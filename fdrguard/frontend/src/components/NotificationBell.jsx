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
        return <AlertTriangle size={15} className="text-amber-600" />
      case 'alert':
        return <Clock size={15} className="text-amber-500" />
      case 'success':
        return <CheckCircle2 size={15} className="text-emerald-600" />
      default:
        return <FileCheck2 size={15} className="text-indigo-600" />
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200/80 cursor-pointer transition-colors"
        aria-label="View notifications"
        title="Real-time FDR alerts"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="bg-indigo-600 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center absolute -top-1 -right-1 shadow-xs">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-slate-200/80 bg-white shadow-lg z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="font-heading text-xs font-semibold text-slate-800">Notifications</span>
              <span className="rounded bg-slate-200/60 px-1.5 py-0.5 text-[9px] font-medium text-slate-600">
                Live Stream
              </span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
            >
              <X size={14} />
            </button>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {loading && notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">Checking alerts...</div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">No pending alerts</div>
            ) : (
              notifications.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className={`w-full text-left p-3.5 hover:bg-slate-50/80 transition-colors flex items-start gap-3 cursor-pointer ${
                    !item.read ? 'bg-indigo-50/20' : ''
                  }`}
                >
                  <div className="mt-0.5 shrink-0 rounded-lg p-1.5 bg-slate-50 border border-slate-100">
                    {getIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-800 truncate">
                        {item.title}
                      </span>
                      {!item.read && (
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                      {item.message}
                    </p>
                    {item.fdrNumber && (
                      <span className="inline-block mt-1 font-mono text-[10px] font-semibold text-indigo-600 tracking-tight">
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
