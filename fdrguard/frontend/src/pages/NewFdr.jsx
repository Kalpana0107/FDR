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
    <div className="max-w-4xl mx-auto space-y-6 text-slate-800">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Link to="/" className="text-xs text-slate-400 hover:text-indigo-600 font-medium transition-colors">
              Home
            </Link>
            <span className="text-slate-300 text-xs">/</span>
            <span className="text-xs text-slate-700 font-medium">Submit New FDR</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1 font-heading">
            Submit Fixed Deposit Receipt
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            AICTE Western Regional Bureau Escrow & Compliance Registration
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 text-xs font-medium">
            OCR Engine Simulated
          </span>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700 flex items-center gap-2">
          <AlertTriangle size={15} className="shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Step 1: Upload Document Card */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
              1
            </span>
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Upload FDR Certificate Scan
            </h2>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Supports PDF, PNG, JPG</span>
        </div>

        <div className="relative border border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-6 sm:p-8 text-center transition-all bg-slate-50/50 hover:bg-slate-50">
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            id="fdr-upload-input"
          />

          {analyzing ? (
            <div className="space-y-3 py-4">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 animate-pulse">
                <Sparkles size={22} />
              </div>
              <div className="text-sm font-semibold text-slate-800">
                Simulated AI Engine: Running OCR & Lien Extraction...
              </div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Parsing bank seals, fixed deposit certificate text, and joint lien endorsements.
              </p>
            </div>
          ) : file ? (
            <div className="space-y-2 py-2">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <FileCheck2 size={20} />
              </div>
              <div className="text-sm font-semibold text-slate-800 font-mono tracking-tight">{file.name}</div>
              <div className="text-xs text-emerald-600 font-medium flex items-center justify-center gap-1">
                <CheckCircle2 size={13} />
                OCR Extraction Completed ({Math.round(ocrConfidence * 100)}% Confidence)
              </div>
              <p className="text-[11px] text-slate-400">Click or drop another file to replace</p>
            </div>
          ) : (
            <div className="space-y-2 py-4">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white text-indigo-600 border border-slate-200 shadow-2xs">
                <UploadCloud size={22} />
              </div>
              <div className="text-sm font-semibold text-slate-800">
                Drag and drop your bank FDR certificate, or browse
              </div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Upload official bank deposit receipt containing account number, interest rate, and AICTE joint lien endorsement.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Step 2: Confirm OCR Fields Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200/80 rounded-xl shadow-xs p-5 sm:p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
              2
            </span>
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Confirm & Edit Extracted Fields
            </h2>
          </div>
          {ocrCompleted && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
              <Sparkles size={12} />
              OCR Auto-Populated
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* FDR Number */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              FDR Receipt Number *
            </label>
            <input
              type="text"
              required
              value={formData.fdr_number}
              onChange={(e) => setFormData({ ...formData, fdr_number: e.target.value })}
              placeholder="e.g. FDR-2026-000192"
              className="w-full px-3 py-2 text-xs rounded-lg bg-white border border-slate-200 text-slate-800 font-mono font-semibold tracking-tight focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
            />
          </div>

          {/* Institution */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Institution Name
            </label>
            <input
              type="text"
              required
              value={formData.institution_name}
              onChange={(e) => setFormData({ ...formData, institution_name: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg bg-white border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
            />
          </div>

          {/* Issuing Bank */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Issuing Scheduled Bank *
            </label>
            <input
              type="text"
              required
              value={formData.bank}
              onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg bg-white border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
            />
          </div>

          {/* Branch Name */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Bank Branch
            </label>
            <input
              type="text"
              value={formData.branch}
              onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg bg-white border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
            />
          </div>

          {/* Principal Amount */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Principal Deposit Amount (INR) *
            </label>
            <input
              type="number"
              required
              min="10000"
              step="1000"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
              className="w-full px-3 py-2 text-xs rounded-lg bg-white border border-slate-200 text-slate-800 font-mono font-semibold tracking-tight focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
            />
          </div>

          {/* Rate of Interest */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Rate of Interest (% p.a.)
            </label>
            <input
              type="number"
              step="0.05"
              value={formData.roi}
              onChange={(e) => setFormData({ ...formData, roi: Number(e.target.value) })}
              className="w-full px-3 py-2 text-xs rounded-lg bg-white border border-slate-200 text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
            />
          </div>

          {/* Start Date */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Deposit Start Date
            </label>
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg bg-white border border-slate-200 text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
            />
          </div>

          {/* Maturity Date */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Maturity Date *
            </label>
            <input
              type="date"
              required
              value={formData.maturity_date}
              onChange={(e) => setFormData({ ...formData, maturity_date: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg bg-white border border-slate-200 text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
            />
          </div>
        </div>

        {/* Joint Holder & AICTE Lien Endorsement */}
        <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800">
              AICTE Joint Holder & Earmarking Clause
            </span>
            <span className="rounded bg-slate-200/60 px-1.5 py-0.5 text-[9px] font-medium text-slate-600">
              Mandatory for Bank Match
            </span>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Joint Holder Registered Designation
            </label>
            <input
              type="text"
              value={formData.joint_holder}
              onChange={(e) => setFormData({ ...formData, joint_holder: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg bg-white border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
            />
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={formData.aicte_lien_endorsed}
              onChange={(e) =>
                setFormData({ ...formData, aicte_lien_endorsed: e.target.checked })
              }
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20"
            />
            <div className="text-xs">
              <span className="font-semibold text-slate-800">
                Bank Certificate carries official AICTE Lien Endorsement Stamp
              </span>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Unchecking this will simulate a bank CBS discrepancy (Status: Returned) for testing the Fix-and-Resubmit workflow.
              </p>
            </div>
          </label>
        </div>

        {/* Remarks */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            College Remarks / Submission Justification
          </label>
          <textarea
            rows={2}
            value={formData.remarks}
            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            className="w-full px-3 py-2 text-xs rounded-lg bg-white border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <Link
            to="/"
            className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-lg px-3.5 py-2 transition-all w-full sm:w-auto text-center"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg shadow-xs px-4 py-2.5 transition-all inline-flex items-center justify-center gap-1.5 w-full sm:w-auto cursor-pointer disabled:opacity-50"
          >
            {submitting ? 'Registering Security Deposit...' : 'Confirm & Submit FDR'}
            <ArrowRight size={14} />
          </button>
        </div>
      </form>
    </div>
  )
}
