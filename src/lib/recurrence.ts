import dayjs from 'dayjs'
import type { Frequency, OccurrenceOverride, OccurrenceStatus } from '../types/firestore'

export function dateKey(ms: number): string {
  return dayjs(ms).format('YYYY-MM-DD')
}

function advance(ms: number, frequency: Frequency, customIntervalDays?: number): number {
  const d = dayjs(ms)
  switch (frequency) {
    case 'weekly':
      return d.add(1, 'week').valueOf()
    case 'biweekly':
      return d.add(2, 'week').valueOf()
    case 'monthly':
      return d.add(1, 'month').valueOf()
    case 'quarterly':
      return d.add(3, 'month').valueOf()
    case 'yearly':
      return d.add(1, 'year').valueOf()
    case 'custom':
      return d.add(Math.max(1, customIntervalDays ?? 1), 'day').valueOf()
  }
}

interface RecurringLike {
  date: number
  recurring: boolean
  recurringEnabled?: boolean
  frequency?: Frequency
  customIntervalDays?: number
  overrides?: Record<string, OccurrenceOverride>
}

// Iterating one period at a time from the anchor date is simple and correct,
// but a years-old item with a short custom interval (e.g. "every day" set up
// 5 years ago) could need thousands of steps to reach the visible range. This
// cap keeps a single calendar render fast regardless; if ForecastFlow ever
// needs to support that scale of history well, the fix is computing a jump-
// ahead offset instead of raising this number further.
const MAX_ITERATIONS = 5000

/**
 * All dates (ms epoch, sorted ascending) an item occurs on within
 * [rangeStart, rangeEnd] (inclusive). Non-recurring items occur once, on
 * `date`. Recurring items project forward from `date` by `frequency` while
 * recurringEnabled !== false. A disabled recurring item still surfaces any
 * date that already has an explicit override, so pausing recurrence never
 * silently erases history (see firestore.rules / types for the design).
 */
export function getOccurrenceDates(item: RecurringLike, rangeStart: number, rangeEnd: number): number[] {
  const dates = new Set<number>()
  const inRange = (ms: number) => ms >= rangeStart && ms <= rangeEnd

  if (!item.recurring || item.recurringEnabled === false) {
    if (inRange(item.date)) dates.add(item.date)
  } else if (item.frequency) {
    let current = item.date
    let iterations = 0
    while (current <= rangeEnd && iterations < MAX_ITERATIONS) {
      if (inRange(current)) dates.add(current)
      current = advance(current, item.frequency, item.customIntervalDays)
      iterations++
    }
  }

  for (const key of Object.keys(item.overrides ?? {})) {
    const ms = dayjs(key, 'YYYY-MM-DD').valueOf()
    if (inRange(ms)) dates.add(ms)
  }

  return [...dates].sort((a, b) => a - b)
}

export interface EffectiveOccurrence {
  status: OccurrenceStatus
  amount: number
}

/** Merges an item's base amount with any override recorded for this
 * specific date, defaulting to 'scheduled' when there's no override yet. */
export function getEffectiveOccurrence(
  baseAmount: number,
  date: number,
  overrides: Record<string, OccurrenceOverride> | undefined,
): EffectiveOccurrence {
  const override = overrides?.[dateKey(date)]
  if (!override) return { status: 'scheduled', amount: baseAmount }
  return {
    status: override.status,
    amount: override.actualAmount ?? baseAmount,
  }
}
