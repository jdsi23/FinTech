import { useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import dayjs from 'dayjs'
import { db } from '../../lib/firebase'
import { ErrorBanner, PrimaryButton } from '../../components/AuthLayout'

async function downloadBackup() {
  const [usersSnap, invitesSnap] = await Promise.all([
    getDocs(collection(db, 'users')),
    getDocs(collection(db, 'invites')),
  ])

  const backup = {
    exportedAt: new Date().toISOString(),
    users: usersSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    invites: invitesSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
  }

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `forecastflow-backup-${dayjs().format('YYYY-MM-DD-HHmm')}.json`
  link.click()
  URL.revokeObjectURL(url)
}

export function BackupPage() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDownload() {
    setError(null)
    setBusy(true)
    try {
      await downloadBackup()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create a backup.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Backup Management</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Download everything currently in the <code>users</code> and <code>invites</code> collections as a
        single JSON file.
      </p>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        There's no one-click restore. Writing this data back would mean bulk-writing other people's
        account records past the security rules that exist specifically to stop that — so treat this as
        a point-in-time export to keep somewhere safe, not a live backup/restore system.
      </p>

      {error && (
        <div className="mt-4">
          <ErrorBanner message={error} />
        </div>
      )}

      <div className="mt-4 w-56">
        <PrimaryButton type="button" onClick={handleDownload} disabled={busy}>
          {busy ? 'Preparing…' : 'Download backup'}
        </PrimaryButton>
      </div>
    </div>
  )
}
