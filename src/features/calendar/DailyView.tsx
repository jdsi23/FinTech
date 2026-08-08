import { useState } from 'react'
import dayjs from 'dayjs'
import { Modal } from '../../components/Modal'
import { SecondaryButton } from '../../components/AuthLayout'
import { buildOccurrenceEntries, type OccurrenceEntry } from './calendarMath'
import { dateKey } from '../../lib/recurrence'
import { clearOccurrenceOverride, setOccurrenceOverride } from '../finance/actions'
import { IncomeForm } from '../finance/IncomeForm'
import { ExpenseForm } from '../finance/ExpenseForm'
import { incomeMeta, paymentMethodMeta } from '../../lib/paymentMethods'
import { checkInWeekKey, getCheckInDates, suggestedPerCheckIn, suggestedStretchTarget } from '../goals/goalMath'
import { clearCheckIn, logCheckIn, updateGoal } from '../goals/actions'
import type { ExpenseDoc, GoalDoc, IncomeDoc, OccurrenceStatus } from '../../types/firestore'

const STATUS_LABEL: Record<OccurrenceStatus, string> = {
  scheduled: 'Scheduled',
  completed: 'Completed',
  modified: 'Modified',
  skipped: 'Skipped',
}

const STATUS_CLASS: Record<OccurrenceStatus, string> = {
  scheduled: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  completed: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  modified: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  skipped: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 line-through',
}

function entryKey(entry: OccurrenceEntry): string {
  return `${entry.kind}-${entry.id}`
}

