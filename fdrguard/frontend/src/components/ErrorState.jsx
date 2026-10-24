import React from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

export default function ErrorState({ error, onRetry }) {
  return (
    <div className="card border-bad-200 bg-bad-50 p-6 flex flex-col items-center text-center">
      <div className="w-10 h-10 rounded-full bg-card border border-bad-200 flex items-center justify-center text-bad-700 mb-2">
        <AlertCircle size={20} />
      </div>
      <h3 className="text-base font-bold text-bad-700">Failed to load data</h3>
      <p className="text-sm text-bad-700/90 mt-1 max-w-md">
        {typeof error === 'string' ? error : error?.message || 'An unexpected error occurred while communicating with the API.'}
      </p>
      {onRetry && (
        <button onClick={onRetry} className="btn-ghost mt-4 text-xs font-semibold">
          <RefreshCw size={14} /> Retry Operation
        </button>
      )}
    </div>
  )
}
