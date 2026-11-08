import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function AdminLiveCharts({ dashboardData }) {
  const dailyReg = dashboardData?.dailyRegistrations || [];
  const dailyLogins = dashboardData?.dailyLogins || [];
  const monthlyGrowth = dashboardData?.monthlyUserGrowth || [];
  const authDist = dashboardData?.authMethodDistribution || { google: 0, email: 0 };
  const statusDist = dashboardData?.accountStatusDistribution || { active: 0, inactive: 0, suspended: 0 };

  // 1. Daily Registrations Chart Data
  const regChartData = {
    labels: dailyReg.map(d => d.date),
    datasets: [
      {
        label: 'New Registrations',
        data: dailyReg.map(d => d.count),
        backgroundColor: 'rgba(59, 130, 246, 0.75)',
        borderColor: '#2563eb',
        borderWidth: 2,
        borderRadius: 6
      }
    ]
  };

  // 2. Daily Logins Chart Data (Success vs Failed)
  const loginChartData = {
    labels: dailyLogins.map(d => d.date),
    datasets: [
      {
        label: 'Successful Logins',
        data: dailyLogins.map(d => d.success),
        backgroundColor: 'rgba(16, 185, 129, 0.75)',
        borderColor: '#059669',
        borderWidth: 2,
        borderRadius: 6
      },
      {
        label: 'Failed Attempts',
        data: dailyLogins.map(d => d.failed),
        backgroundColor: 'rgba(239, 68, 68, 0.75)',
        borderColor: '#dc2626',
        borderWidth: 2,
        borderRadius: 6
      }
    ]
  };

  // 3. Monthly User Growth Chart Data
  const growthChartData = {
    labels: monthlyGrowth.map(d => d.month),
    datasets: [
      {
        fill: true,
        label: 'Total Registered Users',
        data: monthlyGrowth.map(d => d.users),
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.15)',
        tension: 0.35,
        pointRadius: 5,
        pointBackgroundColor: '#8b5cf6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2
      }
    ]
  };

  // 4. Google vs Email Login Distribution
  const authDoughnutData = {
    labels: ['Google OAuth', 'Email & Password'],
    datasets: [
      {
        data: [authDist.google || 0, authDist.email || 0],
        backgroundColor: ['#4285F4', '#10b981'],
        borderColor: ['#ffffff', '#ffffff'],
        borderWidth: 2
      }
    ]
  };

  // 5. Active vs Inactive / Suspended Users Distribution
  const statusDoughnutData = {
    labels: ['Active Users', 'Inactive Users', 'Suspended Users'],
    datasets: [
      {
        data: [statusDist.active || 0, statusDist.inactive || 0, statusDist.suspended || 0],
        backgroundColor: ['#10b981', '#64748b', '#ef4444'],
        borderColor: ['#ffffff', '#ffffff', '#ffffff'],
        borderWidth: 2
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: { family: "'Inter', sans-serif", size: 12, weight: '600' },
          boxWidth: 14
        }
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleFont: { weight: 'bold' },
        padding: 10,
        cornerRadius: 6
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { precision: 0, font: { family: "'Inter', sans-serif", size: 11 } },
        grid: { color: 'rgba(226, 232, 240, 0.7)' }
      },
      x: {
        ticks: { font: { family: "'Inter', sans-serif", size: 11 } },
        grid: { display: false }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: { family: "'Inter', sans-serif", size: 12, weight: '600' },
          boxWidth: 14
        }
      },
      tooltip: {
        backgroundColor: '#0f172a',
        padding: 10,
        cornerRadius: 6
      }
    }
  };

  return (
    <div className="admin-charts-section">
      <div className="section-title-wrap">
        <h3 className="section-heading">📈 Real-Time Platform Analytics &amp; Visual Intelligence</h3>
        <span className="section-subtitle">Live telemetry aggregated directly from PostgreSQL/H2 database logs</span>
      </div>

      <div className="admin-charts-grid">
        {/* Chart 1: Daily Registrations */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h4>Daily Registrations (Past 7 Days)</h4>
            <span className="chart-badge blue">User Influx</span>
          </div>
          <div className="chart-body">
            <Bar data={regChartData} options={chartOptions} />
          </div>
        </div>

        {/* Chart 2: Daily Login Activity */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h4>Daily Login Activity (Past 7 Days)</h4>
            <span className="chart-badge green">Auth Traffic</span>
          </div>
          <div className="chart-body">
            <Bar data={loginChartData} options={chartOptions} />
          </div>
        </div>

        {/* Chart 3: Monthly User Growth */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h4>Cumulative Monthly User Growth</h4>
            <span className="chart-badge purple">6-Month Trend</span>
          </div>
          <div className="chart-body">
            <Line data={growthChartData} options={chartOptions} />
          </div>
        </div>

        {/* Chart 4: Google vs Email Auth */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h4>Google vs Email Login Distribution</h4>
            <span className="chart-badge blue">Auth Providers</span>
          </div>
          <div className="chart-body doughnut">
            <Doughnut data={authDoughnutData} options={doughnutOptions} />
          </div>
        </div>

        {/* Chart 5: User Account Status Distribution */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h4>Account Status Distribution</h4>
            <span className="chart-badge orange">Fleet Health</span>
          </div>
          <div className="chart-body doughnut">
            <Doughnut data={statusDoughnutData} options={doughnutOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}
