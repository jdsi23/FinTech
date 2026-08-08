import { SelectField } from '../../components/AuthLayout'
import type { Frequency } from '../../types/firestore'

export interface RecurringValue {
  recurring: boolean
  frequency?: Frequency
  customIntervalDays?: number
  recurringEnabled?: boolean
}

const FREQUENCY_OPTIONS: { value: Frequency; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'custom', label: 'Custom' },
]

/** Shared by IncomeForm/ExpenseForm. `showEnabledToggle` is only relevant
 * when editing an existing recurring item (pausing recurrence without
 * deleting history — see firestore.rules / recurrence.ts). */
export function RecurringFields({
  value,
  onChange,
  showEnabledToggle,
}: {
  value: RecurringValue
  onChange: (v: RecurringValue) => void
  showEnabledToggle?: boolean
}) {
  return (
    <div className="mb-3">
      <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
        <input
          type="checkbox"
          checked={value.recurring}
          onChange={(e) =>
            onChange({
              ...value,
              recurring: e.target.checked,
              frequency: e.target.checked ? (value.frequency ?? 'monthly') : undefined,
            })
          }
          className="h-4 w-4 rounded border-slate-300"
        />
        This repeats
      </label>

      {value.recurring && (
        <div className="mt-2 flex flex-wrap items-end gap-3">
          <div className="w-40">
            <SelectField
              label="Frequency"
              value={value.frequency}
              onChange={(e) => onChange({ ...value, frequency: e.target.value as Frequency })}
            >
              {FREQUENCY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </SelectField>
          </div>

          {value.frequency === 'custom' && (
            <label className="mb-3 text-sm">
              <span className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Every (days)</span>
              <input
                type="number"
                min={1}
                value={value.customIntervalDays ?? 1}
                onChange={(e) => onChange({ ...value, customIntervalDays: Number(e.target.value) })}
                className="w-20 rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </label>
          )}

          {showEnabledToggle && (
            <label className="mb-3 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={value.recurringEnabled !== false}
                onChange={(e) => onChange({ ...value, recurringEnabled: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300"
              />
              Active
            </label>
          )}
        </div>
      )}
    </div>
  )
}
