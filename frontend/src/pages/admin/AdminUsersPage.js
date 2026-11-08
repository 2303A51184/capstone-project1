import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';
import { StatusBadge, RiskBadge } from '../../components/common/Badge';
import { Search, UserCheck, UserX, Eye, Shield, Calendar, Phone, Mail } from 'lucide-react';

export const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userTransactions, setUserTransactions] = useState([]);
  const [loadingTx, setLoadingTx] = useState(false);
  const { success, error } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminService.getUsers({ search, status: statusFilter });
      setUsers(res.data);
    } catch (err) {
      error('Failed to load registered users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const res = await adminService.toggleUserStatus(id);
      success(res.data.message || 'User status updated.');
      setUsers(users.map((u) => (u.id === id ? { ...u, active: res.data.active } : u)));
    } catch (err) {
      error('Failed to toggle user status.');
    }
  };

  const handleViewUser = async (user) => {
    setSelectedUser(user);
    setLoadingTx(true);
    try {
      const res = await adminService.getUserTransactions(user.id);
      setUserTransactions(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTx(false);
    }
  };

  return (
    <div className="admin-users-page-container">
      {/* Search & Filter Toolbar */}
      <div className="filter-toolbar-card">
        <form onSubmit={handleSearch} className="filter-search-form">
          <div className="search-input-wrap">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by full name, username, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-secondary">
            Search
          </button>
        </form>

        <div className="filter-control">
          <label className="filter-label">Account Status:</label>
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Accounts</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Deactivated Only</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="table-card-box">
        <div className="card-header-clean">
          <div>
            <h3 className="card-header-title">Registered Accounts Directory</h3>
            <p className="card-header-sub">Manage client permissions, monitor activity, and enforce account lockouts</p>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner text="Retrieving user directory..." />
        ) : users.length > 0 ? (
          <div className="fintech-table-responsive">
            <table className="fintech-table">
              <thead>
                <tr>
                  <th>USER</th>
                  <th>ROLE</th>
                  <th>EMAIL</th>
                  <th>PHONE</th>
                  <th>REGISTERED DATE</th>
                  <th>TRANSACTIONS</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="user-table-cell">
                        <div className="avatar-circle-sm">
                          {(u.fullName || u.username || 'U')[0].toUpperCase()}
                        </div>
                        <div>
                          <span className="user-name-bold">{u.fullName || u.username}</span>
                          <span className="user-handle">@{u.username}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`role-pill ${u.role === 'ROLE_ADMIN' ? 'role-admin' : 'role-user'}`}>
                        {u.role === 'ROLE_ADMIN' ? 'ADMIN' : 'CLIENT'}
                      </span>
                    </td>
                    <td>{u.email}</td>
                    <td className="text-muted">{u.phone || 'N/A'}</td>
                    <td className="text-sm text-muted">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN') : 'N/A'}
                    </td>
                    <td className="text-bold">{u.transactionCount || 0}</td>
                    <td>
                      <span className={`status-pill ${u.active ? 'status-active' : 'status-inactive'}`}>
                        {u.active ? 'ACTIVE' : 'DEACTIVATED'}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions-row">
                        <button
                          className="btn-icon-action"
                          onClick={() => handleViewUser(u)}
                          title="View Profile & Transactions"
                        >
                          <Eye size={16} />
                        </button>
                        {u.role !== 'ROLE_ADMIN' && (
                          <button
                            className={`btn-icon-action ${u.active ? 'action-danger' : 'action-success'}`}
                            onClick={() => handleToggleStatus(u.id, u.active)}
                            title={u.active ? 'Deactivate User Account' : 'Activate User Account'}
                          >
                            {u.active ? <UserX size={16} /> : <UserCheck size={16} />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No users found"
            description="Try adjusting your search criteria."
          />
        )}
      </div>

      {/* User Details & Transactions Modal */}
      {selectedUser && (
        <Modal
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          title={`Client Profile: ${selectedUser.fullName || selectedUser.username}`}
          maxWidth="640px"
        >
          <div className="user-modal-profile">
            <div className="user-modal-header-card">
              <div className="avatar-circle-lg">
                {(selectedUser.fullName || selectedUser.username || 'U')[0].toUpperCase()}
              </div>
              <div className="user-modal-header-text">
                <h3>{selectedUser.fullName || selectedUser.username}</h3>
                <p className="text-muted">@{selectedUser.username} • {selectedUser.email}</p>
                <div className="modal-badges-row">
                  <span className={`status-pill ${selectedUser.active ? 'status-active' : 'status-inactive'}`}>
                    {selectedUser.active ? 'ACTIVE' : 'DEACTIVATED'}
                  </span>
                  <span className="role-pill">{selectedUser.role}</span>
                </div>
              </div>
            </div>

            <h4 className="modal-sub-heading">Recent Monitored Transactions</h4>
            {loadingTx ? (
              <LoadingSpinner text="Retrieving transaction ledger..." />
            ) : userTransactions.length > 0 ? (
              <div className="fintech-table-responsive max-h-240">
                <table className="fintech-table">
                  <thead>
                    <tr>
                      <th>TXN REF</th>
                      <th>MERCHANT</th>
                      <th>AMOUNT</th>
                      <th>RISK</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userTransactions.map((tx) => (
                      <tr key={tx.id || tx.transactionId}>
                        <td className="font-mono text-sm">{tx.transactionId}</td>
                        <td>{tx.merchant}</td>
                        <td className="text-bold">₹{Number(tx.amount).toLocaleString('en-IN')}</td>
                        <td><RiskBadge level={tx.riskLevel} score={tx.riskScore} /></td>
                        <td><StatusBadge status={tx.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted py-3">This user has not executed any transactions yet.</p>
            )}

            <div className="modal-action-footer">
              <button className="btn btn-secondary btn-block" onClick={() => setSelectedUser(null)}>
                Close Profile
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminUsersPage;

