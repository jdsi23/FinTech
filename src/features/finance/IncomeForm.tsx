import { useState } from 'react'
import dayjs from 'dayjs'
import { ErrorBanner, FormField, PrimaryButton, SecondaryButton } from '../../components/AuthLayout'
import { RecurringFields, type RecurringValue } from './RecurringFields'
import { createIncome, updateIncome } from './actions'
import type { IncomeDoc } from '../../types/firestore'

interface Props {
  uid: string
  itemId?: string
  initial?: IncomeDoc
  defaultDate: number
  onDone: () => void
  onCancel: () => void
}

export function IncomeForm({ uid, itemId, initial, defaultDate, onDone, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [amount, setAmount] = useState(initial?.amount ?? 0)
  const [date, setDate] = useState(dayjs(initial?.date ?? defaultDate).format('YYYY-MM-DD'))
  const [depositAccount, setDepositAccount] = useState(initial?.depositAccount ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [tagsInput, setTagsInput] = useState(initial?.tags?.join(', ') ?? '')
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
      const base: Omit<IncomeDoc, 'createdAt'> = {
        name: name.trim(),
        amount: Number(amount),
        date: dayjs(date, 'YYYY-MM-DD').valueOf(),
        depositAccount: depositAccount.trim(),
        notes: notes.trim(),
        tags: tagsInput
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
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
        await updateIncome(uid, itemId, base)
      } else {
        await createIncome(uid, base)
      }
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this income source.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <ErrorBanner message={error} />}
      <FormField label="Name" type="text" required value={name} onChange={(e) => setName(e.target.value)} />
      <FormField
        label="Amount"
        type="number"
        min={0}
        step="0.01"
        required
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
      />
      <FormField label="Deposit date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
      <FormField
        label="Deposit account"
        type="text"
        value={depositAccount}
        onChange={(e) => setDepositAccount(e.target.value)}
      />
      <RecurringFields value={recurring} onChange={setRecurring} showEnabledToggle={Boolean(itemId)} />
      <FormField label="Notes" type="text" value={notes} onChange={(e) => setNotes(e.target.value)} />
      <FormField
        label="Tags (comma-separated)"
        type="text"
        value={tagsInput}
        onChange={(e) => setTagsInput(e.target.value)}
      />
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
