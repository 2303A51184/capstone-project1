import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import StatCard from '../../components/common/StatCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { 
  BarChart3, TrendingUp, ShieldAlert, PieChart as PieIcon, 
  Activity, DollarSign, ArrowUpRight, CheckCircle2, AlertOctagon 
} from 'lucide-react';

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
import { Bar, Doughnut, Line } from 'react-chartjs-2';

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

const AdminAnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await api.get('/admin/dashboard');
        setData(res.data);
      } catch (err) {
        console.error(err);
        addToast('Failed to load enterprise analytics telemetry', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading || !data) {
    return (
      <div className="p-16 flex justify-center">
        <LoadingSpinner size="lg" text="Aggregating enterprise fraud analytics..." />
      </div>
    );
  }

  // Monthly trends
  const monthlyLabels = Object.keys(data.monthlyTrends || {});
  const monthlyVolumes = monthlyLabels.map(k => Number(data.monthlyTrends[k].volume || 0));
  const monthlyFraudCounts = monthlyLabels.map(k => data.monthlyTrends[k].fraudCount || 0);

  const monthlyVolumeChartData = {
    labels: monthlyLabels,
    datasets: [
      {
        type: 'bar',
        label: 'Gross Volume (₹)',
        data: monthlyVolumes,
        backgroundColor: 'rgba(99, 102, 241, 0.75)',
        borderColor: '#6366f1',
        borderWidth: 1,
        borderRadius: 6,
        yAxisID: 'y',
      },
      {
        type: 'line',
        label: 'Fraud Flagged (Count)',
        data: monthlyFraudCounts,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        tension: 0.3,
        yAxisID: 'y1',
      }
    ]
  };

  const statusDoughnutData = {
    labels: ['Approved', 'Under Review', 'Blocked'],
    datasets: [
      {
        data: [
          data.statusDistribution?.approved || 0,
          data.statusDistribution?.underReview || 0,
          data.statusDistribution?.blocked || 0,
        ],
        backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
        borderWidth: 0,
      }
    ]
  };

  const riskBarData = {
    labels: ['Low Risk (0-29)', 'Medium Risk (30-69)', 'High Risk (70-100)'],
    datasets: [
      {
        label: 'Transaction Count',
        data: [
          data.riskDistribution?.low || 0,
          data.riskDistribution?.medium || 0,
          data.riskDistribution?.high || 0,
        ],
        backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
        borderRadius: 6,
      }
    ]
  };

  // Category breakdown
  const categoryLabels = Object.keys(data.categoryDistribution || {});
  const categoryCounts = categoryLabels.map(k => data.categoryDistribution[k]);

  const categoryBarData = {
    labels: categoryLabels,
    datasets: [
      {
        label: 'Incidents & Transactions',
        data: categoryCounts,
        backgroundColor: '#3b82f6',
        borderRadius: 4,
      }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
          <BarChart3 className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
          Enterprise Risk & Fraud Analytics
        </h1>
        <p className="text-secondary text-sm">
          Comprehensive multi-dimensional intelligence on platform transaction integrity, threat vectors, and model performance.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Processed Volume"
          value={`₹${Number(data.totalVolume || 0).toLocaleString()}`}
          icon={DollarSign}
          color="indigo"
          subtitle={`${data.totalTransactions} transactions lifetime`}
        />
        <StatCard
          title="Overall Fraud Rate"
          value={`${data.fraudDetectionRate || 0}%`}
          icon={ShieldAlert}
          color="rose"
          subtitle={`${data.fraudTransactions} total flagged incidents`}
        />
        <StatCard
          title="Approved Ratio"
          value={`${data.totalTransactions > 0 ? ((data.approvedTransactions / data.totalTransactions) * 100).toFixed(1) : 0}%`}
          icon={CheckCircle2}
          color="emerald"
          subtitle={`${data.approvedTransactions} successfully settled`}
        />
        <StatCard
          title="Manual Review Load"
          value={`${data.pendingReviews || 0}`}
          icon={Activity}
          color="amber"
          subtitle="Awaiting compliance review"
        />
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Volume & Fraud Dual Axis */}
        <div className="card p-5 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-primary text-base flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              Monthly Volume vs. Fraud Incident Velocity
            </h3>
            <span className="text-xs text-secondary font-medium">Past 6 Months</span>
          </div>
          <div className="h-72">
            <Bar
              data={monthlyVolumeChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    grid: { color: 'rgba(156, 163, 175, 0.1)' }
                  },
                  y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: { drawOnChartArea: false }
                  },
                  x: {
                    grid: { display: false }
                  }
                },
                plugins: {
                  legend: { position: 'top' }
                }
              }}
            />
          </div>
        </div>

        {/* Status Distribution Doughnut */}
        <div className="card p-5 space-y-4">
          <h3 className="font-bold text-primary text-base flex items-center gap-2">
            <PieIcon className="w-5 h-5 text-emerald-600" />
            Decision Status Breakdown
          </h3>
          <div className="h-56 flex items-center justify-center">
            <Doughnut
              data={statusDoughnutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } }
              }}
            />
          </div>
          <div className="grid grid-cols-3 text-center border-t border-slate-200 dark:border-slate-800 pt-3 text-xs">
            <div>
              <p className="text-emerald-600 font-bold">{data.approvedTransactions || 0}</p>
              <p className="text-tertiary">Approved</p>
            </div>
            <div>
              <p className="text-amber-500 font-bold">{data.pendingReviews || 0}</p>
              <p className="text-tertiary">Hold</p>
            </div>
            <div>
              <p className="text-rose-500 font-bold">{data.blockedTransactions || 0}</p>
              <p className="text-tertiary">Blocked</p>
            </div>
          </div>
        </div>
      </div>

      {/* Second Row: Risk Tier & Category Risk */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution */}
        <div className="card p-5 space-y-4">
          <h3 className="font-bold text-primary text-base">ML Risk Severity Classification</h3>
          <p className="text-xs text-secondary">
            Stratification of processed transactions across Low (0-29), Medium (30-69), and High (70-100) scoring bands.
          </p>
          <div className="h-64">
            <Bar
              data={riskBarData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: { grid: { display: false } },
                  y: { grid: { color: 'rgba(156, 163, 175, 0.1)' } }
                }
              }}
            />
          </div>
        </div>

        {/* Category Exposure */}
        <div className="card p-5 space-y-4">
          <h3 className="font-bold text-primary text-base">Transaction Volume by Merchant Category</h3>
          <p className="text-xs text-secondary">
            Distribution of transaction activities across retail, electronics, crypto, and other vertical sectors.
          </p>
          <div className="h-64">
            <Bar
              data={categoryBarData}
              options={{
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: { grid: { color: 'rgba(156, 163, 175, 0.1)' } },
                  y: { grid: { display: false } }
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;