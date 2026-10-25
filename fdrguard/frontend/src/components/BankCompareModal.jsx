import React, { useState } from 'react'
import {
  X,
  Building2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  ArrowRight,
  ShieldCheck,
  FileText,
  ExternalLink,
  Send,
  Zap,
  Info,
  Check,
  Ban,
  RotateCcw,
} from 'lucide-react'
import StatusBadge from './StatusBadge.jsx'
import SimulatedChip from './SimulatedChip.jsx'
import { api } from '../api/client.js'

function formatINR(val) {
  if (typeof val !== 'number') return '₹0'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val)
}

export default function BankCompareModal({ fdr, onClose, onFdrUpdated }) {
  const [currentFdr, setCurrentFdr] = useState(fdr)
  const [verifying, setVerifying] = useState(false)
  const [pingLatency, setPingLatency] = useState(null)
  const [officerRemark, setOfficerRemark] = useState('')
  const [transitioning, setTransitioning] = useState(false)
  const [actionSuccess, setActionSuccess] = useState(null)
  const [actionError, setActionError] = useState(null)

  if (!currentFdr) return null

  const submitted = currentFdr.bank_comparison?.submitted || {
    fdr_number: currentFdr.fdr_number,
    amount: currentFdr.amount,
    bank: currentFdr.bank,
    maturity_date: currentFdr.maturity_date,
    lien_marked: currentFdr.aicte_lien_endorsed ? 'Yes (AICTE Lien Active)' : 'No Lien Clause Attached',
  }

  const cbs = currentFdr.bank_comparison?.cbs_live || {
    fdr_number: currentFdr.fdr_number,
    amount: currentFdr.amount,
    bank: currentFdr.bank,
    maturity_date: currentFdr.maturity_date,
    lien_marked: currentFdr.aicte_lien_endorsed ? 'Yes (AICTE Lien Active)' : 'Not Marked (Free Deposit)',
    account_status: currentFdr.status === 'Active' ? 'Earmarked in CBS' : 'Pending Verification',
  }

  const matchStatus = currentFdr.bank_comparison?.match_status || (
    currentFdr.aicte_lien_endorsed ? 'Full Match' : 'Mismatch - Lien Missing'
  )

  const discrepancies = currentFdr.bank_comparison?.discrepancies || (
    currentFdr.aicte_lien_endorsed
      ? []
      : ['AICTE mandatory joint-holder lien clause omitted by issuing bank branch']
  )

  const isFullMatch = matchStatus === 'Full Match' || currentFdr.verification?.cbs_match

  // Trigger simulated live bank CBS query
  const handleTriggerBankVerify = async () => {
    setVerifying(true)
    setActionError(null)
    const startTime = performance.now()
    try {
      const updated = await api.verifyBank(currentFdr.id)
      const endTime = performance.now()
      setPingLatency(Math.round(endTime - startTime) + 140)
      setCurrentFdr({ ...updated })
      if (onFdrUpdated) onFdrUpdated(updated)
      setActionSuccess('Bank CBS live inquiry completed. Ledger synchronized successfully.')
      setTimeout(() => setActionSuccess(null), 5000)
    } catch (err) {
      setActionError(err?.message || 'CBS API query timeout or network failure')
    } finally {
      setVerifying(false)
    }
  }

  // Officer transition actions
  const handleTransition = async (toStatus) => {
    setTransitioning(true)
    setActionError(null)
    try {
      const remarkText =
        officerRemark.trim() ||
        (toStatus === 'Verified'
          ? 'CBS verification parameters validated. Deposit approved for active escrow.'
          : toStatus === 'Returned'
          ? 'Returned to college for rectification of bank discrepancies.'
          : 'Deposit marked as rejected due to non-compliance.')

      const updated = await api.transitionFdr(
        currentFdr.id,
        toStatus,
        remarkText,
        'Anita Deshmukh',
        'AICTE Officer',
      )

      setCurrentFdr({ ...updated })
      if (onFdrUpdated) onFdrUpdated(updated)
      setActionSuccess(`FDR status successfully updated to "${toStatus}".`)
      setOfficerRemark('')
      setTimeout(() => setActionSuccess(null), 4000)
    } catch (err) {
      setActionError(err?.message || 'Failed to update FDR status')
    } finally {
      setTransitioning(false)
    }
  }

  const comparisonFields = [
    {
      label: 'FDR Certificate Number',
      submittedVal: submitted.fdr_number || currentFdr.fdr_number,
      cbsVal: cbs.fdr_number || currentFdr.fdr_number,
      isMono: true,
      matches: (submitted.fdr_number || currentFdr.fdr_number) === (cbs.fdr_number || currentFdr.fdr_number),
    },
    {
      label: 'Issuing Bank Name',
      submittedVal: submitted.bank || currentFdr.bank,
      cbsVal: cbs.bank || currentFdr.bank,
      isMono: false,
      matches: true,
    },
    {
      label: 'Principal Amount',
      submittedVal: formatINR(submitted.amount || currentFdr.amount),
      cbsVal: formatINR(cbs.amount || currentFdr.amount),
      isMono: true,
      matches: Number(submitted.amount || currentFdr.amount) === Number(cbs.amount || currentFdr.amount),
    },
    {
      label: 'Maturity Expiry Date',
      submittedVal: submitted.maturity_date || currentFdr.maturity_date,
      cbsVal: cbs.maturity_date || currentFdr.maturity_date,
      isMono: true,
      matches: (submitted.maturity_date || currentFdr.maturity_date) === (cbs.maturity_date || currentFdr.maturity_date),
    },
    {
      label: 'AICTE Joint-Lien Endorsement',
      submittedVal: submitted.lien_marked || (currentFdr.aicte_lien_endorsed ? 'Yes (AICTE Joint Holder)' : 'No Lien Marked'),
      cbsVal: cbs.lien_marked || (currentFdr.aicte_lien_endorsed ? 'Yes (Lien Code: AICTE-SEC-DEP)' : 'Not Marked (Free Deposit)'),
      isMono: false,
      matches: currentFdr.aicte_lien_endorsed && !cbs.lien_marked?.toLowerCase().includes('not marked'),
    },
    {
      label: 'Account Earmark Status',
      submittedVal: currentFdr.aicte_lien_endorsed ? 'Pledged to AICTE Western Region' : 'Unrestricted Deposit',
      cbsVal: cbs.account_status || (currentFdr.verification?.cbs_match ? 'Earmarked in CBS' : 'Unencumbered'),
      isMono: false,
      matches: Boolean(currentFdr.verification?.cbs_match || currentFdr.aicte_lien_endorsed),
    },
    {
      label: 'Branch / IFSC Code',
      submittedVal: `${currentFdr.branch || 'Main Branch'} (${currentFdr.ifsc_code || 'SBIN0001092'})`,
      cbsVal: `${currentFdr.branch || 'Main Branch'} (${currentFdr.ifsc_code || 'SBIN0001092'})`,
      isMono: true,
      matches: true,
    },
    {
      label: 'CBS Transaction Reference',
      submittedVal: 'Awaiting Bank CBS Sync',
      cbsVal: currentFdr.verification?.bank_ref || 'Pending Handshake',
      isMono: true,
      matches: Boolean(currentFdr.verification?.bank_ref),
    },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-ink/60 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bank-compare-modal-title"
    >
      <div className="relative w-full max-w-5xl rounded-2xl bg-card border border-line shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-surface/70">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-xs">
              <Building2 size={20} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 id="bank-compare-modal-title" className="text-base sm:text-lg font-bold text-ink">
                  Bank Reconciliation & Comparison
                </h2>
                <StatusBadge status={currentFdr.status} />
                <SimulatedChip text="Simulated CBS API Gateway" />
              </div>
              <div className="text-xs text-muted flex items-center gap-2 mt-0.5">
                <span>FDR: <strong className="font-mono text-ink">{currentFdr.fdr_number}</strong></span>
                <span>•</span>
                <span className="truncate max-w-sm">{currentFdr.institution_name}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-muted hover:text-ink hover:bg-surface border border-line cursor-pointer transition-colors"
            aria-label="Close Bank Comparison View"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Action Success / Error Notifications */}
          {actionSuccess && (
            <div className="p-3.5 rounded-xl bg-ok-50 border border-ok-200 text-ok-800 text-xs font-semibold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-ok-700 shrink-0" />
                <span>{actionSuccess}</span>
              </div>
              <button
                type="button"
                onClick={() => setActionSuccess(null)}
                className="text-ok-700 hover:text-ok-900 font-bold ml-2"
              >
                Dismiss
              </button>
            </div>
          )}

          {actionError && (
            <div className="p-3.5 rounded-xl bg-bad-50 border border-bad-200 text-bad-800 text-xs font-semibold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-bad-700 shrink-0" />
                <span>{actionError}</span>
              </div>
              <button
                type="button"
                onClick={() => setActionError(null)}
                className="text-bad-700 hover:text-bad-900 font-bold ml-2"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Top Status & Reconciliation Banner */}
          <div
            className={`rounded-2xl p-4 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              isFullMatch
                ? 'bg-ok-50/70 border-ok-200'
                : matchStatus.includes('Mismatch') || !currentFdr.aicte_lien_endorsed
                ? 'bg-bad-50/60 border-bad-200'
                : 'bg-warn-50/60 border-warn-200'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-white text-xs font-bold ${
                    isFullMatch
                      ? 'bg-ok-700'
                      : matchStatus.includes('Mismatch') || !currentFdr.aicte_lien_endorsed
                      ? 'bg-bad-700'
                      : 'bg-warn-700'
                  }`}
                >
                  {isFullMatch ? <Check size={14} /> : <AlertTriangle size={14} />}
                </span>
                <span className="text-sm font-bold text-ink">
                  Reconciliation Outcome: {matchStatus}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    isFullMatch
                      ? 'bg-ok-100 text-ok-800'
                      : 'bg-bad-100 text-bad-800'
                  }`}
                >
                  {isFullMatch ? 'Passed Verification' : 'Discrepancy Flagged'}
                </span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                {isFullMatch
                  ? 'All parameters between college submission, OCR extraction, and simulated Core Banking System match with 100% confidence.'
                  : 'Critical discrepancy detected: Bank CBS ledger does not contain the mandatory AICTE joint-lien endorsement clause.'}
              </p>
            </div>

            {/* Trigger Bank CBS Live verification Button */}
            <div className="shrink-0 flex flex-col items-end gap-1">
              <button
                type="button"
                onClick={handleTriggerBankVerify}
                disabled={verifying}
                className="btn btn-primary text-xs px-4 py-2 flex items-center gap-2 shadow-xs"
              >
                <RefreshCw size={14} className={verifying ? 'animate-spin' : ''} />
                <span>{verifying ? 'Querying Bank CBS…' : 'Query Bank CBS Live (Simulated)'}</span>
              </button>
              {pingLatency && (
                <span className="text-[10px] font-mono text-muted">
                  Gateway latency: <span className="text-ok-700 font-bold">{pingLatency} ms</span> • Host: sbi.cbs.api
                </span>
              )}
            </div>
          </div>

          {/* Discrepancies Box if any */}
          {discrepancies.length > 0 && (
            <div className="card bg-bad-50/40 border-bad-200/80 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-bad-800">
                <AlertTriangle size={15} className="text-bad-700" />
                <span>Detected Discrepancies Requiring Officer Attention:</span>
              </div>
              <ul className="list-disc list-inside text-xs text-bad-700 space-y-1 pl-1">
                {discrepancies.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Side-by-Side Comparison Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                <span>Submitted vs Bank Live Values</span>
                <span className="text-[11px] text-muted font-normal">
                  (Field-by-Field Cross Verification)
                </span>
              </h3>
              <div className="text-[11px] text-muted flex items-center gap-2">
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-ok-700" /> Exact Match
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-bad-700" /> Mismatch
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-line overflow-hidden bg-card">
              <div className="grid grid-cols-12 bg-surface text-[11px] font-bold uppercase tracking-wider text-muted px-4 py-3 border-b border-line">
                <div className="col-span-3">Attribute / Field</div>
                <div className="col-span-4">Submitted & OCR Extracted</div>
                <div className="col-span-4">Bank CBS Live Record</div>
                <div className="col-span-1 text-center">Status</div>
              </div>

              <div className="divide-y divide-line text-xs">
                {comparisonFields.map((field, idx) => (
                  <div
                    key={idx}
                    className={`grid grid-cols-12 px-4 py-3 items-center transition-colors ${
                      !field.matches ? 'bg-bad-50/20' : 'hover:bg-surface/50'
                    }`}
                  >
                    <div className="col-span-3 font-semibold text-ink">
                      {field.label}
                    </div>

                    <div className={`col-span-4 pr-3 ${field.isMono ? 'font-mono' : ''} text-ink/90`}>
                      <span className={!field.matches ? 'font-bold text-bad-800' : ''}>
                        {field.submittedVal}
                      </span>
                    </div>

                    <div className={`col-span-4 pr-3 ${field.isMono ? 'font-mono' : ''} text-ink/90`}>
                      <span className={!field.matches ? 'font-bold text-bad-800' : ''}>
                        {field.cbsVal}
                      </span>
                    </div>

                    <div className="col-span-1 flex justify-center">
                      {field.matches ? (
                        <span
                          className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-ok-50 text-ok-700 border border-ok-200"
                          title="Verified Match"
                        >
                          <Check size={12} />
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-bad-50 text-bad-700 border border-bad-200"
                          title="Value Mismatch"
                        >
                          <X size={12} />
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Supporting Verification Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* College OCR Confidence Card */}
            <div className="card p-4 space-y-2 bg-surface/40">
              <div className="flex items-center justify-between text-xs text-muted">
                <span className="font-bold text-ink uppercase tracking-wider text-[10px]">
                  Document OCR Smart-Check
                </span>
                <span className="font-mono font-bold text-brand">
                  {(currentFdr.ocr_data?.confidence * 100 || 96).toFixed(0)}% Confidence
                </span>
              </div>
              <div className="text-xs text-ink/80 space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted">Document:</span>
                  <span className="font-mono text-ink font-semibold truncate max-w-[200px]">
                    {currentFdr.documents?.[0]?.name || 'FDR_Certificate.pdf'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Lien Clause in Text:</span>
                  <span className="font-semibold text-ink">
                    {currentFdr.ocr_data?.lien_clause_detected ? 'Detected & Highlighted' : 'Not Found in Scan'}
                  </span>
                </div>
              </div>
            </div>

            {/* Core Banking Host Card */}
            <div className="card p-4 space-y-2 bg-surface/40">
              <div className="flex items-center justify-between text-xs text-muted">
                <span className="font-bold text-ink uppercase tracking-wider text-[10px]">
                  Simulated CBS Nodal Gateway
                </span>
                <SimulatedChip text="CBS Simulator" />
              </div>
              <div className="text-xs text-ink/80 space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted">Verification Authority:</span>
                  <span className="font-semibold text-ink">
                    {currentFdr.verification?.verified_by || 'Awaiting CBS Handshake'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Bank Ref Token:</span>
                  <span className="font-mono text-xs text-brand font-bold">
                    {currentFdr.verification?.bank_ref || 'PENDING-TOKEN'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Officer Scrutiny Remarks & Actions */}
          <div className="card p-4 space-y-3 bg-surface/50 border-line">
            <label htmlFor="officer-remarks-input" className="text-xs font-bold text-ink block">
              Officer Scrutiny Remarks & Audit Log
            </label>
            <textarea
              id="officer-remarks-input"
              rows={2}
              value={officerRemark}
              onChange={(e) => setOfficerRemark(e.target.value)}
              placeholder="Enter official officer remarks or deficiency rationale to record in the permanent audit chain…"
              className="w-full text-xs p-3 rounded-xl bg-card border border-line text-ink placeholder:text-muted focus:outline-none focus:border-brand"
            />

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="text-[11px] text-muted">
                Logged Officer: <strong className="text-ink">Anita Deshmukh (AICTE Western Region)</strong>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={transitioning}
                  onClick={() => handleTransition('Returned')}
                  className="btn btn-ghost text-xs px-3.5 py-2 border-line hover:bg-warn-50 hover:text-warn-800 text-ink"
                >
                  <RotateCcw size={14} className="text-warn-700" />
                  <span>Return to College</span>
                </button>

                <button
                  type="button"
                  disabled={transitioning}
                  onClick={() => handleTransition('Failed')}
                  className="btn btn-danger text-xs px-3.5 py-2"
                >
                  <Ban size={14} />
                  <span>Reject / Mark Failed</span>
                </button>

                <button
                  type="button"
                  disabled={transitioning}
                  onClick={() => handleTransition('Verified')}
                  className="btn btn-primary text-xs px-4 py-2 shadow-xs"
                >
                  <CheckCircle2 size={14} />
                  <span>Approve & Verify Deposit</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-line bg-surface/70 text-xs text-muted">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <ShieldCheck size={14} className="text-brand" />
            <span>AICTE Escrow Integrity • Dual-Signed Ledger</span>
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
