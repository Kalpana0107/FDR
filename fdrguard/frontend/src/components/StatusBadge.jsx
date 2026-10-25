import React from 'react'

const STATUS_STYLES = {
  Verified: {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    dot: 'bg-emerald-500',
  },
  Active: {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    dot: 'bg-emerald-500',
  },
  Pending: {
    badge: 'bg-amber-50 text-amber-700 border-amber-200/60',
    dot: 'bg-amber-500',
  },
  'Verification Pending': {
    badge: 'bg-amber-50 text-amber-700 border-amber-200/60',
    dot: 'bg-amber-500',
  },
  Maturing: {
    badge: 'bg-amber-50 text-amber-700 border-amber-200/60',
    dot: 'bg-amber-500',
  },
  Returned: {
    badge: 'bg-amber-50 text-amber-700 border-amber-200/60',
    dot: 'bg-amber-500',
  },
  Rejected: {
    badge: 'bg-rose-50 text-rose-700 border-rose-200/60',
    dot: 'bg-rose-500',
  },
  Failed: {
    badge: 'bg-rose-50 text-rose-700 border-rose-200/60',
    dot: 'bg-rose-500',
  },
  'Under Review': {
    badge: 'bg-blue-50 text-blue-700 border-blue-200/60',
    dot: 'bg-blue-500',
  },
  Submitted: {
    badge: 'bg-blue-50 text-blue-700 border-blue-200/60',
    dot: 'bg-blue-500',
  },
  Renewed: {
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200/60',
    dot: 'bg-indigo-500',
  },
  Released: {
    badge: 'bg-slate-50 text-slate-700 border-slate-200/60',
    dot: 'bg-slate-400',
  },
  Withdrawn: {
    badge: 'bg-slate-50 text-slate-700 border-slate-200/60',
    dot: 'bg-slate-400',
  },
  'Release in Progress': {
    badge: 'bg-blue-50 text-blue-700 border-blue-200/60',
    dot: 'bg-blue-500',
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

