import dayjs from 'dayjs'
import { buildOccurrenceEntries, computeBalanceByDay } from '../calendar/calendarMath'
import type { ExpenseDoc, IncomeDoc } from '../../types/firestore'

export interface MonthlyTotal {
  month: string
  monthLabel: string
  income: number
  expense: number
}

/** Income vs Expenses, one bucket per calendar month in range. */
export function incomeVsExpenseByMonth(
  incomeSources: (IncomeDoc & { id: string })[],
  expenses: (ExpenseDoc & { id: string })[],
  rangeStart: number,
  rangeEnd: number,
): MonthlyTotal[] {
  const entries = buildOccurrenceEntries(incomeSources, expenses, rangeStart, rangeEnd).filter(
    (e) => e.status !== 'skipped',
  )

  const byMonth = new Map<string, MonthlyTotal>()
  let cursor = dayjs(rangeStart).startOf('month')
  const end = dayjs(rangeEnd)
  while (cursor.isBefore(end) || cursor.isSame(end, 'month')) {
    const key = cursor.format('YYYY-MM')
    byMonth.set(key, { month: key, monthLabel: cursor.format('MMM YYYY'), income: 0, expense: 0 })
    cursor = cursor.add(1, 'month')
  }

  for (const entry of entries) {
    const bucket = byMonth.get(dayjs(entry.date).format('YYYY-MM'))
    if (!bucket) continue
    if (entry.kind === 'income') bucket.income += entry.amount
    else bucket.expense += entry.amount
  }

  return [...byMonth.values()]
}

export interface CashFlowPoint {
  date: string
  label: string
  balance: number
}

/** Running balance sampled weekly (daily would be too many points for a
 * chart over a multi-month range) -- reuses computeBalanceByDay exactly as
 * the Calendar does, just at coarser granularity. */
export function cashFlowSeries(
  incomeSources: (IncomeDoc & { id: string })[],
  expenses: (ExpenseDoc & { id: string })[],
  startingBalance: number,
  rangeStart: number,
  rangeEnd: number,
): CashFlowPoint[] {
  const earliestItemDate = Math.min(rangeStart, ...incomeSources.map((i) => i.date), ...expenses.map((e) => e.date))
  const allEntries = buildOccurrenceEntries(incomeSources, expenses, earliestItemDate, rangeEnd)

  const dayKeys: string[] = []
  for (let cursor = rangeStart; cursor <= rangeEnd; cursor = dayjs(cursor).add(7, 'day').valueOf()) {
    dayKeys.push(dayjs(cursor).format('YYYY-MM-DD'))
  }
  const lastKey = dayjs(rangeEnd).format('YYYY-MM-DD')
  if (dayKeys[dayKeys.length - 1] !== lastKey) dayKeys.push(lastKey)

  const balances = computeBalanceByDay(allEntries, dayKeys, startingBalance)
  return dayKeys.map((key) => ({
    date: key,
    label: dayjs(key, 'YYYY-MM-DD').format('MMM D'),
    balance: balances.get(key) ?? startingBalance,
  }))
}

export interface SpendingBucket {
  label: string
  total: number
}

export function spendingByMerchant(
  expenses: (ExpenseDoc & { id: string })[],
  rangeStart: number,
  rangeEnd: number,
  limit = 10,
): SpendingBucket[] {
  const entries = buildOccurrenceEntries([], expenses, rangeStart, rangeEnd).filter((e) => e.status !== 'skipped')
  const totals = new Map<string, number>()
  for (const e of entries) totals.set(e.label, (totals.get(e.label) ?? 0) + e.amount)
  return [...totals.entries()]
    .map(([label, total]) => ({ label, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit)
}

export function spendingByCategory(
  expenses: (ExpenseDoc & { id: string })[],
  rangeStart: number,
  rangeEnd: number,
): SpendingBucket[] {
  const entries = buildOccurrenceEntries([], expenses, rangeStart, rangeEnd).filter((e) => e.status !== 'skipped')
  const totals = new Map<string, number>()
  for (const e of entries) {
    const key = e.category || 'Uncategorized'
    totals.set(key, (totals.get(key) ?? 0) + e.amount)
  }
  return [...totals.entries()].map(([label, total]) => ({ label, total })).sort((a, b) => b.total - a.total)
}

export interface ForecastAccuracy {
  accuracyPercent: number
  totalExpected: number
  totalActual: number
  variance: number
  items: { label: string; date: number; expected: number; actual: number; variance: number }[]
}

/** "Completed" occurrences always have actual === expected by construction
 * (see markComplete in DailyView.tsx) -- only "Modified" ones can vary, so
 * the item list only needs to look at those. */
export function forecastAccuracy(
  incomeSources: (IncomeDoc & { id: string })[],
  expenses: (ExpenseDoc & { id: string })[],
  rangeStart: number,
  rangeEnd: number,
): ForecastAccuracy {
  const entries = buildOccurrenceEntries(incomeSources, expenses, rangeStart, rangeEnd).filter(
    (e) => e.status === 'completed' || e.status === 'modified',
  )

  const totalExpected = entries.reduce((sum, e) => sum + e.expectedAmount, 0)
  const totalActual = entries.reduce((sum, e) => sum + e.amount, 0)
  const variance = totalActual - totalExpected
  const accuracyPercent = totalExpected > 0 ? Math.max(0, 100 - (Math.abs(variance) / totalExpected) * 100) : 100

  const items = entries
    .filter((e) => e.status === 'modified')
    .map((e) => ({
      label: e.label,
      date: e.date,
      expected: e.expectedAmount,
      actual: e.amount,
      variance: e.amount - e.expectedAmount,
    }))
    .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance))
    .slice(0, 10)

  return { accuracyPercent, totalExpected, totalActual, variance, items }
}
