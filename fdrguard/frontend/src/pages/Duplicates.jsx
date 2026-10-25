import React, { useEffect, useState, useMemo } from 'react'
import {
  CopyCheck,
  AlertTriangle,
  ShieldAlert,
  Building2,
  FileText,
  Search,
  Filter,
  CheckCircle2,
  ExternalLink,
  ArrowRight,
  Fingerprint,
  RefreshCw,
  Info,
  Download,
  Ban,
  Clock,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react'
import { api } from '../api/client.js'
import StatusBadge from '../components/StatusBadge.jsx'
import SimulatedChip from '../components/SimulatedChip.jsx'
import LoadingState from '../components/LoadingState.jsx'
import EmptyState from '../components/EmptyState.jsx'
import ErrorState from '../components/ErrorState.jsx'
import DuplicateDetailModal from '../components/DuplicateDetailModal.jsx'

function formatINR(val) {
  if (typeof val !== 'number') return '₹0'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val)
}

export default function Duplicates() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [duplicates, setDuplicates] = useState([])
  const [selectedType, setSelectedType] = useState('All')
  const [selectedIncidentStatus, setSelectedIncidentStatus] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [actionNotice, setActionNotice] = useState(null)
  const [activeInvestigatingDup, setActiveInvestigatingDup] = useState(null)

  const loadDuplicates = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.listDuplicates()
      const raw = Array.isArray(res) ? res : res.items || []
      // Annotate each duplicate with default incident status if not present
      const annotated = raw.map((d) => ({
        ...d,
        incident_status: d.incident_status || 'Active Collision',
      }))
      setDuplicates(annotated)
    } catch (err) {
      setError(err?.message || 'Failed to fetch duplicate records')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDuplicates()
  }, [])

  const handleResolveAction = (dupId, actionTitle, statusFlag, officerNotes) => {
    setDuplicates((prev) =>
      prev.map((item) =>
        item.id === dupId
          ? {
              ...item,
              incident_status: statusFlag || 'Resolved',
              last_action: actionTitle,
              officer_notes: officerNotes || item.officer_notes,
            }
          : item,
      ),
    )
    setActionNotice({
      id: dupId,
      message: `Enforcement action "${actionTitle}" applied to incident ${dupId.toUpperCase()} and registered in AICTE audit ledger.`,
    })
    setTimeout(() => setActionNotice(null), 5000)
  }

  // Filter duplicates
  const filteredDuplicates = useMemo(() => {
    return duplicates.filter((item) => {
      if (selectedType !== 'All') {
        if (selectedType === 'Cross-College' && !item.duplicate_type?.includes('Cross-College') && !item.duplicate_type?.includes('Exact FDR Number')) {
          return false
        }
        if (selectedType === 'Same File Hash' && !item.duplicate_type?.includes('File') && !item.file_hash) {
          return false
        }
        if (selectedType === 'Within College' && !item.duplicate_type?.includes('Within College')) {
          return false
        }
        if (selectedType === 'Case Variation' && !item.duplicate_type?.includes('Normalized')) {
          return false
        }
      }

      if (selectedIncidentStatus !== 'All') {
        if (item.incident_status !== selectedIncidentStatus) {
          return false
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchNum = item.flagged_fdr_number?.toLowerCase().includes(q)
        const matchInstA = item.institution_a?.name?.toLowerCase().includes(q)
        const matchInstB = item.institution_b?.name?.toLowerCase().includes(q)
        const matchReason = item.detection_reason?.toLowerCase().includes(q)
        if (!matchNum && !matchInstA && !matchInstB && !matchReason) return false
      }
      return true
    })
  }, [duplicates, selectedType, selectedIncidentStatus, searchQuery])

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    const totalCount = duplicates.length
    const criticalCount = duplicates.filter(
      (d) => d.severity === 'Critical' || d.severity === 'High',
    ).length
    const shaCollisionsCount = duplicates.filter(
      (d) => Boolean(d.file_hash || d.duplicate_type?.includes('File')),
    ).length
    const capitalAtRisk = duplicates.reduce(
      (acc, d) =>
        acc +
        (Number(d.institution_a?.amount || 0) +
          Number(d.institution_b?.amount || 0)),
      0,
    )
    return { totalCount, criticalCount, shaCollisionsCount, capitalAtRisk }
  }, [duplicates])

  // CSV Report Exporter
  const handleExportCSV = () => {
    const headers = [
      'Incident ID',
      'Type',
      'Severity',
      'Flagged Certificate',
      'Institution A',
      'Institution B',
      'Similarity Score',
      'Status',
    ]
    const rows = filteredDuplicates.map((d) => [
      d.id,
      `"${d.duplicate_type}"`,
      d.severity,
      `"${d.flagged_fdr_number}"`,
      `"${d.institution_a?.name || ''}"`,
      `"${d.institution_b?.name || ''}"`,
      `${d.similarity_score}%`,
      d.incident_status || 'Active',
    ])
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', 'AICTE_Duplicate_Fraud_Dossier.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <section className="hero relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="p-1.5 rounded-lg bg-white/10 text-white">
                <CopyCheck size={24} />
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                AICTE Duplicate Detection & Anti-Fraud Suite
              </h1>
              <SimulatedChip
                text="Multi-Vector Collisions"
                className="bg-white/15 text-white border-white/25"
              />
            </div>
            <p className="text-white/80 text-sm max-w-3xl leading-relaxed">
              Task 2 Suite: Monitors and flags fraudulent instrument reuse across three vectors: (1) Same FDR number submitted across multiple technical institutes, (2) Identical document cryptographic file hash (SHA-256 match), and (3) Duplicate deposit applications within a single university trust.
            </p>
          </div>

          <div className="rounded-xl bg-white/10 p-3.5 backdrop-blur-xs border border-white/15 shrink-0 space-y-1 text-right">
            <div className="text-xs text-white/80">Active Collisions</div>
            <div className="text-xl font-extrabold text-white font-mono">
              {duplicates.length} Collisions Flagged
            </div>
            <div className="text-[11px] text-white/70">SHA-256 & Cross-College Match</div>
          </div>
        </div>
      </section>

      {/* Action Notification Alert */}
      {actionNotice && (
        <div className="card bg-ok-50 border-ok-200 text-ok-800 p-4 flex items-center justify-between gap-3 text-xs font-semibold animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-ok-700 shrink-0" />
            <span>{actionNotice.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="text-ok-700 hover:text-ok-900 text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Anti-Fraud Telemetry Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card space-y-1">
          <span className="text-xs font-medium text-muted uppercase tracking-wider">
            Total Flagged Collisions
          </span>
          <div className="text-2xl font-extrabold text-ink font-mono">
            {summaryMetrics.totalCount}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted pt-1">
            <span className="font-semibold text-brand">100% Detected</span>
            <span>in automated intake scan</span>
          </div>
        </div>

        <div className="card space-y-1">
          <span className="text-xs font-medium text-muted uppercase tracking-wider">
            Critical Risk Collisions
          </span>
          <div className="text-2xl font-extrabold text-bad-700 font-mono">
            {summaryMetrics.criticalCount}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted pt-1">
            <span className="font-semibold text-bad-700">Immediate hold recommended</span>
          </div>
        </div>

        <div className="card space-y-1">
          <span className="text-xs font-medium text-muted uppercase tracking-wider">
            Capital at Conflicting Risk
          </span>
          <div className="text-2xl font-extrabold text-brand font-mono">
            {formatINR(summaryMetrics.capitalAtRisk)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted pt-1">
            <span>Aggregated escrow exposure</span>
          </div>
        </div>

        <div className="card space-y-1">
          <span className="text-xs font-medium text-muted uppercase tracking-wider">
            SHA-256 Identical Hashes
          </span>
          <div className="text-2xl font-extrabold text-indigo-deep font-mono">
            {summaryMetrics.shaCollisionsCount}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted pt-1">
            <span className="font-semibold text-warn-700">Bit-exact file duplicates</span>
          </div>
        </div>
      </section>

      {/* Control Bar: Filters, Search, Export */}
      <section className="card p-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Collision Type Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-muted mr-1 flex items-center gap-1">
              <Filter size={13} /> Type:
            </span>
            {['All', 'Cross-College', 'Same File Hash', 'Within College', 'Case Variation'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setSelectedType(tab)}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  selectedType === tab
                    ? 'bg-brand text-white shadow-xs'
                    : 'bg-surface text-muted hover:text-ink hover:bg-line/60'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search box & Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-60">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search certificate # or college…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-surface border border-line text-ink placeholder:text-muted focus:outline-none focus:border-brand"
              />
            </div>

            <button
              type="button"
              onClick={handleExportCSV}
              className="btn btn-ghost text-xs px-3 py-1.5 border border-line"
              title="Export Incident Dossier as CSV"
            >
              <Download size={13} />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            <button
              type="button"
              onClick={loadDuplicates}
              className="btn btn-ghost text-xs px-3 py-1.5 shrink-0"
              title="Refresh Duplicate Records"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Secondary Status Filter */}
        <div className="pt-2 border-t border-line/60 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium text-muted">Investigation State:</span>
          {['All', 'Active Collision', 'Frozen / Hold', 'Show-Cause Issued', 'Under Investigation', 'Resolved'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setSelectedIncidentStatus(st)}
              className={`text-[11px] px-2.5 py-1 rounded-md font-semibold transition-colors ${
                selectedIncidentStatus === st
                  ? 'bg-ink text-white'
                  : 'bg-surface text-muted hover:text-ink'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </section>

      {/* Results View */}
      {loading && <LoadingState message="Scanning cryptographic registry for duplicate instruments…" />}

      {!loading && error && (
        <ErrorState error={error} onRetry={loadDuplicates} />
      )}

      {!loading && !error && filteredDuplicates.length === 0 && (
        <EmptyState
          title="No Duplicate Collisions Detected"
          description={
            searchQuery || selectedType !== 'All' || selectedIncidentStatus !== 'All'
              ? 'No duplicate matches match your selected filters.'
              : 'All Fixed Deposit Receipts have passed unique certificate serial and file hash validation.'
          }
          actionLabel="Reset Filters"
          onAction={() => {
            setSelectedType('All')
            setSelectedIncidentStatus('All')
            setSearchQuery('')
          }}
        />
      )}

      {!loading && !error && filteredDuplicates.length > 0 && (
        <div className="space-y-4">
          {filteredDuplicates.map((dup) => {
            const isCritical = dup.severity === 'Critical' || dup.severity === 'High'
            const isFileHashDup = Boolean(dup.file_hash || dup.duplicate_type?.includes('File'))
            const isResolved = dup.incident_status === 'Resolved'

            return (
              <div
                key={dup.id}
                className={`card p-5 border-l-4 transition-all hover:shadow-sm space-y-4 ${
                  isResolved
                    ? 'border-l-ok-700 opacity-90'
                    : isCritical
                    ? 'border-l-bad-700'
                    : 'border-l-warn-700'
                }`}
              >
                {/* Header: Duplicate Type, Flagged Number, Severity */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`p-1.5 rounded-lg shrink-0 ${
                        isResolved
                          ? 'bg-ok-50 text-ok-700'
                          : isCritical
                          ? 'bg-bad-50 text-bad-700'
                          : 'bg-warn-50 text-warn-700'
                      }`}
                    >
                      <ShieldAlert size={18} />
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-ink">{dup.duplicate_type}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            isCritical
                              ? 'bg-bad-50 text-bad-700 border border-bad-200'
                              : 'bg-warn-50 text-warn-700 border border-warn-200'
                          }`}
                        >
                          {dup.severity} Severity
                        </span>
                        <span className="text-[10px] font-semibold text-muted bg-surface px-2 py-0.5 rounded-md border border-line font-mono">
                          Score: {dup.similarity_score}%
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            dup.incident_status === 'Frozen / Hold'
                              ? 'bg-bad-50 text-bad-700 ring-1 ring-bad-200'
                              : dup.incident_status === 'Show-Cause Issued'
                              ? 'bg-warn-50 text-warn-700 ring-1 ring-warn-200'
                              : dup.incident_status === 'Resolved'
                              ? 'bg-ok-50 text-ok-700 ring-1 ring-ok-200'
                              : 'bg-info-50 text-info-700 ring-1 ring-info-200'
                          }`}
                        >
                          {dup.incident_status || 'Active Collision'}
                        </span>
                      </div>
                      <div className="text-xs text-muted font-mono mt-0.5">
                        Flagged Certificate No.:{' '}
                        <span className="font-bold text-ink">{dup.flagged_fdr_number}</span>
                      </div>
                    </div>
                  </div>

                  {isFileHashDup && (
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted bg-surface px-2.5 py-1 rounded-lg border border-line shrink-0">
                      <Fingerprint size={13} className="text-brand" />
                      <span>SHA-256 Hash Collision</span>
                    </div>
                  )}
                </div>

                {/* Side by side comparison: Institution A vs Institution B */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Institution A Card */}
                  <div className="rounded-xl border border-line bg-surface/50 p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted">
                      <span className="font-bold uppercase tracking-wider text-[10px] text-ink">
                        Institution A (First Submission)
                      </span>
                      <StatusBadge status={dup.institution_a?.status || 'Submitted'} />
                    </div>

                    <div className="font-bold text-sm text-ink flex items-center gap-2">
                      <Building2 size={15} className="text-brand shrink-0" />
                      <span className="truncate">{dup.institution_a?.name}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-line/60">
                      <div>
                        <div className="text-[10px] text-muted">Bank</div>
                        <div className="font-semibold text-ink truncate">{dup.institution_a?.bank}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-muted">Declared Principal</div>
                        <div className="font-mono font-bold text-ink">
                          {formatINR(dup.institution_a?.amount)}
                        </div>
                      </div>
                    </div>

                    {dup.institution_a?.filename && (
                      <div className="text-[10px] text-muted flex items-center gap-1.5 pt-1 font-mono truncate">
                        <FileText size={12} className="text-muted" />
                        <span>File: {dup.institution_a.filename}</span>
                      </div>
                    )}
                  </div>

                  {/* Institution B Card */}
                  <div className="rounded-xl border border-bad/30 bg-bad-50/20 p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted">
                      <span className="font-bold uppercase tracking-wider text-[10px] text-bad">
                        Institution B (Conflicting Reuse)
                      </span>
                      <StatusBadge status={dup.institution_b?.status || 'Under Review'} />
                    </div>

                    <div className="font-bold text-sm text-ink flex items-center gap-2">
                      <Building2 size={15} className="text-bad-700 shrink-0" />
                      <span className="truncate">{dup.institution_b?.name}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-bad/20">
                      <div>
                        <div className="text-[10px] text-muted">Bank</div>
                        <div className="font-semibold text-ink truncate">{dup.institution_b?.bank}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-muted">Declared Principal</div>
                        <div className="font-mono font-bold text-ink">
                          {formatINR(dup.institution_b?.amount)}
                        </div>
                      </div>
                    </div>

                    {dup.institution_b?.filename && (
                      <div className="text-[10px] text-muted flex items-center gap-1.5 pt-1 font-mono truncate">
                        <FileText size={12} className="text-bad-700" />
                        <span>File: {dup.institution_b.filename}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Detection Reason & Suggested Action */}
                <div className="rounded-xl bg-info-50/50 border border-info-200/60 p-3.5 space-y-2 text-xs">
                  <div className="flex items-start gap-2 text-ink">
                    <Info size={14} className="text-brand shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Detection Reason: </span>
                      <span className="text-muted">{dup.detection_reason}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-ink pt-1 border-t border-info-200/40">
                    <AlertTriangle size={14} className="text-warn-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-warn-800">Suggested Action: </span>
                      <span className="text-muted">{dup.suggested_action}</span>
                    </div>
                  </div>
                </div>

                {/* Administrative Decision Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="text-[11px] text-muted font-mono">
                    Incident Ref: {dup.id.toUpperCase()} • System Confidence: {dup.similarity_score}%
                    {dup.last_action && (
                      <span className="ml-2 text-ok-700 font-semibold">• Last: {dup.last_action}</span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveInvestigatingDup(dup)}
                      className="btn btn-ghost text-xs px-3 py-1.5 border-brand/30 text-brand hover:bg-brand/10"
                      title="Inspect full cryptographic hash and deep side-by-side details"
                    >
                      <span>Investigate Dossier</span>
                      <ArrowRight size={13} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleResolveAction(dup.id, 'Hold Both Applications', 'Frozen / Hold')}
                      className="btn btn-danger text-xs px-3 py-1.5"
                    >
                      <Ban size={13} />
                      <span>Hold Both</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleResolveAction(dup.id, 'Issue Show-Cause Notice', 'Show-Cause Issued')}
                      className="btn btn-primary text-xs px-3 py-1.5"
                    >
                      Issue Show-Cause
                    </button>

                    <button
                      type="button"
                      onClick={() => handleResolveAction(dup.id, 'Request Physical Attestation', 'Under Investigation')}
                      className="btn btn-ghost text-xs px-3 py-1.5"
                    >
                      Bank Attestation
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Investigation Modal */}
      {activeInvestigatingDup && (
        <DuplicateDetailModal
          duplicate={activeInvestigatingDup}
          onClose={() => setActiveInvestigatingDup(null)}
          onResolve={handleResolveAction}
        />
      )}
    </div>
  )
}