export function DailyView({
  uid,
  date,
  incomeSources,
  expenses,
  merchants,
  goals,
  onClose,
}: {
  uid: string
  date: number
  incomeSources: (IncomeDoc & { id: string })[]
  expenses: (ExpenseDoc & { id: string })[]
  merchants: { id: string; name: string }[]
  goals: (GoalDoc & { id: string })[]
  onClose: () => void
}) {
  const dayStart = dayjs(date).startOf('day').valueOf()
  const dayEnd = dayjs(date).endOf('day').valueOf()
  const entries = buildOccurrenceEntries(incomeSources, expenses, dayStart, dayEnd)
  const goalsWithCheckIn = goals.filter((g) => getCheckInDates(g, dayStart, dayEnd).length > 0)
  const weekKey = checkInWeekKey(date)

  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editAmount, setEditAmount] = useState('')
  const [addingKind, setAddingKind] = useState<'income' | 'expense' | null>(null)
  const [checkInInputs, setCheckInInputs] = useState<Record<string, string>>({})

  function kindOf(entry: OccurrenceEntry): 'incomeSources' | 'expenses' {
    return entry.kind === 'income' ? 'incomeSources' : 'expenses'
  }

  async function markComplete(entry: OccurrenceEntry) {
    await setOccurrenceOverride(uid, kindOf(entry), entry.id, dateKey(entry.date), {
      status: 'completed',
      actualAmount: entry.amount,
    })
  }

  async function markSkipped(entry: OccurrenceEntry) {
    await setOccurrenceOverride(uid, kindOf(entry), entry.id, dateKey(entry.date), { status: 'skipped' })
  }

  async function undo(entry: OccurrenceEntry) {
    await clearOccurrenceOverride(uid, kindOf(entry), entry.id, dateKey(entry.date))
  }

  async function confirmAmount(entry: OccurrenceEntry) {
    await setOccurrenceOverride(uid, kindOf(entry), entry.id, dateKey(entry.date), {
      status: 'modified',
      actualAmount: Number(editAmount) || 0,
    })
    setEditingKey(null)
  }

  async function toggleEvenSooner(goal: GoalDoc & { id: string }, checked: boolean) {
    if (!checked) {
      const ok = window.confirm(
        'Disabling Even Sooner will turn off the stretch target for all upcoming weekly check-ins on this goal. You can re-enable it at any time.\n\nAre you sure?',
      )
      if (!ok) return
    }
    await updateGoal(uid, goal.id, { evenSoonerEnabled: checked })
  }

  if (addingKind) {
    return (
      <Modal title={addingKind === 'income' ? 'Add income' : 'Add expense'} onClose={onClose}>
        {addingKind === 'income' ? (
          <IncomeForm uid={uid} defaultDate={date} onDone={() => setAddingKind(null)} onCancel={() => setAddingKind(null)} />
        ) : (
          <ExpenseForm
            uid={uid}
            defaultDate={date}
            merchants={merchants}
            onDone={() => setAddingKind(null)}
            onCancel={() => setAddingKind(null)}
          />
        )}
      </Modal>
    )
  }

  return (
    <Modal title={dayjs(date).format('dddd, MMMM D, YYYY')} onClose={onClose}>
      {goalsWithCheckIn.length > 0 && (
        <div className="mb-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">Goal Check-ins</h3>
          {goalsWithCheckIn.map((goal) => {
            const logged = goal.checkIns?.[weekKey]
            const target = suggestedPerCheckIn(goal, date)
            const stretch =
              goal.strategy === 'slightly_early' && goal.evenSoonerEnabled
                ? suggestedStretchTarget(goal, date)
                : null

            const amountValue = Number(checkInInputs[goal.id] ?? logged ?? 0) || 0

            return (
              <div key={goal.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{goal.icon}</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">{goal.name}</span>
                  </div>
                  {goal.strategy === 'slightly_early' && (
                    <label className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <input
                        type="checkbox"
                        checked={goal.evenSoonerEnabled ?? false}
                        onChange={(e) => toggleEvenSooner(goal, e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-slate-300"
                      />
                      Even Sooner
                    </label>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Target this check-in: ${target.toFixed(2)}</p>
                {stretch !== null && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Suggested stretch target: ${stretch.toFixed(2)}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-2">
                  <div className="relative w-28">
                    <span className="pointer-events-none absolute inset-y-0 left-2 flex items-center text-sm text-slate-500 dark:text-slate-400">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={checkInInputs[goal.id] ?? (logged !== undefined ? String(logged) : '')}
                      onChange={(e) => setCheckInInputs((prev) => ({ ...prev, [goal.id]: e.target.value }))}
                      className="w-full rounded-md border border-slate-300 py-1 pl-5 pr-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <button
                    onClick={() => logCheckIn(uid, goal.id, weekKey, amountValue)}
                    className="text-sm text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    {logged !== undefined ? 'Update' : 'Log'}
                  </button>
                  {logged !== undefined && (
                    <button
                      onClick={() => {
                        clearCheckIn(uid, goal.id, weekKey)
                        setCheckInInputs((prev) => {
                          const next = { ...prev }
                          delete next[goal.id]
                          return next
                        })
                      }}
                      className="text-sm text-slate-500 hover:underline dark:text-slate-400"
                    >
                      Undo
                    </button>
                  )}
                </div>
                {logged !== undefined && (
                  <p className="mt-1 text-xs text-green-700 dark:text-green-400">Logged: ${logged.toFixed(2)}</p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {entries.length === 0 && goalsWithCheckIn.length === 0 && (
        <p className="text-sm text-slate-500 dark:text-slate-400">Nothing scheduled.</p>
      )}

      <ul className="space-y-3">
        {entries.map((entry) => {
          const key = entryKey(entry)
          const meta = entry.kind === 'income' ? incomeMeta : paymentMethodMeta[entry.paymentMethod!]
          return (
            <li key={key} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <span className={`mr-2 inline-block h-2 w-2 rounded-full ${meta.dot}`} />
                  <span className="font-medium text-slate-900 dark:text-slate-100">{entry.label}</span>
                  {entry.category && <span className="ml-2 text-xs text-slate-400">{entry.category}</span>}
                </div>
                <span className={entry.kind === 'income' ? 'text-green-700 dark:text-green-400' : 'text-slate-700 dark:text-slate-300'}>
                  {entry.kind === 'income' ? '+' : '-'}${entry.amount.toFixed(2)}
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[entry.status]}`}>
                  {STATUS_LABEL[entry.status]}
                </span>

                {editingKey === key ? (
                  <div className="flex items-center gap-2">
                    <div className="relative w-24">
                      <span className="pointer-events-none absolute inset-y-0 left-2 flex items-center text-sm text-slate-500 dark:text-slate-400">
                        $
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        className="w-full rounded-md border border-slate-300 py-1 pl-5 pr-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <button onClick={() => confirmAmount(entry)} className="text-sm text-indigo-600 hover:underline dark:text-indigo-400">
                      Confirm
                    </button>
                  </div>
                ) : entry.status === 'scheduled' ? (
                  <div className="flex gap-3 text-sm">
                    <button onClick={() => markComplete(entry)} className="text-green-700 hover:underline dark:text-green-400">
                      Complete
                    </button>
                    <button
                      onClick={() => {
                        setEditingKey(key)
                        setEditAmount(String(entry.amount))
                      }}
                      className="text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      Edit amount
                    </button>
                    <button onClick={() => markSkipped(entry)} className="text-red-600 hover:underline dark:text-red-400">
                      Skip
                    </button>
                  </div>
                ) : (
                  <button onClick={() => undo(entry)} className="text-sm text-slate-500 hover:underline dark:text-slate-400">
                    Undo
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      <div className="mt-4 flex gap-2">
        <div className="w-40">
          <SecondaryButton type="button" onClick={() => setAddingKind('income')}>
            + Add income
          </SecondaryButton>
        </div>
        <div className="w-40">
          <SecondaryButton type="button" onClick={() => setAddingKind('expense')}>
            + Add expense
          </SecondaryButton>
        </div>
      </div>
    </Modal>
  )
}
