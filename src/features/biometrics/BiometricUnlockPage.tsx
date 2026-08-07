import { useEffect, useState } from 'react'
import { AuthLayout, ErrorBanner, PrimaryButton, SecondaryButton } from '../../components/AuthLayout'
import { verifyBiometricUnlock } from './webauthn'
import { markUnlocked } from './biometricStore'
import { signOutUser } from '../auth/actions'

export function BiometricUnlockPage({ uid }: { uid: string }) {
  const [status, setStatus] = useState<'prompting' | 'failed'>('prompting')

  async function attempt() {
    setStatus('prompting')
    const ok = await verifyBiometricUnlock(uid)
    if (ok) {
      markUnlocked()
    } else {
      setStatus('failed')
    }
  }

  useEffect(() => {
    attempt()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <AuthLayout
      title="Unlock ForecastFlow"
      subtitle="Use Face ID, Windows Hello, or your fingerprint to continue on this device."
    >
      {status === 'failed' && (
        <ErrorBanner message="Could not verify. It may have been cancelled or timed out." />
      )}
      <div className="space-y-3">
        <PrimaryButton type="button" onClick={attempt} disabled={status === 'prompting'}>
          {status === 'prompting' ? 'Waiting…' : 'Try again'}
        </PrimaryButton>
        <SecondaryButton type="button" onClick={() => signOutUser()}>
          Use password instead
        </SecondaryButton>
      </div>
    </AuthLayout>
  )
}
