import { useEffect, useState } from 'react'
import { collection, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore'
import dayjs from 'dayjs'
import { db } from '../../lib/firebase'
import { ErrorBanner } from '../../components/AuthLayout'
import type { UserDoc } from '../../types/firestore'

interface UserRow extends UserDoc {
  id: string
}

export function UserManagementPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busyUid, setBusyUid] = useState<string | null>(null)

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'asc'))
    return onSnapshot(q, (snap) => {
      setUsers(snap.docs.map((d) => ({ id: d.id, ...(d.data() as UserDoc) })))
    })
  }, [])

  async function toggleDisabled(user: UserRow) {
    setError(null)
    setBusyUid(user.id)
    try {
      await updateDoc(doc(db, 'users', user.id), { disabled: !user.disabled })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update this user.')
    } finally {
      setBusyUid(null)
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">User Management</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Disabling a user blocks their access to the app. It doesn't delete their sign-in account — there's
        no way to do that from here without a backend, so a disabled person could still see a "Sign in"
        screen, they just can't get past it.
      </p>

      {error && (
        <div className="mt-4">
          <ErrorBanner message={error} />
        </div>
      )}

      <table className="mt-6 w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <th className="py-2 font-medium">Name</th>
            <th className="py-2 font-medium">Email</th>
            <th className="py-2 font-medium">Role</th>
            <th className="py-2 font-medium">Joined</th>
            <th className="py-2 font-medium">Status</th>
            <th className="py-2 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b border-slate-100 dark:border-slate-800">
              <td className="py-2 text-slate-700 dark:text-slate-300">{user.displayName || '—'}</td>
              <td className="py-2 text-slate-700 dark:text-slate-300">{user.email}</td>
              <td className="py-2 capitalize text-slate-700 dark:text-slate-300">{user.role}</td>
              <td className="py-2 text-slate-600 dark:text-slate-400">
                {dayjs(user.createdAt).format('MMM D, YYYY')}
              </td>
              <td className="py-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    user.disabled
                      ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                      : 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
                  }`}
                >
                  {user.disabled ? 'Disabled' : 'Active'}
                </span>
              </td>
              <td className="py-2">
                {user.role === 'owner' ? (
                  <span className="text-slate-400">—</span>
                ) : (
                  <button
                    onClick={() => toggleDisabled(user)}
                    disabled={busyUid === user.id}
                    className="text-indigo-600 hover:underline disabled:opacity-50 dark:text-indigo-400"
                  >
                    {user.disabled ? 'Enable' : 'Disable'}
                  </button>
                )}
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr>
              <td colSpan={6} className="py-6 text-center text-slate-400">
                No users yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
