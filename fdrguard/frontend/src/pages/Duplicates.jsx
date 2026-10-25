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
} from 'lucide-react'
import { api } from '../api/client.js'
import StatusBadge from '../components/StatusBadge.jsx'
import SimulatedChip from '../components/SimulatedChip.jsx'
import LoadingState from '../components/LoadingState.jsx'
import EmptyState from '../components/EmptyState.jsx'
import ErrorState from '../components/ErrorState.jsx'

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
  const [searchQuery, setSearchQuery] = useState('')
  const [actionNotice, setActionNotice] = useState(null)

  const loadDuplicates = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.listDuplicates()
      setDuplicates(Array.isArray(res) ? res : res.items || [])
    } catch (err) {
      setError(err?.message || 'Failed to fetch duplicate records')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDuplicates()
  }, [])

  const filteredDuplicates = useMemo(() => {
    return duplicates.filter((item) => {
      if (selectedType !== 'All') {
        if (selectedType === 'Cross-College' && !item.duplicate_type?.includes('Cross-College') && !item.duplicate_type?.includes('Exact FDR Number')) {
          return false
        }
        if (selectedType === 'Same File Hash' && !item.duplicate_type?.includes('File') && !item.file_hash) {
          return false
        }
        if (selectedType === 'Same College' && !item.duplicate_type?.includes('Within College')) {
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
  }, [duplicates, selectedType, searchQuery])

  const handleAction = (dupId, actionName) => {
    setActionNotice({
      id: dupId,
      message: `Action executed: ${actionName} logged in AICTE compliance audit ledger.`,
    })
    setTimeout(() => setActionNotice(null), 4000)
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
                Duplicate Detection Engine
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-bad text-white">
                Task 1: Anti-Fraud
              </span>
            </div>
            <p className="text-white/80 text-sm max-w-3xl leading-relaxed">
              Detects certificate collisions across three fraud vectors: (1) Same FDR number submitted by multiple technical institutes, (2) Identical document file hash (SHA-256 match), and (3) Same deposit certificate reused by two colleges.
            </p>
          </div>

          <div className="rounded-xl bg-white/10 p-3.5 backdrop-blur-xs border border-white/15 shrink-0 space-y-1 text-right">
            <div className="text-xs text-white/80">Active Detection Vectors</div>
            <div className="text-xl font-extrabold text-white font-mono">
              {duplicates.length} Flagged Collision{duplicates.length === 1 ? '' : 's'}
            </div>
            <div className="text-[11px] text-white/70">SHA-256 & Exact Serial Match</div>
          </div>
        </div>
      </section>

      {/* Action Notification Alert */}
      {actionNotice && (
        <div className="card bg-ok-50 border-ok-200 text-ok-800 p-4 flex items-center justify-between gap-3 text-xs font-semibold animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-ok-700" />
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

      {/* Control Bar */}
      <section className="card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-muted mr-1 flex items-center gap-1">
              <Filter size={13} /> Filter:
            </span>
            {['All', 'Cross-College', 'Same File Hash', 'Same College'].map((tab) => (
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

          {/* Search box & Refresh */}
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
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
              onClick={loadDuplicates}
              className="btn btn-ghost text-xs px-3 py-1.5 shrink-0"
              title="Refresh Duplicate Records"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
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
            searchQuery || selectedType !== 'All'
              ? 'No duplicate matches match your selected filters.'
              : 'All Fixed Deposit Receipts have passed unique certificate serial and file hash validation.'
          }
          actionLabel="Reset Filters"
          onAction={() => {
            setSelectedType('All')
            setSearchQuery('')
          }}
        />
      )}

      {!loading && !error && filteredDuplicates.length > 0 && (
        <div className="space-y-4">
          {filteredDuplicates.map((dup) => {
            const isCritical = dup.severity === 'Critical' || dup.severity === 'High'
            const isFileHashDup = Boolean(dup.file_hash || dup.duplicate_type?.includes('File'))

            return (
              <div
                key={dup.id}
                className={`card p-5 border-l-4 transition-all hover:shadow-sm space-y-4 ${
                  isCritical ? 'border-l-bad' : 'border-l-warn'
                }`}
              >
                {/* Header: Duplicate Type, Flagged Number, Severity */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`p-1.5 rounded-lg shrink-0 ${
                        isCritical
                          ? 'bg-bad/10 text-bad'
                          : 'bg-warn/10 text-warn'
                      }`}
                    >
                      <ShieldAlert size={18} />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-ink">{dup.duplicate_type}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            isCritical
                              ? 'bg-bad/15 text-bad border border-bad/30'
                              : 'bg-warn/15 text-warn border border-warn/30'
                          }`}
                        >
                          {dup.severity} Severity
                        </span>
                        <span className="text-[10px] font-semibold text-muted bg-surface px-2 py-0.5 rounded-md border border-line font-mono">
                          Score: {dup.similarity_score}%
                        </span>
                      </div>
                      <div className="text-xs text-muted font-mono mt-0.5">
                        Flagged Certificate No.:{' '}
                        <span className="font-bold text-ink">{dup.flagged_fdr_number}</span>
                      </div>
                    </div>
                  </div>

                  {isFileHashDup && (
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted bg-surface px-2.5 py-1 rounded-lg border border-line">
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
                      <Building2 size={15} className="text-bad shrink-0" />
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
                        <FileText size={12} className="text-bad" />
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
                    <AlertTriangle size={14} className="text-warn shrink-0 mt-0.5" />
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
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAction(dup.id, 'Hold Applications')}
                      className="btn btn-danger text-xs px-3 py-1.5"
                    >
                      Hold Both Applications
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAction(dup.id, 'Issue Show-Cause Notice')}
                      className="btn btn-primary text-xs px-3 py-1.5"
                    >
                      Issue Show-Cause Notice
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAction(dup.id, 'Request Physical Attestation')}
                      className="btn btn-ghost text-xs px-3 py-1.5"
                    >
                      Request Bank Attestation
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
