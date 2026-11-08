import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../../services/api';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge, RiskBadge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import {
  CreditCard,
  CheckCircle,
  AlertTriangle,
  ShieldBan,
  TrendingUp,
  ArrowUpRight,
  Shield,
  PlusCircle,
  Cpu
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const UserDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchStats = async () => {
    try {
      const res = await userService.getDashboardStats();
      setStats(res.data);
    } catch (err) {
      console.error('Failed to load user dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 6000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <LoadingSpinner text="Compiling security telemetry..." size="large" />;
  }

  // Monthly Graph Data
  const monthlyKeys = stats?.monthlyGraph ? Object.keys(stats.monthlyGraph) : [];
  const monthlyValues = stats?.monthlyGraph ? Object.values(stats.monthlyGraph) : [];

  const monthlyChartData = {
    labels: monthlyKeys,
    datasets: [
      {
        label: 'Transaction Volume (₹ INR)',
        data: monthlyValues,
        backgroundColor: 'rgba(99, 102, 241, 0.45)',
        borderColor: '#6366f1',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
        hoverBackgroundColor: 'rgba(99, 102, 241, 0.75)',
      },
    ],
  };

  // Status Chart Data
  const statusCounts = [
    stats?.statusChart?.approved || 0,
    stats?.statusChart?.underReview || 0,
    stats?.statusChart?.blocked || 0,
  ];

  const statusChartData = {
    labels: ['Approved', 'Under Review', 'Blocked'],
    datasets: [
      {
        data: statusCounts,
        backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
        hoverBackgroundColor: ['#059669', '#d97706', '#dc2626'],
        borderWidth: 0,
        hoverOffset: 6,
      },
    ],
  };

  // Risk Distribution Data
  const riskCounts = [
    stats?.riskDistribution?.low || 0,
    stats?.riskDistribution?.medium || 0,
    stats?.riskDistribution?.high || 0,
  ];

  const riskChartData = {
    labels: ['Low (0-29)', 'Medium (30-69)', 'High (70-100)'],
    datasets: [
      {
        label: 'Risk Classification',
        data: riskCounts,
        backgroundColor: ['rgba(16, 185, 129, 0.55)', 'rgba(245, 158, 11, 0.55)', 'rgba(239, 68, 68, 0.55)'],
        borderColor: ['#10b981', '#f59e0b', '#ef4444'],
        borderWidth: 2,
        borderRadius: 8,
        hoverBackgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1400,
      easing: 'easeOutQuart',
    },
    plugins: {
      legend: {
        labels: {
          color: '#94a3b8',
          font: { family: 'Plus Jakarta Sans', size: 12, weight: 600 },
        },
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleFont: { family: 'Plus Jakarta Sans', size: 13, weight: 700 },
        bodyFont: { family: 'Plus Jakarta Sans', size: 12 },
        padding: 12,
        cornerRadius: 10,
        borderColor: '#334155',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(148, 163, 184, 0.08)' },
        ticks: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 11 } },
      },
      y: {
        grid: { color: 'rgba(148, 163, 184, 0.08)' },
        ticks: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 11 } },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1500,
      easing: 'easeOutCirc',
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#94a3b8',
          font: { family: 'Plus Jakarta Sans', size: 12, weight: 600 },
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleFont: { family: 'Plus Jakarta Sans', size: 13, weight: 700 },
        bodyFont: { family: 'Plus Jakarta Sans', size: 12 },
        padding: 12,
        cornerRadius: 10,
        borderColor: '#334155',
        borderWidth: 1,
      },
    },
    cutout: '72%',
  };

  return (
    <div className="dashboard-page-container">
      {/* Action Header Banner */}
      <div className="dashboard-hero-banner">
        <div className="hero-text-wrap">
          <h1 className="hero-title">Website Trust &amp; Fraud Security Console</h1>
          <p className="hero-desc">
            Real-time heuristic risk telemetry and AI-powered transaction protection.
          </p>
        </div>
        <div className="hero-actions-wrap">
          <button className="btn btn-outline" onClick={() => navigate('/ai-fraud-detection')}>
            <Cpu size={16} />
            <span>AI Risk Scanner</span>
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/user/transactions')}>
            <PlusCircle size={16} />
            <span>New Transaction</span>
          </button>
        </div>
      </div>

      {/* 5 Core Metric Cards */}
      <div className="stats-cards-grid">
        <StatCard
          title="Total Transactions"
          value={stats?.totalTransactions || 0}
          subtext="Lifetime processed"
          icon={CreditCard}
          variant="primary"
        />
        <StatCard
          title="Total Volume"
          value={`₹${(stats?.totalAmount || 0).toLocaleString('en-IN')}`}
          subtext="Cleared settlement"
          icon={TrendingUp}
          variant="cyan"
        />
        <StatCard
          title="Successful"
          value={stats?.successfulTransactions || 0}
          subtext="Cleared seamlessly"
          icon={CheckCircle}
          variant="success"
        />
        <StatCard
          title="Suspicious / In Review"
          value={stats?.suspiciousTransactions || 0}
          subtext="Medium risk alerts"
          icon={AlertTriangle}
          variant="warning"
        />
        <StatCard
          title="Blocked Threats"
          value={stats?.blockedTransactions || 0}
          subtext={`${stats?.fraudDetectionRate || 0}% fraud rate`}
          icon={ShieldBan}
          variant="danger"
        />
      </div>

      {/* Charts Grid */}
      <div className="dashboard-charts-grid">
        <div className="chart-card-box span-2">
          <div className="card-header-clean">
            <h3 className="card-header-title">Monthly Transaction Volume Trend</h3>
            <span className="card-header-tag">Last 6 Months (INR)</span>
          </div>
          <div className="chart-wrapper-h260">
            <Bar data={monthlyChartData} options={chartOptions} />
          </div>
        </div>

        <div className="chart-card-box">
          <div className="card-header-clean">
            <h3 className="card-header-title">Transaction Status</h3>
            <span className="card-header-tag">Approval Ratio</span>
          </div>
          <div className="chart-wrapper-h260">
            <Doughnut data={statusChartData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      {/* Secondary Row: Risk Distribution & Recent Activity */}
      <div className="dashboard-secondary-grid">
        <div className="chart-card-box">
          <div className="card-header-clean">
            <h3 className="card-header-title">Fraud Risk Classification</h3>
            <span className="card-header-tag">SMOTE Model Tiers</span>
          </div>
          <div className="chart-wrapper-h220">
            <Bar data={riskChartData} options={chartOptions} />
          </div>
        </div>

        <div className="table-card-box span-2">
          <div className="card-header-clean">
            <div>
              <h3 className="card-header-title">Recent Transactions</h3>
              <p className="card-header-sub">Latest 5 verified transactions on your account</p>
            </div>
            <button className="btn btn-ghost" onClick={() => navigate('/user/transaction-history')}>
              <span>View All</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          {stats?.recentTransactions && stats.recentTransactions.length > 0 ? (
            <div className="fintech-table-responsive">
              <table className="fintech-table">
                <thead>
                  <tr>
                    <th>TRANSACTION ID</th>
                    <th>MERCHANT</th>
                    <th>AMOUNT (₹)</th>
                    <th>RISK LEVEL</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentTransactions.map((tx) => (
                    <tr key={tx.id || tx.transactionId}>
                      <td className="font-mono text-bold">{tx.transactionId}</td>
                      <td>
                        <div className="merchant-cell">
                          <span className="merchant-name">{tx.merchant}</span>
                          {tx.category && <span className="category-chip">{tx.category}</span>}
                        </div>
                      </td>
                      <td className="text-bold">₹{Number(tx.amount).toLocaleString('en-IN')}</td>
                      <td>
                        <RiskBadge level={tx.riskLevel} score={tx.riskScore} />
                      </td>
                      <td>
                        <StatusBadge status={tx.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No recent transactions"
              description="Initiate your first monitored transaction to view live risk analysis."
              actionText="Make Transaction"
              onAction={() => navigate('/user/transactions')}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboardPage;

