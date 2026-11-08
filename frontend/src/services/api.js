import axios from 'axios';

const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const API_BASE = (hostname === 'localhost' || hostname === '127.0.0.1')
  ? 'http://localhost:8080/api'
  : `http://${hostname}:8080/api`;

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sentinel_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if invalid/expired on protected calls
      const path = window.location.pathname;
      if (path !== '/login' && path !== '/register') {
        localStorage.removeItem('sentinel_token');
        localStorage.removeItem('sentinel_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth Services
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
};

// User Services
export const userService = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data) => api.put('/user/profile', data),
  changePassword: (data) => api.post('/user/change-password', data),
  getDashboardStats: () => api.get('/user/dashboard-stats'),
  getTransactions: (params) => api.get('/user/transactions', { params }),
  getAlerts: (params) => api.get('/user/alerts', { params }),
  markAlertRead: (id) => api.patch(`/user/alerts/${id}/read`),
};

// Transaction Services
export const transactionService = {
  create: (data) => api.post('/transactions', data),
  getById: (id) => api.get(`/transactions/${id}`),
  evaluateAi: (data) => api.post('/transactions/evaluate-ai', data),
};

// Admin Services
export const adminService = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  toggleUserStatus: (id) => api.patch(`/admin/users/${id}/toggle-status`),
  getUserTransactions: (id) => api.get(`/admin/users/${id}/transactions`),
  getTransactions: (params) => api.get('/admin/transactions', { params }),
  getFraudTransactions: () => api.get('/admin/fraud-transactions'),
  takeAction: (id, data) => api.patch(`/admin/transactions/${id}/action`, data),
  getAuditLogs: () => api.get('/admin/audit-logs'),
  getReports: () => api.get('/admin/reports'),
  getExportCsvUrl: () => `${API_BASE}/admin/reports/export/csv`,
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (data) => api.put('/admin/settings', data),
};

export default api;
