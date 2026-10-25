import React, { useState } from 'react'
import {
  X,
  FileCheck,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Send,
} from 'lucide-react'
import StatusBadge from './StatusBadge.jsx'
import SimulatedChip from './SimulatedChip.jsx'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'

function formatINR(val) {
  if (typeof val !== 'number') return '₹0'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val)
}

export default function ReleaseReviewModal({ release, onClose, onUpdated }) {
  const { user } = useAuth()
  const [notes, setNotes] = useState(
    'Compliance scrutiny completed. All defect liability clauses satisfied. Zero fee arrears or pending litigation on record. Recommended for release.',
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  if (!release) return null

  const handleReview = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const reviewerId = user?.id || 'u_officer'
      const reviewerName = user?.name ? `${user.name} (AICTE Officer)` : 'Anita Deshmukh (AICTE Officer)'
      const updated = await api.reviewRelease(release.id, notes, reviewerId, reviewerName)
      if (onUpdated) onUpdated(updated)
      onClose()
    } catch (err) {
      setError(err?.message || 'Failed to submit review recommendation')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-ink/60 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
    >
      <div className="relative w-full max-w-xl rounded-2xl bg-card border border-line shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-surface/70">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-xs">
              <FileCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="review-modal-title" className="text-base sm:text-lg font-bold text-ink">
                  Officer Release Review (Key 1)
                </h2>
                <SimulatedChip text="Two-Person Rule" />
              </div>
              <div className="text-xs text-muted font-mono mt-0.5">
                Release Request: <strong>{release.id.toUpperCase()}</strong> • FDR: {release.fdr_number}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-muted hover:text-ink hover:bg-surface border border-line cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {error && (
            <div className="p-3.5 rounded-xl bg-bad-50 border border-bad-200 text-bad-800 font-semibold flex items-center gap-2">
              <AlertTriangle size={15} className="text-bad-700 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Instrument Context Card */}
          <div className="rounded-xl border border-line bg-surface/50 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-bold text-ink flex items-center gap-2">
                <Building2 size={16} className="text-brand shrink-0" />
                <span>{release.institution_name}</span>
              </div>
              <StatusBadge status={release.status} />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-line/60">
              <div>
                <span className="text-[10px] text-muted">Bank & Branch:</span>
                <div className="font-semibold text-ink">{release.bank}</div>
              </div>
              <div>
                <span className="text-[10px] text-muted">Deposit Principal:</span>
                <div className="font-mono font-bold text-ink">{formatINR(release.amount)}</div>
              </div>
            </div>

            <div className="pt-1 text-[11px] text-muted">
              <span className="font-semibold text-ink">College Release Reason: </span>
              <span>{release.reason}</span>
            </div>
          </div>

          {/* Review Protocol Advisory */}
          <div className="card p-3.5 bg-info-50/50 border-info-200/60 space-y-1">
            <span className="font-bold text-ink flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-brand" />
              <span>Two-Person Statutory Separation:</span>
            </span>
            <p className="text-muted leading-relaxed text-[11px]">
              As the Scrutiny Officer (Reviewer), your digital recommendation certifies that the technical institute has satisfied tenure requirements. Final release execution requires a distinct Approver signature with dual-key OTP authorization.
            </p>
          </div>

          {/* Review Notes Input */}
          <div className="space-y-1.5">
            <label htmlFor="review-notes-input" className="font-bold text-ink block">
              Officer Compliance Scrutiny Recommendation:
            </label>
            <textarea
              id="review-notes-input"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter compliance verification findings..."
              className="w-full p-3 rounded-xl bg-card border border-line text-ink text-xs focus:outline-none focus:border-brand"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-line bg-surface/70">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost text-xs px-4 py-1.5"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={submitting || !notes.trim()}
            onClick={handleReview}
            className="btn btn-primary text-xs px-4 py-2 shadow-xs"
          >
            <Send size={13} />
            <span>{submitting ? 'Submitting Review…' : 'Sign & Recommend for Release'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
