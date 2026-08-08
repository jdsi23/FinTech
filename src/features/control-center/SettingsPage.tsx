import { useEffect, useState } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuthStore } from '../../store/authStore'
import { ErrorBanner, FormField, PrimaryButton } from '../../components/AuthLayout'

export function SettingsPage() {
  const appMeta = useAuthStore((s) => s.appMeta)
  const [appName, setAppName] = useState('ForecastFlow')
  const [expirationDays, setExpirationDays] = useState('7')
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (appMeta?.appName) setAppName(appMeta.appName)
    if (appMeta?.defaultInviteExpirationDays) setExpirationDays(String(appMeta.defaultInviteExpirationDays))
  }, [appMeta])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaved(false)
    setBusy(true)
    try {
      await updateDoc(doc(db, 'meta', 'app'), {
        appName: appName.trim() || 'ForecastFlow',
        defaultInviteExpirationDays: Number(expirationDays) || 1,
      })
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save settings.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">App &amp; Security Settings</h1>

      <form onSubmit={handleSave} className="mt-6 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
        <h2 className="font-medium text-slate-900 dark:text-slate-100">App settings</h2>

        {error && (
          <div className="mt-3">
            <ErrorBanner message={error} />
          </div>
        )}
        {saved && !error && <p className="mt-3 text-sm text-green-700 dark:text-green-400">Saved.</p>}

        <div className="mt-3">
          <FormField label="App name" type="text" value={appName} onChange={(e) => setAppName(e.target.value)} />
          <FormField
            label="Default invite expiration (days)"
            type="number"
            min={1}
            max={365}
            value={expirationDays}
            onChange={(e) => setExpirationDays(e.target.value)}
          />
        </div>
        <div className="w-40">
          <PrimaryButton type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </PrimaryButton>
        </div>
      </form>

      <div className="mt-4 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
        <h2 className="font-medium text-slate-900 dark:text-slate-100">Security model</h2>
        <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-slate-600 dark:text-slate-400">
          <li>Email verification is required for every account before the app is accessible.</li>
          <li>
            There's no backend server — Firestore Security Rules are the only enforcement of who can read
            or write what.{' '}
            <a
              className="text-indigo-600 hover:underline dark:text-indigo-400"
              href="https://github.com/jdsi23/FinTech/blob/main/firestore.rules"
              target="_blank"
              rel="noreferrer"
            >
              View the current rules on GitHub →
            </a>
          </li>
          <li>
            Biometric unlock (Face ID/Windows Hello/fingerprint) is opt-in and per device. Each person
            manages their own from their <span className="font-medium">Account</span> page.
          </li>
          <li>Registration is invite-only — there is no public sign-up.</li>
        </ul>
      </div>
    </div>
  )
}
