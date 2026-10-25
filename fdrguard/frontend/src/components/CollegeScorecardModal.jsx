import React from 'react'
import {
  X,
  Building2,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  FileCheck2,
  FileText,
  Mail,
  ExternalLink,
} from 'lucide-react'
import StatusBadge from './StatusBadge.jsx'
import SimulatedChip from './SimulatedChip.jsx'

function formatINR(val) {
  if (typeof val !== 'number') return '₹0'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val)
}

export default function CollegeScorecardModal({ institution, onClose }) {
  if (!institution) return null

  const isHealthy = institution.score >= 90
  const isReview = institution.score >= 75 && institution.score < 90
  const isDeficient = institution.score < 75

  // Scoring breakdown items
  const scoreBreakdown = [
    {
      category: 'Mandatory FDR Capital Base',
      points: '+40 / 40',
      description: 'Minimum statutory security deposit deposited with authorized scheduled commercial bank.',
      passed: true,
    },
    {
      category: 'AICTE Joint-Lien Endorsement',
      points: institution.score < 80 ? '-15 pts' : '+25 / 25',
      description:
        institution.score < 80
          ? 'Deficiency flagged: Missing official AICTE joint-holder endorsement stamp.'
          : 'Valid tripartite joint-holder lien agreement verified by branch manager.',
      passed: institution.score >= 80,
    },
    {
      category: 'CBS Core Banking System Synchronization',
      points: institution.score < 90 ? '-10 pts' : '+20 / 20',
      description:
        institution.score < 90
          ? 'Pending automated CBS ping confirmation or branch verification.'
          : 'Live API handshake confirmed earmarked security deposit.',
      passed: institution.score >= 90,
    },
    {
      category: 'Anti-Fraud & Duplicate Uniqueness',
      points: institution.flaggedIssues > 0 ? '-15 pts' : '+15 / 15',
      description:
        institution.flaggedIssues > 0
          ? `Collision alert: ${institution.flaggedIssues} active duplicate / conflict notification.`
          : 'Zero duplicate collisions detected across national registry.',
      passed: institution.flaggedIssues === 0,
    },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-ink/60 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="scorecard-modal-title"
    >
      <div className="relative w-full max-w-2xl rounded-2xl bg-card border border-line shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-surface/70">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-xs">
              <Building2 size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="scorecard-modal-title" className="text-base sm:text-lg font-bold text-ink">
                  Institutional Compliance Scorecard
                </h2>
                <SimulatedChip text="Algorithm v2.1" />
              </div>
              <div className="text-xs text-muted truncate max-w-sm mt-0.5">
                {institution.name} ({institution.id})
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-muted hover:text-ink hover:bg-surface border border-line cursor-pointer transition-colors"
            aria-label="Close Scorecard View"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Main Score Gauge Banner */}
          <div
            className={`rounded-2xl p-5 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              isHealthy
                ? 'bg-ok-50/70 border-ok-200'
                : isReview
                ? 'bg-warn-50/70 border-warn-200'
                : 'bg-bad-50/70 border-bad-200'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">
                  Overall Health Rating:
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    isHealthy
                      ? 'bg-ok-700 text-white'
                      : isReview
                      ? 'bg-warn-700 text-white'
                      : 'bg-bad-700 text-white'
                  }`}
                >
                  {institution.status}
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-ink">
                {institution.name}
              </h3>
              <p className="text-muted leading-relaxed">
                {isHealthy
                  ? 'All security deposit instruments are fully active, earmarked with AICTE joint liens, and validated via core banking.'
                  : isReview
                  ? 'Minor documentation or renewal gaps require officer advisory.'
                  : 'Critical non-compliance: missing joint-lien endorsement or duplicate certificate conflict detected.'}
              </p>
            </div>

            {/* Score Ring */}
            <div className="shrink-0 flex flex-col items-center justify-center p-3 rounded-2xl bg-card border border-line shadow-xs min-w-[110px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                Health Score
              </span>
              <span
                className={`text-3xl font-extrabold font-mono my-1 ${
                  isHealthy
                    ? 'text-ok-700'
                    : isReview
                    ? 'text-warn-700'
                    : 'text-bad-700'
                }`}
              >
                {institution.score}
                <span className="text-sm font-sans font-semibold">/100</span>
              </span>
              <span className="text-[10px] font-semibold text-muted">
                {isHealthy ? 'Optimal Standing' : isReview ? 'Action Required' : 'Deficient Escrow'}
              </span>
            </div>
          </div>

          {/* Key Institutional Numbers */}
          <div className="grid grid-cols-3 gap-3">
            <div className="card p-3 bg-surface/40 space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-muted font-bold">
                Active FDRs
              </span>
              <div className="text-lg font-bold font-mono text-ink">
                {institution.totalFDRs} Instrument{institution.totalFDRs === 1 ? '' : 's'}
              </div>
            </div>

            <div className="card p-3 bg-surface/40 space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-muted font-bold">
                Escrow Value
              </span>
              <div className="text-lg font-bold font-mono text-ink">
                {formatINR(institution.totalAmount)}
              </div>
            </div>

            <div className="card p-3 bg-surface/40 space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-muted font-bold">
                Flagged Issues
              </span>
              <div
                className={`text-lg font-bold font-mono ${
                  institution.flaggedIssues > 0 ? 'text-bad-700' : 'text-ok-700'
                }`}
              >
                {institution.flaggedIssues} Alert{institution.flaggedIssues === 1 ? '' : 's'}
              </div>
            </div>
          </div>

          {/* Point Deduction / Evaluation Breakdown */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-1.5">
              <TrendingUp size={14} className="text-brand" />
              <span>Score Component Breakdown</span>
            </h4>

            <div className="rounded-xl border border-line divide-y divide-line overflow-hidden bg-card">
              {scoreBreakdown.map((item, idx) => (
                <div key={idx} className="p-3.5 flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="font-bold text-ink flex items-center gap-1.5">
                      {item.passed ? (
                        <CheckCircle2 size={14} className="text-ok-700 shrink-0" />
                      ) : (
                        <AlertTriangle size={14} className="text-bad-700 shrink-0" />
                      )}
                      <span>{item.category}</span>
                    </div>
                    <p className="text-muted text-[11px] leading-tight pl-5">
                      {item.description}
                    </p>
                  </div>

                  <span
                    className={`font-mono font-bold text-xs shrink-0 ${
                      item.passed ? 'text-ok-700' : 'text-bad-700'
                    }`}
                  >
                    {item.points}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Next Steps */}
          <div className="card p-4 bg-info-50/50 border-info-200/60 space-y-2">
            <span className="font-bold text-ink flex items-center gap-1.5">
              <FileCheck2 size={14} className="text-brand" />
              <span>Recommended Remediation Protocol:</span>
            </span>
            <p className="text-muted text-[11px] leading-relaxed">
              {institution.score >= 90
                ? 'Institutional compliance is in excellent standing. Maintain scheduled annual renewal cycle.'
                : institution.score >= 75
                ? 'Issue automated notice to college accountant to submit updated CBS branch covering letter within 15 calendar days.'
                : 'Initiate formal scrutiny hearing: Request immediate physical attestation of security deposit from issuing bank branch.'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-line bg-surface/70 text-xs">
          <div className="flex items-center gap-2 text-muted font-mono text-[11px]">
            <ShieldCheck size={14} className="text-brand" />
            <span>AICTE Regulatory Compliance Engine</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost text-xs px-4 py-1.5"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
