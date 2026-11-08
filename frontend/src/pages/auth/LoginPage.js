import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Shield, Lock, User, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';

export const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      error('Please enter both username and password.');
      return;
    }

    setLoading(true);
    try {
      const user = await login(username, password);
      success(`Welcome back, ${user.fullName || user.username}!`);
      if (user.role === 'ROLE_ADMIN' || user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/user/dashboard');
      }
    } catch (err) {
      error(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (u, p) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card-box">
        <div className="auth-brand-header">
          <div className="auth-logo-badge">
            <Shield size={28} className="auth-shield-icon" />
          </div>
          <h1 className="auth-brand-title">AI Financial Fraud Detection System</h1>
          <p className="auth-brand-subtitle">
            SENTINEL-AI • Real-Time Website Trust &amp; Fraud Intelligence
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Username</label>
            <div className="input-with-icon">
              <User size={18} className="input-icon" />
              <input
                type="text"
                className="form-input"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                type="password"
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In to Portal'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="auth-demo-shortcuts">
          <span className="shortcuts-title">Quick 1-Click Demo Logins:</span>
          <div className="shortcuts-grid">
            <button
              type="button"
              className="shortcut-chip chip-user"
              onClick={() => fillCredentials('demo_user', 'password123')}
            >
              <UserCheck size={16} />
              <span>Demo User Portal</span>
            </button>
            <button
              type="button"
              className="shortcut-chip chip-admin"
              onClick={() => fillCredentials('admin', 'admin123')}
            >
              <ShieldCheck size={16} />
              <span>Admin Console</span>
            </button>
          </div>
        </div>

        <div className="auth-footer-prompt">
          <span>Don't have an account? </span>
          <Link to="/register" className="auth-link">
            Create Client Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
