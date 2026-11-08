import React, { useState } from 'react';
import { userService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import { Lock, Bell, Moon, Sun, Shield, Key } from 'lucide-react';

export const UserSettingsPage = () => {
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [changingPass, setChangingPass] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState({
    emailHighRisk: true,
    emailMediumRisk: true,
    weeklyReport: false,
  });

  const { theme, toggleTheme } = useTheme();
  const { success, error } = useToast();

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      error('New password and confirm password do not match.');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      error('New password must be at least 6 characters.');
      return;
    }

    setChangingPass(true);
    try {
      await userService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      success('Password updated successfully.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update password.');
    } finally {
      setChangingPass(false);
    }
  };

  return (
    <div className="settings-page-container">
      <div className="settings-grid">
        {/* Security / Password */}
        <div className="settings-card-box">
          <div className="settings-card-header">
            <div className="settings-icon-wrap">
              <Key size={20} className="text-cyan" />
            </div>
            <div>
              <h3 className="settings-title">Change Password</h3>
              <p className="settings-sub">Enforce credential freshness with BCrypt hashing</p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} className="settings-form">
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Enter existing password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="At least 6 characters"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Repeat new password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={changingPass}>
              {changingPass ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Theme Preferences */}
        <div className="settings-card-box">
          <div className="settings-card-header">
            <div className="settings-icon-wrap">
              {theme === 'dark' ? <Moon size={20} className="text-cyan" /> : <Sun size={20} className="text-amber" />}
            </div>
            <div>
              <h3 className="settings-title">Visual Appearance</h3>
              <p className="settings-sub">Customize light / dark interface theme</p>
            </div>
          </div>

          <div className="theme-toggle-panel">
            <div className="theme-preview-box">
              <span className="theme-preview-label">Active Mode: <strong>{theme.toUpperCase()}</strong></span>
              <p className="theme-preview-desc">
                {theme === 'dark'
                  ? 'High-contrast dark fintech cyber dashboard style.'
                  : 'Crisp, high-legibility light institutional banking theme.'}
              </p>
            </div>
            <button className="btn btn-outline" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              <span>Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode</span>
            </button>
          </div>

          <hr className="settings-divider" />

          {/* Notifications */}
          <div className="settings-card-header" style={{ marginTop: '1.5rem' }}>
            <div className="settings-icon-wrap">
              <Bell size={20} className="text-green" />
            </div>
            <div>
              <h3 className="settings-title">Alert Notifications</h3>
              <p className="settings-sub">Configure real-time automated fraud alerts</p>
            </div>
          </div>

          <div className="toggle-list">
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={notifPrefs.emailHighRisk}
                onChange={(e) => setNotifPrefs({ ...notifPrefs, emailHighRisk: e.target.checked })}
              />
              <div className="toggle-text">
                <span className="toggle-title">Instant Alerts on High Risk Anomalies (Score ≥ 70)</span>
                <span className="toggle-sub">Sends immediate automated notification on blocked transactions</span>
              </div>
            </label>

            <label className="toggle-row">
              <input
                type="checkbox"
                checked={notifPrefs.emailMediumRisk}
                onChange={(e) => setNotifPrefs({ ...notifPrefs, emailMediumRisk: e.target.checked })}
              />
              <div className="toggle-text">
                <span className="toggle-title">Compliance Review Notifications (Score 30-69)</span>
                <span className="toggle-sub">Notify when transactions are placed under temporary review</span>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSettingsPage;

