import React, { useEffect, useState, useMemo } from 'react'
import {
  CheckSquare,
  Search,
  Filter,
  RefreshCw,
  Building2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  FileCheck2,
  SlidersHorizontal,
  ExternalLink,
  Zap,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import { api } from '../api/client.js'
import StatusBadge from '../components/StatusBadge.jsx'
import SimulatedChip from '../components/SimulatedChip.jsx'
import LoadingState from '../components/LoadingState.jsx'
import EmptyState from '../components/EmptyState.jsx'
import ErrorState from '../components/ErrorState.jsx'
import BankCompareModal from '../components/BankCompareModal.jsx'
import { useAuth } from '../context/AuthContext.jsx'

function formatINR(val) {
  if (typeof val !== 'number') return '₹0'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val)
}

export default function OfficerQueue() {
  const { user, currentRoleKey } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [fdrs, setFdrs] = useState([])
  const [selectedStatus, setSelectedStatus] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFdrForCompare, setSelectedFdrForCompare] = useState(null)
  const [quickVerifyingId, setQuickVerifyingId] = useState(null)
  const [notification, setNotification] = useState(null)

  const loadQueue = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.listFdrs()
      setFdrs(res.items || [])
    } catch (err) {
      setError(err?.message || 'Failed to fetch verification queue')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadQueue()
  }, [])

  // Callback when an FDR is updated in the BankCompareModal
  const handleFdrUpdated = (updatedFdr) => {
    setFdrs((prev) =>
      prev.map((item) => (item.id === updatedFdr.id ? updatedFdr : item)),
    )
    if (selectedFdrForCompare && selectedFdrForCompare.id === updatedFdr.id) {
      setSelectedFdrForCompare(updatedFdr)
    }
  }

  // Quick verify from queue table
  const handleQuickVerify = async (e, fdr) => {
    e.stopPropagation()
    setQuickVerifyingId(fdr.id)
    try {
      const updated = await api.verifyBank(fdr.id)
      handleFdrUpdated(updated)
      setNotification({
        type: 'success',
        message: `CBS Live Inquiry complete for ${fdr.fdr_number}. Status: ${updated.verification?.state || 'Verified'}.`,
      })
      setTimeout(() => setNotification(null), 4000)
    } catch (err) {
      setNotification({
        type: 'error',
        message: `CBS check failed for ${fdr.fdr_number}: ${err?.message || 'Timeout'}`,
      })
      setTimeout(() => setNotification(null), 4000)
    } finally {
      setQuickVerifyingId(null)
    }
  }

  // Filter FDRs for Officer queue
  const filteredFdrs = useMemo(() => {
    return fdrs.filter((item) => {
      if (selectedStatus !== 'All') {
        if (selectedStatus === 'Pending Verification') {
          const isPending =
            item.status === 'Submitted' ||
            item.status === 'Under Review' ||
            item.status === 'Verification Pending' ||
            item.verification?.state === 'Pending' ||
            item.verification?.state === 'Verification Pending'
          if (!isPending) return false
        } else if (selectedStatus === 'Discrepancies / Returned') {
          const isDiscrepant =
            item.status === 'Returned' ||
            item.status === 'Failed' ||
            item.status === 'Rejected' ||
            !item.aicte_lien_endorsed ||
            item.bank_comparison?.match_status?.includes('Mismatch')
          if (!isDiscrepant) return false
        } else if (item.status !== selectedStatus) {
          return false
        }
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
  }, [fdrs, selectedStatus, searchQuery])

  // Queue KPI computations
  const kpiStats = useMemo(() => {
    const pendingCount = fdrs.filter(
      (f) =>
        f.status === 'Submitted' ||
        f.status === 'Under Review' ||
        f.verification?.state === 'Pending' ||
        f.verification?.state === 'Verification Pending',
    ).length

    const verifiedCount = fdrs.filter(
      (f) => f.status === 'Verified' || f.status === 'Active',
    ).length

    const discrepanciesCount = fdrs.filter(
      (f) =>
        f.status === 'Returned' ||
        f.status === 'Failed' ||
        !f.aicte_lien_endorsed ||
        f.bank_comparison?.match_status?.includes('Mismatch'),
    ).length

    const totalValue = fdrs.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0)

    return { pendingCount, verifiedCount, discrepanciesCount, totalValue }
  }, [fdrs])

  const statusFilters = [
    'All',
    'Pending Verification',
    'Submitted',
    'Under Review',
    'Verified',
    'Discrepancies / Returned',
  ]

  return (
    <div className="space-y-6">
      {/* Top Hero Banner */}
      <section className="hero relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="p-1.5 rounded-lg bg-white/10 text-white">
                <CheckSquare size={24} />
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Officer Scrutiny & Bank Verification Queue
              </h1>
              <SimulatedChip
                text="Live CBS Handshake Simulator"
                className="bg-white/15 text-white border-white/25"
              />
            </div>
            <p className="text-white/80 text-sm max-w-3xl leading-relaxed">
              Task 1 Workflow: AICTE officer scrutiny portal for cross-verifying technical institute FDR certificates
              against simulated Core Banking System (CBS) live records. Inspect joint-lien endorsements and reconcile discrepancies.
            </p>
          </div>

          <div className="rounded-xl bg-white/10 p-3.5 backdrop-blur-xs border border-white/15 shrink-0 space-y-1">
            <div className="text-xs text-white/80">Active Verification Desk</div>
            <div className="text-xs font-bold text-white truncate max-w-[200px]">
              {user?.name || 'Anita Deshmukh'}
            </div>
            <div className="text-[11px] text-white/70">
              Western Regional Bureau • E-Governance
            </div>
          </div>
        </div>
      </section>

      {/* Notification Banner */}
      {notification && (
        <div
          className={`card p-4 flex items-center justify-between gap-3 text-xs font-semibold animate-in fade-in ${
            notification.type === 'error'
              ? 'bg-bad-50 border-bad-200 text-bad-800'
              : 'bg-ok-50 border-ok-200 text-ok-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'error' ? (
              <AlertTriangle size={16} className="text-bad-700 shrink-0" />
            ) : (
              <CheckCircle2 size={16} className="text-ok-700 shrink-0" />
            )}
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

      {/* Queue KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card space-y-1">
          <span className="text-xs font-medium text-muted uppercase tracking-wider">
            Pending Officer Scrutiny
          </span>
          <div className="text-2xl font-extrabold text-ink font-mono">
            {kpiStats.pendingCount}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted pt-1">
            <span className="font-semibold text-warn-700">Awaiting CBS Ping</span>
          </div>
        </div>

        <div className="card space-y-1">
          <span className="text-xs font-medium text-muted uppercase tracking-wider">
            Bank CBS Reconciled
          </span>
          <div className="text-2xl font-extrabold text-ok-700 font-mono">
            {kpiStats.verifiedCount}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted pt-1">
            <span>Full 100% parameter match</span>
          </div>
        </div>

        <div className="card space-y-1">
          <span className="text-xs font-medium text-muted uppercase tracking-wider">
            Discrepancies & Flagged
          </span>
          <div className="text-2xl font-extrabold text-bad-700 font-mono">
            {kpiStats.discrepanciesCount}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted pt-1">
            <span className="font-semibold text-bad-700">Missing AICTE lien / returned</span>
          </div>
        </div>

        <div className="card space-y-1">
          <span className="text-xs font-medium text-muted uppercase tracking-wider">
            Total Capital In Queue
          </span>
          <div className="text-2xl font-extrabold text-brand font-mono">
            {formatINR(kpiStats.totalValue)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted pt-1">
            <span>Security deposit exposure</span>
          </div>
        </div>
      </section>

      {/* Queue Filter & Search Toolbar */}
      <section className="card p-4 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Status Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-muted mr-1 flex items-center gap-1">
              <Filter size={13} /> Filter:
            </span>
            {statusFilters.map((tab) => (
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
              onClick={loadQueue}
              className="btn btn-ghost text-xs px-3 py-1.5 shrink-0"
              title="Refresh Queue"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>
      </section>

      {/* Queue Content State */}
      {loading && <LoadingState message="Fetching officer verification queue and CBS ledger sync status…" />}

      {!loading && error && <ErrorState error={error} onRetry={loadQueue} />}

      {!loading && !error && filteredFdrs.length === 0 && (
        <EmptyState
          title="No Deposit Records in Current Queue"
          description={
            searchQuery || selectedStatus !== 'All'
              ? 'No FDR records match the specified search parameters or filter criteria.'
              : 'All Fixed Deposit Receipts have completed officer scrutiny.'
          }
          actionLabel="Reset Queue Filters"
          onAction={() => {
            setSelectedStatus('All')
            setSearchQuery('')
          }}
        />
      )}

      {/* Queue Records Table */}
      {!loading && !error && filteredFdrs.length > 0 && (
        <div className="card p-0 overflow-hidden border border-line shadow-sm">
          <div className="px-5 py-3.5 bg-surface border-b border-line flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-ink">Instruments Awaiting Scrutiny & Reconciliation</h2>
              <span className="text-[11px] font-mono text-muted bg-card px-2 py-0.5 rounded border border-line">
                {filteredFdrs.length} Records
              </span>
            </div>
            <span className="text-xs text-muted hidden sm:inline">
              Click <strong className="text-ink">Compare & Reconcile</strong> for side-by-side CBS bank validation
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface/60 text-[11px] uppercase tracking-wider text-muted font-bold border-b border-line">
                <tr>
                  <th className="px-5 py-3">FDR Certificate #</th>
                  <th className="px-4 py-3">Technical Institute</th>
                  <th className="px-4 py-3">Issuing Bank & Branch</th>
                  <th className="px-4 py-3">Principal Amount</th>
                  <th className="px-4 py-3">Lien Status</th>
                  <th className="px-4 py-3">Verification State</th>
                  <th className="px-4 py-3">CBS Match</th>
                  <th className="px-5 py-3 text-right">Officer Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredFdrs.map((fdr) => {
                  const hasLien = fdr.aicte_lien_endorsed
                  const matchStatus = fdr.bank_comparison?.match_status || (
                    hasLien ? 'Full Match' : 'Mismatch - Lien Missing'
                  )
                  const isMatch = matchStatus === 'Full Match'

                  return (
                    <tr
                      key={fdr.id}
                      className="hover:bg-surface/50 transition-colors cursor-pointer group"
                      onClick={() => setSelectedFdrForCompare(fdr)}
                    >
                      {/* FDR Number */}
                      <td className="px-5 py-3.5 font-mono font-bold text-ink group-hover:text-brand transition-colors">
                        <div className="flex items-center gap-1.5">
                          <span>{fdr.fdr_number}</span>
                        </div>
                        <span className="text-[10px] text-muted font-sans font-normal block mt-0.5">
                          Maturing: {fdr.maturity_date}
                        </span>
                      </td>

                      {/* Technical Institute */}
                      <td className="px-4 py-3.5 max-w-[200px]">
                        <div className="font-semibold text-ink truncate">
                          {fdr.institution_name}
                        </div>
                        <span className="text-[10px] text-muted truncate block">
                          ID: {fdr.institution_id || 'inst_01'}
                        </span>
                      </td>

                      {/* Issuing Bank & Branch */}
                      <td className="px-4 py-3.5 max-w-[180px]">
                        <div className="font-semibold text-ink truncate">{fdr.bank}</div>
                        <span className="text-[10px] text-muted truncate block">
                          {fdr.branch || 'Main Branch'}
                        </span>
                      </td>

                      {/* Principal Amount */}
                      <td className="px-4 py-3.5 font-mono font-bold text-ink">
                        {formatINR(fdr.amount)}
                      </td>

                      {/* AICTE Lien Endorsement */}
                      <td className="px-4 py-3.5">
                        {hasLien ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-ok-50 text-ok-700 ring-1 ring-ok-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-ok-700" />
                            AICTE Endorsed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-bad-50 text-bad-700 ring-1 ring-bad-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-bad-700" />
                            Missing Lien
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <StatusBadge status={fdr.status} />
                      </td>

                      {/* CBS Match */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold ${
                            isMatch
                              ? 'bg-ok-50 text-ok-700 border border-ok-200'
                              : 'bg-bad-50 text-bad-700 border border-bad-200'
                          }`}
                        >
                          {matchStatus}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right space-x-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedFdrForCompare(fdr)
                          }}
                          className="btn btn-ghost text-xs px-2.5 py-1 text-brand hover:bg-brand/10 border-brand/30"
                          title="Open submitted vs bank comparison view"
                        >
                          <span>Compare & Reconcile</span>
                          <ArrowRight size={12} />
                        </button>

                        <button
                          type="button"
                          disabled={quickVerifyingId === fdr.id}
                          onClick={(e) => handleQuickVerify(e, fdr)}
                          className="btn btn-primary text-xs px-2.5 py-1"
                          title="Trigger Simulated Live CBS Inquiry"
                        >
                          <Zap size={11} className={quickVerifyingId === fdr.id ? 'animate-spin' : ''} />
                          <span>{quickVerifyingId === fdr.id ? 'Pinging…' : 'CBS Ping'}</span>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Side-by-Side Bank Comparison Modal */}
      {selectedFdrForCompare && (
        <BankCompareModal
          fdr={selectedFdrForCompare}
          onClose={() => setSelectedFdrForCompare(null)}
          onFdrUpdated={handleFdrUpdated}
        />
      )}
    </div>
  )
}
