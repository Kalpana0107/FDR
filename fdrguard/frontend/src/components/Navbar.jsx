import React from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, Menu } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import SimulatedChip from './SimulatedChip.jsx'
import RoleSwitcher from './RoleSwitcher.jsx'
import NotificationBell from './NotificationBell.jsx'

export default function Navbar({ onToggleSidebar }) {
  const { user } = useAuth()

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur px-4 sm:px-6 py-2.5 transition-colors">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Mobile Toggle & Brand */}
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200/80 transition-colors cursor-pointer"
              aria-label="Toggle Navigation Sidebar"
            >
              <Menu size={18} />
            </button>
          )}

          <Link
            to="/"
            className="flex items-center gap-2.5 hover:opacity-90 transition-opacity"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading text-base font-bold tracking-tight text-slate-900">
                  FDRGuard
                </span>
                <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 uppercase tracking-wider border border-indigo-200/60">
                  AICTE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 -mt-0.5 hidden sm:block">
                Security Deposit Escrow & Compliance
              </p>
            </div>
          </Link>

          <SimulatedChip text="Simulated CBS & HSM" className="hidden md:inline-flex ml-2 bg-slate-100 text-slate-600 border border-slate-200" />
        </div>

        {/* Right: Notifications, Role Switcher & User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          <NotificationBell />

          {/* Quick Role Switcher */}
          <RoleSwitcher variant="dropdown" />

          {/* User Profile Pill */}
          <div className="flex items-center gap-2.5 rounded-lg border border-slate-200/80 bg-slate-50/70 px-2.5 py-1.5 shadow-xs">
            <div className="flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-md bg-indigo-100 text-indigo-700 text-xs font-bold">
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[130px]">
                {user?.name || 'Authorized User'}
              </div>
              <div className="text-[10px] text-slate-400 leading-none mt-0.5">
                {user?.role || 'Guest'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
