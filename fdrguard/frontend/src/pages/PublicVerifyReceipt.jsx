import React, { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  QrCode,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Search,
  Building2,
  Calendar,
  Lock,
  Printer,
  Copy,
  Check,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Award,
} from 'lucide-react'
import { api } from '../api/client.js'
import StatusBadge from '../components/StatusBadge.jsx'
import SimulatedChip from '../components/SimulatedChip.jsx'
import LoadingState from '../components/LoadingState.jsx'

function formatINR(val) {
  if (typeof val !== 'number') return '₹0'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val)
}

export default function PublicVerifyReceipt() {
  const [searchParams, setSearchParams] = useSearchParams()
  const defaultHash = '9e7b2f0a1c843e9d821045fbca3792ef189c42bd0178394aeb56cf102984abcd'
  const hashFromUrl = searchParams.get('hash') || defaultHash

  const [inputHash, setInputHash] = useState(hashFromUrl)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [receiptData, setReceiptData] = useState(null)
  const [copied, setCopied] = useState(false)

  const verifyHash = async (hashToVerify) => {
    if (!hashToVerify || !hashToVerify.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.getReceipt(hashToVerify.trim())
      setReceiptData(res)
    } catch (err) {
      setError(err?.message || 'Invalid or unrecognized release hash signature.')
      setReceiptData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (hashFromUrl) {
      setInputHash(hashFromUrl)
      verifyHash(hashFromUrl)
    }
  }, [hashFromUrl])

  const handleSubmit = (e) => {
    e.preventDefault()
    setSearchParams({ hash: inputHash.trim() })
    verifyHash(inputHash.trim())
  }

  const handleCopy = () => {
    if (!receiptData?.hash) return
    navigator.clipboard.writeText(receiptData.hash)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Hero Banner */}
      <section className="hero relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="p-1.5 rounded-lg bg-white/10 text-white">
                <QrCode size={24} />
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Public FDR Escrow Release Verifier
              </h1>
              <SimulatedChip
                text="Zero-Knowledge Verification"
                className="bg-white/15 text-white border-white/25"
              />
            </div>
            <p className="text-white/80 text-sm max-w-2xl leading-relaxed">
              Public verification gateway for commercial banks, technical institutes, and regulatory authorities to validate legitimate AICTE security deposit release certificates against the cryptographic ledger.
            </p>
          </div>

          <div className="rounded-xl bg-white/10 p-3.5 backdrop-blur-xs border border-white/15 shrink-0 space-y-1 text-right">
            <div className="text-xs text-white/80">Public Gateway</div>
            <div className="text-sm font-bold text-white">Open Verification</div>
            <div className="text-[11px] text-white/70">No Login Required</div>
          </div>
        </div>
      </section>

      {/* Hash Input Bar */}
      <section className="card p-4 space-y-3">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
            />
            <input
              type="text"
              value={inputHash}
              onChange={(e) => setInputHash(e.target.value)}
              placeholder="Paste 64-character SHA-256 release hash token or certificate ID…"
              className="w-full pl-10 pr-3 py-2 text-xs rounded-xl bg-surface border border-line text-ink font-mono focus:outline-none focus:border-brand"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !inputHash.trim()}
            className="btn btn-primary text-xs px-5 py-2 shrink-0 shadow-xs"
          >
            {loading ? 'Verifying…' : 'Verify Authenticity'}
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-between text-[11px] text-muted pt-1">
          <span>Sample Valid Token:</span>
          <button
            type="button"
            onClick={() => {
              setInputHash(defaultHash)
              setSearchParams({ hash: defaultHash })
              verifyHash(defaultHash)
            }}
            className="text-brand hover:underline font-mono"
          >
            {defaultHash.slice(0, 32)}… (Apex Academy Release)
          </button>
        </div>
      </section>

      {/* Loading State */}
      {loading && <LoadingState message="Querying AICTE cryptographic ledger and verifying digital signatures…" />}

      {/* Error / Invalid State */}
      {!loading && error && (
        <div className="card bg-bad-50/50 border-bad-200 p-6 text-center space-y-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-bad-50 text-bad-700 ring-8 ring-bad-100 mx-auto">
            <AlertTriangle size={28} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-ink">
              Invalid or Unregistered Certificate Token
            </h3>
            <p className="text-xs text-muted max-w-md mx-auto">
              The provided hash was not found in the AICTE cryptographic escrow ledger. This instrument may be unreleased, fraudulent, or modified.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setInputHash(defaultHash)
              setSearchParams({ hash: defaultHash })
              verifyHash(defaultHash)
            }}
            className="btn btn-ghost text-xs px-4 py-2 border-line"
          >
            Load Verified Demo Certificate
          </button>
        </div>
      )}

      {/* SIGNATURE BOARDING-PASS STYLE QR RECEIPT */}
      {!loading && !error && receiptData && (
        <div className="space-y-4">
          <div className="card p-0 overflow-hidden border border-line shadow-xl bg-card rounded-3xl">
            {/* Top Boarding Pass Header (Navy Gradient Banner) */}
            <div className="bg-navy p-6 sm:p-8 text-white relative overflow-hidden">
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">
                      <ShieldCheck size={18} />
                    </div>
                    <div>
                      <span className="font-heading font-extrabold text-sm tracking-wide">
                        ALL INDIA COUNCIL FOR TECHNICAL EDUCATION
                      </span>
                      <span className="text-[10px] text-white/70 block -mt-0.5">
                        Statutory Technical Education Bureau • Western Regional Directorate
                      </span>
                    </div>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white pt-2">
                    Official Security Deposit Release Certificate
                  </h2>
                </div>

                <div className="text-left sm:text-right space-y-1">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-ok-50 text-ok-800 px-3 py-1 text-xs font-bold ring-1 ring-ok-200">
                    <CheckCircle2 size={13} className="text-ok-700" />
                    AUTHENTIC & VALIDATED
                  </span>
                  <div className="text-[11px] font-mono text-white/80">
                    ID: {receiptData.certificate_id}
                  </div>
                </div>
              </div>
            </div>

            {/* Boarding Pass Middle Body (Tear-Off Perforated Aesthetic) */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Institution & FDR Core Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-6 border-b border-dashed border-line">
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted block">
                    Beneficiary Technical Institute
                  </span>
                  <div className="font-bold text-ink text-sm mt-0.5">
                    {receiptData.release?.institution_name || receiptData.fdr?.institution_name}
                  </div>
                  <span className="text-[11px] text-muted font-mono">
                    ID: {receiptData.release?.institution_id || 'inst_05'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-muted block">
                    FDR Certificate & Depository Bank
                  </span>
                  <div className="font-mono font-bold text-ink text-sm mt-0.5">
                    {receiptData.release?.fdr_number || receiptData.fdr?.fdr_number}
                  </div>
                  <span className="text-[11px] text-muted">
                    {receiptData.release?.bank || receiptData.fdr?.bank}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-muted block">
                    Released Escrow Principal
                  </span>
                  <div className="font-mono font-extrabold text-brand text-lg mt-0.5">
                    {formatINR(receiptData.release?.amount || receiptData.fdr?.amount)}
                  </div>
                  <span className="text-[11px] text-ok-700 font-semibold">
                    AICTE Joint-Lien Discharged
                  </span>
                </div>
              </div>

              {/* Two-Person Rule Sign-Off Proofs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-dashed border-line text-xs">
                {/* Key 1 Reviewer */}
                <div className="rounded-2xl border border-line p-4 space-y-1 bg-surface/50">
                  <div className="flex items-center justify-between text-muted text-[10px] uppercase font-bold">
                    <span>Key 1: Scrutiny Officer</span>
                    <span className="text-ok-700 font-mono">Verified</span>
                  </div>
                  <div className="font-bold text-ink text-xs">
                    {receiptData.release?.reviewer_name || 'Anita Deshmukh (AICTE Officer)'}
                  </div>
                  <p className="text-[11px] text-muted italic">
                    "{receiptData.release?.reviewer_notes || 'All compliance requirements met.'}"
                  </p>
                  <div className="text-[10px] text-muted font-mono pt-1">
                    Audited: {receiptData.release?.reviewed_at ? new Date(receiptData.release.reviewed_at).toLocaleDateString() : '2025-03-07'}
                  </div>
                </div>

                {/* Key 2 Approver */}
                <div className="rounded-2xl border border-line p-4 space-y-1 bg-surface/50">
                  <div className="flex items-center justify-between text-muted text-[10px] uppercase font-bold">
                    <span>Key 2: Approving Authority</span>
                    <span className="text-ok-700 font-mono">OTP Verified</span>
                  </div>
                  <div className="font-bold text-ink text-xs">
                    {receiptData.release?.approver_name || 'Prof. K. Venkatesh (Approver)'}
                  </div>
                  <p className="text-[11px] text-muted">
                    Two-Person rule verified with dual-key cryptographic OTP.
                  </p>
                  <div className="text-[10px] text-muted font-mono pt-1">
                    Executed: {receiptData.release?.approved_at ? new Date(receiptData.release.approved_at).toLocaleDateString() : '2025-03-08'}
                  </div>
                </div>
              </div>

              {/* QR Code and Cryptographic Digest Section */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-2">
                {/* Hash Details */}
                <div className="space-y-2 flex-1 text-xs">
                  <span className="text-[10px] uppercase font-bold text-muted block">
                    Cryptographic SHA-256 Multi-Signature Token:
                  </span>
                  <div className="p-3 rounded-xl bg-surface border border-line font-mono text-[11px] text-ink break-all select-all flex items-center justify-between gap-2">
                    <span>{receiptData.hash}</span>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="p-1 rounded text-muted hover:text-brand"
                      title="Copy Hash"
                    >
                      {copied ? <Check size={14} className="text-ok-700" /> : <Copy size={14} />}
                    </button>
                  </div>
                  <div className="text-[10px] text-muted flex items-center gap-2">
                    <span>Issuer: All India Council for Technical Education</span>
                    <span>•</span>
                    <SimulatedChip text="Simulated HSM Seal" />
                  </div>
                </div>

                {/* Stylized QR Code Component */}
                <div className="shrink-0 p-3 bg-white rounded-2xl border border-line shadow-sm flex flex-col items-center gap-1.5">
                  <svg width="108" height="108" viewBox="0 0 108 108" className="text-navy">
                    {/* Corner Position Targets */}
                    <rect x="6" y="6" width="28" height="28" rx="4" fill="none" stroke="currentColor" strokeWidth="5" />
                    <rect x="14" y="14" width="12" height="12" rx="2" fill="currentColor" />
                    
                    <rect x="74" y="6" width="28" height="28" rx="4" fill="none" stroke="currentColor" strokeWidth="5" />
                    <rect x="82" y="14" width="12" height="12" rx="2" fill="currentColor" />
                    
                    <rect x="6" y="74" width="28" height="28" rx="4" fill="none" stroke="currentColor" strokeWidth="5" />
                    <rect x="14" y="82" width="12" height="12" rx="2" fill="currentColor" />

                    {/* QR Code Data Pattern Grid */}
                    <rect x="42" y="10" width="6" height="6" fill="currentColor" />
                    <rect x="54" y="10" width="6" height="6" fill="currentColor" />
                    <rect x="42" y="22" width="6" height="6" fill="currentColor" />
                    <rect x="60" y="22" width="6" height="6" fill="currentColor" />
                    <rect x="10" y="44" width="6" height="6" fill="currentColor" />
                    <rect x="22" y="44" width="6" height="6" fill="currentColor" />
                    <rect x="34" y="44" width="6" height="6" fill="currentColor" />
                    <rect x="46" y="44" width="6" height="6" fill="currentColor" />
                    <rect x="58" y="44" width="6" height="6" fill="currentColor" />
                    <rect x="70" y="44" width="6" height="6" fill="currentColor" />
                    <rect x="82" y="44" width="6" height="6" fill="currentColor" />
                    <rect x="94" y="44" width="6" height="6" fill="currentColor" />
                    
                    <rect x="16" y="56" width="6" height="6" fill="currentColor" />
                    <rect x="28" y="56" width="6" height="6" fill="currentColor" />
                    <rect x="46" y="56" width="6" height="6" fill="currentColor" />
                    <rect x="64" y="56" width="6" height="6" fill="currentColor" />
                    <rect x="76" y="56" width="6" height="6" fill="currentColor" />
                    <rect x="88" y="56" width="6" height="6" fill="currentColor" />

                    <rect x="42" y="74" width="6" height="6" fill="currentColor" />
                    <rect x="54" y="74" width="6" height="6" fill="currentColor" />
                    <rect x="66" y="74" width="6" height="6" fill="currentColor" />
                    <rect x="84" y="74" width="6" height="6" fill="currentColor" />
                    <rect x="48" y="86" width="6" height="6" fill="currentColor" />
                    <rect x="60" y="86" width="6" height="6" fill="currentColor" />
                    <rect x="78" y="86" width="6" height="6" fill="currentColor" />
                    <rect x="92" y="86" width="6" height="6" fill="currentColor" />
                  </svg>
                  <span className="text-[9px] font-mono font-bold text-muted uppercase">Scan to Verify</span>
                </div>
              </div>
            </div>

            {/* Boarding Pass Bottom Actions Bar */}
            <div className="bg-surface/80 px-6 sm:px-8 py-4 border-t border-line flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-muted font-mono text-[11px]">
                <ShieldCheck size={14} className="text-brand" />
                <span>Verified against AICTE SHA-256 Ledger Block #3</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn btn-ghost text-xs px-3.5 py-1.5 flex items-center gap-1.5 border-line"
                >
                  <Printer size={13} />
                  <span>Print Certificate</span>
                </button>

                <Link
                  to="/audit"
                  className="btn btn-primary text-xs px-3.5 py-1.5 flex items-center gap-1.5 shadow-xs"
                >
                  <Lock size={13} />
                  <span>Inspect Audit Ledger</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
