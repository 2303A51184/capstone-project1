import React, { useState, useEffect } from 'react';
import { transactionService, userService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { StatusBadge, RiskBadge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import {
  CreditCard,
  Send,
  Zap,
  Globe,
  MapPin,
  Tag,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ShieldBan
} from 'lucide-react';

export const UserTransactionsPage = () => {
  const [formData, setFormData] = useState({
    amount: '',
    merchant: '',
    category: 'ONLINE',
    paymentMethod: 'UPI',
    location: 'Mumbai, India',
    website: '',
  });

  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [predictionResult, setPredictionResult] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);

  const { success, error, warning } = useToast();

  const loadTransactions = async () => {
    try {
      const res = await userService.getTransactions();
      setTransactions(res.data);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      error('Please enter a valid amount.');
      return;
    }
    if (!formData.merchant.trim()) {
      error('Merchant name is required.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        amount: Number(formData.amount),
        currency: 'INR',
        transactionId: `UPI-${Math.floor(100000 + Math.random() * 900000)}`,
      };

      const res = await transactionService.create(payload);
      setPredictionResult(res.data);
      setShowResultModal(true);

      if (res.data.status === 'APPROVED') {
        success(`Transaction ${res.data.transactionId} approved with low risk score (${res.data.riskScore}/100)!`);
      } else if (res.data.status === 'UNDER_REVIEW') {
        warning(`Transaction ${res.data.transactionId} held for review (Risk score: ${res.data.riskScore}/100).`);
      } else {
        error(`Transaction ${res.data.transactionId} blocked! High fraud probability (${res.data.riskScore}/100).`);
      }

      // Reset form & reload list
      setFormData({
        amount: '',
        merchant: '',
        category: 'ONLINE',
        paymentMethod: 'UPI',
        location: 'Mumbai, India',
        website: '',
      });
      loadTransactions();
    } catch (err) {
      error(err.response?.data?.message || 'Transaction processing failed.');
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (preset) => {
    setFormData(preset);
  };

  return (
    <div className="transactions-page-container">
      {/* Top Banner with Presets */}
      <div className="tx-presets-card">
        <div className="presets-header">
          <div className="presets-title-wrap">
            <Zap size={18} className="text-cyan" />
            <h3 className="presets-title">Instant Simulation Presets</h3>
          </div>
          <span className="presets-subtitle">
            One-click presets for evaluating different risk tiers against real ML & heuristic models
          </span>
        </div>

        <div className="presets-buttons-grid">
          <button
            type="button"
            className="preset-btn preset-low"
            onClick={() =>
              applyPreset({
                amount: '450.00',
                merchant: 'Reliance Smart Supermarket',
                category: 'GROCERY',
                paymentMethod: 'UPI',
                location: 'Mumbai, India',
                website: 'https://www.reliancesmart.in',
              })
            }
          >
            <div className="preset-top">
              <span className="preset-tag tag-low">LOW RISK</span>
              <span className="preset-amount">₹450.00</span>
            </div>
            <span className="preset-desc">Grocery • Verified Merchant Domain</span>
          </button>

          <button
            type="button"
            className="preset-btn preset-med"
            onClick={() =>
              applyPreset({
                amount: '45000.00',
                merchant: 'Croma Electronics Mall',
                category: 'ELECTRONICS',
                paymentMethod: 'CARD',
                location: 'Hyderabad, India',
                website: 'https://www.croma.com',
              })
            }
          >
            <div className="preset-top">
              <span className="preset-tag tag-med">MEDIUM RISK</span>
              <span className="preset-amount">₹45,000.00</span>
            </div>
            <span className="preset-desc">Electronics • Value Variance Alert</span>
          </button>

          <button
            type="button"
            className="preset-btn preset-high"
            onClick={() =>
              applyPreset({
                amount: '350000.00',
                merchant: 'Offshore Crypto Exchange Ltd',
                category: 'CRYPTO',
                paymentMethod: 'NET_BANKING',
                location: 'Tortola, BVI',
                website: 'https://offshore-crypto-vault.xyz',
              })
            }
          >
            <div className="preset-top">
              <span className="preset-tag tag-high">HIGH RISK</span>
              <span className="preset-amount">₹3,50,000.00</span>
            </div>
            <span className="preset-desc">Crypto • High Value Anomaly</span>
          </button>

          <button
            type="button"
            className="preset-btn preset-piracy"
            onClick={() =>
              applyPreset({
                amount: '900000.00',
                merchant: 'movierulz stream',
                category: 'TRAVEL',
                paymentMethod: 'UPI',
                location: 'Hanamakonda, India',
                website: 'https://www.5movierulz.watch/stream-hd-7368.html',
              })
            }
          >
            <div className="preset-top">
              <span className="preset-tag tag-piracy">ILLICIT DOMAIN</span>
              <span className="preset-amount">₹9,00,000.00</span>
            </div>
            <span className="preset-desc">Illicit Streaming URL • Domain Heuristic</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Form on Left, Live Log on Right */}
      <div className="tx-form-and-table-grid">
        <div className="tx-form-card">
          <div className="card-header-clean">
            <div>
              <h3 className="card-header-title">Initiate Monitored Transaction</h3>
              <p className="card-header-sub">Protected by 24/7 Random Forest + URL Heuristics</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="tx-creation-form">
            <div className="form-group">
              <label className="form-label">Transaction Amount (₹ INR) *</label>
              <div className="input-with-icon">
                <span className="input-currency-symbol">₹</span>
                <input
                  type="number"
                  step="0.01"
                  name="amount"
                  className="form-input text-bold"
                  placeholder="e.g. 1500.00"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Merchant Name / Counterparty *</label>
              <div className="input-with-icon">
                <CreditCard size={18} className="input-icon" />
                <input
                  type="text"
                  name="merchant"
                  className="form-input"
                  placeholder="e.g. Amazon Retail, Swiggy, Netflix"
                  value={formData.merchant}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Destination Website URL (Heuristic Evaluation)</label>
              <div className="input-with-icon">
                <Globe size={18} className="input-icon" />
                <input
                  type="url"
                  name="website"
                  className="form-input"
                  placeholder="https://merchant-portal.com/pay"
                  value={formData.website}
                  onChange={handleChange}
                />
              </div>
              <span className="input-hint-text">
                Evaluated against illicit domain patterns, spoofed TLDs, and phishing signatures.
              </span>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">Merchant Category</label>
                <div className="input-with-icon">
                  <Tag size={18} className="input-icon" />
                  <select
                    name="category"
                    className="form-select"
                    value={formData.category}
                    onChange={handleChange}
                  >
                    <option value="GROCERY">GROCERY</option>
                    <option value="ONLINE">ONLINE RETAIL</option>
                    <option value="ELECTRONICS">ELECTRONICS</option>
                    <option value="TRAVEL">TRAVEL</option>
                    <option value="CRYPTO">CRYPTO EXCHANGES</option>
                    <option value="GAMBLING">GAMBLING & CASINO</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <select
                  name="paymentMethod"
                  className="form-select"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                >
                  <option value="UPI">UPI Instant</option>
                  <option value="CARD">Debit / Credit Card</option>
                  <option value="NET_BANKING">Net Banking</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Origin Location</label>
              <div className="input-with-icon">
                <MapPin size={18} className="input-icon" />
                <input
                  type="text"
                  name="location"
                  className="form-input"
                  placeholder="Mumbai, India"
                  value={formData.location}
                  onChange={handleChange}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block submit-tx-btn" disabled={loading}>
              <Send size={16} />
              <span>{loading ? 'Evaluating Risk & Clearing...' : 'Process Transaction'}</span>
            </button>
          </form>
        </div>

        {/* Live Transaction Records */}
        <div className="tx-table-card">
          <div className="card-header-clean">
            <div>
              <h3 className="card-header-title">Live Transaction Clearance Log</h3>
              <p className="card-header-sub">Persistent database records in MySQL / H2</p>
            </div>
            <button className="btn btn-ghost" onClick={loadTransactions}>
              Refresh
            </button>
          </div>

          {tableLoading ? (
            <LoadingSpinner text="Retrieving transaction records..." />
          ) : transactions.length > 0 ? (
            <div className="fintech-table-responsive">
              <table className="fintech-table">
                <thead>
                  <tr>
                    <th>TXN ID</th>
                    <th>AMOUNT</th>
                    <th>MERCHANT & WEBSITE</th>
                    <th>CATEGORY</th>
                    <th>RISK SCORE</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 10).map((tx) => (
                    <tr key={tx.id || tx.transactionId}>
                      <td className="font-mono text-bold">{tx.transactionId}</td>
                      <td className="text-bold">₹{Number(tx.amount).toLocaleString('en-IN')}</td>
                      <td>
                        <div className="merchant-url-cell">
                          <span className="merchant-name-bold">{tx.merchant}</span>
                          {tx.website && <span className="merchant-domain-dim">{tx.website}</span>}
                        </div>
                      </td>
                      <td>
                        <span className="category-chip">{tx.category}</span>
                      </td>
                      <td>
                        <RiskBadge level={tx.riskLevel} score={tx.riskScore} />
                      </td>
                      <td>
                        <StatusBadge status={tx.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No transactions yet"
              description="Fill out the form on the left or select a preset to initiate your first transaction."
            />
          )}
        </div>
      </div>

      {/* Instant Prediction Result Modal */}
      {predictionResult && (
        <Modal
          isOpen={showResultModal}
          onClose={() => setShowResultModal(false)}
          title="Real-Time Risk Decision Report"
          maxWidth="580px"
        >
          <div className="prediction-modal-body">
            <div className="modal-status-hero">
              {predictionResult.status === 'APPROVED' && (
                <div className="hero-status-icon success">
                  <CheckCircle2 size={48} />
                </div>
              )}
              {predictionResult.status === 'UNDER_REVIEW' && (
                <div className="hero-status-icon warning">
                  <AlertTriangle size={48} />
                </div>
              )}
              {predictionResult.status === 'BLOCKED' && (
                <div className="hero-status-icon danger">
                  <ShieldBan size={48} />
                </div>
              )}

              <h2 className="modal-status-text">
                TRANSACTION {predictionResult.status}
              </h2>
              <p className="modal-txn-ref">Reference: {predictionResult.transactionId}</p>
            </div>

            <div className="modal-metrics-row">
              <div className="modal-metric-box">
                <span className="metric-box-label">Risk Threat Score</span>
                <span className={`metric-box-val val-${predictionResult.riskLevel?.toLowerCase()}`}>
                  {predictionResult.riskScore} / 100
                </span>
                <span className="metric-box-sub">
                  Classification: {predictionResult.riskLevel} RISK
                </span>
              </div>

              <div className="modal-metric-box">
                <span className="metric-box-label">ML Fraud Probability</span>
                <span className="metric-box-val">
                  {Math.round((predictionResult.fraudProbability || 0) * 100)}%
                </span>
                <span className="metric-box-sub">Ensemble Random Forest</span>
              </div>
            </div>

            <div className="modal-details-table">
              <div className="detail-row">
                <span className="detail-label">Amount Cleared:</span>
                <span className="detail-val font-bold">₹{Number(predictionResult.amount).toLocaleString('en-IN')} INR</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Merchant Name:</span>
                <span className="detail-val">{predictionResult.merchant}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Destination Domain:</span>
                <span className="detail-val text-break">{predictionResult.website || 'Standard Gateway'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Payment Category:</span>
                <span className="detail-val">{predictionResult.category} ({predictionResult.paymentMethod || 'UPI'})</span>
              </div>
            </div>

            <div className="modal-action-footer">
              <button className="btn btn-primary btn-block" onClick={() => setShowResultModal(false)}>
                Acknowledge & Continue
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default UserTransactionsPage;

