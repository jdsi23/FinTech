import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { isAuthReady, useAuthStore } from '../store/authStore'
import { LoginPage } from '../features/auth/LoginPage'
import { VerifyEmailPage } from '../features/auth/VerifyEmailPage'
import { OwnerSetupPage } from '../features/setup/OwnerSetupPage'
import { AccountIncompletePage } from '../features/auth/AccountIncompletePage'
import { AccessDisabledPage } from '../features/auth/AccessDisabledPage'
import { JoinPage } from '../features/invites/JoinPage'
import { InviteManagePage } from '../features/invites/InviteManagePage'
import { AppShell } from '../components/AppShell'
import { DashboardPage } from '../features/dashboard/DashboardPage'
import { CalendarPage } from '../features/calendar/CalendarPage'
import { GoalsPage } from '../features/goals/GoalsPage'
import { ReportsPage } from '../features/reports/ReportsPage'
import { SearchPage } from '../features/search/SearchPage'
import { AccountSecurityPage } from '../features/biometrics/AccountSecurityPage'
import { AppearanceProvider } from '../features/appearance/AppearanceProvider'
import { AppearancePage } from '../features/appearance/AppearancePage'
import { BiometricUnlockPage } from '../features/biometrics/BiometricUnlockPage'
import { useBiometricStore } from '../features/biometrics/biometricStore'
import { hasBiometricCredential } from '../features/biometrics/webauthn'
import { ControlCenterHome } from '../features/control-center/ControlCenterHome'
import { UserManagementPage } from '../features/control-center/UserManagementPage'
import { SystemInfoPage } from '../features/control-center/SystemInfoPage'
import { BackupPage } from '../features/control-center/BackupPage'
import { SettingsPage } from '../features/control-center/SettingsPage'

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">Loading…</div>
  )
}

/** Everything except /join/:inviteId lives behind this gate, in order:
 *  auth state resolved -> Owner exists -> signed in -> email verified ->
 *  biometric unlock (only when this device has one registered and this
 *  page-load's session was silently restored, not an interactive sign-in) ->
 *  user doc loaded. */
function Protected() {
  const ready = useAuthStore((s) => isAuthReady(s))
  const hasOwner = useAuthStore((s) => Boolean(s.appMeta))
  const isSignedIn = useAuthStore((s) => Boolean(s.firebaseUser))
  const emailVerified = useAuthStore((s) => s.firebaseUser?.emailVerified ?? false)
  const uid = useAuthStore((s) => s.firebaseUser?.uid)
  const unlocked = useBiometricStore((s) => s.unlocked)
  const userDocReady = useAuthStore((s) => s.userDocReady)
  const role = useAuthStore((s) => s.userDoc?.role)
  const disabled = useAuthStore((s) => s.userDoc?.disabled ?? false)

  if (!ready) return <LoadingScreen />
  if (!hasOwner) return <OwnerSetupPage />
  if (!isSignedIn) return <LoginPage />
  if (!emailVerified) return <VerifyEmailPage />
  if (!unlocked && uid && hasBiometricCredential(uid)) return <BiometricUnlockPage uid={uid} />
  if (!userDocReady) return <LoadingScreen />
  if (!role) return <AccountIncompletePage />
  if (disabled && role !== 'owner') return <AccessDisabledPage />

  return (
    <AppearanceProvider uid={uid!}>
      <AppShell role={role}>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/account/security" element={<AccountSecurityPage />} />
          <Route path="/account/appearance" element={<AppearancePage />} />
          {role === 'owner' && (
            <>
              <Route path="/control-center" element={<ControlCenterHome />} />
              <Route path="/control-center/invites" element={<InviteManagePage />} />
              <Route path="/control-center/users" element={<UserManagementPage />} />
              <Route path="/control-center/system" element={<SystemInfoPage />} />
              <Route path="/control-center/backup" element={<BackupPage />} />
              <Route path="/control-center/settings" element={<SettingsPage />} />
            </>
          )}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </AppearanceProvider>
  )
}

export function AppRoutes() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/join/:inviteId" element={<JoinPage />} />
        <Route path="/*" element={<Protected />} />
      </Routes>
    </HashRouter>
  )
}
