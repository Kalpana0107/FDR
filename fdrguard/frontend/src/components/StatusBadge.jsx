import React from 'react'

const STATUS_STYLES = {
  Verified: {
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
    dot: 'bg-emerald-600 animate-pulse',
  },
  Active: {
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
    dot: 'bg-emerald-600 animate-pulse',
  },
  Pending: {
    badge: 'bg-amber-50 text-amber-800 border-amber-200/80',
    dot: 'bg-amber-600',
  },
  'Verification Pending': {
    badge: 'bg-amber-50 text-amber-800 border-amber-200/80',
    dot: 'bg-amber-600',
  },
  Maturing: {
    badge: 'bg-amber-50 text-amber-800 border-amber-200/80',
    dot: 'bg-amber-600',
  },
  Returned: {
    badge: 'bg-amber-50 text-amber-800 border-amber-200/80',
    dot: 'bg-amber-600',
  },
  Rejected: {
    badge: 'bg-rose-50 text-rose-800 border-rose-200/80',
    dot: 'bg-rose-600',
  },
  Failed: {
    badge: 'bg-rose-50 text-rose-800 border-rose-200/80',
    dot: 'bg-rose-600',
  },
  'Under Review': {
    badge: 'bg-blue-50 text-blue-800 border-blue-200/80',
    dot: 'bg-blue-600',
  },
  Submitted: {
    badge: 'bg-blue-50 text-blue-800 border-blue-200/80',
    dot: 'bg-blue-600',
  },
  Renewed: {
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
    dot: 'bg-emerald-600 animate-pulse',
  },
  Released: {
    badge: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    dot: 'bg-zinc-400',
  },
  Withdrawn: {
    badge: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    dot: 'bg-zinc-400',
  },
  'Release in Progress': {
    badge: 'bg-blue-50 text-blue-800 border-blue-200/80',
    dot: 'bg-blue-600',
  },
}

export const ALL_STATUSES = Object.keys(STATUS_STYLES)

export default function StatusBadge({ status }) {
  const config = STATUS_STYLES[status] ?? STATUS_STYLES.Released
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border ${config.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot} shrink-0`} />
      {status}
    </span>
  )
}

