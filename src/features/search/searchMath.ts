import dayjs from 'dayjs'
import { buildOccurrenceEntries } from '../calendar/calendarMath'
import type { ExpenseDoc, GoalDoc, IncomeDoc, OccurrenceStatus, PaymentMethod } from '../../types/firestore'

export interface SearchFilters {
  merchant: string
  category: string
  goalName: string
  dateFrom: string
  dateTo: string
  paymentMethod: PaymentMethod | ''
  status: OccurrenceStatus | ''
  tags: string
}

export interface SearchResult {
  type: 'income' | 'expense' | 'goal'
  id: string
  label: string
  date?: number
  amount?: number
  status?: OccurrenceStatus
  category?: string
  paymentMethod?: PaymentMethod
  tags?: string[]
}

// Which filters make sense for each result type -- e.g. filling in Merchant
// clearly signals "only things with a merchant," so Income and Goals drop
// out entirely rather than being silently included regardless.
const INCOME_APPLICABLE = new Set(['dateFrom', 'dateTo', 'status', 'tags'])
const EXPENSE_APPLICABLE = new Set(['merchant', 'category', 'dateFrom', 'dateTo', 'paymentMethod', 'status', 'tags'])
const GOAL_APPLICABLE = new Set(['category', 'goalName'])

function activeFilterKeys(filters: SearchFilters): string[] {
  const keys: string[] = []
  if (filters.merchant) keys.push('merchant')
  if (filters.category) keys.push('category')
  if (filters.goalName) keys.push('goalName')
  if (filters.dateFrom) keys.push('dateFrom')
  if (filters.dateTo) keys.push('dateTo')
  if (filters.paymentMethod) keys.push('paymentMethod')
  if (filters.status) keys.push('status')
  if (filters.tags.trim()) keys.push('tags')
  return keys
}

function isApplicable(activeKeys: string[], applicable: Set<string>): boolean {
  return activeKeys.every((k) => applicable.has(k))
}

/** Searches Income, Expenses, and Goals together, tagging each result by
 * type. Returns nothing until at least one filter is set, rather than
 * dumping the whole history by default. */
export function searchAll(
  incomeSources: (IncomeDoc & { id: string })[],
  expenses: (ExpenseDoc & { id: string })[],
  goals: (GoalDoc & { id: string })[],
  filters: SearchFilters,
): SearchResult[] {
  const activeKeys = activeFilterKeys(filters)
  if (activeKeys.length === 0) return []

  const includeIncome = isApplicable(activeKeys, INCOME_APPLICABLE)
  const includeExpense = isApplicable(activeKeys, EXPENSE_APPLICABLE)
  const includeGoals = isApplicable(activeKeys, GOAL_APPLICABLE)

  const tagList = filters.tags
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)

  const results: SearchResult[] = []

  if (includeIncome || includeExpense) {
    const from = filters.dateFrom ? dayjs(filters.dateFrom, 'YYYY-MM-DD').startOf('day').valueOf() : undefined
    const to = filters.dateTo ? dayjs(filters.dateTo, 'YYYY-MM-DD').endOf('day').valueOf() : undefined
    const rangeStart =
      from ?? Math.min(Date.now(), ...incomeSources.map((i) => i.date), ...expenses.map((e) => e.date))
    const rangeEnd = to ?? dayjs().add(2, 'year').valueOf()

    const entries = buildOccurrenceEntries(
      includeIncome ? incomeSources : [],
      includeExpense ? expenses : [],
      rangeStart,
      rangeEnd,
    )

    for (const entry of entries) {
      if (filters.merchant && !entry.label.toLowerCase().includes(filters.merchant.toLowerCase())) continue
      if (filters.category && (entry.category ?? '').toLowerCase() !== filters.category.toLowerCase()) continue
      if (filters.paymentMethod && entry.paymentMethod !== filters.paymentMethod) continue
      if (filters.status && entry.status !== filters.status) continue
      if (tagList.length > 0) {
        const entryTags = (entry.tags ?? []).map((t) => t.toLowerCase())
        if (!tagList.every((t) => entryTags.includes(t))) continue
      }
      results.push({
        type: entry.kind,
        id: entry.id,
        label: entry.label,
        date: entry.date,
        amount: entry.amount,
        status: entry.status,
        category: entry.category,
        paymentMethod: entry.paymentMethod,
        tags: entry.tags,
      })
    }
  }

  if (includeGoals) {
    for (const g of goals) {
      if (filters.goalName && !g.name.toLowerCase().includes(filters.goalName.toLowerCase())) continue
      if (filters.category && (g.category ?? '').toLowerCase() !== filters.category.toLowerCase()) continue
      results.push({ type: 'goal', id: g.id, label: g.name, category: g.category })
    }
  }

  return results.sort((a, b) => (b.date ?? 0) - (a.date ?? 0))
}
