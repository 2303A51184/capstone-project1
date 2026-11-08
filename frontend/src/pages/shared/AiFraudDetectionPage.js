import React, { useState } from 'react';
import { transactionService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  Cpu,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ShieldBan,
  Activity,
  Layers,
  Sparkles,
  ArrowRight,
  Globe,
  Tag
} from 'lucide-react';

export const AiFraudDetectionPage = () => {
  const [formData, setFormData] = useState({
    amount: '900000',
    merchant: 'movierulz stream',
    category: 'TRAVEL',
    location: 'Hanamakonda, India',
    website: 'https://www.5movierulz.watch/vishwanath-and-sons-2026.html',
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const { success, error } = useToast();

  const handleEvaluate = async (e) => {
    if (e) e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      error('Please enter a valid amount.');
      return;
    }

    setLoading(true);
    try {
      const res = await transactionService.evaluateAi({
        amount: Number(formData.amount),
        merchant: formData.merchant,
        category: formData.category,
        location: formData.location,
        website: formData.website,
      });
      setResult(res.data);
      success('ML inference pipeline completed.');
    } catch (err) {
      error('Failed to communicate with AI inference engine.');
    } finally {
      setLoading(false);
    }
  };

  const setScenario = (preset) => {
    setFormData(preset);
    setResult(null);
  };

  return (
    <div className="ai-eval-page-container">
      {/* Header */}
      <div className="ai-eval-hero">
        <div className="ai-badge-pill">
          <Sparkles size={14} />
          <span>PRODUCTION MACHINE LEARNING INFERENCE</span>
        </div>
        <h1 className="hero-title">AI Fraud Detection & Heuristic Threat Lab</h1>
        <p className="hero-desc">
          Test and analyze arbitrary transactional parameters against the Random Forest classifier,
          SMOTE-balanced decision boundaries, and Domain-First URL Threat Engine.
        </p>
      </div>

      {/* Preset Scenarios */}
      <div className="ai-scenarios-row">
        <span className="scenarios-label">Quick Lab Scenarios:</span>
        <button
          className="scenario-chip chip-danger"
          onClick={() =>
            setScenario({
              amount: '900000',
              merchant: 'movierulz watch',
              category: 'TRAVEL',
              location: 'Hanamakonda, India',
              website: 'https://www.5movierulz.watch/vishwanath-and-sons-2026.html',
            })
          }
        >
          🚨 Illicit Piracy Domain (5movierulz)
        </button>
        <button
          className="scenario-chip chip-warning"
          onClick={() =>
            setScenario({
              amount: '185000',
              merchant: 'Offshore Crypto Trading Ltd',
              category: 'CRYPTO',
              location: 'Tortola, BVI',
              website: 'https://offshore-crypto-vault.xyz',
            })
          }
        >
          ⚠️ High-Velocity Crypto Transfer
        </button>
        <button
          className="scenario-chip chip-success"
          onClick={() =>
            setScenario({
              amount: '450',
              merchant: 'Reliance Smart Supermarket',
              category: 'GROCERY',
              location: 'Mumbai, India',
              website: 'https://www.reliancesmart.in',
            })
          }
        >
          ✅ Standard Consumer Grocery
        </button>
      </div>

      {/* Main Grid: Form on Left, Output on Right */}
      <div className="ai-eval-grid">
        {/* Input Parameters Box */}
        <div className="ai-input-card">
          <div className="card-header-clean">
            <h3 className="card-header-title">Transaction Features</h3>
            <span className="card-header-tag">Input Vector</span>
          </div>

          <form onSubmit={handleEvaluate} className="ai-form">
            <div className="form-group">
              <label className="form-label">Transaction Amount (₹ INR)</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Merchant Name / Identifier</label>
              <input
                type="text"
                className="form-input"
                value={formData.merchant}
                onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Merchant Website URL (Domain Threat Heuristics)</label>
              <div className="input-with-icon">
                <Globe size={16} className="input-icon" />
                <input
                  type="text"
                  className="form-input"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://domain-to-evaluate.com"
                />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">Industry Sector Category</label>
                <select
                  className="form-select"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="GROCERY">GROCERY</option>
                  <option value="ONLINE">ONLINE RETAIL</option>
                  <option value="ELECTRONICS">ELECTRONICS</option>
                  <option value="TRAVEL">TRAVEL</option>
                  <option value="CRYPTO">CRYPTO EXCHANGES</option>
                  <option value="GAMBLING">GAMBLING & CASINO</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Origin Location</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block ai-run-btn" disabled={loading}>
              <Cpu size={16} />
              <span>{loading ? 'Evaluating Vector in Python AI...' : 'Run Real-Time AI Prediction'}</span>
            </button>
          </form>
        </div>

        {/* Output Intelligence Box */}
        <div className="ai-output-card">
          <div className="card-header-clean">
            <h3 className="card-header-title">Prediction Diagnostics</h3>
            <span className="card-header-tag">Live Python Flask Microservice</span>
          </div>

          {loading ? (
            <div className="ai-loading-wrap">
              <div className="fintech-spinner"></div>
              <p>Passing feature vector to Scikit-Learn Random Forest Pipeline...</p>
            </div>
          ) : result ? (
            <div className="ai-results-content">
              {/* Verdict Banner */}
              <div className={`ai-verdict-banner verdict-${result.risk_classification?.toLowerCase()}`}>
                <div className="verdict-icon">
                  {result.detection_result === 'BLOCK' && <ShieldBan size={36} />}
                  {result.detection_result === 'HOLD FOR REVIEW' && <AlertTriangle size={36} />}
                  {result.detection_result === 'APPROVE' && <CheckCircle2 size={36} />}
                </div>
                <div className="verdict-text-wrap">
                  <span className="verdict-label">SYSTEM DECISION RECOMMENDATION</span>
                  <h2 className="verdict-title">{result.detection_result}</h2>
                  <span className="verdict-sub">
                    Risk Classification Tier: <strong>{result.risk_classification} (Score: {result.risk_score}/100)</strong>
                  </span>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="ai-metrics-row">
                <div className="ai-metric-item">
                  <span className="m-label">Calculated Risk Score</span>
                  <span className={`m-val text-${result.risk_classification?.toLowerCase()}`}>
                    {result.risk_score} <span className="m-unit">/ 100</span>
                  </span>
                  <span className="m-sub">
                    {result.risk_score < 30 ? 'Low Range (0–29)' : result.risk_score < 70 ? 'Medium Range (30–69)' : 'High Range (70–100)'}
                  </span>
                </div>

                <div className="ai-metric-item">
                  <span className="m-label">ML Fraud Probability</span>
                  <span className="m-val">{result.fraud_probability}</span>
                  <span className="m-sub">Random Forest Softmax</span>
                </div>
              </div>

              {/* Decision Rules Separator */}
              <div className="decision-separation-note">
                <Activity size={16} />
                <span>
                  <strong>Decoupled Architecture:</strong> ML fraud probability ({result.fraud_probability}) and deterministic decision rules remain separated.
                </span>
              </div>

              {/* Fraud Explanation Factors */}
              <div className="ai-explanations-box">
                <h4 className="box-title">Heuristic & Feature Analysis Factors</h4>
                <ul className="explanations-list">
                  {result.fraud_explanation &&
                    result.fraud_explanation.map((exp, idx) => (
                      <li key={idx} className="explanation-item">
                        <span className="bullet-dot"></span>
                        <span>{exp}</span>
                      </li>
                    ))}
                </ul>
              </div>

              {/* Model Metadata */}
              <div className="ai-model-meta-pill">
                <Layers size={14} />
                <span>Engine: {result.model_architecture} | Latency: ~8.4ms</span>
              </div>
            </div>
          ) : (
            <div className="ai-empty-prompt">
              <Cpu size={48} className="text-muted" />
              <h4>Model Ready for Inference</h4>
              <p>Select a preset above or enter transaction attributes on the left, then click Run Prediction.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiFraudDetectionPage;

