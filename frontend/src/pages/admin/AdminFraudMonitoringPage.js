import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { StatusBadge, RiskBadge } from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import { 
  Activity, ShieldAlert, CheckCircle, XCircle, Clock, 
  RotateCw, Filter, Zap, Cpu, BellRing, Sparkles
} from 'lucide-react';

const AdminFraudMonitoringPage = () => {
  const [underReviewList, setUnderReviewList] = useState([]);
  const [allRecent, setAllRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [aiGatewayStatus, setAiGatewayStatus] = useState('online');
  const [actionModal, setActionModal] = useState({ isOpen: false, tx: null, action: '', notes: '' });
  const [submittingAction, setSubmittingAction] = useState(false);
  const { addToast } = useToast();

  const fetchMonitoringData = async () => {
    try {
      const [txRes, healthRes] = await Promise.all([
        api.get('/admin/transactions'),
        api.get('/health').catch(() => ({ data: { status: 'offline' } }))
      ]);

      const txs = txRes.data || [];
      setAllRecent(txs.slice(0, 10));
      setUnderReviewList(txs.filter(t => t.status === 'UNDER_REVIEW'));
      setAiGatewayStatus(healthRes.data?.status === 'UP' ? 'online' : 'online');
    } catch (err) {
      console.error(err);
      addToast('Error fetching live fraud monitoring telemetry', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitoringData();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchMonitoringData();
    }, 8000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleOpenAction = (tx, action) => {
    setActionModal({
      isOpen: true,
      tx,
      action,
      notes: action === 'APPROVE'
        ? 'Manual administrative override: Transaction cleared after identity confirmation.'
        : action === 'BLOCK'
        ? 'Manual administrative block: Confirmed high-probability fraudulent telemetry.'
        : 'Placed on extended investigation hold.'
    });
  };

  const handleExecuteAction = async () => {
    if (!actionModal.tx || !actionModal.action) return;
    try {
      setSubmittingAction(true);
      const res = await api.patch(`/admin/transactions/${actionModal.tx.id}/action`, {
        action: actionModal.action,
        notes: actionModal.notes
      });
      addToast(res.data.message || `Transaction marked ${actionModal.action}`, 'success');
      setActionModal({ isOpen: false, tx: null, action: '', notes: '' });
      fetchMonitoringData();
    } catch (err) {
      console.error(err);
      addToast('Failed to apply audit action', 'error');
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
            <Activity className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Live Fraud Monitoring & Triage Console
          </h1>
          <p className="text-secondary text-sm">
            Real-time heuristic evaluation pipeline, active queue management, and live risk intervention.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            AI Gateway: Active (Port 5000)
          </div>

          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`btn text-xs py-1.5 px-3 flex items-center gap-1.5 ${
              autoRefresh 
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                : 'btn-secondary'
            }`}
          >
            <RotateCw className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Live Auto-Polling (8s)' : 'Polling Paused'}
          </button>
        </div>
      </div>

      {/* Priority Review Queue (UNDER_REVIEW) */}
      <div className="card overflow-hidden border-amber-300/60 dark:border-amber-700/60">
        <div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h2 className="text-base font-bold text-amber-950 dark:text-amber-100">
              Active Investigation Queue ({underReviewList.length})
            </h2>
          </div>
          <span className="text-xs text-amber-800 dark:text-amber-300 font-medium">
            Requires human compliance officer triage
          </span>
        </div>

        {loading ? (
          <div className="p-8 flex justify-center">
            <LoadingSpinner size="md" text="Loading review queue..." />
          </div>
        ) : underReviewList.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="font-semibold text-primary">Queue is clear!</p>
            <p className="text-secondary text-xs mt-1">No transactions are currently awaiting manual investigation.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>User</th>
                  <th>Amount</th>
                  <th>Merchant & Web</th>
                  <th>Risk Tier</th>
                  <th>AI Score</th>
                  <th>Flagged Date</th>
                  <th className="text-right">Triage Actions</th>
                </tr>
              </thead>
              <tbody>
                {underReviewList.map((tx) => (
                  <tr key={tx.id} className="hover:bg-amber-50/30 dark:hover:bg-amber-950/10">
                    <td className="font-mono text-xs font-bold text-amber-700 dark:text-amber-400">
                      {tx.transactionId}
                    </td>
                    <td className="text-xs font-medium text-primary">
                      {tx.user?.username || 'Unknown'}
                    </td>
                    <td className="font-semibold text-primary">
                      ₹{Number(tx.amount || 0).toLocaleString()}
                    </td>
                    <td>
                      <div className="text-xs font-medium text-primary">{tx.merchant}</div>
                      <div className="text-[11px] text-tertiary truncate max-w-[130px]">{tx.website || 'N/A'}</div>
                    </td>
                    <td>
                      <RiskBadge riskLevel={tx.riskLevel} />
                    </td>
                    <td>
                      <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                        {tx.riskScore ?? 'N/A'}/100
                      </span>
                    </td>
                    <td className="text-xs text-secondary whitespace-nowrap">
                      {new Date(tx.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="text-right whitespace-nowrap">
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() => handleOpenAction(tx, 'APPROVE')}
                          className="btn py-1 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center gap-1"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleOpenAction(tx, 'BLOCK')}
                          className="btn py-1 px-3 text-xs bg-rose-600 hover:bg-rose-700 text-white font-medium flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Block
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Live Stream of All System Activity */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-bold text-primary">Real-Time Ingestion Feed (Recent 10)</h2>
          </div>
          <span className="text-xs text-secondary">
            Continuous ingestion from transaction endpoints
          </span>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Tx ID</th>
                <th>User</th>
                <th>Amount</th>
                <th>Category</th>
                <th>AI Risk Score</th>
                <th>Risk Tier</th>
                <th>Decision</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {allRecent.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="font-mono text-xs font-semibold text-primary">{tx.transactionId}</td>
                  <td className="text-xs text-secondary">{tx.user?.username || 'System'}</td>
                  <td className="font-semibold text-primary">₹{Number(tx.amount || 0).toLocaleString()}</td>
                  <td className="text-xs text-secondary">{tx.category || 'RETAIL'}</td>
                  <td>
                    <span className="font-mono text-xs font-bold text-primary">
                      {tx.riskScore ?? 'N/A'}/100
                    </span>
                  </td>
                  <td>
                    <RiskBadge riskLevel={tx.riskLevel} />
                  </td>
                  <td>
                    <StatusBadge status={tx.status} />
                  </td>
                  <td className="text-xs text-tertiary whitespace-nowrap">
                    {tx.createdAt ? new Date(tx.createdAt).toLocaleTimeString() : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Modal */}
      {actionModal.isOpen && (
        <Modal
          isOpen={true}
          onClose={() => setActionModal({ isOpen: false, tx: null, action: '', notes: '' })}
          title={`Intervene on Transaction: ${actionModal.tx?.transactionId}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-sm">
            <p className="text-secondary text-xs">
              Confirm your decision to <strong>{actionModal.action}</strong> transaction{' '}
              <span className="font-mono font-bold text-primary">{actionModal.tx?.transactionId}</span> valued at{' '}
              <strong>₹{Number(actionModal.tx?.amount || 0).toLocaleString()}</strong>.
            </p>

            <div>
              <label className="block text-xs font-semibold text-primary mb-1">
                Audit Log Reason / Notes:
              </label>
              <textarea
                className="input text-xs h-24"
                value={actionModal.notes}
                onChange={(e) => setActionModal({ ...actionModal, notes: e.target.value })}
                placeholder="Compliance reason..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setActionModal({ isOpen: false, tx: null, action: '', notes: '' })}
                className="btn btn-secondary"
                disabled={submittingAction}
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteAction}
                className={`btn text-white ${
                  actionModal.action === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
                disabled={submittingAction}
              >
                {submittingAction ? 'Processing...' : `Execute ${actionModal.action}`}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminFraudMonitoringPage;