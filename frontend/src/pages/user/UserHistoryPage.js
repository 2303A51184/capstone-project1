import React, { useState, useEffect } from 'react';
import { userService } from '../../services/api';
import { StatusBadge, RiskBadge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Search, Filter, ArrowUpDown, Eye, Download } from 'lucide-react';

export const UserHistoryPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('date_desc');
  const [selectedTx, setSelectedTx] = useState(null);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await userService.getTransactions({
        search,
        status: statusFilter,
        riskLevel: riskFilter,
        sortBy,
      });
      setTransactions(res.data);
    } catch (err) {
      console.error('Failed to load transaction history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [statusFilter, riskFilter, sortBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTransactions();
  };

  return (
    <div className="history-page-container">
      {/* Search & Filters Card */}
      <div className="filter-toolbar-card">
        <form onSubmit={handleSearchSubmit} className="filter-search-form">
          <div className="search-input-wrap">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by merchant, transaction ID, website, location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-secondary">
            Search
          </button>
        </form>

        <div className="filter-controls-group">
          <div className="filter-control">
            <label className="filter-label">Status:</label>
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="APPROVED">Approved</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="BLOCKED">Blocked</option>
            </select>
          </div>

          <div className="filter-control">
            <label className="filter-label">Risk Tier:</label>
            <select
              className="filter-select"
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
            >
              <option value="ALL">All Tiers</option>
              <option value="LOW">Low Risk</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="HIGH">High Risk</option>
            </select>
          </div>

          <div className="filter-control">
            <label className="filter-label">Sort By:</label>
            <select
              className="filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date_desc">Newest First</option>
              <option value="amount_desc">Highest Amount</option>
              <option value="amount_asc">Lowest Amount</option>
              <option value="risk_desc">Highest Risk Score</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="table-card-box">
        <div className="card-header-clean">
          <div>
            <h3 className="card-header-title">Historical Clearance Records</h3>
            <p className="card-header-sub">
              Showing {transactions.length} record{transactions.length === 1 ? '' : 's'} matching active filters
            </p>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner text="Querying historical ledger..." />
        ) : transactions.length > 0 ? (
          <div className="fintech-table-responsive">
            <table className="fintech-table">
              <thead>
                <tr>
                  <th>TRANSACTION ID</th>
                  <th>DATE & TIME</th>
                  <th>MERCHANT / WEBSITE</th>
                  <th>CATEGORY</th>
                  <th>AMOUNT (₹)</th>
                  <th>RISK SCORE</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id || tx.transactionId}>
                    <td className="font-mono text-bold">{tx.transactionId}</td>
                    <td className="text-muted text-sm">
                      {tx.createdAt ? new Date(tx.createdAt).toLocaleString('en-IN') : 'N/A'}
                    </td>
                    <td>
                      <div className="merchant-url-cell">
                        <span className="merchant-name-bold">{tx.merchant}</span>
                        {tx.website && <span className="merchant-domain-dim">{tx.website}</span>}
                      </div>
                    </td>
                    <td>
                      <span className="category-chip">{tx.category}</span>
                    </td>
                    <td className="text-bold">₹{Number(tx.amount).toLocaleString('en-IN')}</td>
                    <td>
                      <RiskBadge level={tx.riskLevel} score={tx.riskScore} />
                    </td>
                    <td>
                      <StatusBadge status={tx.status} />
                    </td>
                    <td>
                      <button
                        className="btn-icon-action"
                        onClick={() => setSelectedTx(tx)}
                        title="View Full Audit Details"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No transactions found"
            description="No transaction records match the specified search or filter criteria."
            actionText="Reset Filters"
            onAction={() => {
              setSearch('');
              setStatusFilter('ALL');
              setRiskFilter('ALL');
            }}
          />
        )}
      </div>

      {/* Transaction Details Modal */}
      {selectedTx && (
        <Modal
          isOpen={!!selectedTx}
          onClose={() => setSelectedTx(null)}
          title={`Transaction Audit: ${selectedTx.transactionId}`}
          maxWidth="560px"
        >
          <div className="tx-audit-detail-content">
            <div className="audit-detail-header-status">
              <StatusBadge status={selectedTx.status} />
              <RiskBadge level={selectedTx.riskLevel} score={selectedTx.riskScore} />
            </div>

            <div className="audit-grid-details">
              <div className="audit-field">
                <span className="field-lbl">Amount:</span>
                <span className="field-val highlight">₹{Number(selectedTx.amount).toLocaleString('en-IN')} INR</span>
              </div>
              <div className="audit-field">
                <span className="field-lbl">Date & Time:</span>
                <span className="field-val">{selectedTx.createdAt ? new Date(selectedTx.createdAt).toLocaleString('en-IN') : 'N/A'}</span>
              </div>
              <div className="audit-field">
                <span className="field-lbl">Merchant:</span>
                <span className="field-val">{selectedTx.merchant}</span>
              </div>
              <div className="audit-field">
                <span className="field-lbl">Payment Method:</span>
                <span className="field-val">{selectedTx.paymentMethod || 'UPI Instant'}</span>
              </div>
              <div className="audit-field">
                <span className="field-lbl">Category:</span>
                <span className="field-val">{selectedTx.category}</span>
              </div>
              <div className="audit-field">
                <span className="field-lbl">Origin Location:</span>
                <span className="field-val">{selectedTx.location || 'India'}</span>
              </div>
              <div className="audit-field span-2">
                <span className="field-lbl">Destination Website URL:</span>
                <span className="field-val text-break">{selectedTx.website || 'Direct Merchant Gateway'}</span>
              </div>
              <div className="audit-field">
                <span className="field-lbl">ML Fraud Probability:</span>
                <span className="field-val">{Math.round((selectedTx.fraudProbability || 0) * 100)}%</span>
              </div>
              <div className="audit-field">
                <span className="field-lbl">Binary Fraud Classification:</span>
                <span className="field-val font-bold text-danger">{selectedTx.isFraud ? 'POSITIVE (FLAGGED)' : 'NEGATIVE (CLEARED)'}</span>
              </div>
              {selectedTx.auditNotes && (
                <div className="audit-field span-2">
                  <span className="field-lbl">Compliance Audit Notes:</span>
                  <span className="field-val text-notes">{selectedTx.auditNotes}</span>
                </div>
              )}
            </div>

            <div className="modal-action-footer">
              <button className="btn btn-secondary btn-block" onClick={() => setSelectedTx(null)}>
                Close Audit Inspection
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default UserHistoryPage;

