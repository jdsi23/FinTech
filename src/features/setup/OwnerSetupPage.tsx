import { useState } from 'react'
import { AuthLayout, ErrorBanner, FormField, PrimaryButton, SecondaryButton } from '../../components/AuthLayout'
import { bootstrapOwner, signInWithGoogle, signUpWithEmail } from '../auth/actions'

export function OwnerSetupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleEmailSetup(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const user = await signUpWithEmail(email, password, name, true)
      await bootstrapOwner(user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  async function handleGoogleSetup() {
    setError(null)
    setBusy(true)
    try {
      const user = await signInWithGoogle(true)
      await bootstrapOwner(user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      title="Welcome to ForecastFlow"
      subtitle="No Owner account exists yet. The account you create now becomes the permanent Owner of this app."
    >
      {error && <ErrorBanner message={error} />}
      <form onSubmit={handleEmailSetup}>
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
          {busy ? 'Creating Owner account…' : 'Create Owner account'}
        </PrimaryButton>
      </form>
      <div className="my-4 flex items-center gap-2 text-xs text-slate-400">
        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
        or
        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
      </div>
      <SecondaryButton type="button" onClick={handleGoogleSetup} disabled={busy}>
        Continue with Google
      </SecondaryButton>
    </AuthLayout>
  )
}
