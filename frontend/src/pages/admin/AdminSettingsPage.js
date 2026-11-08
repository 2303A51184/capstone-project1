import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { 
  Settings, Sliders, Shield, Bell, Save, History, 
  RefreshCw, CheckCircle2, Lock, AlertCircle 
} from 'lucide-react';

const AdminSettingsPage = () => {
  const [settings, setSettings] = useState({
    lowRiskMax: 29,
    mediumRiskMax: 69,
    highRiskThreshold: 70,
    autoBlockHighRisk: true,
    enableDomainHeuristics: true,
    alertOnMediumRisk: true,
    notificationEmail: 'security@enterprise.bank'
  });
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [settingsRes, logsRes] = await Promise.all([
        api.get('/admin/settings'),
        api.get('/admin/audit-logs')
      ]);

      if (settingsRes.data) {
        setSettings({
          lowRiskMax: settingsRes.data.lowRiskMax ?? 29,
          mediumRiskMax: settingsRes.data.mediumRiskMax ?? 69,
          highRiskThreshold: settingsRes.data.highRiskThreshold ?? 70,
          autoBlockHighRisk: settingsRes.data.autoBlockHighRisk ?? true,
          enableDomainHeuristics: settingsRes.data.enableDomainHeuristics ?? true,
          alertOnMediumRisk: settingsRes.data.alertOnMediumRisk ?? true,
          notificationEmail: settingsRes.data.notificationEmail || 'security@enterprise.bank'
        });
      }

      setAuditLogs(logsRes.data || []);
    } catch (err) {
      console.error(err);
      addToast('Failed to load system settings and audit ledger', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await api.put('/admin/settings', settings);
      addToast(res.data.message || 'System thresholds updated successfully', 'success');
      // Refresh audit logs to show the new config update action
      const logsRes = await api.get('/admin/audit-logs');
      setAuditLogs(logsRes.data || []);
    } catch (err) {
      console.error(err);
      addToast('Failed to save system settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 flex justify-center">
        <LoadingSpinner size="lg" text="Loading enterprise system configuration..." />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
          <Settings className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
          System Settings & Enterprise Security Configuration
        </h1>
        <p className="text-secondary text-sm">
          Tune AI classification thresholds, automated intervention policies, and inspect regulatory audit logs.
        </p>
      </div>

      {/* Thresholds Form */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        <div className="card p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
            <Sliders className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="font-bold text-primary text-base">Risk Scoring & Classification Boundaries</h2>
              <p className="text-xs text-secondary">
                Configure score thresholds that demarcate Low, Medium, and High threat classifications.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold text-primary mb-1">
                Low Risk Ceiling (Max Score)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="50"
                  className="input font-mono"
                  value={settings.lowRiskMax}
                  onChange={(e) => setSettings({ ...settings, lowRiskMax: parseInt(e.target.value) || 0 })}
                  required
                />
                <span className="absolute right-3 top-2.5 text-xs text-emerald-600 font-bold">LOW</span>
              </div>
              <p className="text-[11px] text-tertiary mt-1">Scores 0 to {settings.lowRiskMax} &rarr; Instant Approval</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary mb-1">
                Medium Risk Ceiling (Max Score)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={settings.lowRiskMax + 1}
                  max="85"
                  className="input font-mono"
                  value={settings.mediumRiskMax}
                  onChange={(e) => setSettings({ ...settings, mediumRiskMax: parseInt(e.target.value) || 0 })}
                  required
                />
                <span className="absolute right-3 top-2.5 text-xs text-amber-500 font-bold">MED</span>
              </div>
              <p className="text-[11px] text-tertiary mt-1">Scores {settings.lowRiskMax + 1} to {settings.mediumRiskMax} &rarr; Hold for Review</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary mb-1">
                High Risk Threshold (Trigger Score)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={settings.mediumRiskMax + 1}
                  max="99"
                  className="input font-mono"
                  value={settings.highRiskThreshold}
                  onChange={(e) => setSettings({ ...settings, highRiskThreshold: parseInt(e.target.value) || 0 })}
                  required
                />
                <span className="absolute right-3 top-2.5 text-xs text-rose-500 font-bold">HIGH</span>
              </div>
              <p className="text-[11px] text-tertiary mt-1">Scores &ge; {settings.highRiskThreshold} &rarr; Automated Intervention</p>
            </div>
          </div>
        </div>

        {/* Automated Policies */}
        <div className="card p-6 space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
            <Shield className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="font-bold text-primary text-base">Automated Defense & Heuristic Policies</h2>
              <p className="text-xs text-secondary">
                Configure real-time policy enforcement on incoming transaction payloads.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                checked={settings.autoBlockHighRisk}
                onChange={(e) => setSettings({ ...settings, autoBlockHighRisk: e.target.checked })}
              />
              <div>
                <p className="font-semibold text-primary text-sm">Automated High-Risk Hard Block</p>
                <p className="text-xs text-secondary">
                  Automatically set transaction status to <span className="text-rose-600 font-bold">BLOCKED</span> if AI risk score meets or exceeds {settings.highRiskThreshold}.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                checked={settings.enableDomainHeuristics}
                onChange={(e) => setSettings({ ...settings, enableDomainHeuristics: e.target.checked })}
              />
              <div>
                <p className="font-semibold text-primary text-sm">Domain Phishing & Heuristic Rule Engine</p>
                <p className="text-xs text-secondary">
                  Inject deterministic risk penalties (+35 to +50 points) when untrusted TLDs, IP hosts, or brand spoofing keywords are detected.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                checked={settings.alertOnMediumRisk}
                onChange={(e) => setSettings({ ...settings, alertOnMediumRisk: e.target.checked })}
              />
              <div>
                <p className="font-semibold text-primary text-sm">Elevate Medium-Risk Transactions to Investigation Queue</p>
                <p className="text-xs text-secondary">
                  Route transactions with scores {settings.lowRiskMax + 1}-{settings.mediumRiskMax} into the compliance officer triage queue.
                </p>
              </div>
            </label>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-semibold text-primary mb-1">
              Security Compliance Notification Email:
            </label>
            <input
              type="email"
              className="input max-w-md text-sm"
              value={settings.notificationEmail}
              onChange={(e) => setSettings({ ...settings, notificationEmail: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="btn btn-primary flex items-center gap-2"
            disabled={saving}
          >
            <Save className="w-4 h-4" />
            {saving ? 'Persisting Configuration...' : 'Save Configuration Changes'}
          </button>
        </div>
      </form>

      {/* Compliance Audit Trail */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="font-bold text-primary text-base">Administrative Compliance Audit Ledger</h2>
              <p className="text-xs text-secondary">Cryptographic immutable record of administrative interventions.</p>
            </div>
          </div>
          <button
            onClick={fetchData}
            className="btn btn-secondary py-1 px-2.5 text-xs flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        <div className="table-container max-h-96 overflow-y-auto">
          <table className="table text-xs">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Operator</th>
                <th>Action</th>
                <th>Target</th>
                <th>Target ID</th>
                <th>Details & Reason</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="whitespace-nowrap font-mono text-tertiary">
                    {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                  </td>
                  <td className="font-semibold text-primary">{log.adminUsername}</td>
                  <td>
                    <span className="font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-medium">
                      {log.action}
                    </span>
                  </td>
                  <td className="text-secondary">{log.targetType}</td>
                  <td className="font-mono text-tertiary">{log.targetId}</td>
                  <td className="text-secondary max-w-xs truncate" title={log.details}>
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsPage;