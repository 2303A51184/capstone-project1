import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import './App.css';
import AdminLiveCharts from './components/AdminLiveCharts';
import AdminUserActivity from './components/AdminUserActivity';
import GoogleOAuthModal from './components/GoogleOAuthModal';

const API_BASE = 'http://localhost:8080/api';

function App() {
  // Navigation & Route Synchronization
  const [currentPath, setCurrentPath] = useState(() => {
    return window.location.pathname || '/';
  });

  const navigateTo = (path) => {
    window.history.pushState(null, '', path);
    setCurrentPath(path);
    setAuthError('');
    setAuthSuccess('');
    setAdminLoginError('');
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Session & Authentication
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem('sentinel_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => sessionStorage.getItem('sentinel_token') || '');
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [backendConnected, setBackendConnected] = useState(true);

  // Dedicated Admin Login State (/admin/login)
  const [adminLoginForm, setAdminLoginForm] = useState({ username: '', password: '' });
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminLoginError, setAdminLoginError] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);

  // Google OAuth Configuration
  const [googleClientId, setGoogleClientId] = useState(() => {
    return process.env.REACT_APP_GOOGLE_CLIENT_ID || localStorage.getItem('sentinel_google_client_id') || '';
  });
  const [showGoogleConfigModal, setShowGoogleConfigModal] = useState(false);
  const [tempGoogleId, setTempGoogleId] = useState('');

  // Active View / Tab for Navigation
  // Admin tabs: 'website-monitoring', 'dashboard', 'live-users', 'users', 'transactions'
  const [adminTab, setAdminTab] = useState('website-monitoring');
  // User tabs: 'scanner', 'history', 'simulator', 'transactions'
  const [userTab, setUserTab] = useState('scanner');

  // Website Security Scanner State
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState('');
  const [userScans, setUserScans] = useState([]);
  const [userScanStats, setUserScanStats] = useState({
    totalScans: 0,
    trustedScans: 0,
    suspiciousScans: 0,
    highRiskScans: 0,
    unverifiedScans: 0
  });

  // Admin Website Intelligence State
  const [adminWebsiteStats, setAdminWebsiteStats] = useState({
    totalWebsiteScans: 0,
    uniqueWebsitesScanned: 0,
    trustedWebsites: 0,
    suspiciousWebsites: 0,
    highRiskWebsites: 0,
    phishingWebsites: 0,
    malwareWebsites: 0,
    brandImpersonationsDetected: 0,
    unverifiedWebsites: 0,
    recentScans: [],
    recentHighRiskDetections: [],
    topScannedDomains: []
  });

  // User Transactions State (Personal)
  const [userStats, setUserStats] = useState({
    totalTransactions: 0,
    totalAmount: 0,
    successfulTransactions: 0,
    suspiciousTransactions: 0,
    blockedTransactions: 0,
    fraudDetectionRate: 0.0,
    unreadAlertsCount: 0
  });
  const [userTransactions, setUserTransactions] = useState([]);

  // Admin Global State
  const [adminDashboard, setAdminDashboard] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    signupsToday: 0,
    signupsThisMonth: 0,
    totalLogins: 0,
    successfulLogins: 0,
    failedLogins: 0,
    googleLogins: 0,
    emailLogins: 0,
    loginsToday: 0,
    totalTransactions: 0,
    totalVolume: 0,
    fraudTransactions: 0,
    totalWebsiteScans: 0,
    trustedWebsites: 0,
    suspiciousWebsites: 0,
    highRiskWebsites: 0,
    phishingWebsites: 0,
    malwareWebsites: 0,
    brandImpersonationsDetected: 0,
    unverifiedWebsites: 0,
    liveActiveUsers: [],
    recentLogins: [],
    recentRegistrations: [],
    recentScans: [],
    latestHighRiskDetections: [],
    recentSuspiciousActivities: []
  });
  const [adminUsersList, setAdminUsersList] = useState([]);
  const [adminSearch, setAdminSearch] = useState('');
  const [adminAllTransactions, setAdminAllTransactions] = useState([]);

  // Forms
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [signupForm, setSignupForm] = useState({
    fullName: '',
    email: '',
    username: '',
    password: ''
  });
  const [txForm, setTxForm] = useState({
    transactionId: '',
    amount: '',
    currency: 'INR',
    merchant: '',
    website: '',
    location: '',
    category: 'ONLINE'
  });
  const [latestPrediction, setLatestPrediction] = useState(null);

  // Configure Axios default header whenever token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Load User Data strictly for logged-in standard user
  const loadUserData = useCallback(() => {
    if (!token || !currentUser || currentUser.role === 'ROLE_ADMIN') return;

    axios.get(`${API_BASE}/scans/my-scans`)
      .then(res => setUserScans(res.data))
      .catch(() => {});

    axios.get(`${API_BASE}/scans/stats`)
      .then(res => setUserScanStats(res.data))
      .catch(() => {});

    axios.get(`${API_BASE}/user/dashboard-stats`)
      .then(res => setUserStats(res.data))
      .catch(() => {});

    axios.get(`${API_BASE}/user/transactions`)
      .then(res => setUserTransactions(res.data))
      .catch(() => {});
  }, [token, currentUser]);

  // Load Admin Data strictly for Super Admin
  const loadAdminData = useCallback(() => {
    if (!token || !currentUser || currentUser.role !== 'ROLE_ADMIN') return;

    axios.get(`${API_BASE}/admin/website-monitoring`)
      .then(res => setAdminWebsiteStats(res.data))
      .catch(() => {});

    axios.get(`${API_BASE}/admin/dashboard`)
      .then(res => setAdminDashboard(res.data))
      .catch(() => {});

    axios.get(`${API_BASE}/admin/users?search=${encodeURIComponent(adminSearch)}`)
      .then(res => setAdminUsersList(res.data))
      .catch(() => {});

    axios.get(`${API_BASE}/admin/transactions`)
      .then(res => setAdminAllTransactions(res.data))
      .catch(() => {});
  }, [token, currentUser, adminSearch]);

  // General Polling & Heartbeat
  useEffect(() => {
    axios.get(`${API_BASE}/health`)
      .then(() => setBackendConnected(true))
      .catch(() => setBackendConnected(false));

    if (currentUser?.role === 'ROLE_ADMIN') {
      loadAdminData();
    } else if (currentUser) {
      loadUserData();
    }

    const interval = setInterval(() => {
      if (currentUser?.role === 'ROLE_ADMIN') {
        loadAdminData();
      } else if (currentUser) {
        loadUserData();
        axios.post(`${API_BASE}/auth/heartbeat`).catch(() => {});
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [currentUser, loadUserData, loadAdminData]);

  // Real Google Identity Services Integration
  const handleGoogleCredentialResponse = useCallback(async (response) => {
    if (!response || !response.credential) {
      setAuthError('Google sign-in did not return a valid credential.');
      return;
    }

    setLoading(true);
    setAuthError('');
    try {
      const res = await axios.post(`${API_BASE}/auth/google`, { credential: response.credential });
      const { user, token: jwtToken } = res.data;

      sessionStorage.setItem('sentinel_token', jwtToken);
      sessionStorage.setItem('sentinel_user', JSON.stringify(user));
      setToken(jwtToken);
      setCurrentUser(user);
      navigateTo('/user/dashboard');
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Google token verification failed on server.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize Google Identity Services
  useEffect(() => {
    if (!googleClientId || currentUser) return;

    const initGoogle = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCredentialResponse,
          auto_select: false
        });

        const btnContainer = document.getElementById('google-signin-btn-container');
        if (btnContainer) {
          btnContainer.innerHTML = '';
          window.google.accounts.id.renderButton(btnContainer, {
            theme: 'outline',
            size: 'large',
            width: '360',
            text: 'continue_with',
            shape: 'rectangular'
          });
        }
      }
    };

    if (window.google?.accounts?.id) {
      initGoogle();
    } else {
      const timer = setTimeout(initGoogle, 1000);
      return () => clearTimeout(timer);
    }
  }, [googleClientId, currentUser, handleGoogleCredentialResponse, authMode]);

  // Standard Client Login Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginForm.username || !loginForm.password) {
      setAuthError('Please enter username and password.');
      return;
    }
    setLoading(true);
    setAuthError('');
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, loginForm);
      const { user, token: jwtToken } = res.data;

      sessionStorage.setItem('sentinel_token', jwtToken);
      sessionStorage.setItem('sentinel_user', JSON.stringify(user));
      setToken(jwtToken);
      setCurrentUser(user);

      if (user.role === 'ROLE_ADMIN') {
        navigateTo('/admin/dashboard');
      } else {
        navigateTo('/user/dashboard');
      }
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  // Dedicated Super Admin Login Submit (/admin/login)
  const handleAdminLoginSubmit = async (e) => {
    e.preventDefault();
    if (!adminLoginForm.username || !adminLoginForm.password) {
      setAdminLoginError('Please enter administrator email/username and password.');
      return;
    }
    setAdminLoading(true);
    setAdminLoginError('');
    try {
      const res = await axios.post(`${API_BASE}/auth/admin-login`, adminLoginForm);
      const { user, token: jwtToken } = res.data;

      sessionStorage.setItem('sentinel_token', jwtToken);
      sessionStorage.setItem('sentinel_user', JSON.stringify(user));
      setToken(jwtToken);
      setCurrentUser(user);
      navigateTo('/admin/dashboard');
    } catch (err) {
      setAdminLoginError(err.response?.data?.message || 'Invalid administrator credentials.');
    } finally {
      setAdminLoading(false);
    }
  };

  // Sign Up Submit - Strictly Standard User (No admin registration!)
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (!signupForm.username || !signupForm.password || !signupForm.email) {
      setAuthError('All registration fields are required.');
      return;
    }
    setLoading(true);
    setAuthError('');
    try {
      const res = await axios.post(`${API_BASE}/auth/register`, signupForm);
      const { user, token: jwtToken } = res.data;

      sessionStorage.setItem('sentinel_token', jwtToken);
      sessionStorage.setItem('sentinel_user', JSON.stringify(user));
      setToken(jwtToken);
      setCurrentUser(user);
      navigateTo('/user/dashboard');
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Registration failed. Username or email may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  // Save Google Client ID
  const handleSaveGoogleConfig = () => {
    if (!tempGoogleId.trim()) {
      alert('Please enter a valid Google Client ID.');
      return;
    }
    localStorage.setItem('sentinel_google_client_id', tempGoogleId.trim());
    setGoogleClientId(tempGoogleId.trim());
    setShowGoogleConfigModal(false);
    alert('Google OAuth Client ID saved! The official Google sign-in button is now active.');
  };

  const handleLogout = () => {
    axios.post(`${API_BASE}/auth/logout`).catch(() => {});
    sessionStorage.removeItem('sentinel_token');
    sessionStorage.removeItem('sentinel_user');
    setToken('');
    setCurrentUser(null);
    setScanResult(null);
    navigateTo('/');
  };

  // Authenticated CSV Export Handler
  const handleExportCsv = async (type = 'transactions') => {
    try {
      const jwt = token || sessionStorage.getItem('sentinel_token');
      const res = await axios.get(`${API_BASE}/admin/reports/export-csv?type=${type}&token=${encodeURIComponent(jwt || '')}`, {
        headers: jwt ? { Authorization: `Bearer ${jwt}` } : {},
        responseType: 'blob'
      });
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sentinel_${type}_report_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to export CSV report: ' + (err.response?.data?.message || err.message));
    }
  };

  // Perform Website Security Analysis
  const handleScanWebsite = async (overrideUrl) => {
    const targetUrl = (overrideUrl || websiteUrl || '').trim();
    if (!targetUrl) {
      setScanError('Please enter a website URL or domain to scan.');
      return;
    }

    setScanning(true);
    setScanError('');
    try {
      const res = await axios.post(`${API_BASE}/scans/analyze`, { url: targetUrl });
      setScanResult(res.data);
      if (overrideUrl) {
        setWebsiteUrl(overrideUrl);
      }
      loadUserData();
      if (currentUser?.role === 'ROLE_ADMIN') {
        loadAdminData();
      }
    } catch (err) {
      setScanError(err.response?.data?.error || err.response?.data?.message || 'Failed to scan website.');
    } finally {
      setScanning(false);
    }
  };

  // Secondary UPI Simulator Handler
  const handleCreateTransaction = async (e) => {
    e.preventDefault();
    if (!txForm.amount || !txForm.merchant) {
      alert('Please provide amount and merchant name.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...txForm,
        currency: 'INR',
        transactionId: txForm.transactionId || `UPI-${Math.floor(100000 + Math.random() * 900000)}`,
        amount: Number(txForm.amount)
      };
      const res = await axios.post(`${API_BASE}/transactions`, payload);
      setLatestPrediction(res.data);
      loadUserData();
      setTxForm({
        transactionId: '',
        amount: '',
        currency: 'INR',
        merchant: '',
        website: '',
        location: '',
        category: 'ONLINE'
      });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to process transaction.');
    } finally {
      setLoading(false);
    }
  };

  // Admin: Toggle User Active Status
  const handleToggleUserStatus = async (userId) => {
    try {
      await axios.patch(`${API_BASE}/admin/users/${userId}/toggle-status`);
      loadAdminData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user status.');
    }
  };

  const isLoggedIn = !!currentUser;
  const isSuperAdmin = currentUser?.role === 'ROLE_ADMIN';
  const isAdminLoginRoute = currentPath === '/admin/login';
  const isAdminDashboardRoute = currentPath === '/admin/dashboard';
  const isAdminUserActivityRoute = currentPath === '/admin/user-activity';

  // Category Badge Details
  const getCategoryDetails = (category, status, riskLevel) => {
    const c = (category || status || '').toUpperCase();
    if (c.includes('TRUSTED') || status === 'TRUSTED') {
      return { className: 'badge-cat-trusted', label: 'TRUSTED WEBSITE', icon: '✅', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' };
    }
    if (c.includes('PHISHING') || status === 'PHISHING') {
      return { className: 'badge-cat-phishing', label: 'PHISHING WEBSITE', icon: '🚨', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' };
    }
    if (c.includes('MALWARE') || status === 'MALWARE') {
      return { className: 'badge-cat-malware', label: 'MALWARE WEBSITE', icon: '☣️', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' };
    }
    if (c.includes('BRAND IMPERSONATION') || status === 'BRAND_IMPERSONATION') {
      return { className: 'badge-cat-impersonation', label: 'BRAND IMPERSONATION WEBSITE', icon: '🎭', color: '#c2410c', bg: '#fff7ed', border: '#fed7aa' };
    }
    if (c.includes('SUSPICIOUS') || status === 'SUSPICIOUS') {
      return { className: 'badge-cat-suspicious', label: 'SUSPICIOUS WEBSITE', icon: '⚠️', color: '#ea580c', bg: '#fff7ed', border: '#ffedd5' };
    }
    return { className: 'badge-cat-unknown', label: 'UNKNOWN WEBSITE', icon: '❓', color: '#475569', bg: '#f8fafc', border: '#e2e8f0' };
  };

  // Helper for Risk Level Badge
  const getRiskLevelBadge = (level, score) => {
    const s = Number(score || 0);
    if (s <= 20) {
      return { label: 'LOW RISK (0–20)', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' };
    }
    if (s <= 40) {
      return { label: 'MODERATE RISK (21–40)', color: '#ca8a04', bg: '#fefce8', border: '#fef08a' };
    }
    if (s <= 69) {
      return { label: 'SUSPICIOUS (41–69)', color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' };
    }
    return { label: 'HIGH RISK (70–100)', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' };
  };

  return (
    <div className="website-com-root">
      {/* Top Header */}
      <header className="ws-header-wrapper">
        <div className="ws-top-bar">
          <div className="sentinel-brand-logo-wrap" onClick={() => navigateTo(isSuperAdmin ? '/admin/dashboard' : '/')}>
            <div className="sentinel-shield-icon-box">
              <span className="sentinel-shield-emoji">🛡️</span>
              <span className="sentinel-ai-live-pulse"></span>
            </div>
            <div className="sentinel-title-block">
              <div className="sentinel-main-name">
                AI Financial Fraud Detection System
              </div>
              <div className="sentinel-tagline">
                SENTINEL-AI • Real-Time Website Trust &amp; Fraud Intelligence
              </div>
            </div>
          </div>

          <div className="ws-top-utilities">
            <span className="ws-top-link">
              <span className={`ws-dot-live ${backendConnected ? 'green' : 'red'}`}></span>
              {backendConnected ? 'SYSTEM ONLINE' : 'GATEWAY OFFLINE'}
            </span>

            {isLoggedIn ? (
              <div className="ws-user-pill">
                <span className="ws-user-avatar" style={{ background: isSuperAdmin ? '#dc2626' : '#2563eb' }}>
                  {isSuperAdmin ? '🛡️' : (currentUser.fullName || currentUser.username).charAt(0).toUpperCase()}
                </span>
                <div className="ws-user-meta">
                  <span className="ws-user-name">{currentUser.fullName || currentUser.username}</span>
                  <span className="ws-user-role-badge">
                    {isSuperAdmin ? 'Authorized Super Admin' : `User (${currentUser.authProvider || 'LOCAL'})`}
                  </span>
                </div>
                <button className="ws-logout-btn" onClick={handleLogout}>Log Out</button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  className={`ws-top-link ${!isAdminLoginRoute && authMode === 'login' ? 'active' : ''}`}
                  onClick={() => { navigateTo('/'); setAuthMode('login'); }}
                >
                  Log In
                </span>

                <button
                  className="ws-btn-orange"
                  onClick={() => { navigateTo('/'); setAuthMode('signup'); }}
                >
                  Sign Up
                </button>

                <button
                  className="admin-nav-entry-btn"
                  onClick={() => navigateTo('/admin/login')}
                >
                  🛡️ Admin Portal
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Secondary Navigation Bar (Only for authenticated sessions) */}
        {isLoggedIn && (
          <nav className="ws-bottom-nav">
            <div className="ws-nav-inner">
              {isSuperAdmin ? (
                /* SUPER ADMIN NAVIGATION */
                <>
                  <span className={`ws-nav-item ${isAdminUserActivityRoute || adminTab === 'user-activity' ? 'active' : ''}`} onClick={() => { setAdminTab('user-activity'); navigateTo('/admin/user-activity'); }}>
                    👥 USER ACTIVITY MONITORING ({adminDashboard.totalRegisteredUsers || adminDashboard.totalUsers || 0})
                  </span>
                  <span className={`ws-nav-item ${currentPath === '/admin/dashboard' && adminTab === 'website-monitoring' ? 'active' : ''}`} onClick={() => { setAdminTab('website-monitoring'); navigateTo('/admin/dashboard'); }}>
                    🌐 WEBSITE THREAT MONITORING ({adminWebsiteStats.totalWebsiteScans})
                  </span>
                  <span className={`ws-nav-item ${currentPath === '/admin/dashboard' && adminTab === 'dashboard' ? 'active' : ''}`} onClick={() => { setAdminTab('dashboard'); navigateTo('/admin/dashboard'); }}>
                    📊 MASTER METRICS &amp; CHARTS
                  </span>
                  <span className={`ws-nav-item ${currentPath === '/admin/dashboard' && adminTab === 'live-users' ? 'active' : ''}`} onClick={() => { setAdminTab('live-users'); navigateTo('/admin/dashboard'); }}>
                    🟢 LIVE ACTIVE USERS ({adminDashboard.currentlyOnlineUsers ?? adminDashboard.activeUsers ?? 0})
                  </span>
                  <span className={`ws-nav-item ${currentPath === '/admin/dashboard' && adminTab === 'transactions' ? 'active' : ''}`} onClick={() => { setAdminTab('transactions'); navigateTo('/admin/dashboard'); }}>
                    💳 TRANSACTIONS ({adminDashboard.totalTransactions || 0})
                  </span>
                </>
              ) : (
                /* STANDARD USER NAVIGATION */
                <>
                  <span className={`ws-nav-item ${userTab === 'scanner' ? 'active' : ''}`} onClick={() => { setUserTab('scanner'); navigateTo('/user/dashboard'); }}>
                    🔍 WEBSITE SECURITY SCANNER
                  </span>
                  <span className={`ws-nav-item ${userTab === 'history' ? 'active' : ''}`} onClick={() => { setUserTab('history'); navigateTo('/user/dashboard'); }}>
                    📜 MY SCAN HISTORY ({userScans.length})
                  </span>
                  <span className={`ws-nav-item ${userTab === 'simulator' ? 'active' : ''}`} onClick={() => { setUserTab('simulator'); navigateTo('/user/dashboard'); }}>
                    💳 UPI PAYMENT SIMULATOR
                  </span>
                  <span className={`ws-nav-item ${userTab === 'transactions' ? 'active' : ''}`} onClick={() => { setUserTab('transactions'); navigateTo('/user/dashboard'); }}>
                    📊 TRANSACTIONS ({userTransactions.length})
                  </span>
                </>
              )}
            </div>
          </nav>
        )}
      </header>

      {/* Main Content Router */}
      {isAdminUserActivityRoute ? (
        /* ========================================================
           REQUIREMENT 2: ADMIN USER ACTIVITY MONITORING (/admin/user-activity)
           ======================================================== */
        isSuperAdmin ? (
          <main className="ws-dashboard-page-wrap">
            <div className="app-container">
              <AdminUserActivity />
            </div>
          </main>
        ) : (
          <main className="admin-access-denied-wrap">
            <div className="admin-access-denied-card">
              <span className="denied-icon">🚫</span>
              <h2>403 Forbidden — Access Denied</h2>
              <p>You do not have Super Admin privileges to access User Activity Monitoring telemetry. Only the designated administrator can access this portal.</p>
              <button className="ws-submit-btn" style={{ maxWidth: '240px', margin: '1rem auto 0' }} onClick={() => navigateTo(isLoggedIn ? '/user/dashboard' : '/')}>
                {isLoggedIn ? 'Return to User Dashboard' : 'Return to Client Login'}
              </button>
            </div>
          </main>
        )
      ) : isAdminLoginRoute ? (
        /* ========================================================
           PART 3: DEDICATED SUPER ADMIN LOGIN PAGE (/admin/login)
           ======================================================== */
        <main className="admin-login-page-wrap">
          <div className="admin-login-card">
            <div className="admin-login-badge-header">
              <span className="admin-shield-icon">🛡️</span>
              <h2>Sentinel-AI Super Admin Access</h2>
              <p>Strictly restricted to the single authorized Super Admin. Public registration is permanently disabled.</p>
            </div>

            {adminLoginError && (
              <div className="admin-auth-error-banner">
                <strong>Access Failure:</strong> {adminLoginError}
              </div>
            )}

            <form onSubmit={handleAdminLoginSubmit}>
              <div className="admin-input-group">
                <label>Admin Email or Username</label>
                <div className="input-with-icon">
                  <span className="field-icon">👤</span>
                  <input
                    type="text"
                    className="admin-input-field"
                    placeholder="e.g. admin or admin@sentinel.security"
                    value={adminLoginForm.username}
                    onChange={(e) => setAdminLoginForm({ ...adminLoginForm, username: e.target.value })}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="admin-input-group">
                <label>Administrator Password</label>
                <div className="input-with-icon">
                  <span className="field-icon">🔑</span>
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    className="admin-input-field"
                    placeholder="Enter admin password"
                    value={adminLoginForm.password}
                    onChange={(e) => setAdminLoginForm({ ...adminLoginForm, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    className="pwd-toggle-btn"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    title={showAdminPassword ? 'Hide password' : 'Show password'}
                  >
                    {showAdminPassword ? '👁️‍🗨️' : '👁️'}
                  </button>
                </div>
              </div>

              <button type="submit" className="admin-submit-btn" disabled={adminLoading}>
                {adminLoading ? 'AUTHENTICATING SUPER ADMIN...' : 'AUTHENTICATE AS SUPER ADMIN →'}
              </button>
            </form>

            <div className="admin-login-footer-links">
              <span onClick={() => navigateTo('/')} className="ws-text-blue">
                ← Return to Client Portal / User Login
              </span>
              <p className="admin-notice-text">
                🔒 Protected by Spring Security RBAC & BCrypt cryptographic hashing. All attempts are logged with IP & timestamp.
              </p>
            </div>
          </div>
        </main>
      ) : !isLoggedIn ? (
        authMode === 'login' ? (
          /* ========================================================
             CLIENT SIGN-IN VIEW (CLEAN ENTERPRISE FINTECH STYLE)
             ======================================================== */
          <main className="ws-login-page-wrap">
            <div className="ws-login-container">
              <h1 className="ws-main-title">Log In</h1>
              <p className="ws-sub-title">
                Don't have an account yet?{' '}
                <span onClick={() => { setAuthMode('signup'); setAuthError(''); }} className="ws-text-blue">
                  Register for a free account now.
                </span>
              </p>

              {authError && <div className="ws-auth-error-banner">{authError}</div>}
              {authSuccess && <div className="ws-auth-success-banner">{authSuccess}</div>}

              <div className="ws-split-card">
                {/* Left Column: Form */}
                <div className="ws-form-col">
                  <form onSubmit={handleLoginSubmit}>
                    <div className="ws-field-wrap">
                      <label className="ws-field-label">Username or Email</label>
                      <input
                        type="text"
                        className="ws-input-clean"
                        placeholder="Enter your username or email"
                        value={loginForm.username}
                        onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                        required
                      />
                    </div>

                    <div className="ws-field-wrap">
                      <div className="ws-field-header-row">
                        <label className="ws-field-label" style={{ marginBottom: 0 }}>Password</label>
                        <span className="ws-forgot-link" onClick={() => alert('Password recovery: Please contact system support.')}>
                          Forgot Password?
                        </span>
                      </div>
                      <input
                        type="password"
                        className="ws-input-clean"
                        placeholder="Enter your password"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        required
                      />
                    </div>

                    {/* Cloudflare Turnstile Badge */}
                    <div className="ws-cloudflare-badge">
                      <div className="ws-cf-left">
                        <span className="ws-cf-check">✔</span>
                        <span className="ws-cf-text">Success!</span>
                      </div>
                      <div className="ws-cf-right">
                        <svg className="ws-cf-cloud-svg" viewBox="0 0 100 45" width="46" height="24">
                          <path fill="#f38020" d="M85 30c0-6-4.5-11-10.5-11.5C73 10.5 64.5 4 54.5 4c-8 0-15 4-18.5 10C34 13.5 32 13 30 13c-7 0-13 5.5-13.5 12.5C7 26.5 0 33 0 41h85c4.5 0 8.5-3.5 8.5-8s-3.5-8-8.5-8z"/>
                        </svg>
                        <div className="ws-cf-brand-col">
                          <span className="ws-cf-brand">CLOUDFLARE</span>
                          <span className="ws-cf-links">Privacy • Terms</span>
                        </div>
                      </div>
                    </div>

                    <button type="submit" className="ws-submit-btn" disabled={loading}>
                      {loading ? 'AUTHENTICATING...' : 'LOG IN'}
                    </button>
                  </form>

                  <div className="ws-bottom-hints">
                    <p>
                      Don't have an account?{' '}
                      <span onClick={() => { setAuthMode('signup'); setAuthError(''); }} className="ws-text-blue">
                        Sign Up for free
                      </span>
                    </p>
                    <p style={{ marginTop: '8px' }}>
                      <span onClick={() => navigateTo('/admin/login')} className="ws-admin-link">
                        🛡️ Dedicated Super Admin Login &rarr;
                      </span>
                    </p>
                  </div>
                </div>

                {/* Middle Divider */}
                <div className="ws-divider-col">
                  <div className="ws-divider-line"></div>
                  <span className="ws-divider-text">OR</span>
                  <div className="ws-divider-line"></div>
                </div>

                {/* Right Column: Google Sign-In */}
                <div className="ws-social-col">
                  <p className="ws-social-title">Sign in with Google Account</p>

                  <div id="google-signin-btn-container" style={{ minHeight: '44px', marginBottom: '14px' }}>
                    {!googleClientId && (
                      <button
                        type="button"
                        className="ws-google-btn"
                        onClick={() => setShowGoogleConfigModal(true)}
                      >
                        <div className="ws-google-icon-box">
                          <svg viewBox="0 0 24 24" width="20" height="20">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                          </svg>
                        </div>
                        <span className="ws-google-btn-text">Continue with Google</span>
                      </button>
                    )}
                  </div>

                  {googleClientId ? (
                    <p style={{ fontSize: '12px', color: '#16a34a', margin: '6px 0 18px', fontWeight: 600 }}>
                      ✔ Google Identity Services connected to official Google servers.
                    </p>
                  ) : (
                    <p style={{ fontSize: '12px', color: '#64748b', margin: '6px 0 18px' }}>
                      To connect your real Google Account, provide your Google OAuth Client ID via <span className="ws-text-blue" onClick={() => setShowGoogleConfigModal(true)}>OAuth Settings</span>.
                    </p>
                  )}

                  <div className="ws-social-trust-pill">
                    <span style={{ fontSize: '20px' }}>🛡️</span>
                    <div>
                      <strong style={{ display: 'block', color: '#0f172a', fontSize: '13px' }}>Enterprise Threat Intelligence</strong>
                      <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#64748b', lineHeight: 1.4 }}>
                        Zero-knowledge private account isolation. All sessions protected by BCrypt cryptographic hashing and Spring Security RBAC.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        ) : (
          /* ========================================================
             CLIENT REGISTRATION VIEW (STRICTLY NORMAL USER ROLE)
             ======================================================== */
          <main className="ws-login-page-wrap">
            <div className="ws-login-container">
              <h1 className="ws-main-title">Create Account</h1>
              <p className="ws-sub-title">
                Already registered?{' '}
                <span onClick={() => { setAuthMode('login'); setAuthError(''); }} className="ws-text-blue">
                  Log in to your account.
                </span>
              </p>

              {authError && <div className="ws-auth-error-banner">{authError}</div>}

              <div className="ws-split-card">
                <div className="ws-form-col">
                  <form onSubmit={handleSignupSubmit}>
                    <div className="ws-field-wrap">
                      <label className="ws-field-label">Full Name</label>
                      <input
                        type="text"
                        className="ws-input-clean"
                        placeholder="e.g. Sai Kiran"
                        value={signupForm.fullName}
                        onChange={(e) => setSignupForm({ ...signupForm, fullName: e.target.value })}
                        required
                      />
                    </div>

                    <div className="ws-field-wrap">
                      <label className="ws-field-label">Email Address</label>
                      <input
                        type="email"
                        className="ws-input-clean"
                        placeholder="e.g. name@gmail.com"
                        value={signupForm.email}
                        onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                        required
                      />
                    </div>

                    <div className="ws-field-wrap">
                      <label className="ws-field-label">Username</label>
                      <input
                        type="text"
                        className="ws-input-clean"
                        placeholder="Choose Username"
                        value={signupForm.username}
                        onChange={(e) => setSignupForm({ ...signupForm, username: e.target.value })}
                        required
                      />
                    </div>

                    <div className="ws-field-wrap">
                      <label className="ws-field-label">Password</label>
                      <input
                        type="password"
                        className="ws-input-clean"
                        placeholder="Create Password"
                        value={signupForm.password}
                        onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                        required
                      />
                    </div>

                    <div className="ws-cloudflare-badge">
                      <div className="ws-cf-left">
                        <span className="ws-cf-check">✔</span>
                        <span className="ws-cf-text">Success!</span>
                      </div>
                      <div className="ws-cf-right">
                        <svg className="ws-cf-cloud-svg" viewBox="0 0 100 45" width="46" height="24">
                          <path fill="#f38020" d="M85 30c0-6-4.5-11-10.5-11.5C73 10.5 64.5 4 54.5 4c-8 0-15 4-18.5 10C34 13.5 32 13 30 13c-7 0-13 5.5-13.5 12.5C7 26.5 0 33 0 41h85c4.5 0 8.5-3.5 8.5-8s-3.5-8-8.5-8z"/>
                        </svg>
                        <div className="ws-cf-brand-col">
                          <span className="ws-cf-brand">CLOUDFLARE</span>
                          <span className="ws-cf-links">Privacy • Terms</span>
                        </div>
                      </div>
                    </div>

                    <button type="submit" className="ws-submit-btn" disabled={loading}>
                      {loading ? 'CREATING YOUR ACCOUNT...' : 'CREATE ACCOUNT & SIGN IN'}
                    </button>
                  </form>

                  <div className="ws-bottom-hints">
                    <p>New accounts start completely fresh: 0 scans, 0 transactions.</p>
                    <p>Already have an account? <span onClick={() => { setAuthMode('login'); setAuthError(''); }} className="ws-text-blue">Log In here</span></p>
                  </div>
                </div>

                <div className="ws-divider-col">
                  <div className="ws-divider-line"></div>
                  <span className="ws-divider-text">OR</span>
                  <div className="ws-divider-line"></div>
                </div>

                <div className="ws-social-col">
                  <p className="ws-social-title">Sign up with Google Identity</p>
                  <div id="google-signin-btn-container-signup" style={{ minHeight: '44px', marginBottom: '14px' }}>
                    <button
                      type="button"
                      className="ws-google-btn"
                      onClick={() => setShowGoogleConfigModal(true)}
                    >
                      <div className="ws-google-icon-box">
                        <svg viewBox="0 0 24 24" width="20" height="20">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                        </svg>
                      </div>
                      <span className="ws-google-btn-text">Sign up with Google</span>
                    </button>
                  </div>

                  <div className="ws-social-trust-pill" style={{ marginTop: '24px' }}>
                    <span style={{ fontSize: '20px' }}>⚡</span>
                    <div>
                      <strong style={{ display: 'block', color: '#0f172a', fontSize: '13px' }}>Instant Zero-State Dashboard</strong>
                      <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#64748b', lineHeight: 1.4 }}>
                        Your new account starts completely fresh with 0 scans and complete data isolation.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        )
      ) : isSuperAdmin ? (
        /* ========================================================
           PART 5: SUPER ADMIN CONTROL DASHBOARD (/admin/dashboard)
           ======================================================== */
        <main className="ws-dashboard-page-wrap">
          <div className="app-container">
            {/* Super Admin Hero Banner */}
            <div className="hero-header admin-banner">
              <div className="hero-brand">
                <span className="shield-icon">🛡️</span>
                <div>
                  <h1>Super Admin Threat Intelligence & Fleet Console</h1>
                  <p>Global E-Commerce Domain Security, Phishing Mitigation & Single Owner Control</p>
                </div>
              </div>
              <div className="system-status">
                <span className="status-tag active">● Super Admin Active</span>
                <span className="status-tag">Owner: admin</span>
                <span className="status-tag">Route: /admin/dashboard</span>
              </div>
            </div>

            {/* ========================================================
               REQUIREMENT 3: ADMIN DASHBOARD TOP 9 STATISTICS
               ======================================================== */}
            <div className="admin-section-heading">
              <h3>📊 Master Operations &amp; Live Authentication Intelligence</h3>
            </div>
            <div className="metrics-grid top-nine-metrics">
              <div className="metric-card">
                <div className="metric-icon">👥</div>
                <div className="metric-value">{adminDashboard.totalRegisteredUsers || adminDashboard.totalUsers || 0}</div>
                <div className="metric-label">TOTAL REGISTERED USERS</div>
              </div>
              <div
                className="metric-card alert"
                onClick={() => setAdminTab('live-users')}
                style={{ cursor: 'pointer', border: '1.5px solid #86efac', background: '#f0fdf4' }}
                title="Click to view all currently online user emails"
              >
                <div className="metric-icon">🟢</div>
                <div className="metric-value" style={{ color: '#16a34a' }}>{adminDashboard.currentlyOnlineUsers ?? adminDashboard.activeUsers ?? 0}</div>
                <div className="metric-label">CURRENTLY ONLINE USERS</div>
                {adminDashboard.liveActiveUsers && adminDashboard.liveActiveUsers.length > 0 && (
                  <div style={{ marginTop: '6px', fontSize: '0.74rem', color: '#15803d', fontWeight: 600, wordBreak: 'break-all' }}>
                    Active: <code>{adminDashboard.liveActiveUsers[0].email}</code>
                    {adminDashboard.liveActiveUsers.length > 1 && ` (+${adminDashboard.liveActiveUsers.length - 1} more)`}
                  </div>
                )}
              </div>
              <div className="metric-card">
                <div className="metric-icon">📋</div>
                <div className="metric-value">{adminDashboard.totalSignups || adminDashboard.totalUsers || 0}</div>
                <div className="metric-label">TOTAL SIGNUPS</div>
              </div>
              <div className="metric-card">
                <div className="metric-icon">📅</div>
                <div className="metric-value">{adminDashboard.todaySignups ?? adminDashboard.signupsToday ?? 0}</div>
                <div className="metric-label">TODAY'S SIGNUPS</div>
              </div>
              <div className="metric-card">
                <div className="metric-icon">🔑</div>
                <div className="metric-value" style={{ color: '#2563eb' }}>{adminDashboard.totalSuccessfulLogins ?? adminDashboard.successfulLogins ?? 0}</div>
                <div className="metric-label">TOTAL SUCCESSFUL LOGINS</div>
              </div>
              <div className="metric-card">
                <div className="metric-icon">⚡</div>
                <div className="metric-value" style={{ color: '#0891b2' }}>{adminDashboard.todayLogins ?? adminDashboard.loginsToday ?? 0}</div>
                <div className="metric-label">TODAY'S LOGINS</div>
              </div>
              <div className="metric-card alert">
                <div className="metric-icon">⚠️</div>
                <div className="metric-value" style={{ color: '#dc2626' }}>{adminDashboard.totalFailedLogins ?? adminDashboard.failedLogins ?? 0}</div>
                <div className="metric-label">TOTAL FAILED LOGIN ATTEMPTS</div>
              </div>
              <div className="metric-card">
                <div className="metric-icon">🔵</div>
                <div className="metric-value" style={{ color: '#4285F4' }}>{adminDashboard.googleLoginCount ?? adminDashboard.googleLogins ?? 0}</div>
                <div className="metric-label">GOOGLE LOGIN COUNT</div>
              </div>
              <div className="metric-card">
                <div className="metric-icon">✉️</div>
                <div className="metric-value" style={{ color: '#059669' }}>{adminDashboard.emailLoginCount ?? adminDashboard.emailLogins ?? 0}</div>
                <div className="metric-label">EMAIL LOGIN COUNT</div>
              </div>
            </div>

            {/* LIVE ACTIVE USER SESSIONS & LOGGED-IN MAIL IDS */}
            <div className="live-active-sessions-panel" style={{ background: '#ffffff', border: '1.5px solid #86efac', borderRadius: '12px', padding: '1.2rem', marginBottom: '1.8rem', boxShadow: '0 2px 10px rgba(16, 185, 129, 0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#16a34a', boxShadow: '0 0 8px #16a34a' }}></span>
                  <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800, color: '#0f172a' }}>
                    Currently Logged-In User Sessions ({adminDashboard.currentlyOnlineUsers ?? adminDashboard.liveActiveUsers?.length ?? 0} Online)
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => { setAdminTab('user-activity'); navigateTo('/admin/user-activity'); }}
                  style={{ background: '#0284c7', color: '#ffffff', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  View Full User Activity Telemetry (All Accounts) &rarr;
                </button>
              </div>

              {(!adminDashboard.liveActiveUsers || adminDashboard.liveActiveUsers.length === 0) ? (
                <p style={{ color: '#64748b', fontSize: '0.84rem', margin: 0 }}>No users currently active in the last 5 minutes.</p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '6px' }}>
                  {adminDashboard.liveActiveUsers.map(u => (
                    <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', padding: '8px 14px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a' }}></span>
                      <div>
                        <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#15803d' }}>
                          📧 {u.email}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#475569' }}>
                          Name: <strong>{u.fullName || u.username}</strong> | Provider: <strong>{u.authProvider || 'LOCAL'}</strong> | Role: <span style={{ color: '#16a34a', fontWeight: 700 }}>{u.role}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* REQUIREMENT 3: LIVE CHARTS */}
            <AdminLiveCharts dashboardData={adminDashboard} />

            {/* PART 5: WEBSITE SCAN STATISTICS CARDS */}
            <div className="admin-section-heading">
              <h3>🌐 Website Scan & Security Threat Telemetry</h3>
            </div>
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-icon">🌐</div>
                <div className="metric-value">{adminWebsiteStats.totalWebsiteScans}</div>
                <div className="metric-label">Total Website Scans</div>
              </div>
              <div className="metric-card">
                <div className="metric-icon">✅</div>
                <div className="metric-value" style={{ color: '#16a34a' }}>{adminWebsiteStats.trustedWebsites}</div>
                <div className="metric-label">Trusted Websites (Low Risk)</div>
              </div>
              <div className="metric-card warning">
                <div className="metric-icon">⚠️</div>
                <div className="metric-value" style={{ color: '#ea580c' }}>{adminWebsiteStats.suspiciousWebsites}</div>
                <div className="metric-label">Suspicious Websites</div>
              </div>
              <div className="metric-card alert">
                <div className="metric-icon">🚨</div>
                <div className="metric-value" style={{ color: '#dc2626' }}>{adminWebsiteStats.highRiskWebsites}</div>
                <div className="metric-label">High-Risk Fraud Websites</div>
              </div>
              <div className="metric-card alert">
                <div className="metric-icon">🎣</div>
                <div className="metric-value" style={{ color: '#dc2626' }}>{adminWebsiteStats.phishingWebsites}</div>
                <div className="metric-label">Phishing Websites</div>
              </div>
              <div className="metric-card alert">
                <div className="metric-icon">☣️</div>
                <div className="metric-value" style={{ color: '#7c3aed' }}>{adminWebsiteStats.malwareWebsites}</div>
                <div className="metric-label">Malware Websites</div>
              </div>
              <div className="metric-card alert">
                <div className="metric-icon">🎭</div>
                <div className="metric-value" style={{ color: '#c2410c' }}>{adminWebsiteStats.brandImpersonationsDetected}</div>
                <div className="metric-label">Brand Impersonations</div>
              </div>
              <div className="metric-card">
                <div className="metric-icon">❓</div>
                <div className="metric-value" style={{ color: '#64748b' }}>{adminWebsiteStats.unverifiedWebsites}</div>
                <div className="metric-label">Unverified Websites</div>
              </div>
            </div>

            {/* Admin Tabs Content */}
            {adminTab === 'user-activity' && (
              <AdminUserActivity />
            )}

            {adminTab === 'website-monitoring' && (
              <div className="admin-content-flow">
                {/* Most Frequently Scanned Domains */}
                <div className="card-panel full-width">
                  <h2>📈 Most Frequently Scanned Domains Across Fleet</h2>
                  {adminWebsiteStats.topScannedDomains.length === 0 ? (
                    <p className="no-threats">No domain telemetry logged yet.</p>
                  ) : (
                    <div className="top-domains-grid">
                      {adminWebsiteStats.topScannedDomains.map((item, idx) => (
                        <div key={idx} className="top-domain-pill">
                          <span className="top-domain-rank">#{idx + 1}</span>
                          <span className="top-domain-name"><code>{item.domain}</code></span>
                          <span className="top-domain-count">{item.scanCount} scans</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent High-Risk Threats */}
                <div className="card-panel full-width" style={{ marginTop: '1.5rem' }}>
                  <h2>🚨 Latest High-Risk Fraud, Phishing & Impersonation Detections</h2>
                  {adminWebsiteStats.recentHighRiskDetections.length === 0 ? (
                    <p className="no-threats">Zero high-risk fraud domains detected in recent scans.</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Domain</th>
                            <th>Detection Category</th>
                            <th>Brand Target</th>
                            <th>Risk Score</th>
                            <th>Threat Status</th>
                            <th>Scanned By</th>
                            <th>Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminWebsiteStats.recentHighRiskDetections.map(scan => {
                            const cat = getCategoryDetails(scan.category, scan.status, scan.riskLevel);
                            return (
                              <tr key={scan.id} className="row-fraud">
                                <td><code>{scan.domain}</code></td>
                                <td>
                                  <span className={`badge ${cat.className}`}>
                                    {cat.icon} {scan.category || cat.label}
                                  </span>
                                </td>
                                <td><strong>{scan.brandName || 'Unknown'}</strong></td>
                                <td>
                                  <span className="risk-pill high">{scan.riskScore} / 100</span>
                                </td>
                                <td><span className="badge badge-red">{scan.status}</span></td>
                                <td><code>{scan.user?.username || 'user'}</code></td>
                                <td>{scan.scannedAt ? new Date(scan.scannedAt).toLocaleTimeString() : 'N/A'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Live Feed of Recent Scans */}
                <div className="card-panel full-width" style={{ marginTop: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2>🌐 Recent Website Scans Feed</h2>
                    <button
                      type="button"
                      onClick={() => handleExportCsv('scans')}
                      className="secondary-btn"
                      style={{ width: 'auto', padding: '6px 14px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
                    >
                      📥 Export Scans CSV
                    </button>
                  </div>
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Target Domain</th>
                          <th>Detection Category</th>
                          <th>Trust Score</th>
                          <th>Risk Score</th>
                          <th>HTTPS / SSL</th>
                          <th>Risk Level</th>
                          <th>Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminWebsiteStats.recentScans.length === 0 ? (
                          <tr><td colSpan="8" style={{ textAlign: 'center' }}>No website scans logged yet.</td></tr>
                        ) : (
                          adminWebsiteStats.recentScans.map(s => {
                            const cat = getCategoryDetails(s.category, s.status, s.riskLevel);
                            return (
                              <tr key={s.id}>
                                <td><code>#{s.id}</code></td>
                                <td><strong>{s.domain}</strong></td>
                                <td>
                                  <span className={`badge ${cat.className}`}>
                                    {cat.icon} {s.category || cat.label}
                                  </span>
                                </td>
                                <td><strong style={{ color: '#16a34a' }}>{s.trustScore}/100</strong></td>
                                <td>
                                  <span className={`risk-pill ${s.riskScore >= 70 ? 'high' : s.riskScore >= 30 ? 'med' : 'low'}`}>
                                    {s.riskScore}/100
                                  </span>
                                </td>
                                <td>{s.hasHttps ? '🔒 HTTPS' : '⚠️ No HTTPS'}</td>
                                <td><span className="cat-tag">{s.riskLevel}</span></td>
                                <td>{s.scannedAt ? new Date(s.scannedAt).toLocaleTimeString() : '-'}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {adminTab === 'live-users' && (
              /* Live Active Users */
              <div className="card-panel full-width">
                <h2>🟢 Currently Active Users (Activity within last 5 minutes)</h2>
                {adminDashboard.liveActiveUsers.length === 0 ? (
                  <p className="no-threats">No users currently active in the last 5 minutes.</p>
                ) : (
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Status</th>
                          <th>Username</th>
                          <th>Email Address</th>
                          <th>Full Name</th>
                          <th>Auth Provider</th>
                          <th>Last Login</th>
                          <th>Last Activity</th>
                          <th>Role</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminDashboard.liveActiveUsers.map(u => (
                          <tr key={u.id}>
                            <td><span className="live-pulse-badge">ONLINE ●</span></td>
                            <td><code>{u.username}</code></td>
                            <td>{u.email}</td>
                            <td>{u.fullName || '-'}</td>
                            <td><span className="cat-tag">{u.authProvider || 'LOCAL'}</span></td>
                            <td>{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'N/A'}</td>
                            <td>{u.lastActivityAt ? new Date(u.lastActivityAt).toLocaleTimeString() : 'N/A'}</td>
                            <td><span className="badge badge-green">{u.role}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {adminTab === 'users' && (
              /* User Management & Registrations */
              <div className="card-panel full-width">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h2>👥 Registered Users Fleet ({adminUsersList.length})</h2>
                  <input
                    type="text"
                    placeholder="Search by name, email, or username..."
                    style={{ maxWidth: '320px' }}
                    value={adminSearch}
                    onChange={(e) => setAdminSearch(e.target.value)}
                  />
                </div>
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Full Name</th>
                        <th>Provider</th>
                        <th>Registered Date</th>
                        <th>Login Count</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminUsersList.length === 0 ? (
                        <tr><td colSpan="9" style={{ textAlign: 'center' }}>No users found matching query.</td></tr>
                      ) : (
                        adminUsersList.map(u => (
                          <tr key={u.id}>
                            <td><code>#{u.id}</code></td>
                            <td><strong>{u.username}</strong></td>
                            <td>{u.email}</td>
                            <td>{u.fullName || '-'}</td>
                            <td><span className="cat-tag">{u.authProvider}</span></td>
                            <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}</td>
                            <td>{u.loginCount || 0}</td>
                            <td>
                              <span className={`badge ${u.active ? 'badge-green' : 'badge-red'}`}>
                                {u.active ? 'ACTIVE' : 'DEACTIVATED'}
                              </span>
                            </td>
                            <td>
                              {u.role !== 'ROLE_ADMIN' && (
                                <button
                                  className="action-btn"
                                  onClick={() => handleToggleUserStatus(u.id)}
                                >
                                  {u.active ? 'Deactivate' : 'Activate'}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {(adminTab === 'transactions' || adminTab === 'dashboard') && (
              /* Global Transactions */
              <div className="card-panel full-width" style={{ marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2>📊 System-Wide Transaction Audit Ledger (INR ₹)</h2>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => handleExportCsv('transactions')}
                      className="secondary-btn"
                      style={{ width: 'auto', padding: '6px 14px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
                    >
                      📥 Export Transactions CSV
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExportCsv('scans')}
                      className="secondary-btn"
                      style={{ width: 'auto', padding: '6px 14px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
                    >
                      📥 Export Scans CSV
                    </button>
                  </div>
                </div>
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Tx ID</th>
                        <th>User</th>
                        <th>Amount (₹)</th>
                        <th>Merchant</th>
                        <th>Category</th>
                        <th>Risk Score</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminAllTransactions.length === 0 ? (
                        <tr><td colSpan="7" style={{ textAlign: 'center' }}>No system transactions recorded.</td></tr>
                      ) : (
                        adminAllTransactions.map(t => (
                          <tr key={t.id} className={t.isFraud ? 'row-fraud' : ''}>
                            <td><code>{t.transactionId}</code></td>
                            <td><strong>{t.user?.username || 'user'}</strong></td>
                            <td>₹{t.amount?.toLocaleString('en-IN')}</td>
                            <td>{t.merchant}</td>
                            <td><span className="cat-tag">{t.category}</span></td>
                            <td>
                              <span className={`risk-pill ${t.riskScore >= 70 ? 'high' : t.riskScore >= 30 ? 'med' : 'low'}`}>
                                {t.riskScore} / 100
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${t.isFraud ? 'badge-red' : 'badge-green'}`}>
                                {t.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      ) : (
        /* ========================================================
           STANDARD CLIENT PORTAL (STRICT DATA ISOLATION)
           ======================================================== */
        <main className="ws-dashboard-page-wrap">
          <div className="app-container">
            {/* User Hero Banner */}
            <div className="hero-header">
              <div className="hero-brand">
                <span className="shield-icon">🛡️</span>
                <div>
                  <h1>AI Financial Fraud Detection System</h1>
                  <p>Real-time website security intelligence, e-commerce domain trust screening, and financial fraud detection.</p>
                </div>
              </div>
              <div className="system-status">
                <span className="status-tag active">● AI Engine Active</span>
                <span className="status-tag">Account: {currentUser.email}</span>
                <span className="status-tag">Isolation: User #{currentUser.id}</span>
              </div>
            </div>

            {/* Personal Website Security Metrics (Fresh accounts see 0) */}
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-icon">🔍</div>
                <div className="metric-value">{userScanStats.totalScans}</div>
                <div className="metric-label">Websites Checked</div>
              </div>
              <div className="metric-card">
                <div className="metric-icon">✅</div>
                <div className="metric-value" style={{ color: '#16a34a' }}>{userScanStats.trustedScans}</div>
                <div className="metric-label">Trusted Websites (Low Risk)</div>
              </div>
              <div className="metric-card warning">
                <div className="metric-icon">⚠️</div>
                <div className="metric-value" style={{ color: '#ea580c' }}>{userScanStats.suspiciousScans}</div>
                <div className="metric-label">Suspicious Websites</div>
              </div>
              <div className="metric-card alert">
                <div className="metric-icon">🚨</div>
                <div className="metric-value" style={{ color: '#dc2626' }}>{userScanStats.highRiskScans}</div>
                <div className="metric-label">High-Risk Threats Blocked</div>
              </div>
            </div>

            {/* View 1: Website Security Scanner */}
            {userTab === 'scanner' && (
              <div className="scanner-layout">
                {/* URL Input Card */}
                <div className="card-panel full-width">
                  <div className="scanner-hero-title">
                    <h2>Enter Website URL to Check Before Shopping</h2>
                    <p>Our weighted AI engine checks official brand registries, SSL certificates, typosquatting, brand impersonation, and phishing threat databases.</p>
                  </div>

                  {/* Preset Quick Links for Fast Testing */}
                  <div className="scanner-quick-pills">
                    <span className="quick-label">Try Examples:</span>
                    <button type="button" className="quick-pill verified" onClick={() => handleScanWebsite('https://www.amazon.in')}>
                      🛒 amazon.in (Official)
                    </button>
                    <button type="button" className="quick-pill verified" onClick={() => handleScanWebsite('https://www.flipkart.com')}>
                      🛍️ flipkart.com (Official)
                    </button>
                    <button type="button" className="quick-pill unknown" onClick={() => handleScanWebsite('https://unknown-shopping-example.com')}>
                      ❓ unknown-shopping-example.com (Unverified)
                    </button>
                    <button type="button" className="quick-pill fake" onClick={() => handleScanWebsite('https://amaz0n-shopping-example.com')}>
                      🎭 amaz0n-shopping-example.com (Impersonation)
                    </button>
                    <button type="button" className="quick-pill fake" onClick={() => handleScanWebsite('https://known-phishing-domain.example')}>
                      🚨 known-phishing-domain.example (Phishing)
                    </button>
                    <button type="button" className="quick-pill fake" onClick={() => handleScanWebsite('https://known-malware-domain.example')}>
                      ☣️ known-malware-domain.example (Malware)
                    </button>
                  </div>

                  {/* Main Scanner Input Form */}
                  <div className="scanner-input-container">
                    <div className="scanner-input-bar">
                      <span className="scanner-url-icon">🌐</span>
                      <input
                        type="text"
                        className="scanner-input-field"
                        placeholder="e.g. https://www.amazon.in or https://unknown-shopping-site.com"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleScanWebsite()}
                      />
                      <button
                        type="button"
                        className="scanner-check-btn"
                        disabled={scanning}
                        onClick={() => handleScanWebsite()}
                      >
                        {scanning ? 'ANALYZING DOMAIN...' : 'CHECK WEBSITE'}
                      </button>
                    </div>
                  </div>

                  {scanError && <div className="ws-auth-error-banner" style={{ marginTop: '1rem' }}>{scanError}</div>}
                </div>

                {/* Scan Results Card */}
                {scanResult && (
                  <div className={`scan-results-card ${scanResult.risk_level?.toLowerCase()}`}>
                    {/* Header Banner */}
                    <div className="scan-res-header">
                      <div>
                        <div className="scan-res-domain-row">
                          <h3 className="scan-res-domain">{scanResult.domain}</h3>
                          {(() => {
                            const cat = getCategoryDetails(scanResult.category, scanResult.status, scanResult.risk_level);
                            return (
                              <span className={`badge ${cat.className}`}>
                                {cat.icon} {scanResult.category || cat.label}
                              </span>
                            );
                          })()}
                        </div>
                        <p className="scan-res-hostname">Target URL: <code>{scanResult.url}</code></p>
                      </div>

                      {/* Main Status Badge */}
                      <div className="scan-res-badge-wrap">
                        {(() => {
                          const rBadge = getRiskLevelBadge(scanResult.risk_level, scanResult.risk_score);
                          return (
                            <div className="scan-main-status-pill" style={{ background: rBadge.bg, borderColor: rBadge.border, color: rBadge.color }}>
                              <span className="status-dot" style={{ background: rBadge.color }}></span>
                              {rBadge.label}
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Scores Gauge Row */}
                    <div className="scan-scores-row">
                      <div className="score-card trust">
                        <div className="score-number-display">{scanResult.trust_score}<span>/100</span></div>
                        <div className="score-label">Website Trust Score</div>
                        <div className="score-meter-bar">
                          <div className="score-meter-fill trust" style={{ width: `${scanResult.trust_score}%` }}></div>
                        </div>
                        <span className="score-caption">Based on verified brand identity, SSL encryption, and threat telemetry</span>
                      </div>

                      <div className="score-card risk">
                        <div className="score-number-display">{scanResult.risk_score}<span>/100</span></div>
                        <div className="score-label">Weighted Threat Risk Score</div>
                        <div className="score-meter-bar">
                          <div className="score-meter-fill risk" style={{ width: `${scanResult.risk_score}%` }}></div>
                        </div>
                        <span className="score-caption">
                          {scanResult.risk_score <= 20 ? '0–20: LOW RISK' : scanResult.risk_score <= 40 ? '21–40: MODERATE RISK' : scanResult.risk_score <= 69 ? '41–69: SUSPICIOUS' : '70–100: HIGH RISK'}
                        </span>
                      </div>
                    </div>

                    {/* Security Specifications Grid */}
                    <div className="security-specs-grid">
                      <div className="spec-item">
                        <span className="spec-label">Detection Category</span>
                        <strong className="spec-value">{scanResult.category || 'UNKNOWN WEBSITE'}</strong>
                      </div>
                      <div className="spec-item">
                        <span className="spec-label">Brand Identity</span>
                        <strong className="spec-value">{scanResult.brand_name || 'Unrecognized'}</strong>
                      </div>
                      <div className="spec-item">
                        <span className="spec-label">HTTPS Encryption</span>
                        <strong className="spec-value" style={{ color: scanResult.has_https ? '#16a34a' : '#dc2626' }}>
                          {scanResult.has_https ? '🔒 Enabled (HTTPS)' : '⚠️ Unencrypted (HTTP)'}
                        </strong>
                      </div>
                      <div className="spec-item">
                        <span className="spec-label">SSL Certificate Authority</span>
                        <strong className="spec-value">{scanResult.ssl_certificate?.issuer || 'Unavailable / Unverified'}</strong>
                      </div>
                      <div className="spec-item">
                        <span className="spec-label">Phishing Detection</span>
                        <strong className="spec-value" style={{ color: scanResult.is_phishing ? '#dc2626' : '#16a34a' }}>
                          {scanResult.is_phishing ? '🚨 Confirmed Phishing' : 'Clean / No Phishing Reported'}
                        </strong>
                      </div>
                      <div className="spec-item">
                        <span className="spec-label">Malware Detection</span>
                        <strong className="spec-value" style={{ color: scanResult.is_malware ? '#dc2626' : '#16a34a' }}>
                          {scanResult.is_malware ? '☣️ Confirmed Malware Host' : 'Clean / No Malware Reported'}
                        </strong>
                      </div>
                    </div>

                    {/* Indicators Split Grid */}
                    <div className="indicators-split-grid">
                      <div className="indicator-panel positive">
                        <h4>✅ Positive Security Indicators</h4>
                        {scanResult.positive_indicators && scanResult.positive_indicators.length > 0 ? (
                          <ul className="indicator-list">
                            {scanResult.positive_indicators.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="empty-indicator-text">No verified positive security indicators recorded.</p>
                        )}
                      </div>

                      <div className="indicator-panel negative">
                        <h4>⚠️ Detected Issues & Red Flags</h4>
                        {scanResult.detected_issues && scanResult.detected_issues.length > 0 ? (
                          <ul className="indicator-list issues">
                            {scanResult.detected_issues.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="empty-indicator-text clean">✔ Zero suspicious patterns or high-risk threats detected.</p>
                        )}
                      </div>
                    </div>

                    {/* Actionable Advice */}
                    <div className="shopping-advice-panel">
                      <h4>🛡️ Recommended Actions for Shoppers</h4>
                      <ul>
                        {scanResult.recommended_actions?.map((action, i) => (
                          <li key={i}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* View 2: User Scan History */}
            {userTab === 'history' && (
              <div className="card-panel full-width">
                <h2>📜 My Website Security Scan History</h2>
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Domain / Hostname</th>
                        <th>Detection Category</th>
                        <th>Trust Score</th>
                        <th>Risk Score</th>
                        <th>Risk Level</th>
                        <th>Scan Date & Time</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userScans.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                            <strong>No website scans recorded yet.</strong>
                            <p style={{ color: '#64748b', margin: '4px 0 0' }}>
                              Enter an e-commerce URL in the Website Security Scanner above to verify its authenticity.
                            </p>
                          </td>
                        </tr>
                      ) : (
                        userScans.map(scan => {
                          const cat = getCategoryDetails(scan.category, scan.status, scan.riskLevel);
                          const rBadge = getRiskLevelBadge(scan.riskLevel, scan.riskScore);
                          return (
                            <tr key={scan.id}>
                              <td><code>{scan.domain}</code></td>
                              <td>
                                <span className={`badge ${cat.className}`}>
                                  {cat.icon} {scan.category || cat.label}
                                </span>
                              </td>
                              <td><strong style={{ color: '#16a34a' }}>{scan.trustScore}/100</strong></td>
                              <td>
                                <span className={`risk-pill ${scan.riskScore >= 70 ? 'high' : scan.riskScore >= 30 ? 'med' : 'low'}`}>
                                  {scan.riskScore}/100
                                </span>
                              </td>
                              <td>
                                <span className="cat-tag" style={{ color: rBadge.color, borderColor: rBadge.border }}>
                                  {rBadge.label}
                                </span>
                              </td>
                              <td>{scan.scannedAt ? new Date(scan.scannedAt).toLocaleString() : '-'}</td>
                              <td>
                                <button
                                  type="button"
                                  className="action-btn"
                                  onClick={() => {
                                    setUserTab('scanner');
                                    handleScanWebsite(scan.url);
                                  }}
                                >
                                  Re-Check
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* View 3: Secondary UPI Simulator */}
            {userTab === 'simulator' && (
              <div className="card-panel full-width">
                <h2>💳 Indian UPI / Banking Transaction Simulator</h2>
                <p style={{ color: '#64748b', marginBottom: '1.2rem' }}>
                  Simulate online UPI and card checkouts with automatic website domain verification.
                </p>

                <form onSubmit={handleCreateTransaction}>
                  <div className="form-row">
                    <div>
                      <label>Transaction ID / UPI Reference</label>
                      <input
                        placeholder="e.g. UPI-984721"
                        value={txForm.transactionId}
                        onChange={e => setTxForm({ ...txForm, transactionId: e.target.value })}
                      />
                    </div>
                    <div>
                      <label>Amount (₹ INR)</label>
                      <input
                        type="number"
                        placeholder="e.g. 450.00"
                        value={txForm.amount}
                        onChange={e => setTxForm({ ...txForm, amount: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div>
                      <label>Checkout Website URL</label>
                      <input
                        placeholder="e.g. https://www.amazon.in or https://unknown-deals.xyz"
                        value={txForm.website}
                        onChange={e => setTxForm({ ...txForm, website: e.target.value })}
                      />
                    </div>
                    <div>
                      <label>Category</label>
                      <select value={txForm.category} onChange={e => setTxForm({ ...txForm, category: e.target.value })}>
                        <option value="ONLINE">ONLINE SHOPPING</option>
                        <option value="GROCERY">GROCERY</option>
                        <option value="ELECTRONICS">ELECTRONICS</option>
                        <option value="TRAVEL">TRAVEL & AIRLINES</option>
                        <option value="CRYPTO">CRYPTO TRANSFER</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div style={{ gridColumn: 'span 2' }}>
                      <label>Merchant / Platform Name</label>
                      <input
                        placeholder="e.g. Amazon India, Flipkart Seller, Unknown Merchant"
                        value={txForm.merchant}
                        onChange={e => setTxForm({ ...txForm, merchant: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <button type="submit" className="submit-btn" disabled={loading}>
                    {loading ? 'Processing Transaction...' : '🚀 Submit Payment & Check Transaction (₹)'}
                  </button>
                </form>

                {latestPrediction && (
                  <div className={`prediction-result ${latestPrediction.isFraud ? 'flagged' : 'approved'}`} style={{ marginTop: '1.5rem' }}>
                    <div className="result-header">
                      <h3>Checkout Security Evaluation Output</h3>
                      <span className={`badge ${latestPrediction.isFraud ? 'badge-red' : 'badge-green'}`}>
                        {latestPrediction.status}
                      </span>
                    </div>
                    <div className="result-body">
                      <div className="risk-meter-container">
                        <div className="risk-score-display">{latestPrediction.riskScore}<span>/100</span></div>
                        <div className="risk-label">Risk Score</div>
                      </div>
                      <div className="result-details">
                        <p><strong>Fraud Probability:</strong> {(latestPrediction.fraudProbability * 100).toFixed(1)}%</p>
                        <p><strong>Transaction ID:</strong> {latestPrediction.transactionId}</p>
                        <p><strong>Amount:</strong> ₹{latestPrediction.amount?.toLocaleString('en-IN')} INR</p>
                        <p><strong>Decision:</strong> {latestPrediction.isFraud ? '❌ FLAGGED & BLOCKED' : '✅ APPROVED'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* View 4: Transactions Ledger */}
            {userTab === 'transactions' && (
              <div className="card-panel full-width">
                <h2>📊 My Personal Transaction Ledger (INR ₹)</h2>
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Transaction ID</th>
                        <th>Amount (₹)</th>
                        <th>Merchant</th>
                        <th>Category</th>
                        <th>Risk Score</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userTransactions.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                            <strong>No transactions recorded yet.</strong>
                            <p style={{ color: '#64748b', margin: '4px 0 0' }}>
                              Every new account starts fresh with 0 transactions.
                            </p>
                          </td>
                        </tr>
                      ) : (
                        userTransactions.map(tx => (
                          <tr key={tx.id} className={tx.isFraud ? 'row-fraud' : ''}>
                            <td><code>{tx.transactionId}</code></td>
                            <td><strong>₹{tx.amount?.toLocaleString('en-IN')} INR</strong></td>
                            <td>{tx.merchant}</td>
                            <td><span className="cat-tag">{tx.category}</span></td>
                            <td>
                              <span className={`risk-pill ${tx.riskScore >= 70 ? 'high' : tx.riskScore >= 30 ? 'med' : 'low'}`}>
                                {tx.riskScore} / 100
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${tx.isFraud ? 'badge-red' : 'badge-green'}`}>
                                {tx.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      )}

      {/* Real Google OAuth Diagnostic & Configuration Modal */}
      <GoogleOAuthModal
        isOpen={showGoogleConfigModal}
        onClose={() => setShowGoogleConfigModal(false)}
        currentClientId={googleClientId}
        onSaveClientId={(id) => {
          localStorage.setItem('sentinel_google_client_id', id);
          setGoogleClientId(id);
          alert('Google OAuth Client ID saved! The official Google sign-in button is now active.');
        }}
      />

      {/* Global SENTINEL-AI Footer */}
      <footer className="sentinel-global-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <span className="footer-logo-shield">🛡️</span>
            <strong>SENTINEL-AI</strong>
            <span className="footer-tagline">AI-Powered Website Trust &amp; Fraud Detection System</span>
          </div>
          <div className="footer-links">
            <span>Enterprise Security Intelligence</span>
            <span>•</span>
            <span>Real-time Phishing &amp; Malware Mitigation</span>
            <span>•</span>
            <span>BCrypt Cryptographic Hashing</span>
            <span>•</span>
            <span>Single Super Admin RBAC</span>
          </div>
          <div className="footer-copyright">
            &copy; {new Date().getFullYear()} SENTINEL-AI Defense Architecture. All Rights Reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
