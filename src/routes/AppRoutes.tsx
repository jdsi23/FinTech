import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { isAuthReady, useAuthStore } from '../store/authStore'
import { LoginPage } from '../features/auth/LoginPage'
import { VerifyEmailPage } from '../features/auth/VerifyEmailPage'
import { OwnerSetupPage } from '../features/setup/OwnerSetupPage'
import { AccountIncompletePage } from '../features/auth/AccountIncompletePage'
import { JoinPage } from '../features/invites/JoinPage'
import { InviteManagePage } from '../features/invites/InviteManagePage'
import { AppShell } from '../components/AppShell'
import { Dashboard } from '../pages/Dashboard'
import { CalendarPage } from '../pages/Calendar'
import { GoalsPage } from '../pages/Goals'
import { AccountSecurityPage } from '../features/biometrics/AccountSecurityPage'
import { BiometricUnlockPage } from '../features/biometrics/BiometricUnlockPage'
import { useBiometricStore } from '../features/biometrics/biometricStore'
import { hasBiometricCredential } from '../features/biometrics/webauthn'

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

  if (!ready) return <LoadingScreen />
  if (!hasOwner) return <OwnerSetupPage />
  if (!isSignedIn) return <LoginPage />
  if (!emailVerified) return <VerifyEmailPage />
  if (!unlocked && uid && hasBiometricCredential(uid)) return <BiometricUnlockPage uid={uid} />
  if (!userDocReady) return <LoadingScreen />
  if (!role) return <AccountIncompletePage />

  return (
    <AppShell role={role}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/goals" element={<GoalsPage />} />
        <Route path="/account/security" element={<AccountSecurityPage />} />
        {role === 'owner' && <Route path="/control-center/invites" element={<InviteManagePage />} />}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
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
