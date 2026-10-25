import React, { useState } from 'react'
import {
  X,
  ShieldAlert,
  Building2,
  FileText,
  Fingerprint,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  Clock,
  ArrowRight,
  ShieldCheck,
  Send,
  Ban,
  FileWarning,
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

export default function DuplicateDetailModal({ duplicate, onClose, onResolve }) {
  const [copiedHash, setCopiedHash] = useState(false)
  const [officerNotes, setOfficerNotes] = useState('')
  const [submittingAction, setSubmittingAction] = useState(false)
  const [actionDone, setActionDone] = useState(null)

  if (!duplicate) return null

  const isCritical = duplicate.severity === 'Critical' || duplicate.severity === 'High'
  const fileHash =
    duplicate.file_hash ||
    '7c9e8b2f1a043e9d821045fbca3792ef9a12bc4438df920193bbcc8192039102'

  const handleCopyHash = () => {
    navigator.clipboard.writeText(fileHash)
    setCopiedHash(true)
    setTimeout(() => setCopiedHash(false), 2000)
  }

  const handleExecuteAction = (actionTitle, statusFlag) => {
    setSubmittingAction(true)
    setTimeout(() => {
      setActionDone(`Action "${actionTitle}" executed and logged in compliance ledger.`)
      setSubmittingAction(false)
      if (onResolve) {
        onResolve(duplicate.id, actionTitle, statusFlag, officerNotes)
      }
      setTimeout(() => {
        onClose()
      }, 1500)
    }, 400)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-ink/60 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dup-detail-modal-title"
    >
      <div className="relative w-full max-w-4xl rounded-2xl bg-card border border-line shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-surface/70">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-xs ${
                isCritical ? 'bg-bad-700' : 'bg-warn-700'
              }`}
            >
              <ShieldAlert size={20} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 id="dup-detail-modal-title" className="text-base sm:text-lg font-bold text-ink">
                  Duplicate Collision Investigation
                </h2>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    isCritical ? 'bg-bad-100 text-bad-800' : 'bg-warn-100 text-warn-800'
                  }`}
                >
                  {duplicate.severity} Risk
                </span>
                <SimulatedChip text="Anti-Fraud Engine" />
              </div>
              <div className="text-xs text-muted font-mono mt-0.5">
                Incident Ref: <strong>{duplicate.id.toUpperCase()}</strong> • Confidence:{' '}
                <strong className="text-ink">{duplicate.similarity_score}% Match</strong>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-muted hover:text-ink hover:bg-surface border border-line cursor-pointer transition-colors"
            aria-label="Close Investigation Modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {actionDone && (
            <div className="p-3.5 rounded-xl bg-ok-50 border border-ok-200 text-ok-800 font-semibold flex items-center gap-2">
              <CheckCircle2 size={16} className="text-ok-700 shrink-0" />
              <span>{actionDone}</span>
            </div>
          )}

          {/* Incident Overview Card */}
          <div className="card bg-bad-50/40 border-bad-200/80 p-4 space-y-2">
            <div className="flex items-start gap-2 text-ink">
              <FileWarning size={16} className="text-bad-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-bad-900">Fraud Collision Signature: </span>
                <span className="text-ink font-semibold">{duplicate.duplicate_type}</span>
                <p className="text-muted mt-1 leading-relaxed">
                  {duplicate.detection_reason}
                </p>
              </div>
            </div>
          </div>

          {/* Cryptographic SHA-256 Hash Box */}
          <div className="card p-4 space-y-2 bg-surface/50 border-line">
            <div className="flex items-center justify-between text-muted">
              <span className="font-bold uppercase tracking-wider text-[10px] text-ink flex items-center gap-1.5">
                <Fingerprint size={13} className="text-brand" />
                <span>Uploaded Document SHA-256 Checksum</span>
              </span>
              <button
                type="button"
                onClick={handleCopyHash}
                className="btn btn-ghost text-[10px] px-2 py-0.5 flex items-center gap-1 text-brand border-brand/20"
              >
                {copiedHash ? <Check size={11} className="text-ok-700" /> : <Copy size={11} />}
                <span>{copiedHash ? 'Copied!' : 'Copy Hash'}</span>
              </button>
            </div>
            <div className="p-2.5 rounded-lg bg-card border border-line font-mono text-[11px] text-ink break-all select-all">
              {fileHash}
            </div>
            <p className="text-[10px] text-muted">
              Both institutions provided files that produce identical cryptographic digest signatures upon portal upload.
            </p>
          </div>

          {/* Side-by-Side Institution Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Institution A */}
            <div className="rounded-2xl border border-line bg-card p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted bg-surface px-2 py-0.5 rounded border border-line">
                  Institution A (First Ingest)
                </span>
                <StatusBadge status={duplicate.institution_a?.status || 'Submitted'} />
              </div>

              <div>
                <div className="font-bold text-sm text-ink flex items-center gap-1.5">
                  <Building2 size={16} className="text-brand shrink-0" />
                  <span>{duplicate.institution_a?.name}</span>
                </div>
                <div className="text-[10px] text-muted font-mono mt-0.5">
                  Application ID: {duplicate.institution_a?.application_id || 'APP-2025-000101'}
                </div>
              </div>

              <div className="divide-y divide-line/70 text-xs pt-1">
                <div className="py-2 flex justify-between">
                  <span className="text-muted">Issuing Bank:</span>
                  <span className="font-semibold text-ink">{duplicate.institution_a?.bank}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-muted">Deposit Principal:</span>
                  <span className="font-mono font-bold text-ink">
                    {formatINR(duplicate.institution_a?.amount)}
                  </span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-muted">Uploaded File:</span>
                  <span className="font-mono text-muted truncate max-w-[180px]">
                    {duplicate.institution_a?.filename || 'Receipt_A.pdf'}
                  </span>
                </div>
              </div>
            </div>

            {/* Institution B */}
            <div className="rounded-2xl border border-bad/30 bg-bad-50/20 p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-bad bg-bad-50 px-2 py-0.5 rounded border border-bad/30">
                  Institution B (Conflicting Reuse)
                </span>
                <StatusBadge status={duplicate.institution_b?.status || 'Under Review'} />
              </div>

              <div>
                <div className="font-bold text-sm text-ink flex items-center gap-1.5">
                  <Building2 size={16} className="text-bad-700 shrink-0" />
                  <span>{duplicate.institution_b?.name}</span>
                </div>
                <div className="text-[10px] text-muted font-mono mt-0.5">
                  Application ID: {duplicate.institution_b?.application_id || 'APP-2025-000102'}
                </div>
              </div>

              <div className="divide-y divide-bad/20 text-xs pt-1">
                <div className="py-2 flex justify-between">
                  <span className="text-muted">Issuing Bank:</span>
                  <span className="font-semibold text-ink">{duplicate.institution_b?.bank}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-muted">Deposit Principal:</span>
                  <span className="font-mono font-bold text-ink">
                    {formatINR(duplicate.institution_b?.amount)}
                  </span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-muted">Uploaded File:</span>
                  <span className="font-mono text-bad-700 truncate max-w-[180px]">
                    {duplicate.institution_b?.filename || 'Receipt_B.pdf'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Suggested Resolution & Officer Notes */}
          <div className="card p-4 space-y-3 bg-surface/60 border-line">
            <div className="flex items-start gap-2">
              <AlertTriangle size={15} className="text-warn-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-ink">Suggested Anti-Fraud Protocol:</span>
                <p className="text-muted mt-0.5">{duplicate.suggested_action}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-line/60 space-y-1.5">
              <label htmlFor="dup-officer-notes" className="text-xs font-bold text-ink block">
                Officer Enforcement Notes:
              </label>
              <textarea
                id="dup-officer-notes"
                rows={2}
                value={officerNotes}
                onChange={(e) => setOfficerNotes(e.target.value)}
                placeholder="Enter regulatory reasoning or show-cause notice directives to attach to this incident dossier…"
                className="w-full p-2.5 rounded-xl bg-card border border-line text-xs text-ink placeholder:text-muted focus:outline-none focus:border-brand"
              />
            </div>
          </div>
        </div>

        {/* Footer with Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-line bg-surface/70">
          <div className="text-[11px] text-muted font-mono">
            Enforcement Desk: AICTE Western Region
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={submittingAction}
              onClick={() => handleExecuteAction('Dismiss as False Positive', 'Resolved')}
              className="btn btn-ghost text-xs px-3 py-1.5 border-line"
            >
              Mark False Positive
            </button>

            <button
              type="button"
              disabled={submittingAction}
              onClick={() => handleExecuteAction('Request Physical Attestation', 'Under Investigation')}
              className="btn btn-ghost text-xs px-3 py-1.5 border-brand/30 text-brand"
            >
              Request Bank Attestation
            </button>

            <button
              type="button"
              disabled={submittingAction}
              onClick={() => handleExecuteAction('Issue Show-Cause Notice', 'Show-Cause Issued')}
              className="btn btn-primary text-xs px-3 py-1.5 shadow-xs"
            >
              Issue Show-Cause Notice
            </button>

            <button
              type="button"
              disabled={submittingAction}
              onClick={() => handleExecuteAction('Hold Both Applications', 'Frozen / Hold')}
              className="btn btn-danger text-xs px-3.5 py-1.5"
            >
              <Ban size={13} />
              <span>Hold Both Applications</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
