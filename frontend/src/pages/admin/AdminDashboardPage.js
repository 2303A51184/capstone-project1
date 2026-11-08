import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/api';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge, RiskBadge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  Users,
  CreditCard,
  TrendingUp,
  ShieldAlert,
  Percent,
  Clock,
  ShieldBan,
  UserCheck,
  ArrowUpRight,
  Activity,
  FileText
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
import { Bar, Doughnut, Line } from 'react-chartjs-2';

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

export const AdminDashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchDashboard = async () => {
    try {
      const res = await adminService.getDashboard();
      setData(res.data);
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 6000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <LoadingSpinner text="Aggregating enterprise telemetry..." size="large" />;
  }

  // Monthly trends
  const trendKeys = data?.monthlyTrends ? Object.keys(data.monthlyTrends) : [];
  const trendVolumes = trendKeys.map((k) => data.monthlyTrends[k].volume || 0);
  const trendTotalCounts = trendKeys.map((k) => data.monthlyTrends[k].totalCount || 0);
  const trendFraudCounts = trendKeys.map((k) => data.monthlyTrends[k].fraudCount || 0);

  const trendChartData = {
    labels: trendKeys,
    datasets: [
      {
        type: 'line',
        label: 'Fraud Detections (Count)',
        data: trendFraudCounts,
        borderColor: '#ef4444',
        borderWidth: 2,
        pointBackgroundColor: '#ef4444',
        yAxisID: 'y1',
      },
      {
        type: 'bar',
        label: 'Total Volume (₹ INR)',
        data: trendVolumes,
        backgroundColor: 'rgba(37, 99, 235, 0.45)',
        borderColor: '#2563eb',
        borderWidth: 1.5,
        borderRadius: 4,
        yAxisID: 'y',
      },
    ],
  };

  // Status Distribution
  const statusDoughnut = {
    labels: ['Approved', 'Under Review', 'Blocked'],
    datasets: [
      {
        data: [
          data?.statusDistribution?.approved || 0,
          data?.statusDistribution?.underReview || 0,
          data?.statusDistribution?.blocked || 0,
        ],
        backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
        borderWidth: 0,
      },
    ],
  };

  // Risk Distribution
  const riskBar = {
    labels: ['Low (0-29)', 'Medium (30-69)', 'High (70-100)'],
    datasets: [
      {
        label: 'Transactions Count',
        data: [
          data?.riskDistribution?.low || 0,
          data?.riskDistribution?.medium || 0,
          data?.riskDistribution?.high || 0,
        ],
        backgroundColor: ['rgba(16, 185, 129, 0.7)', 'rgba(245, 158, 11, 0.7)', 'rgba(239, 68, 68, 0.7)'],
        borderColor: ['#10b981', '#f59e0b', '#ef4444'],
        borderWidth: 1.5,
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1500,
      easing: 'easeOutQuart',
    },
    plugins: {
      legend: { labels: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 12, weight: 600 } } },
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
      x: { grid: { color: 'rgba(148, 163, 184, 0.08)' }, ticks: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans' } } },
      y: {
        type: 'linear',
        position: 'left',
        grid: { color: 'rgba(148, 163, 184, 0.08)' },
        ticks: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans' } },
      },
      y1: {
        type: 'linear',
        position: 'right',
        grid: { drawOnChartArea: false },
        ticks: { color: '#ef4444', font: { family: 'Plus Jakarta Sans' } },
      },
    },
  };

  return (
    <div className="admin-dashboard-container">
      {/* Top Banner */}
      <div className="admin-hero-banner">
        <div>
          <div className="admin-pill-tag">
            <Activity size={14} />
            <span>ENTERPRISE GOVERNANCE STATION</span>
          </div>
          <h1 className="hero-title">Central Fraud Monitoring & Risk Operations</h1>
          <p className="hero-desc">
            System-wide transactional oversight, machine learning model health, and compliance adjudication.
          </p>
        </div>

        <div className="admin-hero-actions">
          <button className="btn btn-outline" onClick={() => navigate('/admin/reports')}>
            <FileText size={16} />
            <span>Audit Reports</span>
          </button>
          <button className="btn btn-danger-action" onClick={() => navigate('/admin/fraud-monitoring')}>
            <ShieldAlert size={16} />
            <span>Live Monitoring Hub</span>
          </button>
        </div>
      </div>

      {/* 8 Primary Admin Metric Cards */}
      <div className="admin-stats-grid-8">
        <StatCard
          title="Registered Users"
          value={data?.totalUsers || 0}
          subtext="Total clients"
          icon={Users}
          variant="primary"
          onClick={() => navigate('/admin/users')}
        />
        <StatCard
          title="Active Users"
          value={data?.activeUsers || 0}
          subtext="Cleared for banking"
          icon={UserCheck}
          variant="success"
          onClick={() => navigate('/admin/users')}
        />
        <StatCard
          title="Total Transactions"
          value={data?.totalTransactions || 0}
          subtext="All network operations"
          icon={CreditCard}
          variant="cyan"
          onClick={() => navigate('/admin/transactions')}
        />
        <StatCard
          title="Total Volume"
          value={`₹${(data?.totalVolume || 0).toLocaleString('en-IN')}`}
          subtext="Settlement throughput"
          icon={TrendingUp}
          variant="cyan"
        />
        <StatCard
          title="Fraud Transactions"
          value={data?.fraudTransactions || 0}
          subtext="Blocked attacks"
          icon={ShieldAlert}
          variant="danger"
          onClick={() => navigate('/admin/fraud-transactions')}
        />
        <StatCard
          title="Fraud Detection Rate"
          value={`${data?.fraudDetectionRate || 0}%`}
          subtext="Network threat ratio"
          icon={Percent}
          variant="danger"
        />
        <StatCard
          title="Pending Reviews"
          value={data?.pendingReviews || 0}
          subtext="Requires analyst action"
          icon={Clock}
          variant="warning"
          onClick={() => navigate('/admin/fraud-monitoring')}
        />
        <StatCard
          title="Blocked Threats"
          value={data?.blockedTransactions || 0}
          subtext="Automated blocks"
          icon={ShieldBan}
          variant="danger"
          onClick={() => navigate('/admin/fraud-transactions')}
        />
      </div>

      {/* Primary Analytics Row */}
      <div className="dashboard-charts-grid">
        <div className="chart-card-box span-2">
          <div className="card-header-clean">
            <h3 className="card-header-title">Multi-Horizon Fraud & Volume Trends</h3>
            <span className="card-header-tag">Dual Axis: Volume (Bar) vs Fraud Events (Line)</span>
          </div>
          <div className="chart-wrapper-h280">
            <Bar data={trendChartData} options={chartOptions} />
          </div>
        </div>

        <div className="chart-card-box">
          <div className="card-header-clean">
            <h3 className="card-header-title">Settlement Status Ratio</h3>
            <span className="card-header-tag">Live Distribution</span>
          </div>
          <div className="chart-wrapper-h280">
            <Doughnut
              data={statusDoughnut}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 11 } } } },
                cutout: '70%',
              }}
            />
          </div>
        </div>
      </div>

      {/* Secondary Row: Risk Tiering & Recent Suspicious Activities */}
      <div className="dashboard-secondary-grid">
        <div className="chart-card-box">
          <div className="card-header-clean">
            <h3 className="card-header-title">Risk Severity Breakdown</h3>
            <span className="card-header-tag">Classification Tiers</span>
          </div>
          <div className="chart-wrapper-h240">
            <Bar
              data={riskBar}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: { grid: { color: 'rgba(148, 163, 184, 0.08)' }, ticks: { color: '#94a3b8' } },
                  y: { grid: { color: 'rgba(148, 163, 184, 0.08)' }, ticks: { color: '#94a3b8' } },
                },
              }}
            />
          </div>
        </div>

        <div className="table-card-box span-2">
          <div className="card-header-clean">
            <div>
              <h3 className="card-header-title">Recent Flagged & Suspicious Operations</h3>
              <p className="card-header-sub">High & Medium Risk anomalies needing compliance oversight</p>
            </div>
            <button className="btn btn-ghost" onClick={() => navigate('/admin/fraud-monitoring')}>
              <span>Open Monitoring Console</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="fintech-table-responsive">
            <table className="fintech-table">
              <thead>
                <tr>
                  <th>TXN REF</th>
                  <th>CLIENT</th>
                  <th>AMOUNT (₹)</th>
                  <th>MERCHANT & WEBSITE</th>
                  <th>RISK</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {data?.recentSuspiciousActivities && data.recentSuspiciousActivities.length > 0 ? (
                  data.recentSuspiciousActivities.map((tx) => (
                    <tr key={tx.id || tx.transactionId}>
                      <td className="font-mono text-bold">{tx.transactionId}</td>
                      <td>
                        <span className="client-badge">{tx.user?.username || 'Client'}</span>
                      </td>
                      <td className="text-bold">₹{Number(tx.amount).toLocaleString('en-IN')}</td>
                      <td>
                        <div className="merchant-url-cell">
                          <span className="merchant-name-bold">{tx.merchant}</span>
                          {tx.website && <span className="merchant-domain-dim">{tx.website}</span>}
                        </div>
                      </td>
                      <td>
                        <RiskBadge level={tx.riskLevel} score={tx.riskScore} />
                      </td>
                      <td>
                        <StatusBadge status={tx.status} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-4 text-muted">
                      No high risk anomalies recorded. All systems operating under nominal conditions.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;

