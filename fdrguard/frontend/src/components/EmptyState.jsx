import React from 'react'
import { FolderSearch } from 'lucide-react'

export default function EmptyState({
  title = 'No records found',
  description = 'There are no items matching your criteria or query.',
  actionLabel,
  onAction,
}) {
  return (
    <div className="card flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 rounded-full bg-surface border border-line flex items-center justify-center text-muted mb-3">
        <FolderSearch size={22} />
      </div>
      <h3 className="text-base font-bold text-ink">{title}</h3>
      <p className="text-sm text-muted max-w-md mt-1">{description}</p>
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn-primary mt-4">
          {actionLabel}
        </button>
      )}
    </div>
  )
}
