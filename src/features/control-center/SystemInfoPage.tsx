import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { inviteStatus } from '../invites/InviteManagePage'
import type { InviteDoc, UserDoc } from '../../types/firestore'

const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID as string

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-2 text-sm last:border-0 dark:border-slate-800">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-medium text-slate-900 dark:text-slate-100">{value}</span>
    </div>
  )
}

export function SystemInfoPage() {
  const [users, setUsers] = useState<UserDoc[]>([])
  const [invites, setInvites] = useState<InviteDoc[]>([])

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map((d) => d.data() as UserDoc))
    })
    const unsubInvites = onSnapshot(collection(db, 'invites'), (snap) => {
      setInvites(snap.docs.map((d) => d.data() as InviteDoc))
    })
    return () => {
      unsubUsers()
      unsubInvites()
    }
  }, [])

  const ownerCount = users.filter((u) => u.role === 'owner').length
  const userCount = users.filter((u) => u.role === 'user').length
  const disabledCount = users.filter((u) => u.disabled).length
  const activeInvites = invites.filter((i) => inviteStatus(i).label === 'Active').length
  const usedInvites = invites.filter((i) => inviteStatus(i).label === 'Used').length
  const expiredInvites = invites.filter((i) => inviteStatus(i).label === 'Expired').length

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Database &amp; System Info</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Live counts from Firestore, plus where to find this project in the Firebase Console.
      </p>

      <div className="mt-6 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
        <h2 className="font-medium text-slate-900 dark:text-slate-100">Users</h2>
        <div className="mt-2">
          <StatRow label="Owner" value={ownerCount} />
          <StatRow label="Regular users" value={userCount} />
          <StatRow label="Disabled" value={disabledCount} />
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
        <h2 className="font-medium text-slate-900 dark:text-slate-100">Invites</h2>
        <div className="mt-2">
          <StatRow label="Active" value={activeInvites} />
          <StatRow label="Used" value={usedInvites} />
          <StatRow label="Expired" value={expiredInvites} />
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
        <h2 className="font-medium text-slate-900 dark:text-slate-100">Project</h2>
        <div className="mt-2">
          <StatRow label="Firebase project ID" value={projectId} />
          <StatRow label="Plan" value="Spark (free)" />
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          <a
            className="text-indigo-600 hover:underline dark:text-indigo-400"
            href={`https://console.firebase.google.com/project/${projectId}/firestore/data`}
            target="_blank"
            rel="noreferrer"
          >
            Open Firestore data →
          </a>
          <a
            className="text-indigo-600 hover:underline dark:text-indigo-400"
            href={`https://console.firebase.google.com/project/${projectId}/authentication/users`}
            target="_blank"
            rel="noreferrer"
          >
            Open Authentication users →
          </a>
        </div>
      </div>
    </div>
  )
}
