import React, { useState, useEffect } from 'react';
import { userService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { RiskBadge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { ShieldAlert, AlertTriangle, CheckCircle, Bell, Filter } from 'lucide-react';

export const UserAlertsPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRisk, setFilterRisk] = useState('ALL');
  const { success, error } = useToast();

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await userService.getAlerts({ riskLevel: filterRisk });
      setAlerts(res.data);
    } catch (err) {
      console.error('Failed to load fraud alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [filterRisk]);

  const handleMarkRead = async (id) => {
    try {
      await userService.markAlertRead(id);
      success('Alert marked as read.');
      setAlerts(alerts.map((a) => (a.id === id ? { ...a, status: 'READ' } : a)));
    } catch (err) {
      error('Failed to update alert status.');
    }
  };

  return (
    <div className="alerts-page-container">
      {/* Header Banner */}
      <div className="alerts-header-toolbar">
        <div>
          <h2 className="section-title">Security & Fraud Threat Notifications</h2>
          <p className="section-sub">
            Real-time anomaly warnings triggered by the Random Forest classifier and Domain Heuristic Scanner.
          </p>
        </div>

        <div className="filter-control">
          <label className="filter-label">Filter Severity:</label>
          <select
            className="filter-select"
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
          >
            <option value="ALL">All Severities</option>
            <option value="HIGH">High Severity Only</option>
            <option value="MEDIUM">Medium Severity Only</option>
            <option value="LOW">Low Severity Only</option>
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Fetching security alert logs..." />
      ) : alerts.length > 0 ? (
        <div className="alerts-card-list">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`alert-entry-card alert-severity-${alert.riskLevel?.toLowerCase()} ${
                alert.status === 'READ' ? 'alert-read' : 'alert-unread'
              }`}
            >
              <div className="alert-card-icon-col">
                {alert.riskLevel === 'HIGH' ? (
                  <div className="alert-icon-wrap danger">
                    <ShieldAlert size={22} />
                  </div>
                ) : alert.riskLevel === 'MEDIUM' ? (
                  <div className="alert-icon-wrap warning">
                    <AlertTriangle size={22} />
                  </div>
                ) : (
                  <div className="alert-icon-wrap info">
                    <Bell size={22} />
                  </div>
                )}
              </div>

              <div className="alert-card-main-col">
                <div className="alert-top-row">
                  <div className="alert-badges-wrap">
                    <RiskBadge level={alert.riskLevel} score={alert.riskScore} />
                    <span className="alert-ref-pill">Ref: {alert.transactionId}</span>
                    <span className="alert-merchant-name">{alert.merchant}</span>
                  </div>
                  <span className="alert-timestamp">
                    {alert.createdAt ? new Date(alert.createdAt).toLocaleString('en-IN') : 'Just now'}
                  </span>
                </div>

                <p className="alert-message-text">{alert.message}</p>

                <div className="alert-bottom-row">
                  <span className="alert-amount-text">
                    Affected Amount: <strong>₹{Number(alert.amount || 0).toLocaleString('en-IN')} INR</strong>
                  </span>
                  {alert.status === 'UNREAD' ? (
                    <button
                      className="btn btn-outline-sm mark-read-btn"
                      onClick={() => handleMarkRead(alert.id)}
                    >
                      <CheckCircle size={14} />
                      <span>Mark Acknowledged</span>
                    </button>
                  ) : (
                    <span className="status-read-tag">Acknowledged</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="All clear! No fraud alerts"
          description="Your transactions currently display zero high or medium risk anomalies."
        />
      )}
    </div>
  );
};

export default UserAlertsPage;

