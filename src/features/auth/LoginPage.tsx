import { useState } from 'react'
import { AuthLayout, ErrorBanner, FormField, PrimaryButton, SecondaryButton } from '../../components/AuthLayout'
import { signInWithEmail, signInWithGoogle } from './actions'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await signInWithEmail(email, password, remember)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in.')
    } finally {
      setBusy(false)
    }
  }

  async function handleGoogle() {
    setError(null)
    setBusy(true)
    try {
      await signInWithGoogle(remember)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout title="Sign in to ForecastFlow" subtitle="New here? You'll need an invite link from the Owner.">
      {error && <ErrorBanner message={error} />}
      <form onSubmit={handleSubmit}>
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
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        <label className="mb-4 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          Remember me on this device
        </label>
        <PrimaryButton type="submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </PrimaryButton>
      </form>
      <div className="my-4 flex items-center gap-2 text-xs text-slate-400">
        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
        or
        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
      </div>
      <SecondaryButton type="button" onClick={handleGoogle} disabled={busy}>
        Continue with Google
      </SecondaryButton>
    </AuthLayout>
  )
}
