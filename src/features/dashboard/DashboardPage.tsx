import { useState } from 'react'
import dayjs from 'dayjs'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useCollection } from '../../lib/useCollection'
import { buildOccurrenceEntries } from '../calendar/calendarMath'
import { SegmentedBar, type BarSegment } from '../../components/SegmentedBar'
import { incomeMeta, paymentMethodMeta, paymentMethodOptions } from '../../lib/paymentMethods'
import { GoalCard } from '../goals/GoalCard'
import { Modal } from '../../components/Modal'
import { PrimaryButton, SecondaryButton } from '../../components/AuthLayout'
import { IncomeForm } from '../finance/IncomeForm'
import { ExpenseForm } from '../finance/ExpenseForm'
import { LogTodayButton } from '../calendar/LogTodayButton'
import type { ExpenseDoc, GoalDoc, IncomeDoc, MerchantDoc, PaymentMethod } from '../../types/firestore'

export function DashboardPage() {
  const navigate = useNavigate()
  const uid = useAuthStore((s) => s.firebaseUser?.uid)
  const incomeSources = useCollection<IncomeDoc>(uid, 'incomeSources')
  const expenses = useCollection<ExpenseDoc>(uid, 'expenses')
  const merchants = useCollection<MerchantDoc>(uid, 'merchants')
  const goals = useCollection<GoalDoc>(uid, 'goals')

  const [quickAdd, setQuickAdd] = useState<'income' | 'expense' | null>(null)

  if (!uid) return null

  const today = dayjs()
  const monthStart = today.startOf('month').valueOf()
  const monthEnd = today.endOf('month').valueOf()
  const monthEntries = buildOccurrenceEntries(incomeSources, expenses, monthStart, monthEnd).filter(
    (e) => e.status !== 'skipped',
  )

  const incomeTotal = monthEntries.filter((e) => e.kind === 'income').reduce((sum, e) => sum + e.amount, 0)

  const expenseByMethod = Object.fromEntries(paymentMethodOptions.map((o) => [o.value, 0])) as Record<
    PaymentMethod,
    number
  >
  for (const e of monthEntries) {
    if (e.kind === 'expense' && e.paymentMethod) expenseByMethod[e.paymentMethod] += e.amount
  }
  const expenseTotal = Object.values(expenseByMethod).reduce((sum, v) => sum + v, 0)
  const netTotal = incomeTotal - expenseTotal

  const segments: BarSegment[] = [
    { label: incomeMeta.label, value: incomeTotal, colorClass: incomeMeta.dot },
    ...paymentMethodOptions.map((o) => ({
      label: paymentMethodMeta[o.value].label,
      value: expenseByMethod[o.value],
      colorClass: paymentMethodMeta[o.value].dot,
    })),
  ]

  const upcomingBills = buildOccurrenceEntries(
    incomeSources,
    expenses,
    today.startOf('day').valueOf(),
    today.add(14, 'day').endOf('day').valueOf(),
  )
    .filter((e) => e.kind === 'expense' && e.status === 'scheduled')
    .sort((a, b) => a.date - b.date)
    .slice(0, 5)

  const recentActivity = buildOccurrenceEntries(
    incomeSources,
    expenses,
    today.subtract(14, 'day').startOf('day').valueOf(),
    today.endOf('day').valueOf(),
  )
    .filter((e) => e.status !== 'scheduled')
    .sort((a, b) => b.date - a.date)
    .slice(0, 5)

  return (
    <div className="mx-auto max-w-5xl p-6 pb-24">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{today.format('MMMM YYYY')}</h1>

      <div className="mt-4 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
        <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400">Monthly Financial Summary</h2>
        <div className="mt-3">
          <SegmentedBar segments={segments} total={incomeTotal + expenseTotal} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">{incomeMeta.label}</span>
            <span className="font-medium text-green-700 dark:text-green-400">${incomeTotal.toFixed(2)}</span>
          </div>
          {paymentMethodOptions.map((o) => (
            <div key={o.value} className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">{o.label}</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                ${expenseByMethod[o.value].toFixed(2)}
              </span>
            </div>
          ))}
          <div className="flex justify-between border-t border-slate-200 pt-1 dark:border-slate-800">
            <span className="font-medium text-slate-700 dark:text-slate-300">Net Total</span>
            <span className={`font-semibold ${netTotal >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              ${netTotal.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400">Upcoming Bills</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {upcomingBills.map((e) => (
              <li key={`${e.kind}-${e.id}-${e.date}`} className="flex justify-between">
                <span className="text-slate-700 dark:text-slate-300">
                  {e.label} <span className="text-xs text-slate-400">{dayjs(e.date).format('MMM D')}</span>
                </span>
                <span className="text-slate-700 dark:text-slate-300">${e.amount.toFixed(2)}</span>
              </li>
            ))}
            {upcomingBills.length === 0 && <li className="text-slate-400">Nothing due in the next 2 weeks.</li>}
          </ul>
        </div>

        <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400">Recent Activity</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {recentActivity.map((e) => (
              <li key={`${e.kind}-${e.id}-${e.date}`} className="flex justify-between">
                <span className="text-slate-700 dark:text-slate-300">
                  {e.label} <span className="text-xs text-slate-400">{dayjs(e.date).format('MMM D')}</span>
                </span>
                <span className={e.kind === 'income' ? 'text-green-700 dark:text-green-400' : 'text-slate-700 dark:text-slate-300'}>
                  {e.kind === 'income' ? '+' : '-'}${e.amount.toFixed(2)}
                </span>
              </li>
            ))}
            {recentActivity.length === 0 && <li className="text-slate-400">No recent activity.</li>}
          </ul>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400">Goals</h2>
          <Link to="/goals" className="text-sm text-indigo-600 hover:underline dark:text-indigo-400">
            View all →
          </Link>
        </div>
        <div className="mt-2 space-y-2">
          {goals.slice(0, 3).map((g) => (
            <GoalCard key={g.id} goal={g} compact />
          ))}
          {goals.length === 0 && <p className="text-sm text-slate-400">No goals yet.</p>}
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
        <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400">Quick Actions</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          <div className="w-36">
            <PrimaryButton type="button" onClick={() => setQuickAdd('income')}>
              + Add income
            </PrimaryButton>
          </div>
          <div className="w-36">
            <PrimaryButton type="button" onClick={() => setQuickAdd('expense')}>
              + Add expense
            </PrimaryButton>
          </div>
          <div className="w-36">
            <SecondaryButton type="button" onClick={() => navigate('/calendar')}>
              Open Calendar
            </SecondaryButton>
          </div>
          <div className="w-36">
            <SecondaryButton type="button" onClick={() => navigate('/goals')}>
              Open Goals
            </SecondaryButton>
          </div>
        </div>
      </div>

      <LogTodayButton uid={uid} merchants={merchants} />

      {quickAdd && (
        <Modal title={quickAdd === 'income' ? 'Add income' : 'Add expense'} onClose={() => setQuickAdd(null)}>
          {quickAdd === 'income' ? (
            <IncomeForm uid={uid} defaultDate={Date.now()} onDone={() => setQuickAdd(null)} onCancel={() => setQuickAdd(null)} />
          ) : (
            <ExpenseForm
              uid={uid}
              defaultDate={Date.now()}
              merchants={merchants}
              onDone={() => setQuickAdd(null)}
              onCancel={() => setQuickAdd(null)}
            />
          )}
        </Modal>
      )}
    </div>
  )
}
