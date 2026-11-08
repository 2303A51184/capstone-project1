import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:8080/api';

export default function AdminUserActivity({ onSelectUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterSession, setFilterSession] = useState('ALL');
  const [filterAuth, setFilterAuth] = useState('ALL');

  // Modal State for inspecting individual user
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalTab, setModalTab] = useState('scans'); // 'scans', 'logins', 'transactions'
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Fetch Activity Telemetry
  const fetchActivity = useCallback(() => {
    setLoading(true);
    axios.get(`${API_BASE}/admin/user-activity`)
      .then(res => {
        setUsers(res.data);
        setError('');
      })
      .catch(err => {
        setError(err.response?.data?.message || 'Failed to fetch user activity monitoring telemetry.');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchActivity();
    const interval = setInterval(fetchActivity, 6000);
    return () => clearInterval(interval);
  }, [fetchActivity]);

  // Open user details modal
  const openUserDetails = (userId) => {
    setSelectedUserId(userId);
    setModalLoading(true);
    setStatusMessage('');
    axios.get(`${API_BASE}/admin/users/${userId}/details`)
      .then(res => {
        setUserDetails(res.data);
      })
      .catch(err => {
        alert(err.response?.data?.message || 'Failed to load user profile details.');
        setSelectedUserId(null);
      })
      .finally(() => setModalLoading(false));
  };

  // Close modal
  const closeUserDetails = () => {
    setSelectedUserId(null);
    setUserDetails(null);
    setStatusMessage('');
  };

  // Update user status (ACTIVE, INACTIVE, SUSPENDED)
  const handleUpdateStatus = (newStatus) => {
    if (!selectedUserId) return;
    setStatusUpdating(true);
    setStatusMessage('');
    axios.patch(`${API_BASE}/admin/users/${selectedUserId}/status`, { status: newStatus })
      .then(res => {
        setStatusMessage(`Account status updated to ${newStatus} successfully.`);
        // Reload details and table
        axios.get(`${API_BASE}/admin/users/${selectedUserId}/details`)
          .then(det => setUserDetails(det.data));
        fetchActivity();
      })
      .catch(err => {
        alert(err.response?.data?.message || 'Failed to update user account status.');
      })
      .finally(() => setStatusUpdating(false));
  };

  // Filtering
  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = (u.fullName || '').toLowerCase().includes(q) ||
                        (u.email || '').toLowerCase().includes(q) ||
                        (u.username || '').toLowerCase().includes(q) ||
                        String(u.userId).includes(q);

    const matchStatus = filterStatus === 'ALL' || (u.accountStatus || '').toUpperCase() === filterStatus.toUpperCase();
    const matchSession = filterSession === 'ALL' || (u.sessionStatus || '').toUpperCase() === filterSession.toUpperCase();
    const matchAuth = filterAuth === 'ALL' ||
                      (filterAuth === 'GOOGLE' && (u.authMethod || '').includes('Google')) ||
                      (filterAuth === 'LOCAL' && !(u.authMethod || '').includes('Google'));

    return matchSearch && matchStatus && matchSession && matchAuth;
  });

  return (
    <div className="admin-user-activity-page">
      {/* Page Header */}
      <div className="activity-header-bar">
        <div className="activity-title-group">
          <h2>🛡️ SENTINEL-AI User Activity &amp; Live Session Monitoring</h2>
          <p>Super Admin Fleet Intelligence — Tracking registrations, active sessions, authentication channels, and scan activity.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            className="refresh-telemetry-btn"
            style={{ background: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            onClick={() => {
              const jwt = sessionStorage.getItem('sentinel_token');
              axios.get(`${API_BASE}/admin/reports/export-csv?type=users&token=${encodeURIComponent(jwt || '')}`, {
                headers: jwt ? { Authorization: `Bearer ${jwt}` } : {},
                responseType: 'blob'
              }).then(res => {
                const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `sentinel_users_activity_${Date.now()}.csv`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
              }).catch(err => alert('Failed to export users CSV: ' + (err.response?.data?.message || err.message)));
            }}
          >
            📥 Export Users CSV
          </button>
          <button className="refresh-telemetry-btn" onClick={fetchActivity}>
            🔄 Refresh Telemetry
          </button>
        </div>
      </div>

      {error && <div className="activity-error-banner">{error}</div>}

      {/* Filter and Search Controls */}
      <div className="activity-filters-card">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="activity-search-field"
            placeholder="Search by User ID, Name, Email, or Username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-dropdowns-group">
          <div className="filter-item">
            <label>Account Status:</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="ALL">All Accounts</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>

          <div className="filter-item">
            <label>Session Status:</label>
            <select value={filterSession} onChange={(e) => setFilterSession(e.target.value)}>
              <option value="ALL">All Sessions</option>
              <option value="ONLINE">🟢 Online</option>
              <option value="OFFLINE">⚪ Offline</option>
            </select>
          </div>

          <div className="filter-item">
            <label>Auth Channel:</label>
            <select value={filterAuth} onChange={(e) => setFilterAuth(e.target.value)}>
              <option value="ALL">All Methods</option>
              <option value="GOOGLE">Google OAuth</option>
              <option value="LOCAL">Email &amp; Password</option>
            </select>
          </div>
        </div>
      </div>

      {/* Telemetry Table: 14 Requirements Fields */}
      <div className="activity-table-wrapper">
        <table className="sentinel-activity-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Full Name</th>
              <th>Email Address</th>
              <th>Registration Date</th>
              <th>Registration Time</th>
              <th>Auth Method</th>
              <th>Last Login Date</th>
              <th>Last Login Time</th>
              <th>Successful Logins</th>
              <th>Failed Attempts</th>
              <th>Account Status</th>
              <th>Session Status</th>
              <th>Last Activity Time</th>
              <th>Total Scans</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && users.length === 0 ? (
              <tr>
                <td colSpan="15" className="empty-table-cell">Loading real-time user activity telemetry...</td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="15" className="empty-table-cell">No users match the selected filters.</td>
              </tr>
            ) : (
              filteredUsers.map(u => {
                const isOnline = u.sessionStatus === 'Online';
                const isSuspended = u.accountStatus === 'Suspended';
                const isInactive = u.accountStatus === 'Inactive';
                const isGoogle = (u.authMethod || '').includes('Google');

                return (
                  <tr key={u.userId} className={isSuspended ? 'row-suspended' : isOnline ? 'row-online' : ''}>
                    <td className="cell-id">#{u.userId}</td>
                    <td className="cell-name">
                      <strong>{u.fullName}</strong>
                      <span className="sub-username">@{u.username}</span>
                    </td>
                    <td className="cell-email">{u.email}</td>
                    <td>{u.registrationDate}</td>
                    <td>{u.registrationTime}</td>
                    <td>
                      <span className={`auth-badge ${isGoogle ? 'google' : 'email'}`}>
                        {isGoogle ? '🔵 Google' : '🔑 Email'}
                      </span>
                    </td>
                    <td>{u.lastLoginDate}</td>
                    <td>{u.lastLoginTime}</td>
                    <td className="cell-number"><strong>{u.totalSuccessfulLogins}</strong></td>
                    <td className="cell-number">
                      <span className={u.failedLoginAttempts > 0 ? 'badge-failed-alert' : ''}>
                        {u.failedLoginAttempts}
                      </span>
                    </td>
                    <td>
                      <span className={`account-badge ${isSuspended ? 'suspended' : isInactive ? 'inactive' : 'active'}`}>
                        {u.accountStatus}
                      </span>
                    </td>
                    <td>
                      <span className={`session-badge ${isOnline ? 'online' : 'offline'}`}>
                        <span className={`pulse-dot ${isOnline ? 'green' : 'gray'}`}></span>
                        {u.sessionStatus}
                      </span>
                    </td>
                    <td className="cell-time">{u.lastActivityTime}</td>
                    <td className="cell-number">
                      <span className="badge-scans-count">{u.totalWebsiteScans}</span>
                    </td>
                    <td>
                      <button
                        className="btn-inspect-user"
                        onClick={() => openUserDetails(u.userId)}
                        title="View complete user profile, scan history & controls"
                      >
                        Inspect Profile 🔍
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ========================================================
          REQUIREMENT 5: ADMIN USER DETAILS MODAL
          ======================================================== */}
      {selectedUserId && (
        <div className="user-details-modal-overlay" onClick={closeUserDetails}>
          <div className="user-details-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <h3>👤 Super Admin User Profile Inspection</h3>
                <span className="modal-subtitle">User #{selectedUserId} — Complete security &amp; scan telemetry</span>
              </div>
              <button className="btn-modal-close" onClick={closeUserDetails}>✕</button>
            </div>

            {modalLoading || !userDetails ? (
              <div className="modal-loading-pane">Loading detailed user profile data...</div>
            ) : (
              <div className="modal-body-content">
                {statusMessage && <div className="modal-status-banner">{statusMessage}</div>}

                {/* Profile Overview Card */}
                <div className="user-profile-overview-card">
                  <div className="user-avatar-large">
                    {(userDetails.user.fullName || userDetails.user.username || 'U').charAt(0).toUpperCase()}
                  </div>

                  <div className="user-overview-meta">
                    <h4>{userDetails.user.fullName || userDetails.user.username}</h4>
                    <p className="user-email-text">{userDetails.user.email} • @{userDetails.user.username}</p>
                    <div className="user-overview-pills">
                      <span className={`account-badge ${userDetails.user.accountStatus === 'SUSPENDED' ? 'suspended' : userDetails.user.accountStatus === 'INACTIVE' ? 'inactive' : 'active'}`}>
                        {userDetails.user.accountStatus || 'ACTIVE'}
                      </span>
                      <span className={`session-badge ${userDetails.user.sessionStatus === 'Online' ? 'online' : 'offline'}`}>
                        {userDetails.user.sessionStatus}
                      </span>
                      <span className={`auth-badge ${userDetails.user.authMethod === 'Google' ? 'google' : 'email'}`}>
                        {userDetails.user.authMethod}
                      </span>
                      <span className="role-pill">{userDetails.user.role}</span>
                    </div>
                  </div>

                  {/* Account Action Buttons for Super Admin */}
                  {userDetails.user.role !== 'ROLE_ADMIN' && (
                    <div className="user-admin-actions-bar">
                      <button
                        className="btn-status-act active-btn"
                        onClick={() => handleUpdateStatus('ACTIVE')}
                        disabled={statusUpdating || userDetails.user.accountStatus === 'ACTIVE'}
                      >
                        ✓ Activate
                      </button>
                      <button
                        className="btn-status-act inactive-btn"
                        onClick={() => handleUpdateStatus('INACTIVE')}
                        disabled={statusUpdating || userDetails.user.accountStatus === 'INACTIVE'}
                      >
                        Deactivate
                      </button>
                      <button
                        className="btn-status-act suspend-btn"
                        onClick={() => handleUpdateStatus('SUSPENDED')}
                        disabled={statusUpdating || userDetails.user.accountStatus === 'SUSPENDED'}
                      >
                        ⚠️ Suspend
                      </button>
                    </div>
                  )}
                </div>

                {/* Telemetry Metrics Grid */}
                <div className="modal-metrics-grid">
                  <div className="metric-box">
                    <span className="m-label">TOTAL LOGINS</span>
                    <span className="m-val">{userDetails.user.loginCount || 0}</span>
                  </div>
                  <div className="metric-box">
                    <span className="m-label">FAILED ATTEMPTS</span>
                    <span className="m-val warning">{userDetails.user.failedLoginCount || 0}</span>
                  </div>
                  <div className="metric-box">
                    <span className="m-label">TOTAL SCANS</span>
                    <span className="m-val primary">{userDetails.user.totalWebsiteScans || 0}</span>
                  </div>
                  <div className="metric-box">
                    <span className="m-label">REGISTERED AT</span>
                    <span className="m-val text-sm">
                      {userDetails.user.createdAt ? new Date(userDetails.user.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Sub-Tabs: Scans History vs Login History */}
                <div className="modal-subnav-tabs">
                  <button
                    className={`modal-tab-btn ${modalTab === 'scans' ? 'active' : ''}`}
                    onClick={() => setModalTab('scans')}
                  >
                    🌐 Personal Website Scans ({userDetails.recentScans?.length || 0})
                  </button>
                  <button
                    className={`modal-tab-btn ${modalTab === 'logins' ? 'active' : ''}`}
                    onClick={() => setModalTab('logins')}
                  >
                    🔑 Login History ({userDetails.loginHistory?.length || 0})
                  </button>
                </div>

                {/* Tab Pane: Personal Website Scans */}
                {modalTab === 'scans' && (
                  <div className="modal-tab-pane">
                    {userDetails.recentScans?.length === 0 ? (
                      <p className="empty-subtab-text">No website scans submitted by this user yet.</p>
                    ) : (
                      <table className="modal-data-table">
                        <thead>
                          <tr>
                            <th>Target URL / Domain</th>
                            <th>Category</th>
                            <th>Risk Score</th>
                            <th>Status</th>
                            <th>Scanned At</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userDetails.recentScans.map(s => (
                            <tr key={s.id}>
                              <td className="mono-text">{s.url}</td>
                              <td><span className="cat-badge">{s.category || 'UNKNOWN'}</span></td>
                              <td><strong>{s.riskScore} / 100</strong></td>
                              <td><span className={`risk-badge ${s.riskLevel}`}>{s.status}</span></td>
                              <td className="cell-time">{new Date(s.scannedAt).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {/* Tab Pane: Personal Login History */}
                {modalTab === 'logins' && (
                  <div className="modal-tab-pane">
                    {userDetails.loginHistory?.length === 0 ? (
                      <p className="empty-subtab-text">No login history recorded.</p>
                    ) : (
                      <table className="modal-data-table">
                        <thead>
                          <tr>
                            <th>Timestamp</th>
                            <th>Auth Method</th>
                            <th>Status</th>
                            <th>IP Address</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userDetails.loginHistory.map(h => (
                            <tr key={h.id}>
                              <td>{new Date(h.loginTime).toLocaleString()}</td>
                              <td>{h.authMethod}</td>
                              <td>
                                <span className={`login-status-badge ${h.status.toLowerCase()}`}>
                                  {h.status}
                                </span>
                              </td>
                              <td className="mono-text">{h.ipAddress || '127.0.0.1'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
