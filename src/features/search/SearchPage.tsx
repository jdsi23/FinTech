import { useState } from 'react'
import dayjs from 'dayjs'
import { useAuthStore } from '../../store/authStore'
import { useCollection } from '../../lib/useCollection'
import { FormField, SelectField } from '../../components/AuthLayout'
import { paymentMethodOptions } from '../../lib/paymentMethods'
import { searchAll, type SearchFilters } from './searchMath'
import type { ExpenseDoc, GoalDoc, IncomeDoc, OccurrenceStatus, PaymentMethod } from '../../types/firestore'

const STATUS_OPTIONS: OccurrenceStatus[] = ['scheduled', 'completed', 'modified', 'skipped']

const EMPTY_FILTERS: SearchFilters = {
  merchant: '',
  category: '',
  goalName: '',
  dateFrom: '',
  dateTo: '',
  paymentMethod: '',
  status: '',
  tags: '',
}

export function SearchPage() {
  const uid = useAuthStore((s) => s.firebaseUser?.uid)
  const incomeSources = useCollection<IncomeDoc>(uid, 'incomeSources')
  const expenses = useCollection<ExpenseDoc>(uid, 'expenses')
  const goals = useCollection<GoalDoc>(uid, 'goals')

  const [filters, setFilters] = useState<SearchFilters>(EMPTY_FILTERS)

  function setField<K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const results = searchAll(incomeSources, expenses, goals, filters)
  const hasFilters = Object.values(filters).some((v) => v !== '')

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Search</h1>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <FormField
          label="Merchant"
          type="text"
          value={filters.merchant}
          onChange={(e) => setField('merchant', e.target.value)}
        />
        <FormField
          label="Category"
          type="text"
          value={filters.category}
          onChange={(e) => setField('category', e.target.value)}
        />
        <FormField
          label="Goal"
          type="text"
          value={filters.goalName}
          onChange={(e) => setField('goalName', e.target.value)}
        />
        <FormField
          label="From date"
          type="date"
          value={filters.dateFrom}
          onChange={(e) => setField('dateFrom', e.target.value)}
        />
        <FormField
          label="To date"
          type="date"
          value={filters.dateTo}
          onChange={(e) => setField('dateTo', e.target.value)}
        />
        <SelectField
          label="Payment type"
          value={filters.paymentMethod}
          onChange={(e) => setField('paymentMethod', e.target.value as PaymentMethod | '')}
        >
          <option value="">Any</option>
          {paymentMethodOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Status"
          value={filters.status}
          onChange={(e) => setField('status', e.target.value as OccurrenceStatus | '')}
        >
          <option value="">Any</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s[0].toUpperCase() + s.slice(1)}
            </option>
          ))}
        </SelectField>
        <FormField
          label="Tags (comma-separated)"
          type="text"
          value={filters.tags}
          onChange={(e) => setField('tags', e.target.value)}
        />
      </div>

      <div className="mt-2">
        <button
          onClick={() => setFilters(EMPTY_FILTERS)}
          className="text-sm text-indigo-600 hover:underline dark:text-indigo-400"
        >
          Clear filters
        </button>
      </div>

      <table className="mt-6 w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <th className="py-2 font-medium">Type</th>
            <th className="py-2 font-medium">Label</th>
            <th className="py-2 font-medium">Date</th>
            <th className="py-2 font-medium">Amount</th>
            <th className="py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <tr key={`${r.type}-${r.id}-${r.date ?? ''}`} className="border-b border-slate-100 dark:border-slate-800">
              <td className="py-2 capitalize text-slate-500 dark:text-slate-400">{r.type}</td>
              <td className="py-2 text-slate-900 dark:text-slate-100">
                {r.label}
                {r.category && <span className="ml-2 text-xs text-slate-400">{r.category}</span>}
                {r.tags && r.tags.length > 0 && (
                  <span className="ml-2 text-xs text-indigo-500 dark:text-indigo-400">{r.tags.join(', ')}</span>
                )}
              </td>
              <td className="py-2 text-slate-500 dark:text-slate-400">
                {r.date ? dayjs(r.date).format('MMM D, YYYY') : '—'}
              </td>
              <td className="py-2 text-slate-700 dark:text-slate-300">
                {r.amount !== undefined ? `$${r.amount.toFixed(2)}` : '—'}
              </td>
              <td className="py-2 capitalize text-slate-500 dark:text-slate-400">{r.status ?? '—'}</td>
            </tr>
          ))}
          {results.length === 0 && (
            <tr>
              <td colSpan={5} className="py-6 text-center text-slate-400">
                {hasFilters ? 'No matches.' : 'Enter search criteria above.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
