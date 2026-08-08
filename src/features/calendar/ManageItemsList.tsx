import { useState } from 'react'
import { Modal } from '../../components/Modal'
import { IncomeForm } from '../finance/IncomeForm'
import { ExpenseForm } from '../finance/ExpenseForm'
import { deleteIncome, deleteExpense, updateIncome, updateExpense } from '../finance/actions'
import type { ExpenseDoc, IncomeDoc } from '../../types/firestore'

type Editing = { kind: 'income'; item: IncomeDoc & { id: string } } | { kind: 'expense'; item: ExpenseDoc & { id: string } }

export function ManageItemsList({
  uid,
  incomeSources,
  expenses,
  merchants,
  onClose,
}: {
  uid: string
  incomeSources: (IncomeDoc & { id: string })[]
  expenses: (ExpenseDoc & { id: string })[]
  merchants: { id: string; name: string }[]
  onClose: () => void
}) {
  const [editing, setEditing] = useState<Editing | null>(null)

  async function togglePaused(recurringEnabled: boolean | undefined, id: string, kind: 'income' | 'expense') {
    const nextEnabled = recurringEnabled === false
    if (kind === 'income') await updateIncome(uid, id, { recurringEnabled: nextEnabled })
    else await updateExpense(uid, id, { recurringEnabled: nextEnabled })
  }

  async function handleDelete(id: string, kind: 'income' | 'expense') {
    if (!confirm('Delete this item? This cannot be undone.')) return
    if (kind === 'income') await deleteIncome(uid, id)
    else await deleteExpense(uid, id)
  }

  if (editing) {
    return (
      <Modal title={editing.kind === 'income' ? 'Edit income' : 'Edit expense'} onClose={() => setEditing(null)}>
        {editing.kind === 'income' ? (
          <IncomeForm
            uid={uid}
            itemId={editing.item.id}
            initial={editing.item}
            defaultDate={editing.item.date}
            onDone={() => setEditing(null)}
            onCancel={() => setEditing(null)}
          />
        ) : (
          <ExpenseForm
            uid={uid}
            itemId={editing.item.id}
            initial={editing.item}
            defaultDate={editing.item.date}
            merchants={merchants}
            onDone={() => setEditing(null)}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>
    )
  }

  return (
    <Modal title="All income & expenses" onClose={onClose}>
      <h3 className="mb-2 text-sm font-semibold text-slate-500 dark:text-slate-400">Income</h3>
      <ul className="mb-6 space-y-2">
        {incomeSources.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between rounded-lg border border-slate-200 p-2 text-sm dark:border-slate-800"
          >
            <div>
              <span className="font-medium text-slate-900 dark:text-slate-100">{item.name}</span>
              <span className="ml-2 text-slate-500 dark:text-slate-400">${item.amount.toFixed(2)}</span>
              {item.recurring && (
                <span className="ml-2 text-xs text-slate-400">
                  {item.frequency}
                  {item.recurringEnabled === false ? ' (paused)' : ''}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditing({ kind: 'income', item })}
                className="text-indigo-600 hover:underline dark:text-indigo-400"
              >
                Edit
              </button>
              {item.recurring && (
                <button
                  onClick={() => togglePaused(item.recurringEnabled, item.id, 'income')}
                  className="text-slate-500 hover:underline dark:text-slate-400"
                >
                  {item.recurringEnabled === false ? 'Resume' : 'Pause'}
                </button>
              )}
              <button onClick={() => handleDelete(item.id, 'income')} className="text-red-600 hover:underline dark:text-red-400">
                Delete
              </button>
            </div>
          </li>
        ))}
        {incomeSources.length === 0 && <li className="text-sm text-slate-400">No income sources yet.</li>}
      </ul>

      <h3 className="mb-2 text-sm font-semibold text-slate-500 dark:text-slate-400">Expenses</h3>
      <ul className="space-y-2">
        {expenses.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between rounded-lg border border-slate-200 p-2 text-sm dark:border-slate-800"
          >
            <div>
              <span className="font-medium text-slate-900 dark:text-slate-100">{item.merchant}</span>
              <span className="ml-2 text-slate-500 dark:text-slate-400">${item.amount.toFixed(2)}</span>
              {item.recurring && (
                <span className="ml-2 text-xs text-slate-400">
                  {item.frequency}
                  {item.recurringEnabled === false ? ' (paused)' : ''}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditing({ kind: 'expense', item })}
                className="text-indigo-600 hover:underline dark:text-indigo-400"
              >
                Edit
              </button>
              {item.recurring && (
                <button
                  onClick={() => togglePaused(item.recurringEnabled, item.id, 'expense')}
                  className="text-slate-500 hover:underline dark:text-slate-400"
                >
                  {item.recurringEnabled === false ? 'Resume' : 'Pause'}
                </button>
              )}
              <button onClick={() => handleDelete(item.id, 'expense')} className="text-red-600 hover:underline dark:text-red-400">
                Delete
              </button>
            </div>
          </li>
        ))}
        {expenses.length === 0 && <li className="text-sm text-slate-400">No expenses yet.</li>}
      </ul>
    </Modal>
  )
}
