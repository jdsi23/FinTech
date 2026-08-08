import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { signOutUser } from '../features/auth/actions'
import { useAppearance } from '../features/appearance/AppearanceProvider'
import type { UserRole } from '../types/firestore'

function navLinkClass(compact: boolean) {
  return ({ isActive }: { isActive: boolean }) =>
    `rounded-md font-medium ${compact ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm'} ${
      isActive
        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
    }`
}

export function AppShell({ role, children }: { role: UserRole; children: ReactNode }) {
  const displayName = useAuthStore((s) => s.userDoc?.displayName)
  const appName = useAuthStore((s) => s.appMeta?.appName) || 'ForecastFlow'
  const { resolved } = useAppearance()
  const compact = resolved.compactNav
  const linkClass = navLinkClass(compact)
  const divider = <span className="mx-1 h-5 w-px bg-slate-200 dark:bg-slate-800" aria-hidden />

  return (
    <div className="min-h-screen">
      <header
        className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
        style={resolved.headerColor ? { backgroundColor: resolved.headerColor } : undefined}
      >
        <div className={`mx-auto flex max-w-6xl items-center justify-between px-6 ${compact ? 'py-1.5' : 'py-3'}`}>
          <div className="flex items-center gap-6">
            {resolved.showBranding && (
              <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">{appName}</span>
            )}
            <nav className="flex items-center gap-1">
              <NavLink to="/" end className={linkClass}>
                Dashboard
              </NavLink>
              <NavLink to="/calendar" className={linkClass}>
                Calendar
              </NavLink>
              <NavLink to="/goals" className={linkClass}>
                Goals
              </NavLink>
              {compact && divider}
              <NavLink to="/reports" className={linkClass}>
                Reports
              </NavLink>
              <NavLink to="/search" className={linkClass}>
                Search
              </NavLink>
              {role === 'owner' && (
                <>
                  {compact && divider}
                  <NavLink to="/control-center" className={linkClass}>
                    Control Center
                  </NavLink>
                </>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            {!compact && <span className="text-slate-500 dark:text-slate-400">{displayName}</span>}
            <NavLink to="/account/security" className={linkClass}>
              Account
            </NavLink>
            <NavLink to="/account/appearance" className={linkClass}>
              Appearance
            </NavLink>
            <button
              onClick={() => signOutUser()}
              className={`rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 ${
                compact ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'
              }`}
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
