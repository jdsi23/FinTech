import dayjs from 'dayjs'
import type { Frequency, OccurrenceOverride, OccurrenceStatus } from '../types/firestore'

export function dateKey(ms: number): string {
  return dayjs(ms).format('YYYY-MM-DD')
}

/** The Nth occurrence after `anchor`, computed directly from the anchor
 * rather than by repeatedly advancing the previous occurrence. This matters
 * for month-based frequencies: Day.js's add(1,'month') clamps a day that
 * doesn't exist in the target month (e.g. Jan 31 -> Feb 28), and stepping
 * cumulatively from that clamped result would drift the day-of-month down
 * permanently (Feb 28 -> Mar 28 instead of Mar 31). Computing every
 * occurrence from the original anchor makes each month re-attempt the
 * anchor's day independently, so a short month only clamps that one
 * occurrence. Week/day-based frequencies are unaffected either way. */
function occurrenceAt(anchor: number, index: number, frequency: Frequency, customIntervalDays?: number): number {
  const d = dayjs(anchor)
  switch (frequency) {
    case 'weekly':
      return d.add(index, 'week').valueOf()
    case 'biweekly':
      return d.add(index * 2, 'week').valueOf()
    case 'monthly':
      return d.add(index, 'month').valueOf()
    case 'quarterly':
      return d.add(index * 3, 'month').valueOf()
    case 'yearly':
      return d.add(index, 'year').valueOf()
    case 'custom':
      return d.add(index * Math.max(1, customIntervalDays ?? 1), 'day').valueOf()
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
    let index = 0
    let current = item.date
    while (current <= rangeEnd && index < MAX_ITERATIONS) {
      if (inRange(current)) dates.add(current)
      index++
      current = occurrenceAt(item.date, index, item.frequency, item.customIntervalDays)
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
