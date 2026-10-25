import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  X,
  ShieldCheck,
  Building2,
  AlertTriangle,
  CheckCircle2,
  KeyRound,
  QrCode,
  ArrowRight,
  Sparkles,
  Lock,
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

export default function ReleaseApproveModal({ release, onClose, onUpdated }) {
  const { user } = useAuth()
  const [approverName, setApproverName] = useState('Prof. K. Venkatesh (Approver)')
  const [approverId, setApproverId] = useState('u_approver')
  const [otp, setOtp] = useState('849201') // Pre-filled simulated OTP for demo
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [approvedRelease, setApprovedRelease] = useState(null)

  if (!release) return null

  // Two-person rule check: Reviewer cannot be Approver
  const isSelfApproval = release.reviewer_id && release.reviewer_id === approverId

  const handleApprove = async () => {
    if (isSelfApproval) {
      setError('Two-Person Rule Violation: Approver cannot be the same persona as Reviewer.')
      return
    }
    if (!otp || otp.length < 4) {
      setError('Please provide a valid 6-digit cryptographic OTP.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const updated = await api.approveRelease(release.id, approverId, approverName, otp)
      setApprovedRelease(updated)
      if (onUpdated) onUpdated(updated)
    } catch (err) {
      setError(err?.message || 'Failed to approve release request')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-ink/60 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="approve-modal-title"
    >
      <div className="relative w-full max-w-xl rounded-2xl bg-card border border-line shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-surface/70">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ok-700 text-white shadow-xs">
              <KeyRound size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="approve-modal-title" className="text-base sm:text-lg font-bold text-ink">
                  Dual-Key Approval Sign-Off (Key 2)
                </h2>
                <SimulatedChip text="Member Secretary" />
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

          {/* Success Result View */}
          {approvedRelease ? (
            <div className="space-y-4 animate-in fade-in text-center py-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ok-50 text-ok-700 ring-8 ring-ok-100 mx-auto">
                <CheckCircle2 size={32} />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-ink">
                  Security Deposit Release Approved!
                </h3>
                <p className="text-muted leading-relaxed max-w-md mx-auto">
                  Cryptographic dual-key approval successfully recorded. AICTE lien endorsement has been discharged and the immutable QR release receipt generated.
                </p>
              </div>

              {/* Release Hash Box */}
              <div className="card p-3 bg-surface/60 border-line text-left space-y-1 font-mono text-[11px]">
                <span className="text-[10px] uppercase font-bold text-muted font-sans block">
                  Cryptographic Release Hash:
                </span>
                <span className="text-brand font-bold break-all select-all block">
                  {approvedRelease.release_hash}
                </span>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                <Link
                  to={`/verify-receipt?hash=${approvedRelease.release_hash}`}
                  className="btn btn-primary text-xs px-4 py-2 flex items-center gap-2 shadow-xs w-full sm:w-auto"
                >
                  <QrCode size={14} />
                  <span>View Boarding-Pass QR Receipt</span>
                </Link>

                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-ghost text-xs px-4 py-2 w-full sm:w-auto"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <>
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
                    <span className="text-[10px] text-muted">Released Principal:</span>
                    <div className="font-mono font-bold text-ink">{formatINR(release.amount)}</div>
                  </div>
                </div>

                {/* Key 1 Reviewer Proof */}
                <div className="pt-2 border-t border-line/60 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-ok-700 flex items-center gap-1">
                      <CheckCircle2 size={12} /> Key 1 Verified by Scrutiny Reviewer:
                    </span>
                    <span className="text-muted font-mono">{release.reviewed_at ? new Date(release.reviewed_at).toLocaleDateString() : 'Recent'}</span>
                  </div>
                  <div className="font-semibold text-ink">{release.reviewer_name || 'Anita Deshmukh (AICTE Officer)'}</div>
                  <p className="text-[11px] text-muted italic">"{release.reviewer_notes || 'All compliance checks verified.'}"</p>
                </div>
              </div>

              {/* Two-Person Rule Banner */}
              <div className="card p-3.5 bg-warn-50/40 border-warn-200/80 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-ink text-xs">
                  <Lock size={14} className="text-warn-700" />
                  <span>Two-Person Rule Validation</span>
                </div>
                <p className="text-muted leading-relaxed text-[11px]">
                  Statute mandates that Key 2 Approver cannot match Key 1 Reviewer ({release.reviewer_name || 'Anita Deshmukh'}).
                </p>
              </div>

              {/* Approver Identity Selector */}
              <div className="space-y-1.5">
                <label className="font-bold text-ink block">Signing Approver Identity:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setApproverId('u_approver')
                      setApproverName('Prof. K. Venkatesh (Approver)')
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                      approverId === 'u_approver'
                        ? 'border-brand bg-brand/5 text-brand ring-1 ring-brand/30'
                        : 'border-line bg-card text-ink hover:bg-surface'
                    }`}
                  >
                    <div className="font-bold text-xs">Prof. K. Venkatesh</div>
                    <div className="text-[10px] text-muted">Member Secretary / Approver</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setApproverId('u_officer')
                      setApproverName('Anita Deshmukh (AICTE Officer)')
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                      approverId === 'u_officer'
                        ? 'border-bad-700 bg-bad-50 text-bad-700 ring-1 ring-bad-200'
                        : 'border-line bg-card text-ink hover:bg-surface'
                    }`}
                  >
                    <div className="font-bold text-xs">Anita Deshmukh</div>
                    <div className="text-[10px] text-muted">Same as Reviewer (Test Rule)</div>
                  </button>
                </div>
              </div>

              {/* Simulated Dual-Key OTP Verification */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="otp-input" className="font-bold text-ink block">
                    Dual-Key Cryptographic OTP (Simulated SMS/Token):
                  </label>
                  <SimulatedChip text="Demo OTP: 849201" />
                </div>
                <input
                  id="otp-input"
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP..."
                  className="w-full p-2.5 rounded-xl bg-card border border-line font-mono text-ink text-sm tracking-widest text-center font-bold focus:outline-none focus:border-brand"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!approvedRelease && (
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
              disabled={submitting || isSelfApproval}
              onClick={handleApprove}
              className={`btn text-xs px-4 py-2 shadow-xs ${
                isSelfApproval ? 'btn-danger opacity-70 cursor-not-allowed' : 'btn-primary'
              }`}
            >
              <KeyRound size={13} />
              <span>
                {submitting
                  ? 'Executing Sign-Off…'
                  : isSelfApproval
                  ? 'Violates Two-Person Rule'
                  : 'Execute Dual-Key Approval'}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
