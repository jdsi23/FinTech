import { useState } from 'react'
import { Modal } from '../../components/Modal'
import { IncomeForm } from '../finance/IncomeForm'
import { ExpenseForm } from '../finance/ExpenseForm'

export function LogTodayButton({
  uid,
  merchants,
}: {
  uid: string
  merchants: { id: string; name: string }[]
}) {
  const [open, setOpen] = useState(false)
  const [kind, setKind] = useState<'income' | 'expense'>('expense')
  const today = Date.now()

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 rounded-full bg-indigo-600 px-5 py-3 text-sm font-medium text-white shadow-lg transition hover:bg-indigo-500"
      >
        + Log Today
      </button>
      {open && (
        <Modal title="Log today's activity" onClose={() => setOpen(false)}>
          <div className="mb-4 flex gap-1 rounded-md bg-slate-100 p-1 dark:bg-slate-800">
            <button
              onClick={() => setKind('income')}
              className={`flex-1 rounded px-3 py-1.5 text-sm font-medium ${
                kind === 'income' ? 'bg-white shadow dark:bg-slate-700 dark:text-slate-100' : 'text-slate-500'
              }`}
            >
              Income
            </button>
            <button
              onClick={() => setKind('expense')}
              className={`flex-1 rounded px-3 py-1.5 text-sm font-medium ${
                kind === 'expense' ? 'bg-white shadow dark:bg-slate-700 dark:text-slate-100' : 'text-slate-500'
              }`}
            >
              Expense
            </button>
          </div>
          {kind === 'income' ? (
            <IncomeForm uid={uid} defaultDate={today} onDone={() => setOpen(false)} onCancel={() => setOpen(false)} />
          ) : (
            <ExpenseForm
              uid={uid}
              defaultDate={today}
              merchants={merchants}
              onDone={() => setOpen(false)}
              onCancel={() => setOpen(false)}
            />
          )}
        </Modal>
      )}
    </>
  )
}
