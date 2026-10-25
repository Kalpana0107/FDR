import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ShieldCheck,
  FileText,
  Clock,
  History,
  FileCheck2,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Sliders,
  Sparkles,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  Building,
  Upload,
  Calendar,
  X,
  FileSpreadsheet,
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

export default function FdrRecord() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, currentRoleKey } = useAuth()

  const [fdr, setFdr] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Version Time Machine Slider state
  const [selectedVersionIndex, setSelectedVersionIndex] = useState(null)

  // Modals state
  const [showFixModal, setShowFixModal] = useState(false)
  const [showRenewModal, setShowRenewModal] = useState(false)
  const [showReleaseModal, setShowReleaseModal] = useState(false)
  const [showQrModal, setShowQrModal] = useState(false)

  // Fix & Resubmit form
  const [fixForm, setFixForm] = useState({
    fdr_number: '',
    bank: '',
    amount: 0,
    maturity_date: '',
    aicte_lien_endorsed: true,
    remark: 'Corrected certificate upload with mandatory AICTE Western Region joint lien clause.',
    fileName: 'Rectified_FDR_Certificate.pdf',
  })

  // Renewal form
  const [renewForm, setRenewForm] = useState({
    new_fdr_number: '',
    amount: 0,
    roi: 7.35,
    tenure_months: 12,
    maturity_date: '2027-10-25',
    remark: 'Rollover renewal request submitted by college.',
    fileName: 'Renewal_FDR_Endorsement.pdf',
  })

  // Release form
  const [releaseReason, setReleaseReason] = useState(
    'Tenure completed; college security deposit return requested.'
  )

  // Remarks state
  const [newRemark, setNewRemark] = useState('')

  const loadFdr = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.getFdr(id)
      setFdr(data)
      if (data?.versions?.length) {
        setSelectedVersionIndex(data.versions.length - 1)
      }
      // Populate fix & renew forms
      setFixForm({
        fdr_number: data.fdr_number,
        bank: data.bank,
        amount: data.amount,
        maturity_date: data.maturity_date,
        aicte_lien_endorsed: true,
        remark: 'Corrected certificate upload with mandatory AICTE Western Region joint lien clause.',
        fileName: 'Rectified_FDR_Certificate.pdf',
      })
      setRenewForm({
        new_fdr_number: `${data.fdr_number}-R1`,
        amount: data.amount,
        roi: 7.35,
        tenure_months: 12,
        maturity_date: '2027-10-25',
        remark: 'Rollover renewal request submitted by college.',
        fileName: 'Renewal_FDR_Endorsement.pdf',
      })
    } catch (err) {
      setError(err?.message || 'Failed to fetch FDR record')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFdr()
  }, [id])

  // Fix and Resubmit Handler
  const handleFixSubmit = async (e) => {
    e.preventDefault()
    try {
      setActionLoading(true)
      const updated = await api.resubmitFdr(fdr.id, {
        ...fixForm,
        author: user?.name || 'College Accountant',
      })
      setFdr(updated)
      setSelectedVersionIndex(updated.versions.length - 1)
      setShowFixModal(false)
    } catch (err) {
      alert(err?.message || 'Resubmission failed')
    } finally {
      setActionLoading(false)
    }
  }

  // Renewal Handler
  const handleRenewSubmit = async (e) => {
    e.preventDefault()
    try {
      setActionLoading(true)
      const res = await api.renewFdr(fdr.id, {
        ...renewForm,
        author: user?.name || 'College Principal',
      })
      setShowRenewModal(false)
      // Navigate to renewed child FDR or reload
      if (res?.renewed?.id) {
        navigate(`/fdrs/${res.renewed.id}`)
      } else {
        loadFdr()
      }
    } catch (err) {
      alert(err?.message || 'Renewal failed')
    } finally {
      setActionLoading(false)
    }
  }

  // Release Request Handler
  const handleReleaseSubmit = async (e) => {
    e.preventDefault()
    try {
      setActionLoading(true)
      await api.createRelease({
        fdr_id: fdr.id,
        fdr_number: fdr.fdr_number,
        reason: releaseReason,
        requested_by: user?.name || 'College Accountant',
      })
      setShowReleaseModal(false)
      loadFdr()
    } catch (err) {
      alert(err?.message || 'Release request failed')
    } finally {
      setActionLoading(false)
    }
  }

  // Bank Verification Trigger (Simulated CBS)
  const handleVerifyBank = async () => {
    try {
      setActionLoading(true)
      const updated = await api.verifyBank(fdr.id)
      setFdr(updated)
      setSelectedVersionIndex(updated.versions.length - 1)
    } catch (err) {
      alert(err?.message || 'Verification check failed')
    } finally {
      setActionLoading(false)
    }
  }

  // Simulate Rejection / Return for college autonomy demo
  const handleSimulateReturn = async () => {
    try {
      setActionLoading(true)
      const updated = await api.transitionFdr(
        fdr.id,
        'Returned',
        'Simulated Officer Scrutiny: AICTE lien clause stamp missing on page 2. Please endorse and resubmit.',
        'Anita Deshmukh',
        'AICTE Officer'
      )
      // Mark lien as false to demo return
      updated.aicte_lien_endorsed = false
      if (updated.bank_comparison) {
        updated.bank_comparison.match_status = 'Mismatch - Lien Missing'
      }
      setFdr({ ...updated })
      setSelectedVersionIndex(updated.versions.length - 1)
    } catch (err) {
      alert(err?.message || 'Failed to simulate return')
    } finally {
      setActionLoading(false)
    }
  }

  // Add Remark
  const handleAddRemark = async (e) => {
    e.preventDefault()
    if (!newRemark.trim()) return
    try {
      const now = new Date().toISOString()
      const remarkObj = {
        id: `rem_${Date.now()}`,
        author: user?.name || 'Authorized User',
        role: user?.role || 'College',
        text: newRemark.trim(),
        timestamp: now,
      }
      const updated = {
        ...fdr,
        remarks: [...(fdr.remarks || []), remarkObj],
      }
      setFdr(updated)
      setNewRemark('')
    } catch (err) {
      alert(err?.message || 'Failed to add remark')
    }
  }

  if (loading) return <LoadingState message="Loading FDR security deposit ledger..." />
  if (error) return <ErrorState message={error} onRetry={loadFdr} />
  if (!fdr) return <EmptyState title="FDR Not Found" message="The requested record does not exist." />

  // Version Time Machine snapshot calculations
  const versions = fdr.versions || [
    {
      version: 1,
      timestamp: fdr.start_date,
      label: 'Initial Record',
      status: fdr.status,
      amount: fdr.amount,
      notes: 'Initial deposit ingested.',
    },
  ]
  const currentVersion =
    selectedVersionIndex !== null && versions[selectedVersionIndex]
      ? versions[selectedVersionIndex]
      : versions[versions.length - 1]

  // Stepper definition
  const steps = [
    { label: 'Submitted', key: 'Submitted' },
    { label: 'Under Review', key: 'Under Review' },
    { label: 'Verified', key: 'Verified' },
    { label: 'Active', key: 'Active' },
  ]

  const getStepState = (stepKey, index) => {
    if (fdr.status === 'Returned' && index >= 1) {
      return index === 1 ? 'returned' : 'pending'
    }
    if (fdr.status === 'Renewed') return 'completed'
    if (fdr.status === 'Released') return 'completed'

    const order = ['Submitted', 'Under Review', 'Verified', 'Active']
    const currIndex = order.indexOf(fdr.status)
    if (currIndex >= index) return 'completed'
    return 'pending'
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-zinc-900">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200/90 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Link to="/" className="text-xs text-zinc-400 hover:text-emerald-700 font-medium transition-colors">
              Dashboard
            </Link>
            <span className="text-zinc-300 text-xs">/</span>
            <span className="text-xs text-zinc-400 font-mono">{fdr.institution_id}</span>
            <span className="text-zinc-300 text-xs">/</span>
            <span className="text-xs text-zinc-900 font-bold font-mono tracking-tight">{fdr.fdr_number}</span>
          </div>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 font-mono tracking-tight font-heading">
              {fdr.fdr_number}
            </h1>
            <StatusBadge status={fdr.status} />
            <span className="rounded bg-zinc-100 text-zinc-700 border border-zinc-200 px-2.5 py-1 text-xs font-mono font-medium">
              Simulated Bank Gateway
            </span>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Fix & Resubmit Action (Shown when status is Returned) */}
          {fdr.status === 'Returned' && (
            <button
              type="button"
              onClick={() => setShowFixModal(true)}
              className="bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs rounded-lg shadow-xs px-4 py-2 transition-all inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw size={14} />
              Fix & Resubmit Deposit
            </button>
          )}

          {/* Renewal Action (Shown when Maturing or Active) */}
          {(fdr.status === 'Maturing' || fdr.status === 'Active') && (
            <button
              type="button"
              onClick={() => setShowRenewModal(true)}
              className="bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 text-xs font-semibold rounded-lg px-3.5 py-1.5 transition-all inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw size={14} />
              Submit Renewal
            </button>
          )}

          {/* Release Action */}
          {fdr.status === 'Active' && (
            <button
              type="button"
              onClick={() => setShowReleaseModal(true)}
              className="bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 text-xs font-semibold rounded-lg px-3.5 py-1.5 transition-all inline-flex items-center gap-1.5 cursor-pointer"
            >
              <FileCheck2 size={14} />
              Request Release
            </button>
          )}

          {/* QR Receipt (Shown when Released) */}
          {fdr.status === 'Released' && (
            <button
              type="button"
              onClick={() => setShowQrModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow-xs px-4 py-2 transition-all inline-flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck size={14} />
              View QR Receipt
            </button>
          )}

          {/* Autonomous Sandbox Developer Helpers */}
          <button
            type="button"
            disabled={actionLoading}
            onClick={handleVerifyBank}
            title="Execute simulated CBS live check"
            className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-300 text-xs rounded-md px-2.5 py-1 font-mono transition-all inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles size={13} className="text-emerald-600" />
            Simulate CBS Verify
          </button>

          {(fdr.status === 'Submitted' || fdr.status === 'Under Review') && (
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleSimulateReturn}
              title="Test the Fix-and-Resubmit workflow"
              className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-300 text-xs rounded-md px-2.5 py-1 font-mono transition-all inline-flex items-center gap-1.5 cursor-pointer"
            >
              <AlertTriangle size={13} className="text-amber-600" />
              Simulate Return
            </button>
          )}
        </div>
      </div>

      {/* Returned Status Banner with Fix prompt */}
      {fdr.status === 'Returned' && (
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 space-y-2">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-500 text-white shrink-0 mt-0.5 shadow-2xs">
              <AlertTriangle size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="font-semibold text-xs text-amber-900">
                  Deposit Returned: Action Required by College
                </h3>
                <span className="text-[11px] font-mono text-amber-800 font-bold">
                  Status: Returned
                </span>
              </div>
              <p className="text-xs text-amber-800/80 mt-1 leading-relaxed">
                The deposit certificate was returned during scrutiny due to a missing AICTE Western Region joint lien clause or document illegibility. Please upload the rectified certificate and resubmit.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowFixModal(true)}
                  className="bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs rounded-lg shadow-xs px-4 py-2 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw size={14} />
                  Open Fix & Resubmit Form
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Maturing Status Banner with Renewal prompt */}
      {fdr.status === 'Maturing' && (
        <div className="bg-amber-50/50 border border-amber-200/60 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-500 text-white shrink-0 mt-0.5 shadow-2xs">
              <Clock size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="font-semibold text-xs text-amber-900">
                  Deposit Maturing Soon: Renewal Action Recommended
                </h3>
                <span className="text-[11px] font-mono text-amber-800 font-bold">
                  Due: {fdr.maturity_date}
                </span>
              </div>
              <p className="text-xs text-amber-800/80 mt-1 leading-relaxed">
                This security deposit is approaching its maturity date. To maintain statutory AICTE accreditation standing, submit a rollover renewal.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowRenewModal(true)}
                  className="bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 text-xs font-semibold rounded-lg px-3.5 py-1.5 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw size={14} />
                  Submit Deposit Renewal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 1: Lifecycle Stepper as Crisp Horizontal Pipeline */}
      <div className="bg-white border border-zinc-200/90 rounded-xl shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Deposit Lifecycle Pipeline
          </h2>
          <span className="text-xs text-zinc-400 font-mono">
            Current: <span className="font-bold text-zinc-900">{fdr.status}</span>
          </span>
        </div>

        {/* Horizontal Line Pipeline with Circular Step Badges */}
        <div className="relative pt-2 pb-1">
          {/* Connecting line */}
          <div className="absolute top-6 left-8 right-8 h-0.5 bg-zinc-200 -z-0" />

          <div className="relative z-10 flex items-start justify-between">
            {steps.map((st, idx) => {
              const state = getStepState(st.key, idx)
              const isCompleted = state === 'completed'
              const isReturned = state === 'returned'

              return (
                <div key={st.key} className="flex flex-col items-center text-center max-w-[120px]">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ring-4 ring-white transition-all shadow-xs ${
                      isReturned
                        ? 'bg-amber-500 text-white'
                        : isCompleted
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-zinc-100 text-zinc-400 border border-zinc-300'
                    }`}
                  >
                    {isReturned ? '!' : isCompleted ? '✓' : idx + 1}
                  </div>
                  <div className="mt-2 text-xs font-semibold text-zinc-900 leading-tight">
                    {st.label}
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">
                    {isReturned
                      ? 'Action Required'
                      : isCompleted
                      ? 'Completed'
                      : 'Pending'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Special Status Callout if Renewed or Released */}
        {(fdr.status === 'Renewed' || fdr.status === 'Released') && (
          <div className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 rounded-lg p-2.5 flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-emerald-600" />
            Lifecycle Concluded: Deposit transitioned to {fdr.status}
          </div>
        )}
      </div>

      {/* Section 2: Time Machine Version History Slider */}
      <div className="bg-white border border-zinc-200/90 rounded-xl shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <History size={16} />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
                Time Machine: Version History Slider
              </h2>
              <p className="text-xs text-zinc-400">
                Audit scrub back to historical snapshots of this security deposit
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold font-mono text-emerald-700 tracking-tight">
              Version {currentVersion.version} of {versions.length}
            </span>
            <span className="rounded bg-zinc-100 text-zinc-700 border border-zinc-200 px-2 py-0.5 text-xs font-mono font-medium">
              Cryptographic Ledger
            </span>
          </div>
        </div>

        {/* Interactive Scrub Slider */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
            <span>v1 (Initial Upload)</span>
            <span>v{versions.length} (Latest State)</span>
          </div>
          <input
            type="range"
            min="0"
            max={versions.length - 1}
            step="1"
            value={selectedVersionIndex ?? versions.length - 1}
            onChange={(e) => setSelectedVersionIndex(Number(e.target.value))}
            className="w-full accent-emerald-600 cursor-pointer"
          />
        </div>

        {/* Current Selected Version Snapshot Card */}
        <div className="rounded-lg border border-zinc-200/70 bg-zinc-50/60 p-4 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-zinc-900 tracking-tight">
                Version {currentVersion.version}: {currentVersion.label}
              </span>
              <StatusBadge status={currentVersion.status} />
            </div>
            <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-1">
              <Clock size={12} />
              {currentVersion.timestamp}
            </div>
          </div>

          <p className="text-xs text-zinc-600 leading-relaxed">
            {currentVersion.notes || 'Recorded in immutable audit log.'}
          </p>

          <div className="flex items-center gap-4 text-xs font-mono pt-1 text-zinc-500">
            <span>
              Principal: <strong className="text-zinc-900 font-bold tracking-tight">{formatINR(currentVersion.amount)}</strong>
            </span>
            {currentVersion.version === versions.length ? (
              <span className="text-emerald-700 font-semibold">● Live Active State</span>
            ) : (
              <span className="text-amber-700 font-semibold">Historical Snapshot (Read Only)</span>
            )}
          </div>
        </div>
      </div>

      {/* Section 3: Deposit Metadata & Bank CBS Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Submitted Metadata Card */}
        <div className="bg-white border border-zinc-200/90 rounded-xl shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-2">
              <Building size={16} className="text-emerald-600" />
              Deposit Certificate Details
            </h2>
            <span className="text-xs font-mono text-zinc-400 font-bold">{fdr.institution_id}</span>
          </div>

          <div className="grid grid-cols-2 gap-3.5 text-xs">
            <div>
              <span className="text-zinc-400 block text-[10px] font-bold uppercase tracking-wider">Beneficiary College</span>
              <span className="font-semibold text-zinc-900 leading-tight block mt-0.5">
                {fdr.institution_name}
              </span>
            </div>

            <div>
              <span className="text-zinc-400 block text-[10px] font-bold uppercase tracking-wider">Issuing Bank</span>
              <span className="font-semibold text-zinc-900 leading-tight block mt-0.5">{fdr.bank}</span>
              <span className="text-zinc-400 text-[11px] block">{fdr.branch}</span>
            </div>

            <div>
              <span className="text-zinc-400 block text-[10px] font-bold uppercase tracking-wider">Account # & IFSC</span>
              <span className="font-mono font-bold text-zinc-900 tracking-tight block mt-0.5">
                {fdr.account_number || '39019283719'}
              </span>
              <span className="font-mono text-zinc-400 text-[10px]">{fdr.ifsc_code || 'SBIN0001092'}</span>
            </div>

            <div>
              <span className="text-zinc-400 block text-[10px] font-bold uppercase tracking-wider">Principal Deposit</span>
              <span className="font-mono font-bold text-zinc-900 tracking-tight text-sm block mt-0.5">
                {formatINR(fdr.amount)}
              </span>
              <span className="text-zinc-400 text-[10px]">ROI: {fdr.roi}% p.a.</span>
            </div>

            <div>
              <span className="text-zinc-400 block text-[10px] font-bold uppercase tracking-wider">Tenure & Maturity</span>
              <span className="font-mono font-bold text-zinc-900 block mt-0.5">
                {fdr.start_date} to {fdr.maturity_date}
              </span>
              <span className="text-zinc-400 text-[10px]">{fdr.tenure_months || 12} Months</span>
            </div>

            <div>
              <span className="text-zinc-400 block text-[10px] font-bold uppercase tracking-wider">Joint Holder</span>
              <span className="font-semibold text-zinc-900 block mt-0.5 leading-tight">
                {fdr.joint_holder || 'Regional Officer, AICTE Western Region'}
              </span>
            </div>
          </div>

          {/* Lien Endorsement Box */}
          <div className="rounded-lg border border-zinc-200/90 bg-zinc-50/50 p-3 flex items-center justify-between text-xs">
            <div>
              <span className="font-semibold text-zinc-900 block">AICTE Joint Lien Endorsement</span>
              <span className="text-[11px] text-zinc-500">
                {fdr.aicte_lien_endorsed ? 'Stamped & Verified' : 'Clause Missing or Incomplete'}
              </span>
            </div>
            {fdr.aicte_lien_endorsed ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                Endorsed
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-800 border border-rose-200/80">
                Not Endorsed
              </span>
            )}
          </div>
        </div>

        {/* Bank CBS Earmarking Comparison Card */}
        <div className="bg-white border border-zinc-200/90 rounded-xl shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-2">
              <Sparkles size={16} className="text-emerald-600" />
              Core Banking (CBS) Live Match
            </h2>
            <span className="rounded bg-zinc-100 text-zinc-700 border border-zinc-200 px-2 py-0.5 text-xs font-mono font-medium">
              Simulated CBS API
            </span>
          </div>

          {fdr.bank_comparison ? (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between rounded-lg bg-zinc-50 border border-zinc-100 p-2.5">
                <span className="text-zinc-500 font-medium">Gateway Verification Status:</span>
                <span
                  className={`font-semibold font-mono px-2 py-0.5 rounded-md text-[11px] ${
                    fdr.bank_comparison.match_status?.includes('Full Match')
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
                      : 'bg-amber-50 text-amber-800 border border-amber-200/80'
                  }`}
                >
                  {fdr.bank_comparison.match_status}
                </span>
              </div>

              <div className="rounded-lg border border-zinc-200/90 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 border-b border-zinc-100 text-[10px] uppercase font-bold text-zinc-400">
                    <tr>
                      <th className="py-2.5 px-3">Field</th>
                      <th className="py-2.5 px-3">Submitted</th>
                      <th className="py-2.5 px-3">Bank CBS Live</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-mono text-[11px]">
                    <tr>
                      <td className="py-2.5 px-3 font-sans text-zinc-500">FDR Number</td>
                      <td className="py-2.5 px-3 text-zinc-900 font-bold tracking-tight">
                        {fdr.bank_comparison.submitted?.fdr_number}
                      </td>
                      <td className="py-2.5 px-3 text-emerald-700 font-bold tracking-tight">
                        {fdr.bank_comparison.cbs_live?.fdr_number || 'Awaiting CBS'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-sans text-zinc-500">Principal Amount</td>
                      <td className="py-2.5 px-3 text-zinc-900 font-bold tracking-tight">
                        {formatINR(fdr.bank_comparison.submitted?.amount)}
                      </td>
                      <td className="py-2.5 px-3 text-emerald-700 font-bold tracking-tight">
                        {formatINR(fdr.bank_comparison.cbs_live?.amount)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-sans text-zinc-500">Lien Marked</td>
                      <td className="py-2.5 px-3 text-zinc-900 font-sans">
                        {fdr.bank_comparison.submitted?.lien_marked}
                      </td>
                      <td className="py-2.5 px-3 text-emerald-700 font-sans">
                        {fdr.bank_comparison.cbs_live?.lien_marked || 'Unverified'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {fdr.bank_comparison.discrepancies?.length > 0 && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800 space-y-1">
                  <span className="font-semibold block">Discrepancy Flags:</span>
                  <ul className="list-disc list-inside text-[11px]">
                    {fdr.bank_comparison.discrepancies.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-zinc-400">
              No CBS inquiry recorded yet. Click "Simulate CBS Verify" above.
            </div>
          )}
        </div>
      </div>

      {/* Section 4: Documents & Remarks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Uploaded Documents List */}
        <div className="bg-white border border-zinc-200/90 rounded-xl shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-2">
              <FileText size={16} className="text-emerald-600" />
              Attached Deposit Documents
            </h2>
            <span className="text-xs font-mono text-zinc-400 font-bold">
              {fdr.documents?.length || 0} Files
            </span>
          </div>

          <div className="space-y-2">
            {(fdr.documents || []).map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 rounded-lg border border-zinc-200/80 bg-zinc-50/50 hover:bg-zinc-50 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-lg bg-white border border-zinc-200 text-zinc-700 shrink-0 shadow-2xs">
                    <FileText size={15} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-zinc-900 truncate font-mono tracking-tight">{doc.name}</div>
                    <div className="text-[10px] text-zinc-400 font-mono">
                      {doc.size} • {doc.uploaded_at?.split('T')[0]}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => alert(`Simulated document viewer: ${doc.name}`)}
                  className="bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 text-xs p-1.5 rounded-lg transition-all cursor-pointer"
                  title="Simulate Document View"
                >
                  <ExternalLink size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Remarks & Advisory Thread */}
        <div className="bg-white border border-zinc-200/90 rounded-xl shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-2">
              <MessageSquare size={16} className="text-emerald-600" />
              Remarks & Scrutiny Notes
            </h2>
            <span className="text-xs font-mono text-zinc-400 font-bold">
              {fdr.remarks?.length || 0} Notes
            </span>
          </div>

          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {(fdr.remarks || []).map((rem) => (
              <div
                key={rem.id}
                className="rounded-lg border border-zinc-100 bg-zinc-50/60 p-3 space-y-1 text-xs"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-zinc-900">
                    {rem.author} <span className="text-zinc-400 font-normal">({rem.role})</span>
                  </span>
                  <span className="font-mono text-zinc-400 text-[10px]">
                    {rem.timestamp?.split('T')[0]}
                  </span>
                </div>
                <p className="text-zinc-600 leading-relaxed text-[11px]">{rem.text}</p>
              </div>
            ))}
          </div>

          {/* Add Remark Form */}
          <form onSubmit={handleAddRemark} className="flex items-center gap-2 pt-2 border-t border-zinc-100">
            <input
              type="text"
              placeholder="Add observation or compliance remark..."
              value={newRemark}
              onChange={(e) => setNewRemark(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-white border border-zinc-200 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all placeholder:text-zinc-400"
            />
            <button
              type="submit"
              className="bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs rounded-lg shadow-xs px-3.5 py-1.5 transition-all shrink-0 cursor-pointer"
            >
              Add Note
            </button>
          </form>
        </div>
      </div>

      {/* Section 5: Audit History Timeline */}
      <div className="bg-white border border-zinc-200/90 rounded-xl shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            <History size={16} className="text-emerald-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
              Immutable Audit Trail
            </h2>
          </div>
          <span className="rounded bg-zinc-100 text-zinc-700 border border-zinc-200 px-2 py-0.5 text-xs font-mono font-medium">
            SHA-256 Chained
          </span>
        </div>

        <div className="relative pl-6 space-y-4 border-l-2 border-zinc-200 ml-3">
          {(fdr.history || []).map((h, i) => (
            <div key={i} className="relative group">
              {/* Dot on line */}
              <div className="absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full bg-white border-2 border-zinc-900 group-hover:bg-zinc-900 transition-colors shadow-2xs" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                <span className="font-semibold text-zinc-900">{h.action}</span>
                <span className="font-mono text-[10px] text-zinc-400">{h.timestamp}</span>
              </div>
              <div className="text-[11px] text-zinc-500 mt-0.5">
                Actor: <span className="text-zinc-900 font-medium">{h.actor}</span> • Status: <StatusBadge status={h.status} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL 1: Fix & Resubmit Form Modal */}
      {showFixModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white border border-zinc-200/90 rounded-xl shadow-xl max-w-lg w-full space-y-4 p-5 sm:p-6 my-8">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                  <RotateCcw size={16} />
                </div>
                <h3 className="font-bold text-sm text-zinc-900">Fix & Resubmit Deposit</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowFixModal(false)}
                className="text-zinc-400 hover:text-zinc-700 p-1 rounded-md"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleFixSubmit} className="space-y-4 text-xs">
              <div className="rounded-lg border border-amber-200/80 bg-amber-50/70 p-3 text-amber-900">
                <span className="font-semibold block">Correction Notice:</span>
                Ensure AICTE Western Region is specified as joint holder and the lien clause is endorsed.
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  FDR Receipt Number
                </label>
                <input
                  type="text"
                  required
                  value={fixForm.fdr_number}
                  onChange={(e) => setFixForm({ ...fixForm, fdr_number: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-zinc-200 font-mono font-bold text-zinc-900 tracking-tight focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Scheduled Bank
                </label>
                <input
                  type="text"
                  required
                  value={fixForm.bank}
                  onChange={(e) => setFixForm({ ...fixForm, bank: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-zinc-200 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Principal Amount (INR)
                  </label>
                  <input
                    type="number"
                    required
                    value={fixForm.amount}
                    onChange={(e) => setFixForm({ ...fixForm, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-zinc-200 font-mono font-bold text-zinc-900 tracking-tight focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Maturity Date
                  </label>
                  <input
                    type="date"
                    required
                    value={fixForm.maturity_date}
                    onChange={(e) => setFixForm({ ...fixForm, maturity_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-zinc-200 text-zinc-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="rounded-lg border border-zinc-200/90 bg-zinc-50/50 p-3 space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fixForm.aicte_lien_endorsed}
                    onChange={(e) =>
                      setFixForm({ ...fixForm, aicte_lien_endorsed: e.target.checked })
                    }
                    className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500/20"
                  />
                  <div>
                    <span className="font-semibold text-zinc-900">
                      I confirm the amended certificate has the AICTE Joint Lien Endorsement stamp
                    </span>
                  </div>
                </label>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Upload Rectified PDF Certificate
                </label>
                <div className="border border-dashed border-zinc-300 rounded-lg p-3 text-center bg-zinc-50/50">
                  <span className="text-zinc-900 block text-[11px] font-mono font-bold">{fixForm.fileName}</span>
                  <span className="text-[10px] text-emerald-700 font-semibold">Ready to upload</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Resubmission Remark
                </label>
                <textarea
                  rows={2}
                  value={fixForm.remark}
                  onChange={(e) => setFixForm({ ...fixForm, remark: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-zinc-200 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-zinc-100 pt-3">
                <button
                  type="button"
                  onClick={() => setShowFixModal(false)}
                  className="bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 text-xs font-semibold rounded-lg px-3.5 py-1.5 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs rounded-lg shadow-xs px-4 py-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Resubmitting...' : 'Confirm & Resubmit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Renewal Form Modal */}
      {showRenewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white border border-zinc-200/90 rounded-xl shadow-xl max-w-lg w-full space-y-4 p-5 sm:p-6 my-8">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                  <RotateCcw size={16} />
                </div>
                <h3 className="font-bold text-sm text-zinc-900">Submit Deposit Renewal</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRenewModal(false)}
                className="text-zinc-400 hover:text-zinc-700 p-1 rounded-md"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleRenewSubmit} className="space-y-4 text-xs">
              <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/70 p-3 text-emerald-900">
                <span className="font-semibold block">Renewal Rollover:</span>
                This will transition the current FDR to <strong>Renewed</strong> and create an updated active child security deposit.
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Renewed FDR Number
                </label>
                <input
                  type="text"
                  required
                  value={renewForm.new_fdr_number}
                  onChange={(e) => setRenewForm({ ...renewForm, new_fdr_number: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-zinc-200 font-mono font-bold text-zinc-900 tracking-tight focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Rollover Amount (INR)
                  </label>
                  <input
                    type="number"
                    required
                    value={renewForm.amount}
                    onChange={(e) => setRenewForm({ ...renewForm, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-zinc-200 font-mono font-bold text-zinc-900 tracking-tight focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Renewed ROI (% p.a.)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={renewForm.roi}
                    onChange={(e) => setRenewForm({ ...renewForm, roi: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-zinc-200 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Tenure (Months)
                  </label>
                  <input
                    type="number"
                    value={renewForm.tenure_months}
                    onChange={(e) =>
                      setRenewForm({ ...renewForm, tenure_months: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-white border border-zinc-200 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    New Maturity Date
                  </label>
                  <input
                    type="date"
                    required
                    value={renewForm.maturity_date}
                    onChange={(e) => setRenewForm({ ...renewForm, maturity_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-zinc-200 text-zinc-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Renewal Remarks
                </label>
                <textarea
                  rows={2}
                  value={renewForm.remark}
                  onChange={(e) => setRenewForm({ ...renewForm, remark: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-zinc-200 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-zinc-100 pt-3">
                <button
                  type="button"
                  onClick={() => setShowRenewModal(false)}
                  className="bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 text-xs font-semibold rounded-lg px-3.5 py-1.5 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs rounded-lg shadow-xs px-4 py-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Processing Renewal...' : 'Confirm Renewal Rollover'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Release Request Modal */}
      {showReleaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white border border-zinc-200/90 rounded-xl shadow-xl max-w-lg w-full space-y-4 p-5 sm:p-6 my-8">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                  <FileCheck2 size={16} />
                </div>
                <h3 className="font-bold text-sm text-zinc-900">Request Security Deposit Release</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowReleaseModal(false)}
                className="text-zinc-400 hover:text-zinc-700 p-1 rounded-md"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleReleaseSubmit} className="space-y-4 text-xs">
              <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/70 p-3 text-emerald-900">
                <span className="font-semibold block">Two-Person Authorization Rule:</span>
                This request will be routed to the AICTE Reviewer and dual-key Approver with cryptographic OTP signing.
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Deposit to Release
                </label>
                <div className="font-mono text-zinc-900 font-bold p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 tracking-tight">
                  {fdr.fdr_number} • {formatINR(fdr.amount)} ({fdr.bank})
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Reason / Statutory Justification *
                </label>
                <textarea
                  rows={3}
                  required
                  value={releaseReason}
                  onChange={(e) => setReleaseReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-zinc-200 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-zinc-100 pt-3">
                <button
                  type="button"
                  onClick={() => setShowReleaseModal(false)}
                  className="bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 text-xs font-semibold rounded-lg px-3.5 py-1.5 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs rounded-lg shadow-xs px-4 py-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Submitting...' : 'Submit Release Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Digital QR Receipt Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="max-w-2xl w-full my-8">
            <QrReceiptCard
              fdr={fdr}
              onClose={() => setShowQrModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
