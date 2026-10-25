import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FileCheck2,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Key,
  QrCode,
  AlertTriangle,
  UserCheck,
  X,
  Plus,
} from 'lucide-react'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import SimulatedChip from '../components/SimulatedChip.jsx'
import LoadingState from '../components/LoadingState.jsx'
import ErrorState from '../components/ErrorState.jsx'
import EmptyState from '../components/EmptyState.jsx'
import QrReceiptCard from '../components/QrReceiptCard.jsx'

function formatINR(val) {
  if (typeof val !== 'number') return '₹0'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val)
}

export default function Releases() {
  const { user, currentRoleKey } = useAuth()

  const [releases, setReleases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedRelease, setSelectedRelease] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Review modal state
  const [reviewModalItem, setReviewModalItem] = useState(null)
  const [reviewNotes, setReviewNotes] = useState('Compliance audit verified. Recommended for dual-key sign-off.')

  // OTP Approve modal state
  const [approveModalItem, setApproveModalItem] = useState(null)
  const [otpValue, setOtpValue] = useState('849102')

  const fetchReleases = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.listReleases()
      setReleases(data || [])
    } catch (err) {
      setError(err?.message || 'Failed to fetch release requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReleases()
  }, [])

  // Review action
  const handleReview = async (e) => {
    e.preventDefault()
    try {
      setActionLoading(true)
      await api.reviewRelease(
        reviewModalItem.id,
        reviewNotes,
        user?.id || 'u_officer',
        user?.name || 'Anita Deshmukh (AICTE Officer)'
      )
      setReviewModalItem(null)
      fetchReleases()
    } catch (err) {
      alert(err?.message || 'Review failed')
    } finally {
      setActionLoading(false)
    }
  }

  // Dual-Key OTP Approve action
  const handleApprove = async (e) => {
    e.preventDefault()
    try {
      setActionLoading(true)
      const approved = await api.approveRelease(
        approveModalItem.id,
        user?.id || 'u_approver',
        user?.name || 'Prof. K. Venkatesh (Approver)',
        otpValue
      )
      setApproveModalItem(null)
      setSelectedRelease(approved)
      fetchReleases()
    } catch (err) {
      alert(err?.message || 'Approval failed')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <LoadingState message="Loading security deposit release ledger..." />
  if (error) return <ErrorState message={error} onRetry={fetchReleases} />

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Link to="/" className="text-xs text-muted hover:text-brand font-medium">
              Home
            </Link>
            <span className="text-muted text-xs">/</span>
            <span className="text-xs text-ink font-semibold">Release Requests</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight mt-1">
            Security Deposit Release Requests
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Two-Person Rule Workflow • AICTE Western Regional Bureau
          </p>
        </div>

        <div className="flex items-center gap-2">
          <SimulatedChip text="Dual-Key HSM Sealed" />
        </div>
      </div>

      {/* Two-Person Rule Banner */}
      <div className="card bg-info-50/60 border-info-200 p-4 space-y-1">
        <div className="flex items-center gap-2">
          <Key size={16} className="text-brand" />
          <h2 className="text-xs font-bold text-ink uppercase tracking-wider">
            Mandatory Two-Person Rule
          </h2>
        </div>
        <p className="text-xs text-muted leading-relaxed">
          Release requests require independent scrutiny by an AICTE Officer followed by final authorization and cryptographic OTP sign-off by the Approving Authority.
        </p>
      </div>

      {/* Release Items Table */}
      <div className="card p-0 overflow-hidden">
        {releases.length === 0 ? (
          <EmptyState
            title="No Release Requests"
            message="There are currently no security deposit release requests."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface/80 border-b border-line text-muted uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Release ID</th>
                  <th className="py-3 px-4">FDR Number</th>
                  <th className="py-3 px-4">Institution</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {releases.map((rel) => (
                  <tr key={rel.id} className="hover:bg-surface/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-brand">{rel.id}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-ink">
                      <Link
                        to={`/fdrs/${rel.fdr_id}`}
                        className="hover:underline flex items-center gap-1"
                      >
                        {rel.fdr_number}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-ink leading-tight">
                        {rel.institution_name}
                      </div>
                      <div className="text-[10px] text-muted">{rel.bank}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-ink">
                      {formatINR(rel.amount)}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={rel.status === 'Approved' ? 'Released' : 'Release in Progress'} />
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5">
                      {rel.status === 'Pending Review' && (
                        <button
                          type="button"
                          onClick={() => setReviewModalItem(rel)}
                          className="btn btn-ghost text-xs px-2.5 py-1"
                        >
                          <UserCheck size={13} />
                          Review
                        </button>
                      )}

                      {rel.status === 'Reviewed' && (
                        <button
                          type="button"
                          onClick={() => setApproveModalItem(rel)}
                          className="btn btn-primary text-xs px-2.5 py-1"
                        >
                          <Key size={13} />
                          Dual-Key Sign
                        </button>
                      )}

                      {rel.status === 'Approved' && (
                        <button
                          type="button"
                          onClick={() => setSelectedRelease(rel)}
                          className="btn btn-ghost text-xs px-2.5 py-1 text-ok-700 border-ok-200"
                        >
                          <QrCode size={13} />
                          View Receipt
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="card max-w-md w-full space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="font-bold text-sm text-ink">Review Release Request</h3>
              <button
                type="button"
                onClick={() => setReviewModalItem(null)}
                className="text-muted hover:text-ink"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleReview} className="space-y-3 text-xs">
              <div className="p-3 bg-surface rounded-xl border border-line space-y-1">
                <span className="font-mono text-ink font-bold block">{reviewModalItem.fdr_number}</span>
                <span className="text-muted text-[11px] block">{reviewModalItem.institution_name}</span>
                <span className="font-mono font-bold text-brand block">{formatINR(reviewModalItem.amount)}</span>
              </div>
              <div className="space-y-1">
                <label className="font-bold text-ink">Compliance Scrutiny Notes</label>
                <textarea
                  rows={3}
                  required
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-surface border border-line text-ink"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => setReviewModalItem(null)}
                  className="btn btn-ghost text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn btn-primary text-xs"
                >
                  Confirm Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dual-Key OTP Approve Modal */}
      {approveModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="card max-w-md w-full space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="font-bold text-sm text-ink">Dual-Key Approver Sign-Off</h3>
              <button
                type="button"
                onClick={() => setApproveModalItem(null)}
                className="text-muted hover:text-ink"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleApprove} className="space-y-3 text-xs">
              <div className="rounded-xl border border-line bg-surface p-3 space-y-1">
                <span className="font-mono font-bold text-ink block">{approveModalItem.fdr_number}</span>
                <span className="text-muted text-[11px] block">
                  Reviewed by: {approveModalItem.reviewer_name || 'Anita Deshmukh'}
                </span>
                <span className="font-mono font-bold text-ok-700 block">
                  {formatINR(approveModalItem.amount)}
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-ink">Simulated Cryptographic OTP</label>
                  <SimulatedChip text="SMS / HSM OTP" />
                </div>
                <input
                  type="text"
                  required
                  value={otpValue}
                  onChange={(e) => setOtpValue(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface border border-line font-mono font-bold text-ink tracking-widest text-center"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => setApproveModalItem(null)}
                  className="btn btn-ghost text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn btn-primary text-xs"
                >
                  Sign & Issue QR Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Receipt Card Modal */}
      {selectedRelease && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="max-w-2xl w-full my-8">
            <QrReceiptCard
              release={selectedRelease}
              onClose={() => setSelectedRelease(null)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
