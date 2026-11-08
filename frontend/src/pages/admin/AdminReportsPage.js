import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { 
  FileText, Download, Calendar, ShieldCheck, ShieldAlert, 
  Clock, TrendingUp, Printer, RefreshCw
} from 'lucide-react';

const AdminReportsPage = () => {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/reports');
      setReports(res.data);
    } catch (err) {
      console.error(err);
      addToast('Failed to load compliance reports telemetry', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading || !reports) {
    return (
      <div className="p-16 flex justify-center">
        <LoadingSpinner size="lg" text="Compiling security & fraud compliance reports..." />
      </div>
    );
  }

  const { daily, weekly, monthly, totalHistorical } = reports;

  const periods = [
    { title: 'Last 24 Hours (Daily)', data: daily, subtitle: 'Rolling 24-hour ingestion ledger' },
    { title: 'Last 7 Days (Weekly)', data: weekly, subtitle: 'Weekly fraud velocity & risk audit' },
    { title: 'Last 30 Days (Monthly)', data: monthly, subtitle: 'Monthly platform settlement reconciliation' },
    { title: 'All Time (Historical)', data: totalHistorical, subtitle: 'Cumulative lifetime platform telemetry' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
            <FileText className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Compliance & Fraud Audit Reports
          </h1>
          <p className="text-secondary text-sm">
            Regulatory audit trails, domain verifications, and exportable security telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="btn btn-secondary flex items-center gap-1.5"
            title="Print Report"
          >
            <Printer className="w-4 h-4" />
            Print Report
          </button>
          <a
            href="/api/admin/reports/export/csv"
            download
            className="btn btn-primary flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            Export Live CSV Ledger
          </a>
        </div>
      </div>

      {/* Period Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {periods.map((p, idx) => (
          <div key={idx} className="card p-5 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-primary text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  {p.title}
                </h3>
                <p className="text-xs text-tertiary mt-0.5">{p.subtitle}</p>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 rounded">
                {p.data?.count || 0} Transactions
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <p className="text-xs text-secondary">Total Settled Volume</p>
                <p className="text-lg font-bold text-primary mt-1">
                  ₹{Number(p.data?.volume || 0).toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <p className="text-xs text-secondary">Observed Fraud Rate</p>
                <p className={`text-lg font-bold mt-1 ${(p.data?.fraudRate || 0) > 10 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {p.data?.fraudRate || 0}%
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-secondary flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Approved / Cleared Transactions:
                </span>
                <span className="font-semibold text-primary">{p.data?.approvedCount || 0}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-secondary flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  Investigated / On Hold:
                </span>
                <span className="font-semibold text-primary">{p.data?.underReviewCount || 0}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-secondary flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                  High Risk Blocked Incidents:
                </span>
                <span className="font-semibold text-rose-600 dark:text-rose-400">{p.data?.fraudCount || 0}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CSV Export Instructions Card */}
      <div className="card p-6 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 border-indigo-200 dark:border-indigo-900/40 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="font-bold text-primary text-base flex items-center gap-2">
            <Download className="w-5 h-5 text-indigo-600" />
            Complete Machine-Readable Regulatory Audit Ledger
          </h3>
          <p className="text-secondary text-xs max-w-2xl">
            Export the complete cryptographic audit trail containing all transactions, AI probability coefficients, heuristic classifications, investigator decisions, and timestamped audit notes.
          </p>
        </div>
        <a
          href="/api/admin/reports/export/csv"
          download
          className="btn btn-primary whitespace-nowrap flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Download CSV Ledger
        </a>
      </div>
    </div>
  );
};

export default AdminReportsPage;