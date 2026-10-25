import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  FileCheck,
  Search,
  Filter,
  RefreshCw,
  Building2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  KeyRound,
  ShieldCheck,
  QrCode,
  ArrowRight,
  Lock,
  Sparkles,
  UserCheck,
} from 'lucide-react'
import { api } from '../api/client.js'
import StatusBadge from '../components/StatusBadge.jsx'
import SimulatedChip from '../components/SimulatedChip.jsx'
import LoadingState from '../components/LoadingState.jsx'
import EmptyState from '../components/EmptyState.jsx'
import ErrorState from '../components/ErrorState.jsx'
import ReleaseReviewModal from '../components/ReleaseReviewModal.jsx'
import ReleaseApproveModal from '../components/ReleaseApproveModal.jsx'
import { useAuth } from '../context/AuthContext.jsx'

function formatINR(val) {
  if (typeof val !== 'number') return '₹0'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val)
}

export default function Releases() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [releases, setReleases] = useState([])
  const [selectedStatus, setSelectedStatus] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [reviewingRelease, setReviewingRelease] = useState(null)
  const [approvingRelease, setApprovingRelease] = useState(null)
  const [notification, setNotification] = useState(null)

  const loadReleases = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.listReleases()
      setReleases(res || [])
    } catch (err) {
      setError(err?.message || 'Failed to fetch release requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReleases()
  }, [])

  const handleReleaseUpdated = (updated) => {
    setReleases((prev) =>
      prev.map((r) => (r.id === updated.id ? updated : r)),
    )
    setNotification({
      type: 'success',
      message: `Release request ${updated.id.toUpperCase()} successfully progressed to "${updated.status}".`,
    })
    setTimeout(() => setNotification(null), 5000)
  }

  // Filter releases
  const filteredReleases = useMemo(() => {
    return releases.filter((item) => {
      if (selectedStatus !== 'All') {
        if (selectedStatus === 'Pending Review' && item.status !== 'Pending Review') return false
        if (selectedStatus === 'Reviewed' && item.status !== 'Reviewed') return false
        if (selectedStatus === 'Approved' && item.status !== 'Approved') return false
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchNum = item.fdr_number?.toLowerCase().includes(q)
        const matchInst = item.institution_name?.toLowerCase().includes(q)
        const matchBank = item.bank?.toLowerCase().includes(q)
        if (!matchNum && !matchInst && !matchBank) return false
      }
      return true
    })
  }, [releases, selectedStatus, searchQuery])

  // Summary KPIs
  const stats = useMemo(() => {
    const total = releases.length
    const pendingReview = releases.filter((r) => r.status === 'Pending Review').length
    const reviewed = releases.filter((r) => r.status === 'Reviewed').length
    const approved = releases.filter((r) => r.status === 'Approved').length
    const totalCapital = releases
      .filter((r) => r.status === 'Approved')
      .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0)

    return { total, pendingReview, reviewed, approved, totalCapital }
  }, [releases])

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <section className="hero relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="p-1.5 rounded-lg bg-white/10 text-white">
                <KeyRound size={24} />
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Dual-Key Escrow Release Authority
              </h1>
              <SimulatedChip
                text="Two-Person Rule & OTP Sign-off"
                className="bg-white/15 text-white border-white/25"
              />
            </div>
            <p className="text-white/80 text-sm max-w-3xl leading-relaxed">
              Task 4 Workflow: Security deposits submitted to AICTE are released only through a statutory two-person protocol:
              (Key 1) Scrutiny Officer verifies tenure completion and zero fee arrears, followed by (Key 2) Member Secretary executive dual-key approval with cryptographic OTP and immutable QR receipt generation.
            </p>
          </div>

          <div className="rounded-xl bg-white/10 p-3.5 backdrop-blur-xs border border-white/15 shrink-0 space-y-1 text-right">
            <div className="text-xs text-white/80">Two-Person Protocol</div>
            <div className="text-xl font-extrabold text-white font-mono">
              Strict Segregation
            </div>
            <div className="text-[11px] text-white/70">Reviewer ≠ Approver Enforced</div>
          </div>
        </div>
      </section>

      {/* Notification Banner */}
      {notification && (
        <div className="card bg-ok-50 border-ok-200 text-ok-800 p-4 flex items-center justify-between gap-3 text-xs font-semibold animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-ok-700 shrink-0" />
            <span>{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="hover:underline font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Two-Person Rule Protocol Stepper */}
      <section className="card p-5 bg-surface/50 border-line">
        <div className="text-xs font-bold uppercase tracking-wider text-muted mb-3 flex items-center gap-2">
          <Lock size={14} className="text-brand" />
          <span>Statutory Escrow Discharge Stepper</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-card border border-line space-y-1">
            <div className="flex items-center gap-2 font-bold text-ink">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-white text-[10px]">1</span>
              <span>College Request</span>
            </div>
            <p className="text-[11px] text-muted">
              Institute accountant initiates release request with lock-in justification.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-card border border-line space-y-1">
            <div className="flex items-center gap-2 font-bold text-ink">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-white text-[10px]">2</span>
              <span>Officer Scrutiny (Key 1)</span>
            </div>
            <p className="text-[11px] text-muted">
              AICTE officer verifies student placements, fee records, and signs recommendation.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-card border border-line space-y-1">
            <div className="flex items-center gap-2 font-bold text-ink">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-white text-[10px]">3</span>
              <span>Dual-Key Sign-Off (Key 2)</span>
            </div>
            <p className="text-[11px] text-muted">
              Member Secretary verifies Key 1 and signs off with cryptographic OTP.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-card border border-line space-y-1">
            <div className="flex items-center gap-2 font-bold text-ok-700">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ok-700 text-white text-[10px]">4</span>
              <span>QR Receipt Issued</span>
            </div>
            <p className="text-[11px] text-muted">
              Immutable SHA-256 release receipt generated with public QR verification.
            </p>
          </div>
        </div>
      </section>

      {/* KPI Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card space-y-1">
          <span className="text-xs font-medium text-muted uppercase tracking-wider">
            Total Release Dossiers
          </span>
          <div className="text-2xl font-extrabold text-ink font-mono">
            {stats.total}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted pt-1">
            <span>Security deposit release petitions</span>
          </div>
        </div>

        <div className="card space-y-1">
          <span className="text-xs font-medium text-muted uppercase tracking-wider">
            Pending Officer Review
          </span>
          <div className="text-2xl font-extrabold text-warn-700 font-mono">
            {stats.pendingReview}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted pt-1">
            <span className="font-semibold text-warn-700">Awaiting Key 1 Scrutiny</span>
          </div>
        </div>

        <div className="card space-y-1">
          <span className="text-xs font-medium text-muted uppercase tracking-wider">
            Ready for Sign-Off
          </span>
          <div className="text-2xl font-extrabold text-brand font-mono">
            {stats.reviewed}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted pt-1">
            <span className="font-semibold text-brand">Awaiting Key 2 OTP Approval</span>
          </div>
        </div>

        <div className="card space-y-1">
          <span className="text-xs font-medium text-muted uppercase tracking-wider">
            Discharged Escrow Capital
          </span>
          <div className="text-2xl font-extrabold text-ok-700 font-mono">
            {formatINR(stats.totalCapital)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted pt-1">
            <span>{stats.approved} Receipts issued & validated</span>
          </div>
        </div>
      </section>

      {/* Control Bar: Filters & Search */}
      <section className="card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status Filters */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-muted mr-1 flex items-center gap-1">
              <Filter size={13} /> Status:
            </span>
            {['All', 'Pending Review', 'Reviewed', 'Approved'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setSelectedStatus(tab)}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  selectedStatus === tab
                    ? 'bg-brand text-white shadow-xs'
                    : 'bg-surface text-muted hover:text-ink hover:bg-line/60'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search box & Refresh */}
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search FDR #, college, bank…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-surface border border-line text-ink placeholder:text-muted focus:outline-none focus:border-brand"
              />
            </div>

            <button
              type="button"
              onClick={loadReleases}
              className="btn btn-ghost text-xs px-3 py-1.5 shrink-0"
              title="Refresh Releases"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>
      </section>

      {/* Loading / Error States */}
      {loading && <LoadingState message="Fetching dual-key release queue and cryptographic signatures…" />}

      {!loading && error && <ErrorState error={error} onRetry={loadReleases} />}

      {!loading && !error && filteredReleases.length === 0 && (
        <EmptyState
          title="No Release Requests Found"
          description="No release petitions match your selected status filters or search term."
          actionLabel="Reset Filters"
          onAction={() => {
            setSelectedStatus('All')
            setSearchQuery('')
          }}
        />
      )}

      {/* Release Cards List */}
      {!loading && !error && filteredReleases.length > 0 && (
        <div className="space-y-4">
          {filteredReleases.map((rel) => {
            const isApproved = rel.status === 'Approved'
            const isReviewed = rel.status === 'Reviewed'
            const isPending = rel.status === 'Pending Review'

            return (
              <div
                key={rel.id}
                className={`card p-5 border-l-4 transition-all hover:shadow-sm space-y-4 ${
                  isApproved
                    ? 'border-l-ok-700'
                    : isReviewed
                    ? 'border-l-brand'
                    : 'border-l-warn-700'
                }`}
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`p-2 rounded-xl shrink-0 ${
                        isApproved
                          ? 'bg-ok-50 text-ok-700'
                          : isReviewed
                          ? 'bg-info-50 text-brand'
                          : 'bg-warn-50 text-warn-700'
                      }`}
                    >
                      <KeyRound size={20} />
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-ink text-sm">
                          Release Petition: <span className="font-mono">{rel.id.toUpperCase()}</span>
                        </span>
                        <StatusBadge status={rel.status} />
                        {isApproved && <SimulatedChip text="QR Receipt Issued" />}
                      </div>
                      <div className="text-xs text-muted font-mono mt-0.5">
                        FDR Certificate: <strong className="text-ink">{rel.fdr_number}</strong> • Bank: {rel.bank}
                      </div>
                    </div>
                  </div>

                  <div className="text-right sm:shrink-0">
                    <span className="text-[10px] uppercase font-bold text-muted block">Release Amount</span>
                    <span className="text-lg font-bold font-mono text-ink">{formatINR(rel.amount)}</span>
                  </div>
                </div>

                {/* College Info & Release Justification */}
                <div className="rounded-xl bg-surface/50 border border-line p-3.5 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-ink flex items-center gap-1.5">
                      <Building2 size={15} className="text-brand shrink-0" />
                      <span>{rel.institution_name}</span>
                    </div>
                    <span className="text-[10px] text-muted">
                      Requested by: <strong className="text-ink">{rel.requested_by}</strong> on {new Date(rel.requested_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-muted leading-relaxed">
                    <strong className="text-ink">Justification: </strong>
                    {rel.reason}
                  </p>
                </div>

                {/* Dual-Key Two-Person Signature Trail */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {/* Key 1: Reviewer Status */}
                  <div className="rounded-xl border border-line p-3 space-y-1.5 bg-card">
                    <div className="flex items-center justify-between">
                      <span className="font-bold uppercase tracking-wider text-[10px] text-muted flex items-center gap-1">
                        <UserCheck size={12} className={rel.reviewer_name ? 'text-ok-700' : 'text-muted'} />
                        <span>Key 1: Scrutiny Reviewer</span>
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                          rel.reviewer_name ? 'bg-ok-50 text-ok-700' : 'bg-surface text-muted'
                        }`}
                      >
                        {rel.reviewer_name ? 'Certified' : 'Pending Scrutiny'}
                      </span>
                    </div>

                    {rel.reviewer_name ? (
                      <div className="space-y-1 pt-0.5">
                        <div className="font-semibold text-ink">{rel.reviewer_name}</div>
                        <p className="text-[11px] text-muted italic">"{rel.reviewer_notes}"</p>
                        <div className="text-[10px] text-muted font-mono">
                          Certified on: {new Date(rel.reviewed_at).toLocaleDateString()}
                        </div>
                      </div>
                    ) : (
                      <div className="text-muted text-[11px] py-2">
                        Awaiting officer compliance audit and sign-off.
                      </div>
                    )}
                  </div>

                  {/* Key 2: Approver Status */}
                  <div className="rounded-xl border border-line p-3 space-y-1.5 bg-card">
                    <div className="flex items-center justify-between">
                      <span className="font-bold uppercase tracking-wider text-[10px] text-muted flex items-center gap-1">
                        <ShieldCheck size={12} className={rel.approver_name ? 'text-ok-700' : 'text-muted'} />
                        <span>Key 2: Member Secretary Approver</span>
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                          rel.approver_name ? 'bg-ok-50 text-ok-700' : 'bg-surface text-muted'
                        }`}
                      >
                        {rel.approver_name ? 'Dual OTP Verified' : 'Awaiting Sign-Off'}
                      </span>
                    </div>

                    {rel.approver_name ? (
                      <div className="space-y-1 pt-0.5">
                        <div className="font-semibold text-ink">{rel.approver_name}</div>
                        <div className="text-[11px] font-mono text-brand truncate">
                          Hash: {rel.release_hash?.slice(0, 24)}…
                        </div>
                        <div className="text-[10px] text-muted font-mono">
                          Approved on: {new Date(rel.approved_at).toLocaleDateString()}
                        </div>
                      </div>
                    ) : (
                      <div className="text-muted text-[11px] py-2">
                        Requires verified Key 1 before dual-key OTP approval can be executed.
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-line/60">
                  <div className="text-[11px] text-muted font-mono">
                    {isApproved
                      ? 'Receipt Validated • Permanent Ledger Head'
                      : isReviewed
                      ? 'Key 1 Validated • Ready for Key 2 Approver Sign-Off'
                      : 'Step 1 of 2: AICTE Officer Scrutiny Required'}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Action 1: Review */}
                    {isPending && (
                      <button
                        type="button"
                        onClick={() => setReviewingRelease(rel)}
                        className="btn btn-primary text-xs px-3.5 py-1.5 shadow-xs"
                      >
                        <UserCheck size={13} />
                        <span>Review & Recommend (Key 1)</span>
                      </button>
                    )}

                    {/* Action 2: Dual-Key Approve */}
                    {isReviewed && (
                      <button
                        type="button"
                        onClick={() => setApprovingRelease(rel)}
                        className="btn btn-primary text-xs px-3.5 py-1.5 shadow-xs bg-ok-700 hover:bg-ok-800"
                      >
                        <KeyRound size={13} />
                        <span>Execute Dual-Key Approval (Key 2)</span>
                      </button>
                    )}

                    {/* Action 3: View QR Receipt */}
                    {isApproved && rel.release_hash && (
                      <Link
                        to={`/verify-receipt?hash=${rel.release_hash}`}
                        className="btn btn-ghost text-xs px-3.5 py-1.5 border-brand/30 text-brand hover:bg-brand/10 flex items-center gap-1.5"
                      >
                        <QrCode size={13} />
                        <span>View Boarding-Pass QR Receipt</span>
                        <ArrowRight size={12} />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Review Modal */}
      {reviewingRelease && (
        <ReleaseReviewModal
          release={reviewingRelease}
          onClose={() => setReviewingRelease(null)}
          onUpdated={handleReleaseUpdated}
        />
      )}

      {/* Dual-Key Approve Modal */}
      {approvingRelease && (
        <ReleaseApproveModal
          release={approvingRelease}
          onClose={() => setApprovingRelease(null)}
          onUpdated={handleReleaseUpdated}
        />
      )}
    </div>
  )
}
