import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Bell,
  Sun,
  Moon,
  Search,
  CheckCircle2,
  AlertTriangle,
  User as UserIcon,
  LogOut,
  ShieldAlert
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const TopNavbar = ({ title, breadcrumbs = [] }) => {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="top-navbar">
      <div className="navbar-left">
        {breadcrumbs.length > 0 && (
          <div className="breadcrumbs">
            {breadcrumbs.map((b, i) => (
              <span key={i} className="breadcrumb-item">
                {b.link ? (
                  <span className="breadcrumb-link" onClick={() => navigate(b.link)}>
                    {b.label}
                  </span>
                ) : (
                  <span className="breadcrumb-current">{b.label}</span>
                )}
                {i < breadcrumbs.length - 1 && <span className="breadcrumb-separator">/</span>}
              </span>
            ))}
          </div>
        )}
        <h2 className="page-header-title">{title}</h2>
      </div>

      <div className="navbar-right">
        {/* Backend Online Status Indicator */}
        <div className="system-health-pill" title="Backend & AI Service Live">
          <span className="health-dot-live"></span>
          <span className="health-label">ML Gateway Connected</span>
        </div>

        {/* Theme Toggle */}
        <button
          className="navbar-icon-btn theme-toggle-btn"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications Dropdown */}
        <div className="nav-dropdown-wrapper">
          <button
            className="navbar-icon-btn notification-btn"
            onClick={() => setShowNotificationMenu(!showNotificationMenu)}
            title="System Notifications"
          >
            <Bell size={18} />
            <span className="notification-badge">2</span>
          </button>

          {showNotificationMenu && (
            <div className="dropdown-panel notification-panel">
              <div className="dropdown-panel-header">
                <span className="panel-title">Notifications</span>
                <span className="panel-subtitle">Real-time alerts</span>
              </div>
              <div className="dropdown-panel-list">
                <div
                  className="notification-item unread"
                  onClick={() => {
                    setShowNotificationMenu(false);
                    navigate(isAdmin ? '/admin/fraud-monitoring' : '/user/fraud-alerts');
                  }}
                >
                  <div className="notif-icon danger">
                    <ShieldAlert size={14} />
                  </div>
                  <div className="notif-content">
                    <p className="notif-text">High-risk anomaly blocked on UPI-100005.</p>
                    <span className="notif-time">10 mins ago</span>
                  </div>
                </div>
                <div
                  className="notification-item"
                  onClick={() => {
                    setShowNotificationMenu(false);
                    navigate(isAdmin ? '/admin/dashboard' : '/user/dashboard');
                  }}
                >
                  <div className="notif-icon success">
                    <CheckCircle2 size={14} />
                  </div>
                  <div className="notif-content">
                    <p className="notif-text">Model evaluation pipeline active.</p>
                    <span className="notif-time">1 hour ago</span>
                  </div>
                </div>
              </div>
              <div className="dropdown-panel-footer">
                <button
                  className="dropdown-footer-link"
                  onClick={() => {
                    setShowNotificationMenu(false);
                    navigate(isAdmin ? '/admin/fraud-transactions' : '/user/fraud-alerts');
                  }}
                >
                  View All Alerts →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="nav-dropdown-wrapper">
          <button
            className="user-profile-btn"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <div className="user-avatar-small">
              {(user?.fullName || user?.username || 'U')[0].toUpperCase()}
            </div>
            <div className="user-info-text">
              <span className="user-display-name">{user?.fullName || user?.username || 'Account'}</span>
              <span className="user-role-badge">{isAdmin ? 'ADMIN' : 'USER'}</span>
            </div>
          </button>

          {showProfileMenu && (
            <div className="dropdown-panel profile-menu-panel">
              <div className="dropdown-panel-header">
                <p className="user-panel-name">{user?.fullName || user?.username}</p>
                <p className="user-panel-email">{user?.email}</p>
              </div>
              <div className="dropdown-menu-items">
                <button
                  className="dropdown-menu-item"
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate(isAdmin ? '/admin/settings' : '/user/profile');
                  }}
                >
                  <UserIcon size={16} />
                  <span>Profile & Settings</span>
                </button>
                <div className="dropdown-divider"></div>
                <button className="dropdown-menu-item danger" onClick={handleLogout}>
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;
