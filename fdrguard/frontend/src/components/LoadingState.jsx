import React from 'react'
import { Loader2 } from 'lucide-react'

export default function LoadingState({ message = 'Loading records from registry…' }) {
  return (
    <div className="card flex flex-col items-center justify-center py-12 text-center">
      <Loader2 size={36} className="animate-spin text-brand mb-3" />
      <p className="text-sm font-medium text-ink">{message}</p>
      <p className="text-xs text-muted mt-1">Sentinel mock-first API gateway responding…</p>
    </div>
  )
}
