import React, { useState, useEffect } from 'react';
import { userService } from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
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

export const UserAnalyticsPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await userService.getDashboardStats();
        setStats(res.data);
      } catch (err) {
        console.error('Analytics load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Computing predictive analytics..." size="large" />;
  }

  // Monthly Line Chart
  const monthlyKeys = stats?.monthlyGraph ? Object.keys(stats.monthlyGraph) : [];
  const monthlyValues = stats?.monthlyGraph ? Object.values(stats.monthlyGraph) : [];

  const lineChartData = {
    labels: monthlyKeys,
    datasets: [
      {
        label: 'Monthly Expenditure (₹)',
        data: monthlyValues,
        fill: true,
        backgroundColor: 'rgba(37, 99, 235, 0.15)',
        borderColor: '#2563eb',
        tension: 0.35,
        pointBackgroundColor: '#06b6d4',
        pointRadius: 4,
      },
    ],
  };

  // Category Breakdown
  const catKeys = stats?.categoryDistribution ? Object.keys(stats.categoryDistribution) : [];
  const catVals = stats?.categoryDistribution ? Object.values(stats.categoryDistribution) : [];

  const categoryChartData = {
    labels: catKeys,
    datasets: [
      {
        data: catVals,
        backgroundColor: ['#06b6d4', '#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'],
        borderWidth: 0,
      },
    ],
  };

  // Risk Score Histogram
  const riskData = {
    labels: ['Low Risk (0-29)', 'Medium Risk (30-69)', 'High Risk (70-100)'],
    datasets: [
      {
        label: 'Number of Transactions',
        data: [
          stats?.riskDistribution?.low || 0,
          stats?.riskDistribution?.medium || 0,
          stats?.riskDistribution?.high || 0,
        ],
        backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
        borderRadius: 4,
      },
    ],
  };

  const baseOptions = {
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
          font: { family: 'Plus Jakarta Sans', size: 12, weight: 600 } 
        } 
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
        ticks: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 11 } } 
      },
      y: { 
        grid: { color: 'rgba(148, 163, 184, 0.08)' }, 
        ticks: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 11 } } 
      },
    },
  };

  return (
    <div className="analytics-page-container">
      <div className="analytics-hero">
        <h2 className="section-title">Personal Risk & Expenditure Analytics</h2>
        <p className="section-sub">
          Quantitative telemetry evaluating domain security velocity, category allocation, and heuristic risk profile.
        </p>
      </div>

      <div className="analytics-grid-row">
        <div className="chart-card-box span-2">
          <div className="card-header-clean">
            <h3 className="card-header-title">6-Month Spending Velocity</h3>
            <span className="card-header-tag">Aggregated Settlement</span>
          </div>
          <div className="chart-wrapper-h280">
            <Line data={lineChartData} options={baseOptions} />
          </div>
        </div>

        <div className="chart-card-box">
          <div className="card-header-clean">
            <h3 className="card-header-title">Category Distribution</h3>
            <span className="card-header-tag">Merchant Allocation</span>
          </div>
          <div className="chart-wrapper-h280">
            <Doughnut
              data={categoryChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 11 } } } },
              }}
            />
          </div>
        </div>
      </div>

      <div className="analytics-grid-row">
        <div className="chart-card-box span-2">
          <div className="card-header-clean">
            <h3 className="card-header-title">Risk Score Tier Histogram</h3>
            <span className="card-header-tag">Decision Thresholds</span>
          </div>
          <div className="chart-wrapper-h260">
            <Bar data={riskData} options={baseOptions} />
          </div>
        </div>

        <div className="stat-summary-card">
          <h3 className="card-header-title">Analytical Summary</h3>
          <div className="summary-metric-list">
            <div className="summary-item">
              <span className="sum-lbl">Total Monitored Operations:</span>
              <span className="sum-val">{stats?.totalTransactions || 0}</span>
            </div>
            <div className="summary-item">
              <span className="sum-lbl">Lifetime Settled Capital:</span>
              <span className="sum-val font-bold">₹{(stats?.totalAmount || 0).toLocaleString('en-IN')} INR</span>
            </div>
            <div className="summary-item">
              <span className="sum-lbl">Approval Reliability Rate:</span>
              <span className="sum-val text-success">
                {stats?.totalTransactions > 0
                  ? Math.round(((stats.successfulTransactions || 0) / stats.totalTransactions) * 1000) / 10
                  : 100}%
              </span>
            </div>
            <div className="summary-item">
              <span className="sum-lbl">Anomalous Interception Rate:</span>
              <span className="sum-val text-danger">{stats?.fraudDetectionRate || 0}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserAnalyticsPage;

