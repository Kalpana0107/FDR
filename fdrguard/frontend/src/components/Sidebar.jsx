import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  FilePlus2,
  CheckSquare,
  CopyCheck,
  FileCheck,
  Link2,
  QrCode,
  ShieldCheck,
  X,
  Sparkles,
  Building,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import SimulatedChip from './SimulatedChip.jsx'
import RoleSwitcher from './RoleSwitcher.jsx'

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation()
  const { user, currentRoleKey } = useAuth()

  const navItems = [
    {
      group: 'Overview',
      items: [
        { label: 'Dashboard', path: '/app', icon: LayoutDashboard },
        { label: 'Security Deposits', path: '/app/fdrs', icon: FileText, badge: 'Active' },
      ],
    },
    {
      group: 'Operations',
      items: [
        {
          label: 'Submit New FDR',
          path: '/app/fdrs/new',
          icon: FilePlus2,
          roleOnly: ['College'],
        },
        {
          label: 'Verification Queue',
          path: '/app/verify',
          icon: CheckSquare,
          simulated: true,
          badge: 'CBS',
        },
        {
          label: 'Duplicate Detection',
          path: '/app/duplicates',
          icon: CopyCheck,
        },
        {
          label: 'Release Requests',
          path: '/app/releases',
          icon: FileCheck,
          badge: 'Dual-Key',
        },
      ],
    },
    {
      group: 'Compliance & Audit',
      items: [
        {
          label: 'Tamper-Evident Chain',
          path: '/app/audit',
          icon: Link2,
          simulated: true,
        },
        {
          label: 'Public QR Verifier',
          path: '/verify',
          icon: QrCode,
        },
      ],
    },
  ]

  const isActive = (path) => {
    if (path === '/app') return location.pathname === '/app'
    return location.pathname.startsWith(path)
  }

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between overflow-y-auto">
      {/* Top area */}
      <div className="p-4 space-y-5">
        {/* Mobile Header with Close button */}
        <div className="flex items-center justify-between lg:hidden border-b border-line pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">
              <ShieldCheck size={18} />
            </div>
            <div>
              <span className="font-heading font-extrabold text-sm text-ink">FDRGuard</span>
              <span className="ml-1.5 rounded bg-brand/10 px-1 py-0.2 text-[9px] font-bold text-brand uppercase">
                AICTE
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-surface border border-line"
            aria-label="Close navigation sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Active Role Card */}
        <div className="card p-3.5 bg-surface/80 border-line space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
              Active Persona
            </span>
            <span className="inline-flex items-center rounded-md bg-brand/10 px-2 py-0.5 text-[10px] font-bold text-brand">
              {currentRoleKey}
            </span>
          </div>

          <div>
            <div className="text-xs font-bold text-ink truncate">{user?.name || 'Authorized User'}</div>
            <div className="text-[11px] text-muted truncate mt-0.5">
              {user?.institution || user?.department || user?.bank || user?.designation || 'Central Bureau'}
            </div>
          </div>

          {/* Quick role switcher inside sidebar */}
          <div className="pt-1 border-t border-line/60">
            <div className="text-[10px] text-muted mb-1.5 font-medium">Switch Active Role:</div>
            <RoleSwitcher variant="pills" />
          </div>
        </div>

        {/* Nav list */}
        <nav className="space-y-4" aria-label="Sidebar Navigation">
          {navItems.map((section) => (
            <div key={section.group} className="space-y-1">
              <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted">
                {section.group}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(item.path)
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.label}
                      to={item.path}
                      onClick={() => onClose && onClose()}
                      className={`group flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                        active
                          ? 'bg-brand text-white shadow-xs'
                          : 'text-ink/80 hover:bg-surface hover:text-ink'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          size={16}
                          className={active ? 'text-white' : 'text-muted group-hover:text-ink'}
                        />
                        <span>{item.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {item.simulated && (
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-medium ${
                              active
                                ? 'bg-white/20 text-white'
                                : 'bg-warn-50 text-warn-700 border border-warn-200'
                            }`}
                          >
                            Sim
                          </span>
                        )}
                        {item.badge && !item.simulated && (
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                              active
                                ? 'bg-white/20 text-white'
                                : 'bg-info-50 text-info-700'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom Compliance & Security info */}
      <div className="p-4 border-t border-line space-y-3 bg-card">
        <div className="flex items-center justify-between text-xs text-muted">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-ok-700 animate-pulse" />
            <span className="font-semibold text-ink text-[11px]">Sentinel Gateway</span>
          </div>
          <span className="text-[10px] font-mono text-muted">v2.4-sim</span>
        </div>

        <div className="rounded-xl bg-surface border border-line p-2.5 space-y-1">
          <div className="flex items-center gap-1 text-[11px] font-bold text-ink">
            <Sparkles size={12} className="text-warn-700" />
            <span>AICTE Escrow Integrity</span>
          </div>
          <p className="text-[10px] text-muted leading-tight">
            All FDR verification transactions are cryptographically signed and SHA-256 chained.
          </p>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-line transform transition-transform duration-200 ease-in-out lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Mobile Navigation"
      >
        {sidebarContent}
      </aside>

      {/* Desktop Persistent Sidebar */}
      <aside
        className="hidden lg:flex lg:w-64 lg:shrink-0 lg:flex-col border-r border-line bg-card min-h-screen sticky top-0 h-screen"
        aria-label="Desktop Navigation"
      >
        {sidebarContent}
      </aside>
    </>
  )
}
