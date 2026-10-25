import React, { useState, useEffect, useRef } from 'react'
import { Bell, AlertTriangle, Clock, CheckCircle2, FileCheck2, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client.js'
import SimulatedChip from './SimulatedChip.jsx'

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const data = await api.getNotifications()
      setNotifications(data || [])
      setUnreadCount((data || []).filter((n) => !n.read).length)
    } catch {
      // Keep silent fallback in header
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 12000)
    return () => clearInterval(interval)
  }, [])

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const handleSelect = (item) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
    setOpen(false)
    if (item.fdrId) {
      navigate(`/fdrs/${item.fdrId}`)
    }
  }

  const getIcon = (type) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle size={15} className="text-ret-700" />
      case 'alert':
        return <Clock size={15} className="text-warn-700" />
      case 'success':
        return <CheckCircle2 size={15} className="text-ok-700" />
      default:
        return <FileCheck2 size={15} className="text-info-700" />
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl text-muted hover:text-ink hover:bg-surface border border-line cursor-pointer transition-colors"
        aria-label="View notifications"
        title="Real-time FDR alerts"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-ret-700 px-1 text-[10px] font-bold text-white shadow-xs">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-line bg-card shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-line bg-surface/50 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="font-heading text-xs font-bold text-ink">Notifications</span>
              <SimulatedChip text="Live Stream" />
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-muted hover:text-ink p-1 rounded-lg"
            >
              <X size={14} />
            </button>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-line">
            {loading && notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted">Checking alerts...</div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted">No pending alerts</div>
            ) : (
              notifications.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className={`w-full text-left p-3.5 hover:bg-surface/60 transition-colors flex items-start gap-3 cursor-pointer ${
                    !item.read ? 'bg-brand/5' : ''
                  }`}
                >
                  <div className="mt-0.5 shrink-0 rounded-lg p-1.5 bg-surface border border-line">
                    {getIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-ink truncate">
                        {item.title}
                      </span>
                      {!item.read && (
                        <span className="h-2 w-2 rounded-full bg-brand shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-muted line-clamp-2 mt-0.5 leading-relaxed">
                      {item.message}
                    </p>
                    {item.fdrNumber && (
                      <span className="inline-block mt-1 font-mono text-[10px] font-bold text-brand">
                        {item.fdrNumber}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
