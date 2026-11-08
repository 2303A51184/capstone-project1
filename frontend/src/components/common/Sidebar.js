import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  ArrowLeftRight,
  History,
  ShieldAlert,
  BarChart3,
  UserCheck,
  Settings,
  Users,
  ShieldCheck,
  Activity,
  FileText,
  Sliders,
  Cpu,
  LogOut,
  Shield
} from 'lucide-react';

export const Sidebar = ({ role = 'user' }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userNavItems = [
    { to: '/user/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/user/transactions', label: 'New Transaction', icon: ArrowLeftRight },
    { to: '/user/transaction-history', label: 'Transaction History', icon: History },
    { to: '/ai-fraud-detection', label: 'AI Fraud Detection', icon: Cpu },
    { to: '/user/fraud-alerts', label: 'Fraud Alerts', icon: ShieldAlert },
    { to: '/user/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/user/profile', label: 'My Profile', icon: UserCheck },
    { to: '/user/settings', label: 'Settings', icon: Settings },
  ];

  const adminNavItems = [
    { to: '/admin/dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
    { to: '/admin/users', label: 'User Management', icon: Users },
    { to: '/admin/transactions', label: 'All Transactions', icon: ArrowLeftRight },
    { to: '/admin/fraud-transactions', label: 'Fraud Transactions', icon: ShieldAlert },
    { to: '/admin/fraud-monitoring', label: 'Fraud Monitoring', icon: Activity },
    { to: '/ai-fraud-detection', label: 'AI Model Workbench', icon: Cpu },
    { to: '/admin/analytics', label: 'Deep Analytics', icon: BarChart3 },
    { to: '/admin/reports', label: 'Reports & Export', icon: FileText },
    { to: '/admin/settings', label: 'System Settings', icon: Sliders },
  ];

  const items = role === 'admin' ? adminNavItems : userNavItems;

  return (
    <aside className={`fintech-sidebar ${role === 'admin' ? 'sidebar-admin' : 'sidebar-user'}`}>
      <div className="sidebar-brand">
        <div className="brand-logo-wrap">
          <Shield size={24} className="brand-icon" />
        </div>
        <div className="brand-text-wrap">
          <span className="brand-title">AI Financial Fraud Detection</span>
          <span className={`brand-badge ${role === 'admin' ? 'badge-admin' : 'badge-user'}`}>
            {role === 'admin' ? 'ADMIN CONSOLE' : 'CLIENT PORTAL'}
          </span>
        </div>
      </div>

      <div className="sidebar-nav-section">
        <span className="sidebar-section-title">
          {role === 'admin' ? 'ENTERPRISE GOVERNANCE' : 'SECURITY & TRUST'}
        </span>
        <nav className="sidebar-nav">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} className="sidebar-link-icon" />
                <span className="sidebar-link-label">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="sidebar-user-footer">
        <div className="user-profile-preview">
          <div className="avatar-circle">
            {(user?.fullName || user?.username || 'U')[0].toUpperCase()}
          </div>
          <div className="user-meta">
            <span className="user-name">{user?.fullName || user?.username || 'User'}</span>
            <span className="user-email">{user?.email || (role === 'admin' ? 'Admin Role' : 'Client')}</span>
          </div>
        </div>
        <button className="sidebar-logout-btn" onClick={handleLogout} title="Sign Out">
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
