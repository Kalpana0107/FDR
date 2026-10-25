import React from 'react'
import { ShieldCheck, CheckCircle2, Download, Printer, ExternalLink, QrCode } from 'lucide-react'
import SimulatedChip from './SimulatedChip.jsx'

function formatINR(val) {
  if (typeof val !== 'number') return '₹0'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val)
}

export default function QrReceiptCard({ release, fdr, onClose }) {
  if (!release && !fdr) return null

  const certId = `AICTE-REL-CERT-${(release?.id || fdr?.id || '001').toUpperCase()}`
  const hash =
    release?.release_hash ||
    fdr?.release_info?.release_hash ||
    '9e7b2f0a1c843e9d821045fbca3792ef88019a71'
  const approvedAt = release?.approved_at || fdr?.release_info?.approved_at || '2026-10-25T11:00:00Z'

  return (
    <div className="card p-0 overflow-hidden border-2 border-line bg-card shadow-lg max-w-2xl mx-auto">
      {/* Boarding-Pass Top Strip */}
      <div className="bg-navy p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-sm">
            <ShieldCheck size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-extrabold text-base tracking-tight text-white">
                All India Council for Technical Education
              </span>
            </div>
            <p className="text-xs text-white/80">
              Western Regional Bureau • Security Deposit Release Certificate
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <SimulatedChip text="Dual-Key HSM Sealed" className="bg-white/10 text-white border-white/20" />
        </div>
      </div>

      {/* Perforated ticket divider */}
      <div className="relative border-b-2 border-dashed border-line bg-surface py-2 px-6 flex items-center justify-between text-[11px] text-muted">
        <span className="font-mono font-semibold text-ink">CERT: {certId}</span>
        <span className="font-mono">ISSUED: {approvedAt.split('T')[0]}</span>
      </div>

      {/* Main Ticket Content */}
      <div className="p-6 space-y-6">
        {/* Core Deposit Data Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-muted tracking-wider">
              Beneficiary Institution
            </span>
            <div className="font-bold text-sm text-ink leading-tight">
              {fdr?.institution_name || release?.institution_name || 'Sample Institute of Technology'}
            </div>
            <div className="text-[11px] text-muted font-mono">
              Inst ID: {fdr?.institution_id || release?.institution_id || 'inst_01'}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-muted tracking-wider">
              Fixed Deposit Receipt #
            </span>
            <div className="font-mono font-extrabold text-base text-brand">
              {fdr?.fdr_number || release?.fdr_number || 'FDR-2025-000101'}
            </div>
            <div className="text-[11px] text-muted">
              {fdr?.bank || release?.bank || 'State Bank of India'}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-muted tracking-wider">
              Refunded Principal Escrow
            </span>
            <div className="font-mono font-extrabold text-xl text-ink">
              {formatINR(fdr?.amount || release?.amount || 1500000)}
            </div>
            <div className="text-[11px] text-ok-700 font-semibold flex items-center gap-1">
              <CheckCircle2 size={13} />
              AICTE Lien Discharged
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-muted tracking-wider">
              Reason for Discharge
            </span>
            <p className="text-xs text-ink leading-relaxed">
              {release?.reason || 'Tenure completion & statutory program compliance cleared.'}
            </p>
          </div>
        </div>

        {/* Dual-Key Signatures */}
        <div className="rounded-xl border border-line bg-surface/70 p-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-ink">
            <span>Dual-Person Rule Cryptographic Authorization</span>
            <SimulatedChip text="Simulated HSM Signatures" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="border border-line bg-card rounded-lg p-3 space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted">Primary Reviewer</span>
              <div className="font-semibold text-ink">
                {release?.reviewer_name || 'Anita Deshmukh (AICTE Officer)'}
              </div>
              <div className="text-[10px] text-ok-700 font-medium">Compliance Audit Verified</div>
            </div>
            <div className="border border-line bg-card rounded-lg p-3 space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted">Sign-off Authority (OTP)</span>
              <div className="font-semibold text-ink">
                {release?.approver_name || 'Prof. K. Venkatesh (Approver)'}
              </div>
              <div className="text-[10px] text-ok-700 font-medium">Dual-Key Signature Ingested</div>
            </div>
          </div>
        </div>

        {/* QR Code & Tamper-Evident Hash Block */}
        <div className="flex flex-col sm:flex-row items-center gap-4 rounded-xl border border-line bg-card p-4">
          {/* Simulated QR Pattern */}
          <div className="flex flex-col items-center gap-1 shrink-0 p-2 rounded-xl border border-line bg-white">
            <QrCode size={80} className="text-ink" />
            <span className="text-[9px] font-mono text-muted uppercase">Scan to Verify</span>
          </div>

          <div className="flex-1 space-y-1.5 text-center sm:text-left min-w-0">
            <div className="text-[10px] uppercase font-bold text-muted">
              Tamper-Evident SHA-256 Receipt Hash
            </div>
            <div className="font-mono text-xs text-brand break-all bg-surface p-2 rounded-lg border border-line select-all">
              {hash}
            </div>
            <p className="text-[11px] text-muted">
              Publicly verifiable against the immutable audit chain ledger.
            </p>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="border-t border-line bg-surface/50 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-muted">
          Official AICTE SIH 2026 Prototype Digital Seal
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="btn btn-ghost text-xs"
          >
            <Printer size={14} />
            Print Certificate
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="btn btn-primary text-xs"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
