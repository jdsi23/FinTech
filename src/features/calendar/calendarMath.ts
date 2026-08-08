import dayjs from 'dayjs'
import { dateKey, getEffectiveOccurrence, getOccurrenceDates } from '../../lib/recurrence'
import type { ExpenseDoc, IncomeDoc, OccurrenceStatus, PaymentMethod } from '../../types/firestore'

export interface OccurrenceEntry {
  id: string
  kind: 'income' | 'expense'
  date: number
  label: string
  amount: number
  // The template's base amount, before any override -- the "expected"
  // value for Forecast Accuracy (amount is the "actual"/effective value).
  expectedAmount: number
  status: OccurrenceStatus
  paymentMethod?: PaymentMethod
  category?: string
  tags?: string[]
}

/** Flat list of every occurrence (recurring or not, overrides applied) for
 * all given templates within [rangeStart, rangeEnd]. */
export function buildOccurrenceEntries(
  incomeSources: (IncomeDoc & { id: string })[],
  expenses: (ExpenseDoc & { id: string })[],
  rangeStart: number,
  rangeEnd: number,
): OccurrenceEntry[] {
  const entries: OccurrenceEntry[] = []

  for (const item of incomeSources) {
    for (const d of getOccurrenceDates(item, rangeStart, rangeEnd)) {
      const eff = getEffectiveOccurrence(item.amount, d, item.overrides)
      entries.push({
        id: item.id,
        kind: 'income',
        date: d,
        label: item.name,
        amount: eff.amount,
        expectedAmount: item.amount,
        status: eff.status,
        tags: item.tags,
      })
    }
  }

  for (const item of expenses) {
    for (const d of getOccurrenceDates(item, rangeStart, rangeEnd)) {
      const eff = getEffectiveOccurrence(item.amount, d, item.overrides)
      entries.push({
        id: item.id,
        kind: 'expense',
        date: d,
        label: item.merchant,
        amount: eff.amount,
        expectedAmount: item.amount,
        status: eff.status,
        paymentMethod: item.paymentMethod,
        category: item.category,
        tags: item.tags,
      })
    }
  }

  return entries
}

export function groupByDay(entries: OccurrenceEntry[]): Map<string, OccurrenceEntry[]> {
  const map = new Map<string, OccurrenceEntry[]>()
  for (const entry of entries) {
    const key = dateKey(entry.date)
    const bucket = map.get(key)
    if (bucket) bucket.push(entry)
    else map.set(key, [entry])
  }
  return map
}

/** Cumulative balance as of the end of each day in `dayKeysAscending`,
 * starting from `startingBalance` and walking every entry (which may span a
 * wider range than the visible grid, back to the earliest item) in date
 * order. Skipped occurrences don't affect the balance. */
export function computeBalanceByDay(
  entries: OccurrenceEntry[],
  dayKeysAscending: string[],
  startingBalance: number,
): Map<string, number> {
  const sorted = [...entries].sort((a, b) => a.date - b.date)
  const balances = new Map<string, number>()
  let running = startingBalance
  let i = 0

  for (const key of dayKeysAscending) {
    const dayEnd = dayjs(key, 'YYYY-MM-DD').endOf('day').valueOf()
    while (i < sorted.length && sorted[i].date <= dayEnd) {
      const entry = sorted[i]
      if (entry.status !== 'skipped') {
        running += entry.kind === 'income' ? entry.amount : -entry.amount
      }
      i++
    }
    balances.set(key, running)
  }

  return balances
}
