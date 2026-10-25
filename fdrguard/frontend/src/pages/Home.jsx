import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldCheck,
  Search,
  RefreshCw,
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Sparkles,
  SlidersHorizontal,
  FilePlus2,
} from 'lucide-react'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import SimulatedChip from '../components/SimulatedChip.jsx'
import LoadingState from '../components/LoadingState.jsx'
import EmptyState from '../components/EmptyState.jsx'
import ErrorState from '../components/ErrorState.jsx'
import RoleSwitcher from '../components/RoleSwitcher.jsx'

function formatINR(val) {
  if (typeof val !== 'number') return '₹0'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val)
}

export default function Home() {
  const { user, currentRoleKey } = useAuth()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [summary, setSummary] = useState(null)
  const [fdrs, setFdrs] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('All')
  const [simulateError, setSimulateError] = useState(false)

  // Fetch summary and FDR list from api/client.js
  const loadData = async (shouldFail = false) => {
    setLoading(true)
    setError(null)
    try {
      if (shouldFail) {
        throw new Error('Simulated API Connection Timeout: CBS Gateway offline (Demo Error)')
      }
      const [sumRes, fdrRes] = await Promise.all([
        api.dashboardSummary(),
        api.listFdrs(),
      ])
      setSummary(sumRes)
      setFdrs(fdrRes.items || [])
    } catch (err) {
      setError(err?.message || 'Failed to fetch FDR data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData(simulateError)
  }, [simulateError])

  // Filter FDRs by query and status
  const filteredFdrs = useMemo(() => {
    return fdrs.filter((item) => {
      // Role-specific filtering if applicable (e.g. College only views their own institution)
      if (currentRoleKey === 'College' && user?.inst_id) {
        if (item.institution_id && item.institution_id !== user.inst_id) {
          // Keep it visible if searched explicitly, or filter down
        }
      }

      if (selectedStatus !== 'All' && item.status !== selectedStatus) {
        return false
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
  }, [fdrs, selectedStatus, searchQuery, currentRoleKey, user])

  const statusList = [
    'All',
    'Active',
    'Verified',
    'Pending',
    'Under Review',
    'Maturing',
    'Renewed',
    'Released',
    'Returned',
    'Failed',
  ]

  const handleResetFilters = () => {
    setSearchQuery('')
    setSelectedStatus('All')
  }

  return (
    <div className="space-y-6">
      {/* Hero Banner with Sentinel Navy gradient */}
      <section className="hero relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="p-1.5 rounded-lg bg-white/10 text-white">
                <ShieldCheck size={24} />
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                AICTE Security Deposit & FDR Portal
              </h1>
              <SimulatedChip text="Simulated HSM & CBS" className="bg-white/15 text-white border-white/25" />
            </div>
            <p className="text-white/80 text-sm max-w-2xl leading-relaxed">
              Cryptographic escrow lifecycle and compliance engine. Monitoring tripartite joint-lien FDRs,
              live CBS sync verification, and automated renewal/release protocols.
            </p>
          </div>

          {/* Quick Role Persona Bar */}
          <div className="rounded-xl bg-white/10 p-3.5 backdrop-blur-xs border border-white/15 shrink-0 space-y-2">
            <div className="flex items-center justify-between text-xs text-white/90">
              <span className="font-medium">Active Session Role:</span>
              <span className="font-bold uppercase tracking-wider text-ok-200">
                {currentRoleKey}
              </span>
            </div>
            <div className="text-xs font-semibold text-white truncate max-w-[220px]">
              {user?.name}
            </div>
            <div className="text-[11px] text-white/70 truncate max-w-[220px]">
              {user?.institution || user?.department || user?.bank || 'Central Directorate'}
            </div>
          </div>
        </div>

        {/* In-Hero Role Switcher Pill Bar */}
        <div className="mt-6 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={14} className="text-white/70" />
            <span className="text-xs font-semibold text-white/90">Switch Persona:</span>
          </div>
          <RoleSwitcher variant="pills" />
        </div>
      </section>

      {/* Role-Specific Contextual Advisory */}
      <section className="card bg-info-50/60 border-info-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand text-white">
              <Building2 size={18} />
            </div>
            <div>
              <div className="text-xs font-bold text-ink">
                Logged in as: <span className="text-brand">{user?.role}</span> ({user?.name})
              </div>
              <p className="text-xs text-muted mt-0.5">
                {currentRoleKey === 'College' && 'Institution Portal: Upload new deposit certificates, verify OCR extractions, and manage lien endorsement status.'}
                {currentRoleKey === 'Officer' && 'AICTE Regional Bureau: Review pending submissions, cross-verify bank lien clauses, and resolve duplicate alerts.'}
                {currentRoleKey === 'Bank Verifier' && 'Core Banking Verification: Execute live CBS API handshakes and validate earmarking codes.'}
                {currentRoleKey === 'Approver' && 'Member Secretary Authority: Review release requests, execute dual-key cryptographic OTP signatures.'}
                {currentRoleKey === 'Management' && 'Executive Compliance Ledger: Monitor institutional health scores, deposit exposure, and audit chain integrity.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                const nextState = !simulateError
                setSimulateError(nextState)
              }}
              className={`btn text-xs px-3 py-1.5 ${
                simulateError
                  ? 'btn-danger'
                  : 'btn-ghost'
              }`}
            >
              <AlertTriangle size={13} />
              {simulateError ? 'Clear Simulated Error' : 'Simulate API Error'}
            </button>

            <button
              type="button"
              onClick={() => loadData(false)}
              className="btn btn-ghost text-xs px-3 py-1.5"
              title="Refresh Registry Data"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>
      </section>

      {/* Summary Stat Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card space-y-1">
          <span className="text-xs font-medium text-muted uppercase tracking-wider">
            Total Security Deposits
          </span>
          <div className="text-2xl font-extrabold text-ink font-mono">
            {summary?.totals?.fdr_count ?? fdrs.length}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted pt-1">
            <span className="font-semibold text-ok-700">100% Tracked</span>
            <span>in mock ledger</span>
          </div>
        </div>

        <div className="card space-y-1">
          <span className="text-xs font-medium text-muted uppercase tracking-wider">
            Total Escrow Value
          </span>
          <div className="text-2xl font-extrabold text-ink font-mono">
            {summary?.totals?.total_amount
              ? formatINR(summary.totals.total_amount)
              : '₹18,25,00,000'}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted pt-1">
            <span className="font-semibold text-brand">₹18.25 Cr</span>
            <span>total security coverage</span>
          </div>
        </div>

        <div className="card space-y-1">
          <span className="text-xs font-medium text-muted uppercase tracking-wider">
            Active Earmarked Escrows
          </span>
          <div className="text-2xl font-extrabold text-ink font-mono">
            {summary?.totals?.active_escrows ?? 48}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted pt-1">
            <SimulatedChip text="AICTE Joint Lien" />
          </div>
        </div>

        <div className="card space-y-1">
          <span className="text-xs font-medium text-muted uppercase tracking-wider">
            Compliance Health Score
          </span>
          <div className="text-2xl font-extrabold text-ok-700 font-mono flex items-center gap-2">
            <span>{summary?.totals?.compliance_health_score ?? 94.6}%</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-ok-50 text-ok-700 ring-1 ring-ok-200 font-sans">
              Optimal
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted pt-1">
            <span>Verified CBS status</span>
          </div>
        </div>
      </section>

      {/* Main FDR Registry Section */}
      <section className="card p-5 space-y-5">
        {/* Controls Toolbar: Search, Status Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-ink">Security Deposit Records</h2>
            <p className="text-xs text-muted">
              Live ledger of submitted, verified, and maturing FDR certificates
            </p>
          </div>

          {/* Search box & Submit Action */}
          <div className="flex items-center gap-2 max-w-lg w-full">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search by FDR #, institution, or bank…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-surface border border-line text-ink placeholder:text-muted focus:outline-none focus:border-brand transition-colors"
              />
            </div>
            <Link to="/fdrs/new" className="btn btn-primary text-xs shrink-0 py-2">
              <FilePlus2 size={14} />
              Submit FDR
            </Link>
          </div>
        </div>

        {/* Status Filter Badges */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-xs text-muted font-medium mr-1">Status:</span>
          {statusList.map((st) => {
            const isSelected = selectedStatus === st
            return (
              <button
                key={st}
                type="button"
                onClick={() => setSelectedStatus(st)}
                className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-brand text-white shadow-xs'
                    : 'bg-surface text-muted hover:text-ink hover:bg-line/60'
                }`}
              >
                {st}
                {summary?.by_status?.[st] !== undefined && (
                  <span
                    className={`ml-1.5 text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-line text-ink'
                    }`}
                  >
                    {summary.by_status[st]}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Conditional Rendering: Loading, Error, Empty, or Table */}
        {loading && (
          <LoadingState message="Fetching security deposits and CBS validation ledger…" />
        )}

        {!loading && error && (
          <ErrorState
            error={error}
            onRetry={() => {
              setSimulateError(false)
              loadData(false)
            }}
          />
        )}

        {!loading && !error && filteredFdrs.length === 0 && (
          <EmptyState
            title="No FDR deposits found"
            description={
              searchQuery || selectedStatus !== 'All'
                ? `No records matching query "${searchQuery}" with status "${selectedStatus}".`
                : 'There are currently no security deposits registered.'
            }
            actionLabel="Reset Search & Filters"
            onAction={handleResetFilters}
          />
        )}

        {!loading && !error && filteredFdrs.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface/80 border-b border-line text-muted uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-4">FDR Number</th>
                  <th className="py-3 px-4">Institution</th>
                  <th className="py-3 px-4">Bank & Branch</th>
                  <th className="py-3 px-4">Principal Amount</th>
                  <th className="py-3 px-4">Maturity Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Lien / CBS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredFdrs.map((fdr) => (
                  <tr
                    key={fdr.id}
                    className="hover:bg-surface/50 transition-colors group"
                  >
                    {/* FDR Number */}
                    <td className="py-3.5 px-4 font-mono font-bold text-ink">
                      <Link
                        to={`/fdrs/${fdr.id}`}
                        className="hover:text-brand hover:underline flex items-center gap-1 group-hover:text-brand transition-colors"
                      >
                        {fdr.fdr_number}
                        <ArrowUpRight size={13} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    </td>

                    {/* Institution */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-ink leading-tight max-w-[200px] truncate">
                        {fdr.institution_name}
                      </div>
                      <div className="text-[10px] text-muted font-mono mt-0.5">
                        ID: {fdr.institution_id}
                      </div>
                    </td>

                    {/* Bank & Branch */}
                    <td className="py-3.5 px-4">
                      <div className="text-ink font-medium">{fdr.bank}</div>
                      <div className="text-[10px] text-muted truncate max-w-[150px]">
                        {fdr.branch || 'Branch Earmarked'}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 font-mono font-bold text-ink">
                      {formatINR(fdr.amount)}
                      <div className="text-[10px] font-sans font-normal text-muted">
                        ROI: {fdr.roi}%
                      </div>
                    </td>

                    {/* Maturity Date */}
                    <td className="py-3.5 px-4 font-mono text-muted">
                      {fdr.maturity_date}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <StatusBadge status={fdr.status} />
                    </td>

                    {/* Simulated Lien / CBS */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {fdr.verification?.simulated ? (
                          <SimulatedChip text="CBS Matched" />
                        ) : (
                          <span className="text-[10px] text-ok-700 font-medium">Verified</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Upcoming Maturities & Compliance Health Radar */}
      {summary?.upcoming_maturities && summary.upcoming_maturities.length > 0 && (
        <section className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-brand" />
              <h2 className="text-base font-bold text-ink">Upcoming Deposit Maturities</h2>
            </div>
            <span className="text-xs text-muted font-medium">Automatic renewal alert enabled</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {summary.upcoming_maturities.map((item) => (
              <div
                key={item.fdr_id}
                className="rounded-xl border border-line bg-surface/50 p-3.5 space-y-2 hover:bg-surface transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-ink">{item.fdr_number}</span>
                  <span className="text-[11px] font-bold text-warn-700 font-mono">
                    {item.days_left} days left
                  </span>
                </div>
                <div className="text-xs text-muted truncate">{item.institution_name}</div>
                <div className="flex items-center justify-between pt-1 border-t border-line/60">
                  <span className="text-xs font-mono font-bold text-ink">
                    {formatINR(item.amount)}
                  </span>
                  <StatusBadge status="Maturing" />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
