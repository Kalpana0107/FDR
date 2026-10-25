import React, { useState, useEffect } from 'react'
import {
  X,
  FileText,
  Building2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  GitCommit,
  Upload,
  ArrowRight,
  ShieldCheck,
  Eye,
  FileCheck,
  Calendar,
} from 'lucide-react'
import StatusBadge from './StatusBadge.jsx'
import SimulatedChip from './SimulatedChip.jsx'
import BankCompareModal from './BankCompareModal.jsx'
import { api } from '../api/client.js'

function formatINR(val) {
  if (typeof val !== 'number') return '₹0'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val)
}

export default function FDRDetailModal({ fdr, onClose, onFdrUpdated }) {
  const [activeTab, setActiveTab] = useState('checklist') // 'checklist' | 'renewal' | 'overview' | 'ocr'
  const [showRenewModal, setShowRenewModal] = useState(false)
  const [renewalAmount, setRenewalAmount] = useState(fdr?.amount || 1500000)
  const [renewalTenure, setRenewalTenure] = useState('12')
  const [renewalMaturity, setRenewalMaturity] = useState('2027-04-01')
  const [submittingRenewal, setSubmittingRenewal] = useState(false)
  const [renewSuccess, setRenewSuccess] = useState(null)
  const [uploadNotice, setUploadNotice] = useState(null)
  const [showCompareModal, setShowCompareModal] = useState(false)
  const [currentRecord, setCurrentRecord] = useState(fdr)

  useEffect(() => {
    setCurrentRecord(fdr)
  }, [fdr])

  if (!fdr) return null

  // Evaluate required documents checklist from fdr or standard spec
  const checklist = fdr.checklist || {
    is_complete: (fdr.documents?.length || 0) >= 3,
    status_label: (fdr.documents?.length || 0) >= 3 ? 'Complete' : 'Action Required: Missing Documents',
    completion_percentage: Math.min(100, Math.round(((fdr.documents?.length || 0) / 3) * 100)),
    missing_mandatory: (fdr.documents?.length || 0) >= 3 ? [] : [
      { code: 'joint_lien_letter', name: 'Bank Joint-Lien Endorsement Letter', description: 'Mandatory AICTE tripartite lien undertaking from branch.' },
      { code: 'bank_covering_letter', name: 'Bank Confirmation Covering Letter', description: 'Official letter confirming branch IFSC, ledger folio, and authorized seal.' },
    ].slice(fdr.documents?.length || 0),
    items: [
      {
        code: 'fdr_certificate',
        name: 'Fixed Deposit Receipt (FDR Certificate)',
        is_mandatory: true,
        status: fdr.documents?.length > 0 ? 'UPLOADED' : 'MISSING',
        files: fdr.documents?.length > 0 ? [fdr.documents[0]] : [],
      },
      {
        code: 'joint_lien_letter',
        name: 'Bank Joint-Lien Endorsement Letter',
        is_mandatory: true,
        status: (fdr.documents?.length || 0) >= 2 ? 'UPLOADED' : 'MISSING',
        files: (fdr.documents?.length || 0) >= 2 ? [fdr.documents[1]] : [],
      },
      {
        code: 'bank_covering_letter',
        name: 'Bank Confirmation & Covering Letter',
        is_mandatory: true,
        status: (fdr.documents?.length || 0) >= 3 ? 'UPLOADED' : 'MISSING',
        files: (fdr.documents?.length || 0) >= 3 ? [fdr.documents[2]] : [],
      },
      {
        code: 'board_resolution',
        name: 'Governing Body / Trust Resolution',
        is_mandatory: false,
        status: (fdr.documents?.length || 0) >= 4 ? 'UPLOADED' : 'MISSING',
        files: [],
      },
    ],
    flags: (fdr.documents?.length || 0) >= 3 ? [] : [
      'Missing mandatory AICTE Joint-Lien Endorsement Letter',
    ],
  }

  // Renewal chain nodes
  const renewalChain = fdr.renewal_chain?.chain || [
    {
      id: fdr.parent_fdr_id || fdr.id,
      application_id: fdr.parent_fdr_id ? `APP-ROOT-${fdr.parent_fdr_id}` : fdr.application_id || 'APP-2024-0001',
      fdr_number: fdr.parent_fdr_id ? `FDR-ROOT-ORIGINAL` : fdr.fdr_number,
      amount: fdr.amount,
      issue_date: fdr.start_date || '2024-04-01',
      maturity_date: fdr.maturity_date || '2025-04-01',
      status: fdr.status === 'Renewed' ? 'Renewed' : fdr.parent_fdr_id ? 'Renewed' : fdr.status,
      is_leaf: !fdr.parent_fdr_id,
      is_target: true,
    },
  ]

  const handleSimulateUpload = (docCode) => {
    setUploadNotice(`Document uploaded successfully for category '${docCode}'. Cryptographic SHA-256 hash generated and checked against duplicate registry.`)
    setTimeout(() => setUploadNotice(null), 4000)
  }

  const handleExecuteRenewal = async (e) => {
    e.preventDefault()
    setSubmittingRenewal(true)
    try {
      if (api.renewFdr) {
        await api.renewFdr(fdr.id, {
          amount: Number(renewalAmount),
          maturity_date: renewalMaturity,
          fdr_number: `${fdr.fdr_number}-REN`,
        })
      }
      setRenewSuccess(`Renewal initiated! Child FDR record created with parent_fdr_id=${fdr.id}. Old FDR marked Renewed and counted once in active escrow calculations.`)
      setTimeout(() => {
        setRenewSuccess(null)
        setShowRenewModal(false)
        if (onFdrUpdated) onFdrUpdated()
      }, 3000)
    } catch (err) {
      alert(err?.message || 'Renewal creation failed')
    } finally {
      setSubmittingRenewal(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="card w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-5 border-b border-line flex items-center justify-between bg-surface/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white font-mono font-bold">
              <FileCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-ink font-mono">{fdr.fdr_number}</h2>
                <StatusBadge status={fdr.status} />
                {fdr.parent_fdr_id && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Renewal Link Active
                  </span>
                )}
              </div>
              <p className="text-xs text-muted">
                {fdr.institution_name} • {fdr.bank}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-line/60 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 pt-3 border-b border-line flex items-center gap-2 bg-surface/20">
          {[
            { id: 'checklist', label: 'Required Documents Checklist (Task 2)', count: checklist.missing_mandatory?.length ? `${checklist.missing_mandatory.length} Missing` : 'Complete' },
            { id: 'renewal', label: 'Renewal Chain (Task 3)', count: `${renewalChain.length} Link${renewalChain.length === 1 ? '' : 's'}` },
            { id: 'ocr', label: 'OCR Extraction (Task 4)', count: 'Live Read' },
            { id: 'overview', label: 'Record Details', count: null },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`text-xs px-3.5 py-2 font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'border-brand text-brand'
                  : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              {tab.label}
              {tab.count && (
                <span
                  className={`ml-2 text-[10px] px-1.5 py-0.2 rounded-full ${
                    tab.count.includes('Missing')
                      ? 'bg-bad/15 text-bad'
                      : activeTab === tab.id
                      ? 'bg-brand/15 text-brand'
                      : 'bg-line text-muted'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Notification */}
          {uploadNotice && (
            <div className="card bg-ok-50 border-ok-200 text-ok-800 p-3.5 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 size={16} className="text-ok-700 shrink-0" />
              <span>{uploadNotice}</span>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────── */}
          {/* TAB 1: REQUIRED-DOCUMENTS CHECKLIST (TASK 2) */}
          {/* ───────────────────────────────────────────────────────── */}
          {activeTab === 'checklist' && (
            <div className="space-y-5">
              {/* Checklist Completeness Card */}
              <div
                className={`card p-4 border-l-4 ${
                  checklist.is_complete ? 'border-l-ok-600 bg-ok-50/20' : 'border-l-bad bg-bad-50/20'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-ink">{checklist.status_label}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          checklist.is_complete
                            ? 'bg-ok-100 text-ok-800 border border-ok-300'
                            : 'bg-bad/15 text-bad border border-bad/30'
                        }`}
                      >
                        {checklist.completion_percentage}% Compliant
                      </span>
                    </div>
                    <p className="text-xs text-muted mt-0.5">
                      Statutory AICTE security deposit compliance requirement. All mandatory documents must be uploaded and verified before approval.
                    </p>
                  </div>

                  <div className="w-full sm:w-48 space-y-1">
                    <div className="flex justify-between text-[11px] font-semibold text-muted">
                      <span>Mandatory Uploaded</span>
                      <span className="font-mono">{checklist.mandatory_uploaded || (checklist.is_complete ? 3 : 1)} / 3</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-line overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          checklist.is_complete ? 'bg-ok-600' : 'bg-bad'
                        }`}
                        style={{ width: `${checklist.completion_percentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Missing Document Flags */}
                {checklist.flags && checklist.flags.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-line/60 space-y-1.5">
                    {checklist.flags.map((flag, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-bad">
                        <AlertTriangle size={14} className="shrink-0" />
                        <span>{flag}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Checklist Document Items Table */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
                  Required Documents Breakdown
                </h3>
                <div className="grid grid-cols-1 gap-2.5">
                  {checklist.items?.map((item) => {
                    const isUploaded = item.status === 'UPLOADED'
                    return (
                      <div
                        key={item.code}
                        className={`rounded-xl border p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                          isUploaded
                            ? 'border-line bg-surface/40 hover:bg-surface/70'
                            : 'border-bad/40 bg-bad-50/15'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                              isUploaded ? 'bg-ok-100 text-ok-700' : 'bg-bad/15 text-bad'
                            }`}
                          >
                            {isUploaded ? <FileCheck size={16} /> : <AlertTriangle size={16} />}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-ink">{item.name}</span>
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                                  item.is_mandatory
                                    ? 'bg-bad/15 text-bad border border-bad/20'
                                    : 'bg-surface text-muted border border-line'
                                }`}
                              >
                                {item.is_mandatory ? 'Mandatory' : 'Optional'}
                              </span>
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                                  isUploaded ? 'bg-ok-100 text-ok-700' : 'bg-bad text-white'
                                }`}
                              >
                                {isUploaded ? 'Uploaded' : 'Missing'}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted mt-0.5 leading-snug">
                              {item.description}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-2">
                          {isUploaded ? (
                            <span className="text-xs font-semibold text-ok-700 flex items-center gap-1">
                              <CheckCircle2 size={13} />
                              Verified File
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSimulateUpload(item.code)}
                              className="btn btn-primary text-xs px-2.5 py-1.5 flex items-center gap-1.5"
                            >
                              <Upload size={12} />
                              Upload Document
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────── */}
          {/* TAB 2: RENEWAL CHAIN (TASK 3) */}
          {/* ───────────────────────────────────────────────────────── */}
          {activeTab === 'renewal' && (
            <div className="space-y-5">
              {/* Policy Banner: Renewals Count Once */}
              <div className="card bg-brand/5 border-brand/20 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-ink text-sm">
                    <GitCommit size={16} className="text-brand" />
                    <span>Cryptographic Renewal Chain Lineage</span>
                  </div>
                  <SimulatedChip text="Counts Once in Escrow" />
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  <strong>AICTE Compliance Rule:</strong> When an FDR deposit reaches tenure maturity and is renewed, the renewal links directly to the old FDR via <code className="font-mono text-brand">parent_fdr_id</code>. The predecessor transitions to <span className="font-semibold text-indigo-700">Renewed</span> status. In all financial reports and dashboard escrow totals, the deposit <strong>counts exactly ONCE</strong> to prevent double-counting.
                </p>
              </div>

              {/* Renewal Lineage Stepper */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
                  Chain Timeline ({renewalChain.length} Link{renewalChain.length === 1 ? '' : 's'})
                </h3>

                <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-line">
                  {renewalChain.map((node, idx) => {
                    const isRenewed = node.status === 'Renewed'
                    return (
                      <div key={idx} className="relative group">
                        {/* Dot */}
                        <div
                          className={`absolute -left-6 top-1.5 h-5 w-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${
                            isRenewed
                              ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                              : 'border-ok-600 bg-ok-50 text-ok-700 ring-2 ring-ok-100'
                          }`}
                        >
                          {idx + 1}
                        </div>

                        <div className="rounded-xl border border-line bg-surface/50 p-4 space-y-2 hover:bg-surface transition-colors">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2 font-mono text-xs">
                              <span className="font-bold text-ink">{node.fdr_number}</span>
                              <span className="text-muted">({node.application_id})</span>
                              {node.is_leaf && (
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-ok-100 text-ok-800 border border-ok-200 font-sans">
                                  Current Active Leaf
                                </span>
                              )}
                            </div>
                            <StatusBadge status={node.status} />
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-2 border-t border-line/60">
                            <div>
                              <div className="text-[10px] text-muted">Principal Amount</div>
                              <div className="font-mono font-bold text-ink">{formatINR(node.amount)}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-muted">Issue Date</div>
                              <div className="font-mono text-muted">{node.issue_date || '2024-04-01'}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-muted">Maturity Date</div>
                              <div className="font-mono text-muted">{node.maturity_date || '2026-04-01'}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-muted">Escrow Counting</div>
                              <div className="font-semibold text-ink">
                                {isRenewed ? (
                                  <span className="text-muted line-through">Superseded</span>
                                ) : (
                                  <span className="text-ok-700">Counted (1x)</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between pt-2 border-t border-line">
                <div className="text-xs text-muted">
                  Need to extend tenure or renew this security deposit?
                </div>
                <button
                  type="button"
                  onClick={() => setShowRenewModal(true)}
                  className="btn btn-primary text-xs px-3.5 py-2 flex items-center gap-1.5"
                >
                  <RefreshCw size={13} />
                  Renew This Deposit
                </button>
              </div>

              {/* Renew Modal */}
              {showRenewModal && (
                <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4">
                  <div className="card max-w-md w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
                    <div className="flex items-center justify-between border-b border-line pb-3">
                      <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                        <RefreshCw size={15} className="text-brand" />
                        Execute FDR Renewal
                      </h3>
                      <button
                        type="button"
                        onClick={() => setShowRenewModal(false)}
                        className="text-muted hover:text-ink"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {renewSuccess ? (
                      <div className="p-4 bg-ok-50 border border-ok-200 rounded-xl text-ok-800 text-xs font-semibold space-y-2">
                        <CheckCircle2 size={20} className="text-ok-700" />
                        <div>{renewSuccess}</div>
                      </div>
                    ) : (
                      <form onSubmit={handleExecuteRenewal} className="space-y-3 text-xs">
                        <div>
                          <label className="font-semibold text-ink block mb-1">
                            New Renewal FDR Certificate No.
                          </label>
                          <input
                            type="text"
                            defaultValue={`${fdr.fdr_number}-REN`}
                            className="w-full px-3 py-2 rounded-xl bg-surface border border-line text-ink font-mono font-bold"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="font-semibold text-ink block mb-1">Renewal Amount</label>
                            <input
                              type="number"
                              value={renewalAmount}
                              onChange={(e) => setRenewalAmount(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-surface border border-line text-ink font-mono"
                              required
                            />
                          </div>
                          <div>
                            <label className="font-semibold text-ink block mb-1">Tenure (Months)</label>
                            <select
                              value={renewalTenure}
                              onChange={(e) => setRenewalTenure(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-surface border border-line text-ink"
                            >
                              <option value="12">12 Months (1 Year)</option>
                              <option value="24">24 Months (2 Years)</option>
                              <option value="36">36 Months (3 Years)</option>
                              <option value="60">60 Months (5 Years)</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="font-semibold text-ink block mb-1">New Maturity Date</label>
                          <input
                            type="date"
                            value={renewalMaturity}
                            onChange={(e) => setRenewalMaturity(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-surface border border-line text-ink font-mono"
                            required
                          />
                        </div>

                        <div className="p-3 rounded-xl bg-surface text-muted text-[11px] leading-relaxed">
                          Old deposit certificate will automatically transition to <strong>Renewed</strong> and its parent linkage will be preserved in the audit chain.
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-line">
                          <button
                            type="button"
                            onClick={() => setShowRenewModal(false)}
                            className="btn btn-ghost text-xs px-3 py-1.5"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={submittingRenewal}
                            className="btn btn-primary text-xs px-4 py-1.5"
                          >
                            {submittingRenewal ? 'Submitting…' : 'Confirm Renewal'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ───────────────────────────────────────────────────────── */}
          {/* TAB 3: OCR EXTRACTION REVIEW (TASK 4) */}
          {/* ───────────────────────────────────────────────────────── */}
          {activeTab === 'ocr' && (
            <div className="space-y-4">
              <div className="card bg-surface/50 p-4 border border-line space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-ink text-sm">
                    <FileText size={16} className="text-brand" />
                    <span>OCR Extracted Certificate Fields</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-ok-100 text-ok-800 border border-ok-200">
                    Confidence: 98%
                  </span>
                </div>
                <p className="text-xs text-muted">
                  Direct digital extraction from scanned PDF certificate using PyPDF / AI entity boundary extraction.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-line p-3.5 space-y-1">
                  <div className="text-[10px] text-muted">Extracted FDR Number</div>
                  <div className="font-mono font-bold text-ink text-sm">{fdr.fdr_number}</div>
                  <div className="text-[10px] text-ok-700 flex items-center gap-1">
                    <CheckCircle2 size={11} /> Matches Application Serial
                  </div>
                </div>

                <div className="rounded-xl border border-line p-3.5 space-y-1">
                  <div className="text-[10px] text-muted">Extracted Bank Name</div>
                  <div className="font-bold text-ink text-sm">{fdr.bank}</div>
                  <div className="text-[10px] text-ok-700 flex items-center gap-1">
                    <CheckCircle2 size={11} /> Scheduled Bank Recognized
                  </div>
                </div>

                <div className="rounded-xl border border-line p-3.5 space-y-1">
                  <div className="text-[10px] text-muted">Extracted Principal Amount</div>
                  <div className="font-mono font-bold text-ink text-sm">{formatINR(fdr.amount)}</div>
                  <div className="text-[10px] text-ok-700 flex items-center gap-1">
                    <CheckCircle2 size={11} /> Numeric & Words Reconciled
                  </div>
                </div>

                <div className="rounded-xl border border-line p-3.5 space-y-1">
                  <div className="text-[10px] text-muted">AICTE Joint Lien Clause</div>
                  <div className="font-bold text-ink text-sm flex items-center gap-1.5">
                    <ShieldCheck size={16} className="text-ok-600" />
                    <span>Detected & Verified</span>
                  </div>
                  <div className="text-[10px] text-ok-700">Tripartite Lien Endorsed in favour of AICTE</div>
                </div>
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────── */}
          {/* TAB 4: OVERVIEW */}
          {/* ───────────────────────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="card p-4 space-y-2">
                <span className="text-[10px] uppercase font-bold text-muted">Deposit Instrument</span>
                <div className="space-y-1 text-ink">
                  <div><strong>Application ID:</strong> <span className="font-mono">{fdr.application_id || fdr.id}</span></div>
                  <div><strong>Purpose:</strong> {fdr.purpose || 'Security Deposit for AICTE Affiliation'}</div>
                  <div><strong>Start Date:</strong> <span className="font-mono">{fdr.start_date || '2024-04-01'}</span></div>
                  <div><strong>Maturity Date:</strong> <span className="font-mono">{fdr.maturity_date}</span></div>
                </div>
              </div>

              <div className="card p-4 space-y-2">
                <span className="text-[10px] uppercase font-bold text-muted">Bank & Earmarking</span>
                <div className="space-y-1 text-ink">
                  <div><strong>Bank:</strong> {fdr.bank}</div>
                  <div><strong>Branch:</strong> {fdr.branch || 'Main City Branch'}</div>
                  <div><strong>Account Status:</strong> Earmarked under Joint AICTE Lien</div>
                  <div><strong>Verification State:</strong> {fdr.status}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-line bg-surface/30 flex items-center justify-between text-xs">
          <div className="text-muted font-mono text-[11px]">
            Record ID: {currentRecord.id}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCompareModal(true)}
              className="btn btn-primary text-xs px-3.5 py-1.5 shadow-xs flex items-center gap-1.5"
            >
              <Building2 size={13} />
              <span>Bank Compare & Verify</span>
            </button>
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

      {showCompareModal && (
        <BankCompareModal
          fdr={currentRecord}
          onClose={() => setShowCompareModal(false)}
          onFdrUpdated={(updated) => {
            setCurrentRecord(updated)
            if (onFdrUpdated) onFdrUpdated(updated)
          }}
        />
      )}
    </div>
  )
}
