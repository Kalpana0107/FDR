import React, { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../api/client.js'
import { users as defaultUsers } from '../mocks/auth.js'

export const ROLES = [
  { key: 'College', label: 'College', fullRole: 'College' },
  { key: 'Officer', label: 'Officer', fullRole: 'AICTE Officer' },
  { key: 'Bank Verifier', label: 'Bank Verifier', fullRole: 'Bank Verifier' },
  { key: 'Approver', label: 'Approver', fullRole: 'Approver' },
  { key: 'Management', label: 'Management', fullRole: 'Management/Admin' },
]

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [userList, setUserList] = useState(defaultUsers)
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('fdrguard_user')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        // fallback
      }
    }
    return defaultUsers[0]
  })

  useEffect(() => {
    api
      .getUsers()
      .then((users) => {
        if (users && users.length > 0) {
          setUserList(users)
        }
      })
      .catch(() => {})
  }, [])

  const switchRole = (roleKeyOrName) => {
    if (!roleKeyOrName) return
    const target = roleKeyOrName.toLowerCase().trim()
    const list = userList && userList.length > 0 ? userList : defaultUsers

    const matched = list.find((u) => {
      const r = u.role.toLowerCase()
      if (r === target) return true
      if (target === 'officer' && r.includes('officer')) return true
      if (target === 'management' && r.includes('management')) return true
      if (target === 'aicte officer' && r.includes('officer')) return true
      if (target === 'management/admin' && r.includes('management')) return true
      if (r.includes(target) || target.includes(r.split('/')[0].toLowerCase())) return true
      return false
    })

    if (matched) {
      setCurrentUser(matched)
      localStorage.setItem('fdrguard_user', JSON.stringify(matched))
    }
  }

  const setUser = (user) => {
    setCurrentUser(user)
    localStorage.setItem('fdrguard_user', JSON.stringify(user))
  }

  const logout = () => {
    const defaultUser = (userList && userList.find((u) => u.role === 'College')) || defaultUsers[0]
    setCurrentUser(defaultUser)
    localStorage.removeItem('fdrguard_user')
  }

  // Helper to get normalized role key for UI highlighting
  const currentRoleKey = (() => {
    const r = currentUser?.role || 'College'
    if (r.includes('Officer')) return 'Officer'
    if (r.includes('Management') || r.includes('Admin')) return 'Management'
    if (r.includes('Bank')) return 'Bank Verifier'
    if (r.includes('Approver')) return 'Approver'
    return 'College'
  })()

  return (
    <AuthContext.Provider
      value={{
        user: currentUser,
        userList,
        roles: ROLES,
        currentRoleKey,
        switchRole,
        setUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

