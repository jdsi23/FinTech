import { useState } from 'react'
import { AuthLayout, ErrorBanner, PrimaryButton, SecondaryButton } from '../../components/AuthLayout'
import { useAuthStore, refreshFirebaseUser } from '../../store/authStore'
import { resendVerificationEmail, signOutUser } from './actions'
import { auth } from '../../lib/firebase'

export function VerifyEmailPage() {
  const email = useAuthStore((s) => s.firebaseUser?.email)
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleResend() {
    setError(null)
    setBusy(true)
    try {
      if (auth.currentUser) await resendVerificationEmail(auth.currentUser)
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send email.')
    } finally {
      setBusy(false)
    }
  }

  async function handleCheckAgain() {
    setBusy(true)
    try {
      await refreshFirebaseUser()
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout title="Verify your email" subtitle={`We sent a verification link to ${email ?? 'your email address'}.`}>
      {error && <ErrorBanner message={error} />}
      {sent && !error && (
        <p className="mb-4 text-sm text-green-700 dark:text-green-400">Verification email sent.</p>
      )}
      <div className="space-y-3">
        <PrimaryButton type="button" onClick={handleCheckAgain} disabled={busy}>
          I've verified — check again
        </PrimaryButton>
        <SecondaryButton type="button" onClick={handleResend} disabled={busy}>
          Resend verification email
        </SecondaryButton>
        <SecondaryButton type="button" onClick={() => signOutUser()} disabled={busy}>
          Sign out
        </SecondaryButton>
      </div>
    </AuthLayout>
  )
}
