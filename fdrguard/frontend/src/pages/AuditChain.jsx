import React, { useEffect, useState, useMemo } from 'react'
import {
  Link2,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Copy,
  Check,
  ArrowDown,
  Lock,
  Sparkles,
  Zap,
  Fingerprint,
  RotateCcw,
  Bug,
} from 'lucide-react'
import { api } from '../api/client.js'
import StatusBadge from '../components/StatusBadge.jsx'
import SimulatedChip from '../components/SimulatedChip.jsx'
import LoadingState from '../components/LoadingState.jsx'
import EmptyState from '../components/EmptyState.jsx'
import ErrorState from '../components/ErrorState.jsx'

export default function AuditChain() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [blocks, setBlocks] = useState([])
  const [verificationResult, setVerificationResult] = useState(null)
  const [verifying, setVerifying] = useState(false)
  const [copiedHash, setCopiedHash] = useState(null)
  const [tamperedBlockIndex, setTamperedBlockIndex] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [eventTypeFilter, setEventTypeFilter] = useState('All')

  const loadChain = async () => {
    setLoading(true)
    setError(null)
    try {
      const [chainRes, verifyRes] = await Promise.all([
        api.getAuditChain(),
        api.verifyAudit(),
      ])
      setBlocks(chainRes || [])
      setVerificationResult(verifyRes)
      setTamperedBlockIndex(null)
    } catch (err) {
      setError(err?.message || 'Failed to fetch cryptographic audit chain')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadChain()
  }, [])

  // Live chain verification button
  const handleVerifyChain = async () => {
    setVerifying(true)
    try {
      const res = await api.verifyAudit()
      // If user simulated tampering
      if (tamperedBlockIndex !== null) {
        setVerificationResult({
          valid: false,
          length: blocks.length,
          broken_at: tamperedBlockIndex,
          chain_head: blocks[blocks.length - 1]?.block_hash,
          verified_at: new Date().toISOString(),
        })
      } else {
        setVerificationResult(res)
      }
    } catch (err) {
      setError(err?.message || 'Verification failed')
    } finally {
      setVerifying(false)
    }
  }

  // Simulate Tamper Attack to demonstrate cryptographic proof
  const handleToggleTamper = (idx) => {
    if (tamperedBlockIndex === idx) {
      setTamperedBlockIndex(null)
      setVerificationResult({
        valid: true,
        length: blocks.length,
        broken_at: null,
        chain_head: blocks[blocks.length - 1]?.block_hash,
        verified_at: new Date().toISOString(),
      })
    } else {
      setTamperedBlockIndex(idx)
      setVerificationResult({
        valid: false,
        length: blocks.length,
        broken_at: idx,
        chain_head: 'HASH_MISMATCH_TAMPER_DETECTED',
        verified_at: new Date().toISOString(),
      })
    }
  }

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text)
    setCopiedHash(id)
    setTimeout(() => setCopiedHash(null), 2000)
  }

  // Filter blocks
  const filteredBlocks = useMemo(() => {
    return blocks.filter((b) => {
      if (eventTypeFilter !== 'All' && b.event_type !== eventTypeFilter) {
        return false
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchEntity = b.entity_id?.toLowerCase().includes(q)
        const matchActor = b.actor?.toLowerCase().includes(q)
        const matchDetails = b.details?.toLowerCase().includes(q)
        const matchHash = b.block_hash?.toLowerCase().includes(q)
        if (!matchEntity && !matchActor && !matchDetails && !matchHash) return false
      }
      return true
    })
  }, [blocks, eventTypeFilter, searchQuery])

  const eventTypes = [
    'All',
    'GENESIS_BLOCK',
    'FDR_SUBMISSION',
    'BANK_VERIFICATION_PASS',
    'TWO_PERSON_RELEASE_APPROVED',
  ]

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <section className="hero relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="p-1.5 rounded-lg bg-white/10 text-white">
                <Link2 size={24} />
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Cryptographic Hash Chain Audit Log
              </h1>
              <SimulatedChip
                text="SHA-256 Merkle Ledger"
                className="bg-white/15 text-white border-white/25"
              />
            </div>
            <p className="text-white/80 text-sm max-w-3xl leading-relaxed">
              Task 5 Suite: Tamper-evident ledger providing mathematical immutability for every FDR lifecycle event.
              Each transaction is chained via SHA-256 hash digests and signed by HSM keys, preventing retroactive modification.
            </p>
          </div>

          <div className="rounded-xl bg-white/10 p-3.5 backdrop-blur-xs border border-white/15 shrink-0 space-y-1 text-right">
            <div className="text-xs text-white/80">Ledger Height</div>
            <div className="text-2xl font-extrabold text-white font-mono">
              {blocks.length} Blocks
            </div>
            <div className="text-[11px] text-white/70">Cryptographically Sealed</div>
          </div>
        </div>
      </section>

      {/* Chain Integrity Status Card */}
      {verificationResult && (
        <section
          className={`card p-5 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
            verificationResult.valid
              ? 'bg-ok-50/60 border-ok-200'
              : 'bg-bad-50/70 border-bad-200'
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-white text-xs font-bold ${
                  verificationResult.valid ? 'bg-ok-700' : 'bg-bad-700'
                }`}
              >
                {verificationResult.valid ? <Check size={14} /> : <AlertTriangle size={14} />}
              </span>
              <h2 className="text-base font-bold text-ink">
                Chain Integrity Status:{' '}
                <span className={verificationResult.valid ? 'text-ok-700' : 'text-bad-700'}>
                  {verificationResult.valid
                    ? '100% Cryptographically Valid'
                    : `Tamper Detected at Block ${verificationResult.broken_at}!`}
                </span>
              </h2>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              {verificationResult.valid
                ? `All ${verificationResult.length} blocks verified from Genesis anchor to current Head. Zero broken links or signature mutations detected.`
                : `Security Alert: Hash mismatch detected at Block #${verificationResult.broken_at}. The payload or timestamp has been altered, breaking downstream hashes.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={verifying}
              onClick={handleVerifyChain}
              className="btn btn-primary text-xs px-4 py-2 shadow-xs"
            >
              <RefreshCw size={13} className={verifying ? 'animate-spin' : ''} />
              <span>{verifying ? 'Verifying Hashes…' : 'Re-Verify Chain Integrity'}</span>
            </button>

            {tamperedBlockIndex !== null && (
              <button
                type="button"
                onClick={() => handleToggleTamper(tamperedBlockIndex)}
                className="btn btn-ghost text-xs px-3 py-2 text-ok-700 border-ok-300 hover:bg-ok-50"
              >
                <RotateCcw size={13} />
                <span>Restore Chain</span>
              </button>
            )}
          </div>
        </section>
      )}

      {/* Control Bar: Filters & Search */}
      <section className="card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Event Filter */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-muted mr-1 flex items-center gap-1">
              <Filter size={13} /> Event:
            </span>
            {eventTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setEventTypeFilter(type)}
                className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  eventTypeFilter === type
                    ? 'bg-brand text-white shadow-xs'
                    : 'bg-surface text-muted hover:text-ink hover:bg-line/60'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Search box & Refresh */}
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search actor, FDR #, hash…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-surface border border-line text-ink placeholder:text-muted focus:outline-none focus:border-brand"
              />
            </div>

            <button
              type="button"
              onClick={loadChain}
              className="btn btn-ghost text-xs px-3 py-1.5 shrink-0"
              title="Refresh Chain"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>
      </section>

      {/* Loading / Error States */}
      {loading && <LoadingState message="Traversing SHA-256 Merkle chain and validating block hashes…" />}

      {!loading && error && <ErrorState error={error} onRetry={loadChain} />}

      {!loading && !error && filteredBlocks.length === 0 && (
        <EmptyState
          title="No Blocks Match Filter"
          description="Try selecting 'All' events or clearing your search term."
          actionLabel="Reset Filter"
          onAction={() => {
            setEventTypeFilter('All')
            setSearchQuery('')
          }}
        />
      )}

      {/* Visual Chain Blocks Sequence */}
      {!loading && !error && filteredBlocks.length > 0 && (
        <div className="space-y-4">
          {filteredBlocks.map((block, index) => {
            const isTampered = tamperedBlockIndex === block.block_index
            const isBroken = verificationResult?.broken_at !== null && block.block_index >= verificationResult?.broken_at
            const isGenesis = block.block_index === 0

            return (
              <React.Fragment key={block.block_index}>
                {/* Block Card */}
                <div
                  className={`card p-5 border-l-4 transition-all hover:shadow-md space-y-4 relative ${
                    isTampered
                      ? 'border-l-bad-700 bg-bad-50/30 ring-2 ring-bad-300'
                      : isBroken
                      ? 'border-l-bad-700 bg-bad-50/10'
                      : isGenesis
                      ? 'border-l-brand bg-brand/5'
                      : 'border-l-ok-700'
                  }`}
                >
                  {/* Block Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line pb-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-xl font-mono text-xs font-bold text-white shadow-xs ${
                          isTampered
                            ? 'bg-bad-700'
                            : isGenesis
                            ? 'bg-brand'
                            : 'bg-ink'
                        }`}
                      >
                        #{block.block_index}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-ink">{block.event_type}</span>
                          {isGenesis && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand/10 text-brand">
                              Genesis Anchor
                            </span>
                          )}
                          {isTampered && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-bad-700 text-white animate-pulse">
                              Tampered Payload
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-muted font-mono block">
                          Timestamp: {new Date(block.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Simulation Tool: Tamper Toggle */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleTamper(block.block_index)}
                        className={`btn text-[11px] px-2.5 py-1 ${
                          isTampered
                            ? 'btn-ghost text-ok-700 border-ok-300 hover:bg-ok-50'
                            : 'btn-ghost text-muted hover:text-bad-700 hover:bg-bad-50 border-line'
                        }`}
                        title="Simulate data tampering attack to demonstrate SHA-256 breakage"
                      >
                        <Bug size={12} />
                        <span>{isTampered ? 'Revert Tamper' : 'Simulate Attack'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Block Payload / Transaction Data */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-surface/50 rounded-xl p-3 border border-line">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted block">Transaction Actor</span>
                      <span className="font-semibold text-ink">{block.actor}</span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted block">Entity Ref</span>
                      <span className="font-mono font-bold text-brand">{block.entity_id}</span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted block">Digital Signature</span>
                      <span className="font-mono text-[10px] text-muted truncate block">
                        {block.signature}
                      </span>
                    </div>

                    <div className="md:col-span-3 pt-1 border-t border-line/60">
                      <span className="text-[10px] uppercase font-bold text-muted block">Payload Details</span>
                      <span className="text-ink font-medium">{block.details}</span>
                    </div>
                  </div>

                  {/* Cryptographic Hashes (Prev Hash & Block Hash) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                    {/* Previous Hash */}
                    <div className="rounded-xl border border-line p-2.5 bg-card space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-muted font-sans font-bold">
                        <span>Previous Block Hash (prev_hash):</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(block.prev_hash, `prev_${block.block_index}`)}
                          className="hover:text-brand"
                        >
                          {copiedHash === `prev_${block.block_index}` ? (
                            <span className="text-ok-700 text-[9px]">Copied</span>
                          ) : (
                            <Copy size={11} />
                          )}
                        </button>
                      </div>
                      <div className="text-[11px] text-muted break-all truncate">
                        {block.prev_hash}
                      </div>
                    </div>

                    {/* Block Hash */}
                    <div
                      className={`rounded-xl border p-2.5 bg-card space-y-1 ${
                        isTampered ? 'border-bad-700 bg-bad-50/20' : 'border-line'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-sans font-bold">
                        <span className={isTampered ? 'text-bad-700' : 'text-muted'}>
                          Block Hash (block_hash):
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(block.block_hash, `hash_${block.block_index}`)}
                          className="hover:text-brand text-muted"
                        >
                          {copiedHash === `hash_${block.block_index}` ? (
                            <span className="text-ok-700 text-[9px]">Copied</span>
                          ) : (
                            <Copy size={11} />
                          )}
                        </button>
                      </div>
                      <div
                        className={`text-[11px] font-bold break-all truncate ${
                          isTampered ? 'text-bad-700' : 'text-ink'
                        }`}
                      >
                        {isTampered ? 'MUTATED_CORRUPT_BLOCK_HASH_TAMPERED' : block.block_hash}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Connecting Chain Link Icon between blocks */}
                {index < filteredBlocks.length - 1 && (
                  <div className="flex justify-center items-center py-1">
                    <div
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono border ${
                        isBroken
                          ? 'bg-bad-50 text-bad-700 border-bad-200'
                          : 'bg-surface text-muted border-line'
                      }`}
                    >
                      <ArrowDown size={11} className={isBroken ? 'text-bad-700' : 'text-brand'} />
                      <span>{isBroken ? 'BROKEN HASH LINK' : 'SHA-256 SECURED LINK'}</span>
                    </div>
                  </div>
                )}
              </React.Fragment>
            )
          })}
        </div>
      )}
    </div>
  )
}
