import { useEffect, useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { ErrorBanner, PrimaryButton, SecondaryButton } from '../../components/AuthLayout'
import {
  hasBiometricCredential,
  isPlatformAuthenticatorAvailable,
  registerBiometricCredential,
  removeBiometricCredential,
} from './webauthn'

export function AccountSecurityPage() {
  const uid = useAuthStore((s) => s.firebaseUser?.uid)
  const email = useAuthStore((s) => s.firebaseUser?.email)

  const [available, setAvailable] = useState<boolean | null>(null)
  const [enabled, setEnabled] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    isPlatformAuthenticatorAvailable().then(setAvailable)
    if (uid) setEnabled(hasBiometricCredential(uid))
  }, [uid])

  async function handleEnable() {
    if (!uid || !email) return
    setError(null)
    setBusy(true)
    try {
      await registerBiometricCredential(uid, email)
      setEnabled(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not enable biometric unlock on this device.')
    } finally {
      setBusy(false)
    }
  }

  function handleDisable() {
    if (!uid) return
    removeBiometricCredential(uid)
    setEnabled(false)
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Account &amp; Security</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        You'll always be able to sign in with your email and password. Biometric unlock is an optional
        shortcut for this device only — it doesn't replace your password, and each device you use needs
        its own separate setup.
      </p>

      <div className="mt-6 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
        <h2 className="font-medium text-slate-900 dark:text-slate-100">
          Face ID / Windows Hello / Fingerprint
        </h2>

        {error && (
          <div className="mt-3">
            <ErrorBanner message={error} />
          </div>
        )}

        {available === false && (
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            This browser or device doesn't support biometric unlock.
          </p>
        )}

        {available === true && (
          <>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Status on this device: <span className="font-medium">{enabled ? 'Enabled' : 'Disabled'}</span>
            </p>
            <div className="mt-4 w-56">
              {enabled ? (
                <SecondaryButton type="button" onClick={handleDisable} disabled={busy}>
                  Disable on this device
                </SecondaryButton>
              ) : (
                <PrimaryButton type="button" onClick={handleEnable} disabled={busy}>
                  {busy ? 'Setting up…' : 'Enable on this device'}
                </PrimaryButton>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
