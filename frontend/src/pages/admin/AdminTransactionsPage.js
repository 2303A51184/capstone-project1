import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { StatusBadge, RiskBadge } from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import { 
  Receipt, Search, Filter, ArrowUpDown, Eye, Download, 
  RefreshCw, CheckCircle, AlertTriangle, ShieldCheck
} from 'lucide-react';

const AdminTransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [selectedTx, setSelectedTx] = useState(null);
  const [sortField, setSortField] = useState('createdAt');
  const [sortAsc, setSortAsc] = useState(false);
  const { addToast } = useToast();

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (riskFilter !== 'ALL') params.riskLevel = riskFilter;
      if (categoryFilter !== 'ALL') params.category = categoryFilter;

      const res = await api.get('/admin/transactions', { params });
      setTransactions(res.data || []);
    } catch (err) {
      console.error(err);
      addToast('Failed to fetch admin transactions', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTransactions();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter, riskFilter, categoryFilter]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const sortedList = [...transactions].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];
    if (sortField === 'amount') {
      valA = Number(valA || 0);
      valB = Number(valB || 0);
    }
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
            <Receipt className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Global Transaction Ledger
          </h1>
          <p className="text-secondary text-sm">
            Auditing and real-time oversight of all transactions across all enterprise accounts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchTransactions} 
            className="btn btn-secondary flex items-center gap-1.5"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <a
            href="/api/admin/reports/export/csv"
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </a>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="card p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-tertiary" />
          <input
            type="text"
            className="input pl-9"
            placeholder="Search tx ID, user, merchant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            className="select text-sm py-1.5"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="APPROVED">Approved</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="BLOCKED">Blocked</option>
          </select>

          <select
            className="select text-sm py-1.5"
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
          >
            <option value="ALL">All Risk Tiers</option>
            <option value="LOW">Low Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="HIGH">High Risk</option>
          </select>

          <select
            className="select text-sm py-1.5"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="ALL">All Categories</option>
            <option value="RETAIL">Retail / Shopping</option>
            <option value="ELECTRONICS">Electronics</option>
            <option value="CRYPTO">Cryptocurrency</option>
            <option value="WIRE_TRANSFER">Wire Transfer</option>
            <option value="TRAVEL">Travel / Hospitality</option>
            <option value="PHISHING_SIMULATION">Phishing Testing</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <LoadingSpinner size="lg" text="Querying enterprise ledger..." />
          </div>
        ) : sortedList.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={Receipt}
              title="No transactions found"
              description="No ledger transactions match the specified search or filter criteria."
              actionLabel="Clear Filters"
              onAction={() => { setSearch(''); setStatusFilter('ALL'); setRiskFilter('ALL'); setCategoryFilter('ALL'); }}
            />
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('transactionId')} className="cursor-pointer">
                    <div className="flex items-center gap-1">
                      Tx ID
                      <ArrowUpDown className="w-3.5 h-3.5 opacity-50" />
                    </div>
                  </th>
                  <th>User</th>
                  <th onClick={() => handleSort('amount')} className="cursor-pointer">
                    <div className="flex items-center gap-1">
                      Amount
                      <ArrowUpDown className="w-3.5 h-3.5 opacity-50" />
                    </div>
                  </th>
                  <th>Merchant & Web</th>
                  <th>Payment</th>
                  <th>Risk Score</th>
                  <th>Risk Tier</th>
                  <th>Status</th>
                  <th onClick={() => handleSort('createdAt')} className="cursor-pointer">
                    <div className="flex items-center gap-1">
                      Timestamp
                      <ArrowUpDown className="w-3.5 h-3.5 opacity-50" />
                    </div>
                  </th>
                  <th className="text-right">Audit</th>
                </tr>
              </thead>
              <tbody>
                {sortedList.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                      {tx.transactionId}
                    </td>
                    <td>
                      <span className="font-medium text-primary text-xs">
                        {tx.user ? tx.user.username : 'Unknown'}
                      </span>
                    </td>
                    <td className="font-semibold text-primary">
                      ₹{Number(tx.amount || 0).toLocaleString()}
                    </td>
                    <td>
                      <div className="text-xs font-medium text-primary">{tx.merchant}</div>
                      <div className="text-[11px] text-tertiary truncate max-w-[140px]">{tx.website || 'N/A'}</div>
                    </td>
                    <td className="text-xs text-secondary">
                      {tx.paymentMethod || 'CARD'}
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-primary">
                          {tx.riskScore != null ? tx.riskScore : 'N/A'}
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
                    <td className="text-right">
                      <button
                        onClick={() => setSelectedTx(tx)}
                        className="btn btn-secondary py-1 px-2.5 text-xs flex items-center gap-1 inline-flex"
                        title="Audit Transaction Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Inspect
                      </button>
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
          title={`Transaction Audit: ${selectedTx.transactionId}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-5 text-sm">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <div>
                <p className="text-xs text-tertiary">Amount</p>
                <p className="text-lg font-bold text-primary">
                  ₹{Number(selectedTx.amount || 0).toLocaleString()} {selectedTx.currency || 'INR'}
                </p>
              </div>
              <div>
                <p className="text-xs text-tertiary">Current Status</p>
                <div className="mt-1"><StatusBadge status={selectedTx.status} /></div>
              </div>
              <div>
                <p className="text-xs text-tertiary">Risk Assessment</p>
                <div className="mt-1"><RiskBadge riskLevel={selectedTx.riskLevel} /></div>
              </div>
              <div>
                <p className="text-xs text-tertiary">User / Account</p>
                <p className="font-medium text-primary">{selectedTx.user?.username || 'Unknown'}</p>
                <p className="text-[11px] text-tertiary">{selectedTx.user?.email || ''}</p>
              </div>
              <div>
                <p className="text-xs text-tertiary">AI Risk Score</p>
                <p className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {selectedTx.riskScore ?? 'N/A'} / 100
                </p>
              </div>
              <div>
                <p className="text-xs text-tertiary">Fraud Probability</p>
                <p className="font-mono font-bold text-primary">
                  {selectedTx.fraudProbability != null ? `${(selectedTx.fraudProbability * 100).toFixed(1)}%` : 'N/A'}
                </p>
              </div>
            </div>

            <div className="space-y-2 border-t border-slate-200 dark:border-slate-800 pt-3">
              <h4 className="font-semibold text-primary text-xs uppercase tracking-wider">Merchant & Payload Metadata</h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-tertiary">Merchant:</span>
                  <span className="ml-2 font-medium text-primary">{selectedTx.merchant || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-tertiary">Website:</span>
                  <span className="ml-2 font-mono text-primary truncate">{selectedTx.website || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-tertiary">Category:</span>
                  <span className="ml-2 font-medium text-primary">{selectedTx.category || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-tertiary">Payment Method:</span>
                  <span className="ml-2 font-medium text-primary">{selectedTx.paymentMethod || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-tertiary">Client Location:</span>
                  <span className="ml-2 font-medium text-primary">{selectedTx.location || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-tertiary">Creation Timestamp:</span>
                  <span className="ml-2 font-medium text-primary">
                    {selectedTx.createdAt ? new Date(selectedTx.createdAt).toLocaleString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {selectedTx.auditNotes && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-lg text-xs">
                <p className="font-semibold text-amber-800 dark:text-amber-300">Compliance Audit Notes:</p>
                <p className="text-amber-700 dark:text-amber-400 mt-1">{selectedTx.auditNotes}</p>
                {selectedTx.reviewedBy && (
                  <p className="text-[11px] text-amber-600/80 dark:text-amber-500 mt-1">
                    Reviewed by <span className="font-semibold">{selectedTx.reviewedBy}</span> on {new Date(selectedTx.reviewedAt || selectedTx.createdAt).toLocaleString()}
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedTx(null)}
                className="btn btn-secondary"
              >
                Close Audit
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminTransactionsPage;