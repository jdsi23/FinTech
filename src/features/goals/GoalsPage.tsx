import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useCollection } from '../../lib/useCollection'
import { Modal } from '../../components/Modal'
import { GoalForm } from './GoalForm'
import { GoalCard } from './GoalCard'
import { PrimaryButton } from '../../components/AuthLayout'
import { deleteGoal } from './actions'
import type { GoalDoc } from '../../types/firestore'

export function GoalsPage() {
  const uid = useAuthStore((s) => s.firebaseUser?.uid)
  const goals = useCollection<GoalDoc>(uid, 'goals')
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<(GoalDoc & { id: string }) | null>(null)

  if (!uid) return null

  async function handleDelete(id: string) {
    if (!uid) return
    if (!confirm('Delete this goal? This cannot be undone.')) return
    await deleteGoal(uid, id)
    setEditing(null)
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Goals</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Suggestions only — ForecastFlow never moves money or requires a certain amount.
          </p>
        </div>
        <div className="w-40">
          <PrimaryButton type="button" onClick={() => setShowCreate(true)}>
            + New goal
          </PrimaryButton>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {goals.map((goal) => (
          <GoalCard key={goal.id} goal={goal} onClick={() => setEditing(goal)} />
        ))}
        {goals.length === 0 && <p className="text-sm text-slate-400">No goals yet — create one to get started.</p>}
      </div>

      {showCreate && (
        <Modal title="New goal" onClose={() => setShowCreate(false)}>
          <GoalForm uid={uid} onDone={() => setShowCreate(false)} onCancel={() => setShowCreate(false)} />
        </Modal>
      )}

      {editing && (
        <Modal title="Edit goal" onClose={() => setEditing(null)}>
          <GoalForm
            uid={uid}
            itemId={editing.id}
            initial={editing}
            onDone={() => setEditing(null)}
            onCancel={() => setEditing(null)}
          />
          <button
            onClick={() => handleDelete(editing.id)}
            className="mt-4 text-sm text-red-600 hover:underline dark:text-red-400"
          >
            Delete goal
          </button>
        </Modal>
      )}
    </div>
  )
}
