import dayjs from 'dayjs'
import { currentSaved, suggestedWeekly } from './goalMath'
import { GoalJourney } from './GoalJourney'
import type { GoalDoc } from '../../types/firestore'

export function GoalCard({
  goal,
  onClick,
  compact,
}: {
  goal: GoalDoc & { id: string }
  onClick?: () => void
  compact?: boolean
}) {
  const saved = currentSaved(goal)
  const progress = goal.targetAmount > 0 ? (saved / goal.targetAmount) * 100 : 0
  const weekly = suggestedWeekly(goal, Date.now())

  return (
    <button
      onClick={onClick}
      style={{ borderLeftColor: goal.color, borderLeftWidth: 4 }}
      className="w-full rounded-lg border border-slate-200 p-4 text-left transition hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-800 dark:hover:border-indigo-800 dark:hover:bg-indigo-950"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{goal.icon || '🎯'}</span>
          <div>
            <div className="font-medium text-slate-900 dark:text-slate-100">{goal.name}</div>
            {!compact && goal.category && <div className="text-xs text-slate-400">{goal.category}</div>}
          </div>
        </div>
        <div className="text-right text-sm">
          <div className="font-medium text-slate-900 dark:text-slate-100">
            ${saved.toFixed(0)} / ${goal.targetAmount.toFixed(0)}
          </div>
          {!compact && (
            <div className="text-xs text-slate-400">by {dayjs(goal.targetDate).format('MMM D, YYYY')}</div>
          )}
        </div>
      </div>

      <GoalJourney progress={progress} />

      {!compact && (
        <p className="text-xs text-slate-500 dark:text-slate-400">Suggested: ${weekly.toFixed(2)}/week</p>
      )}
    </button>
  )
}
