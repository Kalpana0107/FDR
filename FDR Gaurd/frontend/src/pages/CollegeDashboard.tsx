import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  FileText, Clock, CheckCircle, XCircle, RotateCcw,
  PlusCircle, TrendingUp, AlertTriangle, Layers
} from 'lucide-react';
import { getCollegeStats, listFDRs } from '../api/fdr';
import { useAuth } from '../store/AuthContext';
import StatusBadge from '../components/StatusBadge';
import { format } from 'date-fns';

const CollegeDashboard: React.FC = () => {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['college-stats'],
    queryFn: getCollegeStats,
  });

  const { data: recentFDRs, isLoading: fdrsLoading } = useQuery({
    queryKey: ['college-fdrs-recent'],
    queryFn: () => listFDRs({ page: 1, page_size: 5, sort_by: 'created_at', sort_dir: 'desc' }),
  });

  const statCards = stats ? [
    { label: 'Total Records', value: stats.total, icon: <Layers size={20} />, color: '#2563eb', bg: '#dbeafe' },
    { label: 'Draft', value: stats.draft, icon: <FileText size={20} />, color: '#64748b', bg: '#f1f5f9' },
    { label: 'Submitted', value: stats.submitted, icon: <Clock size={20} />, color: '#1d4ed8', bg: '#dbeafe' },
    { label: 'Under Review', value: stats.under_review, icon: <TrendingUp size={20} />, color: '#92400e', bg: '#fef3c7' },
    { label: 'Returned', value: stats.returned, icon: <RotateCcw size={20} />, color: '#c2410c', bg: '#ffedd5' },
    { label: 'Verified', value: stats.verified, icon: <CheckCircle size={20} />, color: '#065f46', bg: '#d1fae5' },
    { label: 'Rejected', value: stats.rejected, icon: <XCircle size={20} />, color: '#991b1b', bg: '#fee2e2' },
  ] : [];

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Welcome back, {user?.full_name} — {user?.institution_name}
          </p>
        </div>
        <Link to="/fdr/new" className="btn btn-primary">
          <PlusCircle size={16} />
          New FDR Submission
        </Link>
      </div>

      {/* Attention: returned records */}
      {stats && stats.returned > 0 && (
        <div className="alert alert-warning mb-24">
          <AlertTriangle size={16} />
          <span>
            <strong>{stats.returned} record{stats.returned > 1 ? 's' : ''}</strong> {stats.returned > 1 ? 'have' : 'has'} been returned for correction.{' '}
            <Link to="/fdr?status=returned" style={{ color: '#92400e', fontWeight: 700, textDecoration: 'underline' }}>
              View now
            </Link>
          </span>
        </div>
      )}

      {/* Stats */}
      {statsLoading ? (
        <div className="stats-grid">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="stat-card" style={{ height: 110, background: '#f8fafc', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : (
        <div className="stats-grid">
          {statCards.map((s) => (
            <div key={s.label} className="stat-card">
              <div className="stat-icon" style={{ background: s.bg }}>
                <span style={{ color: s.color }}>{s.icon}</span>
              </div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Recent FDRs */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Recent Submissions</span>
          <Link to="/fdr" className="btn btn-ghost btn-sm">View All</Link>
        </div>

        {fdrsLoading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            <div className="loading-spinner" style={{ margin: '0 auto' }} />
          </div>
        ) : !recentFDRs?.items?.length ? (
          <div className="empty-state">
            <div className="empty-icon"><FileText size={24} /></div>
            <p className="empty-title">No FDR records yet</p>
            <p className="empty-sub">
              <Link to="/fdr/new" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>
                Create your first FDR
              </Link>
            </p>
          </div>
        ) : (
          <div className="table-wrapper" style={{ borderRadius: 0, border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Application ID</th>
                  <th>FDR Number</th>
                  <th>Bank</th>
                  <th>Amount (INR)</th>
                  <th>Maturity Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentFDRs.items.map((r) => (
                  <tr key={r.id} onClick={() => window.location.href = `/fdr/${r.id}`}>
                    <td><span className="font-mono text-sm">{r.application_id}</span></td>
                    <td>{r.fdr_number}</td>
                    <td>{r.bank_name}</td>
                    <td><strong>₹{Number(r.amount).toLocaleString('en-IN')}</strong></td>
                    <td>{format(new Date(r.maturity_date), 'dd MMM yyyy')}</td>
                    <td><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollegeDashboard;
