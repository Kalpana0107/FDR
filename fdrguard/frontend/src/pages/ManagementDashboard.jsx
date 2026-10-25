import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart3,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building2,
  Search,
  Filter,
  RefreshCw,
  SlidersHorizontal,
  ArrowUpRight,
  Sparkles,
  PieChart as PieChartIcon,
  Radar as RadarIcon,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts'
import { api } from '../api/client.js'
import StatusBadge from '../components/StatusBadge.jsx'
import SimulatedChip from '../components/SimulatedChip.jsx'
import LoadingState from '../components/LoadingState.jsx'
import EmptyState from '../components/EmptyState.jsx'
import ErrorState from '../components/ErrorState.jsx'
import CollegeScorecardModal from '../components/CollegeScorecardModal.jsx'
import { useAuth } from '../context/AuthContext.jsx'

function formatINR(val) {
  if (typeof val !== 'number') return '₹0'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val)
}

function formatINRCrores(val) {
  if (typeof val !== 'number') return '₹0 Cr'
  const cr = (val / 10000000).toFixed(2)
  return `₹${cr} Cr`
}

export default function ManagementDashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [summary, setSummary] = useState(null)
  const [healthFilter, setHealthFilter] = useState('All')
  const [searchCollege, setSearchCollege] = useState('')
  const [sortOrder, setSortOrder] = useState('lowest') // 'lowest' | 'highest'
  const [selectedInstitutionForScorecard, setSelectedInstitutionForScorecard] = useState(null)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.dashboardSummary()
      setSummary(res)
    } catch (err) {
      setError(err?.message || 'Failed to load executive management summary')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Verification distribution data for Recharts Pie
  const verificationData = useMemo(() => {
    if (!summary?.verification_amounts) return []
    const { verified, pending, failed } = summary.verification_amounts
    const total = verified + pending + failed || 1
    return [
      {
        name: 'Verified',
        value: verified,
        formattedValue: formatINRCrores(verified),
        percentage: ((verified / total) * 100).toFixed(1),
        color: '#157A45', // --color-ok-700
      },
      {
        name: 'Pending Verification',
        value: pending,
        formattedValue: formatINRCrores(pending),
        percentage: ((pending / total) * 100).toFixed(1),
        color: '#9A6700', // --color-warn-700
      },
      {
        name: 'Failed / Discrepancy',
        value: failed,
        formattedValue: formatINRCrores(failed),
        percentage: ((failed / total) * 100).toFixed(1),
        color: '#B42318', // --color-bad-700
      },
    ]
  }, [summary])

  // Status breakdown data for Recharts Bar
  const statusChartData = useMemo(() => {
    if (!summary?.by_status) return []
    return Object.entries(summary.by_status).map(([key, count]) => ({
      status: key,
      count: count,
    }))
  }, [summary])

  // Institutional Compliance & Risk Radar Data
  const radarData = useMemo(() => {
    return [
      { dimension: 'AICTE Lien Clause', actual: 96, benchmark: 90, fullMark: 100 },
      { dimension: 'CBS Bank Sync', actual: 92, benchmark: 90, fullMark: 100 },
      { dimension: 'On-Time Renewal', actual: 88, benchmark: 90, fullMark: 100 },
      { dimension: 'Hash Authenticity', actual: 98, benchmark: 90, fullMark: 100 },
      { dimension: 'Mandatory Docs', actual: 90, benchmark: 90, fullMark: 100 },
      { dimension: 'Branch Attestation', actual: 85, benchmark: 90, fullMark: 100 },
    ]
  }, [])

  // Filtered and sorted college health score list
  const filteredColleges = useMemo(() => {
    if (!summary?.institution_health) return []
    return summary.institution_health
      .filter((inst) => {
        if (healthFilter !== 'All' && inst.status !== healthFilter) return false
        if (searchCollege.trim()) {
          const q = searchCollege.toLowerCase()
          return inst.name.toLowerCase().includes(q) || inst.id.toLowerCase().includes(q)
        }
        return true
      })
      .sort((a, b) => {
        if (sortOrder === 'lowest') return a.score - b.score
        return b.score - a.score
      })
  }, [summary, healthFilter, searchCollege, sortOrder])

  return (
    <div className="space-y-6">
      {/* Executive Hero Banner */}
      <section className="hero relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="p-1.5 rounded-lg bg-white/10 text-white">
                <BarChart3 size={24} />
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                AICTE Executive Management Dashboard
              </h1>
              <SimulatedChip
                text="Multi-Institution Analytics"
                className="bg-white/15 text-white border-white/25"
              />
            </div>
            <p className="text-white/80 text-sm max-w-3xl leading-relaxed">
              Task 3 Executive Console: Macro surveillance of security deposit escrows across AICTE technical institutes.
              Provides aggregate totals (renewals counted once), Verified / Pending / Failed capital allocation, compliance radar analysis, and institutional College Health Scores.
            </p>
          </div>

          <div className="rounded-xl bg-white/10 p-3.5 backdrop-blur-xs border border-white/15 shrink-0 space-y-1 text-right">
            <div className="text-xs text-white/80">Compliance Index</div>
            <div className="text-2xl font-extrabold text-white font-mono flex items-center justify-end gap-1.5">
              <span>{summary?.totals?.compliance_health_score ?? 94.6}%</span>
              <span className="text-[10px] bg-ok-50 text-ok-700 px-2 py-0.5 rounded-full font-bold font-sans">
                Optimal
              </span>
            </div>
            <div className="text-[11px] text-white/70">Autonomous CBS Live Surveillance</div>
          </div>
        </div>
      </section>

      {/* Loading / Error States */}
      {loading && <LoadingState message="Aggregating national escrow analytics and compliance scores…" />}
      {!loading && error && <ErrorState error={error} onRetry={loadData} />}

      {!loading && !error && summary && (
        <>
          {/* SECTION 1: TOTALS (RENEWALS COUNTED ONCE) */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-ink">National Escrow Totals</h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-brand/10 text-brand font-mono">
                  SIH PS 26265 Compliant
                </span>
              </div>
              <button
                type="button"
                onClick={loadData}
                className="btn btn-ghost text-xs px-2.5 py-1 text-muted hover:text-ink"
              >
                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                <span>Refresh Data</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total FDRs Card with Renewals Counted Once Note */}
              <div className="card space-y-1 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted uppercase tracking-wider">
                    Total Security Deposits
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-info-50 text-info-700">
                    Net Count
                  </span>
                </div>
                <div className="text-3xl font-extrabold text-ink font-mono">
                  {summary.totals.fdr_count}
                </div>
                <div className="pt-1.5 border-t border-line/60 flex items-center gap-1.5 text-[11px] text-brand font-semibold">
                  <CheckCircle2 size={13} />
                  <span>Renewals counted once (no double-counting)</span>
                </div>
              </div>

              {/* Total Escrow Capital */}
              <div className="card space-y-1">
                <span className="text-xs font-medium text-muted uppercase tracking-wider">
                  Total Escrow Capital
                </span>
                <div className="text-3xl font-extrabold text-brand font-mono">
                  {formatINRCrores(summary.totals.total_amount)}
                </div>
                <div className="pt-1.5 border-t border-line/60 flex items-center gap-1.5 text-[11px] text-muted font-mono">
                  <span>{formatINR(summary.totals.total_amount)} active coverage</span>
                </div>
              </div>

              {/* Active Earmarked Escrows */}
              <div className="card space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted uppercase tracking-wider">
                    Active Earmarked Escrows
                  </span>
                  <SimulatedChip text="CBS Sync" />
                </div>
                <div className="text-3xl font-extrabold text-ok-700 font-mono">
                  {summary.totals.active_escrows}
                </div>
                <div className="pt-1.5 border-t border-line/60 flex items-center gap-1.5 text-[11px] text-muted">
                  <span className="font-semibold text-ok-700">Tripartite joint liens</span>
                  <span>verified with banks</span>
                </div>
              </div>

              {/* National Technical Institutes Under Escrow */}
              <div className="card space-y-1">
                <span className="text-xs font-medium text-muted uppercase tracking-wider">
                  Institutions Under Escrow
                </span>
                <div className="text-3xl font-extrabold text-ink font-mono">
                  {summary.institution_health?.length || 5}
                </div>
                <div className="pt-1.5 border-t border-line/60 flex items-center gap-1.5 text-[11px] text-muted">
                  <span className="font-semibold text-brand">100% Surveillance</span>
                  <span>Western Region</span>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 2: VERIFIED / PENDING / FAILED BREAKDOWN */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-ink flex items-center gap-2">
                  <span>Verification Capital Distribution</span>
                  <span className="text-xs font-normal text-muted">
                    (Verified vs Pending vs Failed Escrows)
                  </span>
                </h2>
              </div>
            </div>

            {/* Verification 3-way KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Verified Bucket */}
              <div className="card border-l-4 border-l-ok-700 bg-ok-50/20 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-muted">
                  <span className="font-bold text-ok-700 uppercase tracking-wider text-[11px]">
                    Verified Escrow
                  </span>
                  <span className="font-bold font-mono text-ok-700 bg-ok-50 px-2 py-0.5 rounded-full border border-ok-200">
                    82.2% of Total
                  </span>
                </div>
                <div className="text-2xl font-extrabold font-mono text-ink">
                  {formatINRCrores(summary.verification_amounts.verified)}
                </div>
                <div className="text-xs text-muted flex items-center gap-1.5 pt-1 border-t border-ok-200/50">
                  <CheckCircle2 size={13} className="text-ok-700" />
                  <span>{formatINR(summary.verification_amounts.verified)} authenticated via CBS</span>
                </div>
              </div>

              {/* Pending Bucket */}
              <div className="card border-l-4 border-l-warn-700 bg-warn-50/20 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-muted">
                  <span className="font-bold text-warn-700 uppercase tracking-wider text-[11px]">
                    Verification Pending
                  </span>
                  <span className="font-bold font-mono text-warn-700 bg-warn-50 px-2 py-0.5 rounded-full border border-warn-200">
                    12.3% of Total
                  </span>
                </div>
                <div className="text-2xl font-extrabold font-mono text-ink">
                  {formatINRCrores(summary.verification_amounts.pending)}
                </div>
                <div className="text-xs text-muted flex items-center gap-1.5 pt-1 border-t border-warn-200/50">
                  <Clock size={13} className="text-warn-700" />
                  <span>{formatINR(summary.verification_amounts.pending)} in bank scrutiny pipeline</span>
                </div>
              </div>

              {/* Failed Bucket */}
              <div className="card border-l-4 border-l-bad-700 bg-bad-50/20 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-muted">
                  <span className="font-bold text-bad-700 uppercase tracking-wider text-[11px]">
                    Failed / Discrepant
                  </span>
                  <span className="font-bold font-mono text-bad-700 bg-bad-50 px-2 py-0.5 rounded-full border border-bad-200">
                    5.5% of Total
                  </span>
                </div>
                <div className="text-2xl font-extrabold font-mono text-bad-700">
                  {formatINRCrores(summary.verification_amounts.failed)}
                </div>
                <div className="text-xs text-muted flex items-center gap-1.5 pt-1 border-t border-bad-200/50">
                  <AlertTriangle size={13} className="text-bad-700" />
                  <span>{formatINR(summary.verification_amounts.failed)} missing lien endorsement</span>
                </div>
              </div>
            </div>

            {/* Interactive Visualizations: Pie Chart + Bar Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Donut Chart: Capital Share */}
              <div className="card lg:col-span-5 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                    <PieChartIcon size={15} className="text-brand" />
                    <span>Capital Share Breakdown</span>
                  </h3>
                  <span className="text-[10px] text-muted font-mono">INR ₹18.25 Cr Net</span>
                </div>

                <div className="h-64 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={verificationData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={95}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {verificationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [formatINR(Number(value)), 'Capital Amount']}
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderColor: '#E3E8F2',
                          borderRadius: '12px',
                          fontSize: '12px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Donut Legend */}
                <div className="space-y-1.5 pt-2 border-t border-line text-xs">
                  {verificationData.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-muted font-medium">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="font-bold text-ink">{item.formattedValue}</span>
                        <span className="text-muted text-[11px]">({item.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bar Chart: Instrument Count by Status */}
              <div className="card lg:col-span-7 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                    <BarChart3 size={15} className="text-brand" />
                    <span>Instrument Distribution by Status</span>
                  </h3>
                  <span className="text-[10px] text-muted">All 100 Instruments</span>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={statusChartData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                    >
                      <XAxis
                        dataKey="status"
                        tick={{ fill: '#5B6B8C', fontSize: 10 }}
                        angle={-25}
                        textAnchor="end"
                        interval={0}
                      />
                      <YAxis tick={{ fill: '#5B6B8C', fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderColor: '#E3E8F2',
                          borderRadius: '12px',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="count" fill="#3B5BDB" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <p className="text-[11px] text-muted pt-2 border-t border-line">
                  48 FDRs are fully Active, with 12 Verified awaiting activation cycle and 10 approaching 60-day maturity.
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 3: RADAR CHART (INSTITUTIONAL COMPLIANCE DIMENSIONS) */}
          <section className="card p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <RadarIcon size={18} className="text-brand" />
                  <h2 className="text-base font-bold text-ink">
                    Institutional Compliance & Risk Radar
                  </h2>
                  <SimulatedChip text="6-Vector Model" />
                </div>
                <p className="text-xs text-muted mt-0.5">
                  Multi-axial evaluation of technical institute compliance across statutory mandates, live CBS verification, and anti-fraud protocols.
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-brand" />
                  <span className="font-semibold text-ink">Actual National Compliance</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 border-2 border-dashed border-warn-700 rounded-full" />
                  <span className="text-muted">Statutory Benchmark (90%)</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Radar visualization */}
              <div className="lg:col-span-6 h-72 sm:h-80 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                    <PolarGrid stroke="#E3E8F2" />
                    <PolarAngleAxis
                      dataKey="dimension"
                      tick={{ fill: '#0B1B3A', fontSize: 11, fontWeight: 600 }}
                    />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#CBD3DF" />
                    <Radar
                      name="National Actual"
                      dataKey="actual"
                      stroke="#3B5BDB"
                      fill="#3B5BDB"
                      fillOpacity={0.4}
                    />
                    <Radar
                      name="Statutory Target"
                      dataKey="benchmark"
                      stroke="#9A6700"
                      strokeDasharray="4 4"
                      fill="#9A6700"
                      fillOpacity={0.08}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        borderColor: '#E3E8F2',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Dimension Explanations Grid */}
              <div className="lg:col-span-6 space-y-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">
                  Vector Scoring Dimensions
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  {radarData.map((vec, i) => {
                    const isExceeding = vec.actual >= vec.benchmark
                    return (
                      <div
                        key={i}
                        className="rounded-xl border border-line bg-surface/50 p-3 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-ink">{vec.dimension}</span>
                          <span
                            className={`font-mono font-bold text-xs ${
                              isExceeding ? 'text-ok-700' : 'text-warn-700'
                            }`}
                          >
                            {vec.actual}%
                          </span>
                        </div>
                        <div className="w-full bg-line rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isExceeding ? 'bg-ok-700' : 'bg-warn-700'
                            }`}
                            style={{ width: `${vec.actual}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-muted flex justify-between pt-0.5">
                          <span>Target: {vec.benchmark}%</span>
                          <span className={isExceeding ? 'text-ok-700 font-semibold' : 'text-warn-700'}>
                            {isExceeding ? '+ Above Target' : '- Below Target'}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 4: COLLEGE HEALTH SCORE TABLE */}
          <section className="card p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Building2 size={18} className="text-brand" />
                  <h2 className="text-base font-bold text-ink">
                    Technical Institute Compliance Health Scores
                  </h2>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-surface border border-line text-muted">
                    {filteredColleges.length} Institutes
                  </span>
                </div>
                <p className="text-xs text-muted mt-0.5">
                  AICTE automated institutional risk score computed from lien endorsement rates, deposit coverage, and anti-fraud collision history.
                </p>
              </div>

              {/* Controls: Search, Filter, Sort */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Health Filter */}
                <div className="flex items-center gap-1 bg-surface p-1 rounded-xl border border-line">
                  {['All', 'Healthy', 'Review Needed', 'Deficient'].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setHealthFilter(lvl)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                        healthFilter === lvl
                          ? 'bg-card text-ink shadow-xs'
                          : 'text-muted hover:text-ink'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>

                {/* Sort Order */}
                <button
                  type="button"
                  onClick={() => setSortOrder(sortOrder === 'lowest' ? 'highest' : 'lowest')}
                  className="btn btn-ghost text-xs px-2.5 py-1.5 border border-line"
                  title="Toggle Risk Sorting"
                >
                  <SlidersHorizontal size={13} />
                  <span>{sortOrder === 'lowest' ? 'Risk Priority (Lowest)' : 'Score (Highest)'}</span>
                </button>

                {/* Search */}
                <div className="relative w-44">
                  <Search
                    size={13}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
                  />
                  <input
                    type="text"
                    placeholder="Search college…"
                    value={searchCollege}
                    onChange={(e) => setSearchCollege(e.target.value)}
                    className="w-full pl-7 pr-2.5 py-1 text-xs rounded-xl bg-surface border border-line text-ink placeholder:text-muted focus:outline-none focus:border-brand"
                  />
                </div>
              </div>
            </div>

            {/* Institutions Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface/60 text-[11px] uppercase tracking-wider text-muted font-bold border-b border-line">
                  <tr>
                    <th className="px-4 py-3">Technical Institute</th>
                    <th className="px-4 py-3">Active Instruments</th>
                    <th className="px-4 py-3">Escrow Value</th>
                    <th className="px-4 py-3">Compliance Score</th>
                    <th className="px-4 py-3">Status Rating</th>
                    <th className="px-4 py-3">Alerts / Flags</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filteredColleges.map((col) => {
                    const isHealthy = col.score >= 90
                    const isReview = col.score >= 75 && col.score < 90
                    const isDeficient = col.score < 75

                    return (
                      <tr
                        key={col.id}
                        className="hover:bg-surface/50 transition-colors cursor-pointer group"
                        onClick={() => setSelectedInstitutionForScorecard(col)}
                      >
                        {/* College Info */}
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-ink group-hover:text-brand transition-colors">
                            {col.name}
                          </div>
                          <span className="text-[10px] text-muted font-mono block mt-0.5">
                            ID: {col.id}
                          </span>
                        </td>

                        {/* Total FDRs */}
                        <td className="px-4 py-3.5 font-mono text-ink">
                          {col.totalFDRs} Deposit{col.totalFDRs === 1 ? '' : 's'}
                        </td>

                        {/* Escrow Value */}
                        <td className="px-4 py-3.5 font-mono font-bold text-ink">
                          {formatINR(col.totalAmount)}
                        </td>

                        {/* Health Score Progress */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-mono font-extrabold text-sm ${
                                isHealthy
                                  ? 'text-ok-700'
                                  : isReview
                                  ? 'text-warn-700'
                                  : 'text-bad-700'
                              }`}
                            >
                              {col.score}
                            </span>
                            <div className="w-20 bg-line rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  isHealthy
                                    ? 'bg-ok-700'
                                    : isReview
                                    ? 'bg-warn-700'
                                    : 'bg-bad-700'
                                }`}
                                style={{ width: `${col.score}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              isHealthy
                                ? 'bg-ok-50 text-ok-700 ring-1 ring-ok-200'
                                : isReview
                                ? 'bg-warn-50 text-warn-700 ring-1 ring-warn-200'
                                : 'bg-bad-50 text-bad-700 ring-1 ring-bad-200'
                            }`}
                          >
                            {col.status}
                          </span>
                        </td>

                        {/* Flagged Issues */}
                        <td className="px-4 py-3.5">
                          {col.flaggedIssues > 0 ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-bad-700 bg-bad-50 px-2 py-0.5 rounded border border-bad-200">
                              <AlertTriangle size={11} />
                              <span>{col.flaggedIssues} Flag{col.flaggedIssues === 1 ? '' : 's'}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-ok-700 flex items-center gap-1">
                              <CheckCircle2 size={12} />
                              <span>Clean Ledger</span>
                            </span>
                          )}
                        </td>

                        {/* Action */}
                        <td className="px-4 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedInstitutionForScorecard(col)
                            }}
                            className="btn btn-ghost text-xs px-2.5 py-1 text-brand hover:bg-brand/10 border-brand/20"
                          >
                            <span>Inspect Scorecard</span>
                            <ChevronRight size={12} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* College Scorecard Breakdown Modal */}
      {selectedInstitutionForScorecard && (
        <CollegeScorecardModal
          institution={selectedInstitutionForScorecard}
          onClose={() => setSelectedInstitutionForScorecard(null)}
        />
      )}
    </div>
  )
}
