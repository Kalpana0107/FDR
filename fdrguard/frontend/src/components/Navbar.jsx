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
    <header className="sticky top-0 z-30 border-b border-line bg-card/95 backdrop-blur px-4 sm:px-6 py-3 transition-colors">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Mobile Toggle & Brand */}
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-xl text-muted hover:text-ink hover:bg-surface border border-line cursor-pointer"
              aria-label="Toggle Navigation Sidebar"
            >
              <Menu size={20} />
            </button>
          )}

          <Link
            to="/"
            className="flex items-center gap-2.5 text-ink hover:opacity-90 transition-opacity"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-sm">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading text-lg font-extrabold tracking-tight text-ink">
                  FDRGuard
                </span>
                <span className="rounded bg-brand/10 px-1.5 py-0.5 text-[10px] font-bold text-brand uppercase tracking-wider">
                  AICTE
                </span>
              </div>
              <p className="text-[11px] text-muted -mt-0.5 hidden sm:block">
                Security Deposit Escrow & Compliance
              </p>
            </div>
          </Link>

          <SimulatedChip text="Simulated CBS & HSM" className="hidden md:inline-flex ml-2" />
        </div>

        {/* Right: Notifications, Role Switcher & User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          <NotificationBell />

          {/* Quick Role Switcher */}
          <RoleSwitcher variant="dropdown" />

          {/* User Profile Pill */}
          <div className="flex items-center gap-2.5 rounded-xl border border-line bg-card px-2.5 sm:px-3 py-1.5 shadow-xs">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-info-50 text-info-700 text-xs font-bold ring-1 ring-info-200">
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-semibold text-ink leading-tight truncate max-w-[140px]">
                {user?.name || 'Authorized User'}
              </div>
              <div className="text-[10px] text-muted leading-none mt-0.5">
                {user?.role || 'Guest'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
