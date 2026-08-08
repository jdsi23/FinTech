import { useState } from 'react'
import dayjs from 'dayjs'
import { useAuthStore } from '../../store/authStore'
import { useCollection } from '../../lib/useCollection'
import { SelectField } from '../../components/AuthLayout'
import {
  cashFlowSeries,
  forecastAccuracy,
  incomeVsExpenseByMonth,
  spendingByCategory,
  spendingByMerchant,
} from './reportMath'
import { CashFlowChart, IncomeVsExpenseChart } from './FlowCharts'
import { CategorySpendingChart, MerchantSpendingChart } from './SpendingCharts'
import { ForecastAccuracyView } from './ForecastAccuracyView'
import { GoalProgressView } from './GoalProgressView'
import type { ExpenseDoc, GoalDoc, IncomeDoc } from '../../types/firestore'

type RangeOption = 'month' | '3months' | 'year' | 'all'
type ReportTab = 'income_expense' | 'cash_flow' | 'merchant' | 'category' | 'accuracy' | 'goals'

const TABS: { value: ReportTab; label: string }[] = [
  { value: 'income_expense', label: 'Income vs Expenses' },
  { value: 'cash_flow', label: 'Cash Flow' },
  { value: 'merchant', label: 'Merchant Spending' },
  { value: 'category', label: 'Category Spending' },
  { value: 'accuracy', label: 'Forecast Accuracy' },
  { value: 'goals', label: 'Goal Progress' },
]

export function ReportsPage() {
  const uid = useAuthStore((s) => s.firebaseUser?.uid)
  const startingBalance = useAuthStore((s) => s.userDoc?.startingBalance ?? 0)
  const incomeSources = useCollection<IncomeDoc>(uid, 'incomeSources')
  const expenses = useCollection<ExpenseDoc>(uid, 'expenses')
  const goals = useCollection<GoalDoc>(uid, 'goals')

  const [range, setRange] = useState<RangeOption>('3months')
  const [tab, setTab] = useState<ReportTab>('income_expense')

  if (!uid) return null

  const now = dayjs()
  const earliestItemDate = Math.min(
    now.valueOf(),
    ...incomeSources.map((i) => i.date),
    ...expenses.map((e) => e.date),
  )
  // "This Month"/"This Year" include the rest of the period even though it
  // hasn't happened yet (matching how the Dashboard's current-month summary
  // already works) -- only the rolling "Last 3 Months" window stops at
  // today, since it's meant to look backward, not forward.
  const rangeStart =
    range === 'month'
      ? now.startOf('month').valueOf()
      : range === '3months'
        ? now.subtract(3, 'month').startOf('day').valueOf()
        : range === 'year'
          ? now.startOf('year').valueOf()
          : dayjs(earliestItemDate).startOf('day').valueOf()
  const rangeEnd =
    range === 'month'
      ? now.endOf('month').valueOf()
      : range === '3months'
        ? now.endOf('day').valueOf()
        : range === 'year'
          ? now.endOf('year').valueOf()
          : now.add(2, 'year').endOf('day').valueOf()

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Reports</h1>
        <div className="w-48">
          <SelectField label="Date range" value={range} onChange={(e) => setRange(e.target.value as RangeOption)}>
            <option value="month">This Month</option>
            <option value="3months">Last 3 Months</option>
            <option value="year">This Year</option>
            <option value="all">All Time</option>
          </SelectField>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-1 border-b border-slate-200 pb-2 dark:border-slate-800">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              tab === t.value
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
        {tab === 'income_expense' && (
          <IncomeVsExpenseChart data={incomeVsExpenseByMonth(incomeSources, expenses, rangeStart, rangeEnd)} />
        )}
        {tab === 'cash_flow' && (
          <CashFlowChart data={cashFlowSeries(incomeSources, expenses, startingBalance, rangeStart, rangeEnd)} />
        )}
        {tab === 'merchant' && <MerchantSpendingChart data={spendingByMerchant(expenses, rangeStart, rangeEnd)} />}
        {tab === 'category' && <CategorySpendingChart data={spendingByCategory(expenses, rangeStart, rangeEnd)} />}
        {tab === 'accuracy' && (
          <ForecastAccuracyView data={forecastAccuracy(incomeSources, expenses, rangeStart, rangeEnd)} />
        )}
        {tab === 'goals' && <GoalProgressView goals={goals} />}
      </div>
    </div>
  )
}
