import { useState } from 'react'
import dayjs from 'dayjs'
import { ErrorBanner, FormField, PrimaryButton, SecondaryButton, SelectField } from '../../components/AuthLayout'
import { createGoal, updateGoal } from './actions'
import { WEEKDAY_LABELS } from '../calendar/CalendarPage'
import { sanitizeNumericInput } from '../../lib/numberInput'
import type { Frequency, GoalDoc, GoalType, SavingsStrategy } from '../../types/firestore'

const CATEGORY_SUGGESTIONS = [
  'Emergency Fund',
  'Vacation',
  'Home',
  'Car',
  'Wedding',
  'Education',
  'Electronics',
  'Gift',
  'Debt Payoff',
  'Other',
]

const COLOR_PALETTE = ['#6366f1', '#22c55e', '#f59e0b', '#a855f7', '#ef4444', '#0ea5e9', '#ec4899', '#64748b']

interface Props {
  uid: string
  itemId?: string
  initial?: GoalDoc
  onDone: () => void
  onCancel: () => void
}

export function GoalForm({ uid, itemId, initial, onDone, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [goalType, setGoalType] = useState<GoalType>(initial?.goalType ?? 'short_term')
  const [category, setCategory] = useState(initial?.category ?? '')
  const [icon, setIcon] = useState(initial?.icon ?? '🎯')
  const [color, setColor] = useState(initial?.color ?? COLOR_PALETTE[0])
  const [initialSaved, setInitialSaved] = useState(initial ? String(initial.initialSaved) : '')
  const [targetAmount, setTargetAmount] = useState(initial ? String(initial.targetAmount) : '')
  const [targetDate, setTargetDate] = useState(
    dayjs(initial?.targetDate ?? dayjs().add(3, 'month').valueOf()).format('YYYY-MM-DD'),
  )
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [strategy, setStrategy] = useState<SavingsStrategy>(initial?.strategy ?? 'on_time')
  const [evenSoonerEnabled, setEvenSoonerEnabled] = useState(initial?.evenSoonerEnabled ?? false)
  const [startDate, setStartDate] = useState(dayjs(initial?.startDate ?? Date.now()).format('YYYY-MM-DD'))
  const [checkInFrequency, setCheckInFrequency] = useState<Frequency>(initial?.checkInFrequency ?? 'weekly')
  const [checkInDays, setCheckInDays] = useState<number[]>(
    initial?.checkInDays?.length ? initial.checkInDays : [dayjs(initial?.startDate ?? Date.now()).day()],
  )
  const [rolloverEnabled, setRolloverEnabled] = useState(initial?.checkInRolloverEnabled ?? true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleCheckInDay(day: number) {
    setCheckInDays((prev) => {
      if (prev.includes(day)) {
        return prev.length > 1 ? prev.filter((d) => d !== day) : prev
      }
      return [...prev, day].sort()
    })
  }

  function handleEvenSoonerChange(checked: boolean) {
    if (!checked && itemId) {
      const ok = window.confirm(
        'Disabling Even Sooner will turn off the stretch target for all upcoming weekly check-ins on this goal. You can re-enable it at any time.\n\nAre you sure?',
      )
      if (!ok) return
    }
    setEvenSoonerEnabled(checked)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const base: Omit<GoalDoc, 'createdAt'> = {
        name: name.trim(),
        goalType,
        category: category.trim(),
        icon: icon.trim() || '🎯',
        color,
        initialSaved: Number(initialSaved) || 0,
        targetAmount: Number(targetAmount) || 0,
        targetDate: dayjs(targetDate, 'YYYY-MM-DD').valueOf(),
        notes: notes.trim(),
        strategy,
        evenSoonerEnabled: strategy === 'slightly_early' ? evenSoonerEnabled : false,
        startDate: dayjs(startDate, 'YYYY-MM-DD').valueOf(),
        checkInFrequency,
        checkInDays,
        checkInRolloverEnabled: rolloverEnabled,
        checkIns: initial?.checkIns ?? {},
      }
      if (itemId) {
        await updateGoal(uid, itemId, base)
      } else {
        await createGoal(uid, base)
      }
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this goal.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <ErrorBanner message={error} />}
      <FormField label="Goal name" type="text" required value={name} onChange={(e) => setName(e.target.value)} />

      <label className="mb-3 block text-sm">
        <span className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Category</span>
        <input
          list="goal-category-suggestions"
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
        <datalist id="goal-category-suggestions">
          {CATEGORY_SUGGESTIONS.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </label>

      <SelectField label="Goal type" value={goalType} onChange={(e) => setGoalType(e.target.value as GoalType)}>
        <option value="short_term">Short Term (0–6 months)</option>
        <option value="long_term">Long Term (1+ years)</option>
      </SelectField>

      <FormField label="Icon (emoji)" type="text" value={icon} onChange={(e) => setIcon(e.target.value)} maxLength={4} />

      <div className="mb-3">
        <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Color</span>
        <div className="flex gap-2">
          {COLOR_PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              style={{ backgroundColor: c }}
              aria-label={c}
              className={`h-7 w-7 rounded-full ${
                color === c ? 'ring-2 ring-slate-900 ring-offset-2 dark:ring-slate-100 dark:ring-offset-slate-900' : ''
              }`}
            />
          ))}
        </div>
      </div>

      <FormField
        label="Already saved"
        type="number"
        min={0}
        step="0.01"
        prefix="$"
        value={initialSaved}
        onChange={(e) => setInitialSaved(sanitizeNumericInput(e.target.value))}
      />
      <FormField
        label="Target amount"
        type="number"
        min={0}
        step="0.01"
        required
        prefix="$"
        value={targetAmount}
        onChange={(e) => setTargetAmount(sanitizeNumericInput(e.target.value))}
      />
      <FormField
        label="Target date"
        type="date"
        required
        value={targetDate}
        onChange={(e) => setTargetDate(e.target.value)}
      />

      <FormField
        label="First check-in date"
        type="date"
        required
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
      />

      <SelectField
        label="Check-in frequency"
        value={checkInFrequency}
        onChange={(e) => setCheckInFrequency(e.target.value as Frequency)}
      >
        <option value="weekly">Weekly</option>
        <option value="biweekly">Biweekly</option>
        <option value="monthly">Once a month</option>
      </SelectField>

      {checkInFrequency === 'monthly' ? (
        <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
          Check-ins occur on the {dayjs(startDate, 'YYYY-MM-DD').format('Do')} of each month (falls back to the
          month's last day when it's shorter than that).
        </p>
      ) : (
        <div className="mb-3">
          <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Check-in days {checkInDays.length > 1 && '(saving on multiple days sums toward your total)'}
          </span>
          <div className="flex gap-1">
            {WEEKDAY_LABELS.map((label, day) => (
              <button
                key={label}
                type="button"
                onClick={() => toggleCheckInDay(day)}
                className={`h-8 w-8 rounded-full text-xs font-medium ${
                  checkInDays.includes(day)
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {label[0]}
              </button>
            ))}
          </div>
        </div>
      )}

      <label className="mb-3 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
        <input
          type="checkbox"
          checked={rolloverEnabled}
          onChange={(e) => setRolloverEnabled(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300"
        />
        Roll missed check-ins into future targets
      </label>
      <p className="-mt-2 mb-3 text-xs text-slate-500 dark:text-slate-400">
        {rolloverEnabled
          ? 'Missing a check-in raises the suggested amount for future ones to stay on track.'
          : 'The suggested amount stays fixed regardless of missed check-ins -- the goal may just fall behind schedule.'}
      </p>

      <SelectField
        label="Savings strategy"
        value={strategy}
        onChange={(e) => setStrategy(e.target.value as SavingsStrategy)}
      >
        <option value="on_time">On Time</option>
        <option value="slightly_early">Slightly Early</option>
        <option value="asap">As Soon As Possible</option>
      </SelectField>

      {strategy === 'slightly_early' && (
        <label className="mb-3 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={evenSoonerEnabled}
            onChange={(e) => handleEvenSoonerChange(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          Even Sooner (gradually increase the suggested amount over time)
        </label>
      )}

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
