import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  UploadCloud,
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Building,
  Calendar,
  FileText,
  RotateCcw,
} from 'lucide-react'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import SimulatedChip from '../components/SimulatedChip.jsx'

export default function NewFdr() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [file, setFile] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [ocrCompleted, setOcrCompleted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  // OCR Form fields (pre-filled once OCR finishes)
  const [formData, setFormData] = useState({
    fdr_number: '',
    institution_id: user?.inst_id || 'inst_01',
    institution_name: user?.institution_name || 'Sample Institute of Technology, Pune',
    bank: 'State Bank of India',
    branch: 'Shivajinagar Branch, Pune',
    account_number: '39019283719',
    ifsc_code: 'SBIN0001092',
    amount: 1500000,
    roi: 7.25,
    tenure_months: 12,
    start_date: new Date().toISOString().split('T')[0],
    maturity_date: '2027-10-25',
    joint_holder: 'Regional Officer, AICTE Western Region',
    aicte_lien_endorsed: true,
    remarks: 'Initial security deposit submitted for AICTE approval extension.',
  })

  const [ocrConfidence, setOcrConfidence] = useState(0.97)

  // Simulate file upload and OCR extraction
  const handleFileChange = (e) => {
    const selected = e.target.files?.[0]
    if (!selected) return

    setFile(selected)
    setAnalyzing(true)
    setError(null)

    // Simulate OCR delay and scanning
    setTimeout(() => {
      const generatedNum = `FDR-2026-${Math.floor(100000 + Math.random() * 900000)}`
      setFormData((prev) => ({
        ...prev,
        fdr_number: generatedNum,
        bank: 'State Bank of India',
        amount: 1500000,
        roi: 7.25,
        aicte_lien_endorsed: true,
      }))
      setOcrConfidence(0.96)
      setAnalyzing(false)
      setOcrCompleted(true)
    }, 1200)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.fdr_number.trim()) {
      setError('FDR number cannot be empty')
      return
    }

    try {
      setSubmitting(true)
      setError(null)
      const res = await api.createFdr({
        ...formData,
        fileName: file ? file.name : 'Scanned_FDR_Certificate.pdf',
      })
      navigate(`/fdrs/${res.id}`)
    } catch (err) {
      setError(err?.message || 'Failed to submit FDR certificate')
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Link to="/" className="text-xs text-muted hover:text-brand font-medium">
              Home
            </Link>
            <span className="text-muted text-xs">/</span>
            <span className="text-xs text-ink font-semibold">Submit New FDR</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight mt-1">
            Submit Fixed Deposit Receipt
          </h1>
          <p className="text-xs text-muted mt-0.5">
            AICTE Western Regional Bureau Escrow & Compliance Registration
          </p>
        </div>

        <div className="flex items-center gap-2">
          <SimulatedChip text="OCR Engine Simulated" />
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-bad-200 bg-bad-50 p-4 text-xs text-bad-700 flex items-center gap-2">
          <AlertTriangle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step 1: Upload Document Card */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
              1
            </span>
            <h2 className="text-sm font-bold text-ink">Upload FDR Certificate Scan</h2>
          </div>
          <SimulatedChip text="Supports PDF, PNG, JPG" />
        </div>

        <div className="relative border-2 border-dashed border-line hover:border-brand rounded-2xl p-6 sm:p-8 text-center transition-colors bg-surface/40">
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            id="fdr-upload-input"
          />

          {analyzing ? (
            <div className="space-y-3 py-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand animate-pulse">
                <Sparkles size={24} />
              </div>
              <div className="text-sm font-bold text-ink">
                Simulated AI Engine: Running OCR & Lien Extraction...
              </div>
              <p className="text-xs text-muted max-w-sm mx-auto">
                Parsing bank seals, fixed deposit certificate text, and joint lien endorsements.
              </p>
            </div>
          ) : file ? (
            <div className="space-y-2 py-2">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-ok-50 text-ok-700">
                <FileCheck2 size={22} />
              </div>
              <div className="text-sm font-bold text-ink">{file.name}</div>
              <div className="text-xs text-ok-700 font-semibold flex items-center justify-center gap-1">
                <CheckCircle2 size={13} />
                OCR Extraction Completed ({Math.round(ocrConfidence * 100)}% Confidence)
              </div>
              <p className="text-[11px] text-muted">Click or drop another file to replace</p>
            </div>
          ) : (
            <div className="space-y-2 py-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-surface text-brand border border-line">
                <UploadCloud size={24} />
              </div>
              <div className="text-sm font-bold text-ink">
                Drag and drop your bank FDR certificate, or browse
              </div>
              <p className="text-xs text-muted max-w-sm mx-auto">
                Upload official bank deposit receipt containing account number, interest rate, and AICTE joint lien endorsement.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Step 2: Confirm OCR Fields Form */}
      <form onSubmit={handleSubmit} className="card space-y-6">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
              2
            </span>
            <h2 className="text-sm font-bold text-ink">Confirm & Edit Extracted Fields</h2>
          </div>
          {ocrCompleted && (
            <div className="flex items-center gap-1.5 text-xs text-ok-700 font-semibold bg-ok-50 px-2.5 py-0.5 rounded-full ring-1 ring-ok-200">
              <Sparkles size={13} />
              OCR Auto-Populated
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* FDR Number */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-ink">FDR Receipt Number *</label>
            <input
              type="text"
              required
              value={formData.fdr_number}
              onChange={(e) => setFormData({ ...formData, fdr_number: e.target.value })}
              placeholder="e.g. FDR-2026-000192"
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-surface border border-line font-mono font-bold text-ink focus:outline-none focus:border-brand"
            />
          </div>

          {/* Institution */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-ink">Institution Name</label>
            <input
              type="text"
              required
              value={formData.institution_name}
              onChange={(e) => setFormData({ ...formData, institution_name: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-surface border border-line text-ink focus:outline-none focus:border-brand"
            />
          </div>

          {/* Issuing Bank */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-ink">Issuing Scheduled Bank *</label>
            <input
              type="text"
              required
              value={formData.bank}
              onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-surface border border-line text-ink focus:outline-none focus:border-brand"
            />
          </div>

          {/* Branch Name */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-ink">Bank Branch</label>
            <input
              type="text"
              value={formData.branch}
              onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-surface border border-line text-ink focus:outline-none focus:border-brand"
            />
          </div>

          {/* Principal Amount */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-ink">Principal Deposit Amount (INR) *</label>
            <input
              type="number"
              required
              min="10000"
              step="1000"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-surface border border-line font-mono font-bold text-ink focus:outline-none focus:border-brand"
            />
          </div>

          {/* Rate of Interest */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-ink">Rate of Interest (% p.a.)</label>
            <input
              type="number"
              step="0.05"
              value={formData.roi}
              onChange={(e) => setFormData({ ...formData, roi: Number(e.target.value) })}
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-surface border border-line font-mono text-ink focus:outline-none focus:border-brand"
            />
          </div>

          {/* Start Date */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-ink">Deposit Start Date</label>
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-surface border border-line text-ink focus:outline-none focus:border-brand"
            />
          </div>

          {/* Maturity Date */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-ink">Maturity Date *</label>
            <input
              type="date"
              required
              value={formData.maturity_date}
              onChange={(e) => setFormData({ ...formData, maturity_date: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-surface border border-line text-ink focus:outline-none focus:border-brand"
            />
          </div>
        </div>

        {/* Joint Holder & AICTE Lien Endorsement */}
        <div className="rounded-xl border border-line bg-surface/50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink">AICTE Joint Holder & Earmarking Clause</span>
            <SimulatedChip text="Mandatory for Bank Match" />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted">Joint Holder Registered Designation</label>
            <input
              type="text"
              value={formData.joint_holder}
              onChange={(e) => setFormData({ ...formData, joint_holder: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-card border border-line text-ink focus:outline-none focus:border-brand"
            />
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={formData.aicte_lien_endorsed}
              onChange={(e) =>
                setFormData({ ...formData, aicte_lien_endorsed: e.target.checked })
              }
              className="mt-0.5 h-4 w-4 rounded border-line text-brand focus:ring-brand"
            />
            <div className="text-xs">
              <span className="font-bold text-ink">
                Bank Certificate carries official AICTE Lien Endorsement Stamp
              </span>
              <p className="text-muted text-[11px] mt-0.5">
                Unchecking this will simulate a bank CBS discrepancy (Status: Returned) for testing the Fix-and-Resubmit workflow.
              </p>
            </div>
          </label>
        </div>

        {/* Remarks */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-ink">College Remarks / Submission Justification</label>
          <textarea
            rows={2}
            value={formData.remarks}
            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            className="w-full px-3.5 py-2 text-xs rounded-xl bg-surface border border-line text-ink focus:outline-none focus:border-brand"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-line pt-4">
          <Link to="/" className="btn btn-ghost text-xs w-full sm:w-auto">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary text-xs w-full sm:w-auto px-6 py-2.5"
          >
            {submitting ? 'Registering Security Deposit...' : 'Confirm & Submit FDR'}
            <ArrowRight size={14} />
          </button>
        </div>
      </form>
    </div>
  )
}
