import { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import dayjs from 'dayjs'
import { db } from '../../lib/firebase'
import { useAuthStore } from '../../store/authStore'
import { createInvite } from '../auth/actions'
import { ErrorBanner, PrimaryButton } from '../../components/AuthLayout'
import type { InviteDoc } from '../../types/firestore'

interface InviteRow extends InviteDoc {
  id: string
}

function inviteLink(id: string): string {
  const { origin, pathname } = window.location
  return `${origin}${pathname}#/join/${id}`
}

function inviteStatus(invite: InviteDoc): { label: string; className: string } {
  if (invite.used) return { label: 'Used', className: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300' }
  if (invite.expiresAt <= Date.now())
    return { label: 'Expired', className: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' }
  return { label: 'Active', className: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' }
}

export function InviteManagePage() {
  const firebaseUser = useAuthStore((s) => s.firebaseUser)
  const [invites, setInvites] = useState<InviteRow[]>([])
  const [expiresInDays, setExpiresInDays] = useState(7)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    const q = query(collection(db, 'invites'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, (snap) => {
      setInvites(snap.docs.map((d) => ({ id: d.id, ...(d.data() as InviteDoc) })))
    })
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!firebaseUser) return
    setError(null)
    setBusy(true)
    try {
      const expiresAt = dayjs().add(expiresInDays, 'day').valueOf()
      await createInvite(firebaseUser.uid, 'user', expiresAt)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create invite.')
    } finally {
      setBusy(false)
    }
  }

  async function handleCopy(id: string) {
    await navigator.clipboard.writeText(inviteLink(id))
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Invite Management</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Registration is invite-only. Create a link below and share it with the person you want to invite.
      </p>

      {error && (
        <div className="mt-4">
          <ErrorBanner message={error} />
        </div>
      )}

      <form onSubmit={handleCreate} className="mt-4 flex items-end gap-3">
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Expires in (days)</span>
          <input
            type="number"
            min={1}
            max={365}
            value={expiresInDays}
            onChange={(e) => setExpiresInDays(Number(e.target.value))}
            className="w-28 rounded-md border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </label>
        <div className="w-40">
          <PrimaryButton type="submit" disabled={busy}>
            {busy ? 'Creating…' : 'Create invite'}
          </PrimaryButton>
        </div>
      </form>

      <table className="mt-6 w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <th className="py-2 font-medium">Role</th>
            <th className="py-2 font-medium">Status</th>
            <th className="py-2 font-medium">Expires</th>
            <th className="py-2 font-medium">Link</th>
          </tr>
        </thead>
        <tbody>
          {invites.map((invite) => {
            const status = inviteStatus(invite)
            return (
              <tr key={invite.id} className="border-b border-slate-100 dark:border-slate-800">
                <td className="py-2 capitalize text-slate-700 dark:text-slate-300">{invite.role}</td>
                <td className="py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}>
                    {status.label}
                  </span>
                </td>
                <td className="py-2 text-slate-600 dark:text-slate-400">
                  {dayjs(invite.expiresAt).format('MMM D, YYYY')}
                </td>
                <td className="py-2">
                  {!invite.used && invite.expiresAt > Date.now() ? (
                    <button
                      onClick={() => handleCopy(invite.id)}
                      className="text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      {copiedId === invite.id ? 'Copied!' : 'Copy link'}
                    </button>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
              </tr>
            )
          })}
          {invites.length === 0 && (
            <tr>
              <td colSpan={4} className="py-6 text-center text-slate-400">
                No invites yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
