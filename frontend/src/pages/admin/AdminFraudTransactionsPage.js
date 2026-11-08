import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { StatusBadge, RiskBadge } from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import { 
  ShieldAlert, AlertTriangle, Eye, CheckCircle2, XCircle, 
  Clock, RefreshCw, FileText, Search
} from 'lucide-react';

const AdminFraudTransactionsPage = () => {
  const [fraudTx, setFraudTx] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTx, setSelectedTx] = useState(null);
  const [actionModal, setActionModal] = useState({ isOpen: false, tx: null, action: '', notes: '' });
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const { addToast } = useToast();

  const fetchFraudTransactions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/fraud-transactions');
      setFraudTx(res.data || []);
    } catch (err) {
      console.error(err);
      addToast('Failed to load fraud transaction telemetry', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFraudTransactions();
  }, []);

  const handleOpenAction = (tx, action) => {
    setActionModal({
      isOpen: true,
      tx,
      action,
      notes: action === 'APPROVE' 
        ? 'Verified legitimate user transaction after security review.' 
        : action === 'BLOCK' 
        ? 'Confirmed unauthorized or fraudulent transaction pattern.' 
        : 'Placed on temporary compliance hold for verification.'
    });
  };

  const handleExecuteAction = async () => {
    if (!actionModal.tx || !actionModal.action) return;
    try {
      setActionSubmitting(true);
      const res = await api.patch(`/admin/transactions/${actionModal.tx.id}/action`, {
        action: actionModal.action,
        notes: actionModal.notes
      });
      addToast(res.data.message || `Transaction ${actionModal.action}ed successfully`, 'success');
      setActionModal({ isOpen: false, tx: null, action: '', notes: '' });
      fetchFraudTransactions();
    } catch (err) {
      console.error(err);
      addToast('Failed to update transaction action', 'error');
    } finally {
      setActionSubmitting(false);
    }
  };

  const filteredList = fraudTx.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (t.transactionId && t.transactionId.toLowerCase().includes(q)) ||
      (t.merchant && t.merchant.toLowerCase().includes(q)) ||
      (t.website && t.website.toLowerCase().includes(q)) ||
      (t.user && t.user.username && t.user.username.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-rose-600 dark:text-rose-400" />
            Fraud Incidents & Flagged Transactions
          </h1>
          <p className="text-secondary text-sm">
            High-severity suspicious activity flagged by AI inference engines and heuristic risk barriers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchFraudTransactions} 
            className="btn btn-secondary flex items-center gap-1.5"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Queue
          </button>
        </div>
      </div>

      {/* Overview Metric Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-4 bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40">
          <div className="p-3 bg-rose-100 dark:bg-rose-900/50 rounded-xl text-rose-600 dark:text-rose-400">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-rose-800 dark:text-rose-300 uppercase tracking-wider">Blocked Incidents</p>
            <p className="text-2xl font-bold text-rose-900 dark:text-rose-100">
              {fraudTx.filter(t => t.status === 'BLOCKED').length}
            </p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-4 bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/50 rounded-xl text-amber-600 dark:text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider">Under Investigation</p>
            <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">
              {fraudTx.filter(t => t.status === 'UNDER_REVIEW').length}
            </p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-4 bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/40">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl text-indigo-600 dark:text-indigo-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider">High Risk Tiers (Score &ge; 70)</p>
            <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
              {fraudTx.filter(t => (t.riskScore || 0) >= 70).length}
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-tertiary" />
          <input
            type="text"
            className="input pl-9"
            placeholder="Search flagged incidents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="text-xs text-secondary font-medium">
          Showing {filteredList.length} flagged transaction records
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <LoadingSpinner size="lg" text="Scanning fraud registry..." />
          </div>
        ) : filteredList.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={ShieldAlert}
              title="No flagged fraud transactions"
              description="No suspicious transactions currently require administrative attention."
            />
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Incident / Tx ID</th>
                  <th>User</th>
                  <th>Amount</th>
                  <th>Merchant & Web Domain</th>
                  <th>AI Risk Score</th>
                  <th>Risk Tier</th>
                  <th>Status</th>
                  <th>Timestamp</th>
                  <th className="text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400">
                      {tx.transactionId}
                    </td>
                    <td className="font-medium text-xs text-primary">
                      {tx.user?.username || 'Unknown'}
                    </td>
                    <td className="font-semibold text-primary">
                      ₹{Number(tx.amount || 0).toLocaleString()}
                    </td>
                    <td>
                      <div className="text-xs font-medium text-primary">{tx.merchant}</div>
                      <div className="text-[11px] text-rose-500 font-mono truncate max-w-[150px]">{tx.website || 'N/A'}</div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-extrabold text-rose-600 dark:text-rose-400">
                          {tx.riskScore ?? 'N/A'}
                        </span>
                        <span className="text-[10px] text-tertiary">/100</span>
                      </div>
                    </td>
                    <td>
                      <RiskBadge riskLevel={tx.riskLevel} />
                    </td>
                    <td>
                      <StatusBadge status={tx.status} />
                    </td>
                    <td className="text-xs text-secondary whitespace-nowrap">
                      {tx.createdAt ? new Date(tx.createdAt).toLocaleString() : 'N/A'}
                    </td>
                    <td className="text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => setSelectedTx(tx)}
                          className="btn btn-secondary py-1 px-2 text-xs"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {tx.status !== 'APPROVED' && (
                          <button
                            onClick={() => handleOpenAction(tx, 'APPROVE')}
                            className="btn py-1 px-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                            title="Approve / Override"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {tx.status !== 'BLOCKED' && (
                          <button
                            onClick={() => handleOpenAction(tx, 'BLOCK')}
                            className="btn py-1 px-2 text-xs bg-rose-600 hover:bg-rose-700 text-white"
                            title="Block Transaction"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transaction Details Modal */}
      {selectedTx && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedTx(null)}
          title={`Fraud Incident Detail: ${selectedTx.transactionId}`}
          maxWidth="max-w-xl"
        >
          <div className="space-y-4 text-sm">
            <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-rose-700 dark:text-rose-300 font-semibold uppercase">Fraud Threat Level</span>
                <RiskBadge riskLevel={selectedTx.riskLevel} />
              </div>
              <div className="flex justify-between items-center text-rose-950 dark:text-rose-100 font-bold text-lg">
                <span>₹{Number(selectedTx.amount || 0).toLocaleString()}</span>
                <span className="font-mono text-sm">AI Score: {selectedTx.riskScore ?? 'N/A'}/100</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-tertiary">Merchant:</span>
                <p className="font-medium text-primary mt-0.5">{selectedTx.merchant}</p>
              </div>
              <div>
                <span className="text-tertiary">Website Domain:</span>
                <p className="font-mono font-medium text-rose-600 dark:text-rose-400 mt-0.5">{selectedTx.website || 'N/A'}</p>
              </div>
              <div>
                <span className="text-tertiary">Payment Method:</span>
                <p className="font-medium text-primary mt-0.5">{selectedTx.paymentMethod || 'CARD'}</p>
              </div>
              <div>
                <span className="text-tertiary">Category:</span>
                <p className="font-medium text-primary mt-0.5">{selectedTx.category || 'N/A'}</p>
              </div>
              <div>
                <span className="text-tertiary">Account User:</span>
                <p className="font-medium text-primary mt-0.5">{selectedTx.user?.username || 'Unknown'}</p>
              </div>
              <div>
                <span className="text-tertiary">Timestamp:</span>
                <p className="font-medium text-primary mt-0.5">{new Date(selectedTx.createdAt).toLocaleString()}</p>
              </div>
            </div>

            {selectedTx.auditNotes && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs">
                <p className="font-semibold text-primary">Audit Log Note:</p>
                <p className="text-secondary mt-1">{selectedTx.auditNotes}</p>
                {selectedTx.reviewedBy && (
                  <p className="text-[11px] text-tertiary mt-1">
                    Audited by {selectedTx.reviewedBy}
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setSelectedTx(null)}
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Action Confirmation Modal */}
      {actionModal.isOpen && (
        <Modal
          isOpen={true}
          onClose={() => setActionModal({ isOpen: false, tx: null, action: '', notes: '' })}
          title={`Administrative Action: ${actionModal.action} Transaction`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-sm">
            <p className="text-secondary text-xs">
              You are applying an administrative compliance override to transaction{' '}
              <span className="font-mono font-bold text-primary">{actionModal.tx?.transactionId}</span>.
              This action will be permanently logged in the audit ledger.
            </p>

            <div>
              <label className="block text-xs font-semibold text-primary mb-1">
                Compliance Review Notes / Justification:
              </label>
              <textarea
                className="input text-xs h-24"
                value={actionModal.notes}
                onChange={(e) => setActionModal({ ...actionModal, notes: e.target.value })}
                placeholder="Enter mandatory audit compliance reasoning..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setActionModal({ isOpen: false, tx: null, action: '', notes: '' })}
                className="btn btn-secondary"
                disabled={actionSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteAction}
                className={`btn text-white ${
                  actionModal.action === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-700' :
                  actionModal.action === 'BLOCK' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-600 hover:bg-amber-700'
                }`}
                disabled={actionSubmitting}
              >
                {actionSubmitting ? 'Recording Action...' : `Confirm ${actionModal.action}`}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminFraudTransactionsPage;