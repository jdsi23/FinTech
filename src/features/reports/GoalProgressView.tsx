import { GoalCard } from '../goals/GoalCard'
import type { GoalDoc } from '../../types/firestore'

export function GoalProgressView({ goals }: { goals: (GoalDoc & { id: string })[] }) {
  if (goals.length === 0) return <p className="text-sm text-slate-400">No goals yet.</p>
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {goals.map((g) => (
        <GoalCard key={g.id} goal={g} />
      ))}
    </div>
  )
}
