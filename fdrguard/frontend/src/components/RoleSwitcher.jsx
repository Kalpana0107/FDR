import React from 'react'
import {
  GraduationCap,
  ShieldCheck,
  Building2,
  CheckCircle2,
  BarChart3,
  ChevronDown,
  UserCheck,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

const ROLE_ICONS = {
  College: GraduationCap,
  Officer: ShieldCheck,
  'Bank Verifier': Building2,
  Approver: CheckCircle2,
  Management: BarChart3,
}

export default function RoleSwitcher({ variant = 'dropdown', className = '' }) {
  const { roles, currentRoleKey, userList, switchRole } = useAuth()

  if (variant === 'pills') {
    return (
      <div
        className={`flex flex-wrap items-center gap-1.5 p-1 bg-surface border border-line rounded-xl ${className}`}
        role="group"
        aria-label="Role Switcher"
      >
        {roles.map((r) => {
          const isActive = currentRoleKey === r.key
          const Icon = ROLE_ICONS[r.key] || UserCheck
          return (
            <button
              key={r.key}
              type="button"
              onClick={() => switchRole(r.key)}
              aria-pressed={isActive}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-muted hover:text-ink hover:bg-card bg-transparent'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-white' : 'text-muted'} />
              <span>{r.label}</span>
            </button>
          )
        })}
      </div>
    )
  }

  // Dropdown variant (standard in Top Bar)
  return (
    <div
      className={`relative inline-flex items-center gap-2 bg-surface border border-line rounded-xl px-3 py-1.5 hover:border-brand/40 transition-colors ${className}`}
    >
      <span className="text-xs text-muted font-medium hidden sm:inline">Role:</span>
      <div className="relative inline-flex items-center">
        <select
          aria-label="Switch Role"
          value={currentRoleKey}
          onChange={(e) => switchRole(e.target.value)}
          className="bg-transparent text-xs font-semibold text-ink focus:outline-none cursor-pointer pr-5 appearance-none"
        >
          {roles.map((r) => {
            const matchedUser = userList?.find(
              (u) =>
                u.role === r.fullRole ||
                u.role.toLowerCase() === r.key.toLowerCase() ||
                (r.key === 'Officer' && u.role.includes('Officer')) ||
                (r.key === 'Management' && u.role.includes('Management')),
            )
            const personName = matchedUser ? ` • ${matchedUser.name.split(' ')[0]}` : ''
            return (
              <option key={r.key} value={r.key} className="bg-card text-ink">
                {r.label}
                {personName}
              </option>
            )
          })}
        </select>
        <ChevronDown
          size={13}
          className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-muted"
        />
      </div>
    </div>
  )
}
