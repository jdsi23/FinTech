import { useState } from 'react'
import dayjs from 'dayjs'
import { ErrorBanner, FormField, PrimaryButton, SecondaryButton, SelectField } from '../../components/AuthLayout'
import { RecurringFields, type RecurringValue } from './RecurringFields'
import { MerchantAutocomplete } from './MerchantAutocomplete'
import { createExpense, updateExpense, ensureMerchant } from './actions'
import { paymentMethodOptions } from '../../lib/paymentMethods'
import type { ExpenseDoc, PaymentMethod } from '../../types/firestore'

const CATEGORY_SUGGESTIONS = [
  'Groceries',
  'Utilities',
  'Rent/Mortgage',
  'Entertainment',
  'Dining',
  'Transportation',
  'Insurance',
  'Subscriptions',
  'Health',
  'Other',
]

interface Props {
  uid: string
  itemId?: string
  initial?: ExpenseDoc
  defaultDate: number
  merchants: { id: string; name: string }[]
  onDone: () => void
  onCancel: () => void
}

export function ExpenseForm({ uid, itemId, initial, defaultDate, merchants, onDone, onCancel }: Props) {
  const [merchant, setMerchant] = useState(initial?.merchant ?? '')
  const [category, setCategory] = useState(initial?.category ?? '')
  const [amount, setAmount] = useState(initial?.amount ?? 0)
  const [date, setDate] = useState(dayjs(initial?.date ?? defaultDate).format('YYYY-MM-DD'))
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(initial?.paymentMethod ?? 'debit')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [recurring, setRecurring] = useState<RecurringValue>({
    recurring: initial?.recurring ?? false,
    frequency: initial?.frequency,
    customIntervalDays: initial?.customIntervalDays,
    recurringEnabled: initial?.recurringEnabled,
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await ensureMerchant(uid, merchant, merchants)
      const base: Omit<ExpenseDoc, 'createdAt'> = {
        merchant: merchant.trim(),
        category: category.trim(),
        amount: Number(amount),
        date: dayjs(date, 'YYYY-MM-DD').valueOf(),
        paymentMethod,
        notes: notes.trim(),
        recurring: recurring.recurring,
        overrides: initial?.overrides ?? {},
        ...(recurring.recurring
          ? {
              frequency: recurring.frequency ?? 'monthly',
              recurringEnabled: recurring.recurringEnabled !== false,
              ...(recurring.frequency === 'custom'
                ? { customIntervalDays: recurring.customIntervalDays ?? 1 }
                : {}),
            }
          : {}),
      }
      if (itemId) {
        await updateExpense(uid, itemId, base)
      } else {
        await createExpense(uid, base)
      }
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this expense.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <ErrorBanner message={error} />}
      <MerchantAutocomplete value={merchant} onChange={setMerchant} merchants={merchants} />
      <label className="mb-3 block text-sm">
        <span className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Category</span>
        <input
          list="category-suggestions"
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
        <datalist id="category-suggestions">
          {CATEGORY_SUGGESTIONS.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </label>
      <FormField
        label="Amount"
        type="number"
        min={0}
        step="0.01"
        required
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
      />
      <FormField label="Date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
      <SelectField
        label="Payment method"
        value={paymentMethod}
        onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
      >
        {paymentMethodOptions.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </SelectField>
      <RecurringFields value={recurring} onChange={setRecurring} showEnabledToggle={Boolean(itemId)} />
      <FormField label="Notes" type="text" value={notes} onChange={(e) => setNotes(e.target.value)} />
      <div className="flex gap-2">
        <div className="w-32">
          <PrimaryButton type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </PrimaryButton>
        </div>
        <div className="w-32">
          <SecondaryButton type="button" onClick={onCancel}>
            Cancel
          </SecondaryButton>
        </div>
      </div>
    </form>
  )
}
