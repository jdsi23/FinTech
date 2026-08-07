import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuthStore } from '../../store/authStore'
import { AuthLayout, ErrorBanner, FormField, PrimaryButton, SecondaryButton } from '../../components/AuthLayout'
import { redeemInvite, signInWithGoogle, signUpWithEmail } from '../auth/actions'
import type { InviteDoc } from '../../types/firestore'

type InviteState =
  | { status: 'loading' }
  | { status: 'invalid' }
  | { status: 'used' }
  | { status: 'expired' }
  | { status: 'valid'; invite: InviteDoc }

export function JoinPage() {
  const { inviteId } = useParams<{ inviteId: string }>()
  const firebaseUser = useAuthStore((s) => s.firebaseUser)
  const [inviteState, setInviteState] = useState<InviteState>({ status: 'loading' })
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!inviteId) return
    getDoc(doc(db, 'invites', inviteId)).then((snap) => {
      if (!snap.exists()) {
        setInviteState({ status: 'invalid' })
        return
      }
      const invite = snap.data() as InviteDoc
      if (invite.used) {
        setInviteState({ status: 'used' })
      } else if (invite.expiresAt <= Date.now()) {
        setInviteState({ status: 'expired' })
      } else {
        setInviteState({ status: 'valid', invite })
      }
    }).catch(() => setInviteState({ status: 'invalid' }))
  }, [inviteId])

  async function completeRedemption(user: Parameters<typeof redeemInvite>[1]) {
    if (!inviteId) return
    await redeemInvite(inviteId, user)
  }

  async function handleEmailJoin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const user = await signUpWithEmail(email, password, name, true)
      await completeRedemption(user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  async function handleGoogleJoin() {
    setError(null)
    setBusy(true)
    try {
      const user = await signInWithGoogle(true)
      await completeRedemption(user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  if (firebaseUser) {
    return (
      <AuthLayout title="You're already signed in">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Sign out first if you want to redeem this invite with a different account.
        </p>
      </AuthLayout>
    )
  }

  if (inviteState.status === 'loading') {
    return (
      <AuthLayout title="Checking invite…">
        <p className="text-sm text-slate-500">One moment.</p>
      </AuthLayout>
    )
  }

  if (inviteState.status !== 'valid') {
    const messages: Record<string, string> = {
      invalid: 'This invite link is not valid. Ask the Owner for a new one.',
      used: 'This invite has already been used. Ask the Owner for a new one.',
      expired: 'This invite has expired. Ask the Owner for a new one.',
    }
    return (
      <AuthLayout title="Invite unavailable">
        <ErrorBanner message={messages[inviteState.status]} />
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="You're invited to ForecastFlow"
      subtitle={`Create your account to join as ${inviteState.invite.role === 'owner' ? 'Owner' : 'a user'}.`}
    >
      {error && <ErrorBanner message={error} />}
      <form onSubmit={handleEmailJoin}>
        <FormField
          label="Your name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
        />
        <FormField
          label="Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <FormField
          label="Password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />
        <PrimaryButton type="submit" disabled={busy}>
          {busy ? 'Creating account…' : 'Create account'}
        </PrimaryButton>
      </form>
      <div className="my-4 flex items-center gap-2 text-xs text-slate-400">
        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
        or
        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
      </div>
      <SecondaryButton type="button" onClick={handleGoogleJoin} disabled={busy}>
        Continue with Google
      </SecondaryButton>
    </AuthLayout>
  )
}
