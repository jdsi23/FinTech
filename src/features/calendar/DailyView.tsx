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
import type { ExpenseDoc, IncomeDoc, OccurrenceStatus } from '../../types/firestore'

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
  onClose,
}: {
  uid: string
  date: number
  incomeSources: (IncomeDoc & { id: string })[]
  expenses: (ExpenseDoc & { id: string })[]
  merchants: { id: string; name: string }[]
  onClose: () => void
}) {
  const dayStart = dayjs(date).startOf('day').valueOf()
  const dayEnd = dayjs(date).endOf('day').valueOf()
  const entries = buildOccurrenceEntries(incomeSources, expenses, dayStart, dayEnd)

  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editAmount, setEditAmount] = useState(0)
  const [addingKind, setAddingKind] = useState<'income' | 'expense' | null>(null)

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
      actualAmount: editAmount,
    })
    setEditingKey(null)
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
      {entries.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">Nothing scheduled.</p>}

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
                    <input
                      type="number"
                      step="0.01"
                      value={editAmount}
                      onChange={(e) => setEditAmount(Number(e.target.value))}
                      className="w-24 rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
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
                        setEditAmount(entry.amount)
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
