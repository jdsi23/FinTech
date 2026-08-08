import dayjs from 'dayjs'
import { dateKey, getOccurrenceDates } from '../../lib/recurrence'
import type { GoalDoc } from '../../types/firestore'

const MAX_CHECKIN_ITERATIONS = 1000

/** Always computed, never stored — initialSaved + every logged check-in. */
export function currentSaved(goal: GoalDoc): number {
  const logged = Object.values(goal.checkIns ?? {}).reduce((sum, v) => sum + v, 0)
  return goal.initialSaved + logged
}

function weeksBetween(from: number, to: number): number {
  return Math.max(1, Math.ceil(dayjs(to).diff(dayjs(from), 'week', true)))
}

/** The weekly amount needed to hit `targetDate`, adjusted per strategy. 3
 * weeks is the midpoint of Slightly Early's "2-4 weeks early" range; 6 weeks
 * is the midpoint of ASAP's "1-2 months early" (4-8 weeks) range. Because
 * this is recalculated fresh from the *current* saved total every time it's
 * called, under- or over-saving one week automatically adjusts next week's
 * suggestion — that's the whole of "Adaptive Planning," no separate
 * replanning step needed. */
export function suggestedWeekly(goal: GoalDoc, today: number): number {
  const remaining = Math.max(0, goal.targetAmount - currentSaved(goal))
  const weeks = weeksBetween(today, goal.targetDate)
  const adjustedWeeks =
    goal.strategy === 'slightly_early'
      ? Math.max(1, weeks - 3)
      : goal.strategy === 'asap'
        ? Math.max(1, weeks - 6)
        : weeks
  return remaining / adjustedWeeks
}

/** 1-indexed weeks elapsed since the goal's startDate. */
function weekNumber(goal: GoalDoc, today: number): number {
  return Math.max(1, Math.floor(dayjs(today).diff(dayjs(goal.startDate), 'week', true)) + 1)
}

/** Even Sooner's stretch percentage: +5% in week 1, +1%/week after, capped
 * at +20% (week 16 onward). Driven purely by elapsed time, never by whether
 * past targets were hit — the spec requires a predictable progression that
 * never judges the user's actual savings behavior. */
export function evenSoonerStretchPercent(goal: GoalDoc, today: number): number {
  return Math.min(20, 4 + weekNumber(goal, today))
}

/** Only meaningful for strategy === 'slightly_early' with evenSoonerEnabled. */
export function suggestedStretchTarget(goal: GoalDoc, today: number): number {
  const base = suggestedPerCheckIn(goal, today)
  const pct = evenSoonerStretchPercent(goal, today)
  return base * (1 + pct / 100)
}

/** The user's actual pace-based projection — distinct from `targetDate`,
 * which stays fixed. Moves earlier when the user is ahead of their average
 * pace, later when behind, satisfying "move the projected completion date
 * earlier" without touching the deadline the user originally chose. Returns
 * null when there's not enough data yet to project (no elapsed time and no
 * progress logged). */
export function projectedCompletionDate(goal: GoalDoc, today: number): number | null {
  const saved = currentSaved(goal)
  const remaining = Math.max(0, goal.targetAmount - saved)
  if (remaining <= 0) return today

  const weeksElapsed = Math.max(0, dayjs(today).diff(dayjs(goal.startDate), 'week', true))
  const pace = weeksElapsed > 0 ? saved / weeksElapsed : 0
  if (pace <= 0) return null

  const weeksToFinish = remaining / pace
  return dayjs(today).add(weeksToFinish, 'week').valueOf()
}

/** Weekly/biweekly check-in dates for one or more selected weekdays,
 * stepping a week (or two) at a time from startDate's week and emitting
 * every selected weekday per step -- generalizes the single-day case
 * (checkInDays absent/empty) to multiple check-ins per week. */
function weeklyCheckInDates(goal: GoalDoc, rangeStart: number, rangeEnd: number): number[] {
  const intervalWeeks = goal.checkInFrequency === 'biweekly' ? 2 : 1
  const days = goal.checkInDays?.length ? goal.checkInDays : [dayjs(goal.startDate).day()]
  const dates: number[] = []

  let weekCursor = dayjs(goal.startDate).startOf('week')
  let iterations = 0
  while (weekCursor.valueOf() <= rangeEnd && iterations < MAX_CHECKIN_ITERATIONS) {
    for (const day of days) {
      const ms = weekCursor.day(day).valueOf()
      if (ms >= goal.startDate && ms >= rangeStart && ms <= rangeEnd) dates.push(ms)
    }
    weekCursor = weekCursor.add(intervalWeeks, 'week')
    iterations++
  }

  return dates.sort((a, b) => a - b)
}

/** Every scheduled check-in date within [rangeStart, rangeEnd], regardless
 * of whether the goal is already fully funded -- used both for live
 * scheduling (via getCheckInDates) and for the flat/steady baseline in
 * suggestedPerCheckIn, which needs the full start-to-target schedule. */
function rawCheckInDates(goal: GoalDoc, rangeStart: number, rangeEnd: number): number[] {
  if (goal.checkInFrequency === 'monthly') {
    return getOccurrenceDates({ date: goal.startDate, recurring: true, frequency: 'monthly' }, rangeStart, rangeEnd)
  }
  return weeklyCheckInDates(goal, rangeStart, rangeEnd)
}

/** Check-in dates within [rangeStart, rangeEnd]. Stops once the goal is
 * already fully funded. */
export function getCheckInDates(goal: GoalDoc, rangeStart: number, rangeEnd: number): number[] {
  if (currentSaved(goal) >= goal.targetAmount) return []
  return rawCheckInDates(goal, rangeStart, rangeEnd)
}

/** The amount needed for one specific check-in occurrence -- the
 * per-occurrence generalization of suggestedWeekly, aware of actual
 * cadence/selected days (used by DailyView for the loggable amount;
 * suggestedWeekly stays a simple weekly-pace summary for GoalCard/Reports).
 *
 * Rollover enabled (default): adaptive, same philosophy as suggestedWeekly
 * -- remaining amount divided across the actual scheduled occurrences
 * between today and the strategy-adjusted target date, so a missed
 * check-in folds into every future one automatically without being
 * tracked explicitly.
 *
 * Rollover disabled: flat/steady -- computed once from the goal's original
 * numbers (initialSaved, full start-to-target schedule) and never
 * recalculated from progress, so missing a check-in doesn't raise future
 * amounts; the goal just falls behind schedule instead. */
export function suggestedPerCheckIn(goal: GoalDoc, today: number): number {
  if (goal.checkInRolloverEnabled === false) {
    const total = rawCheckInDates(goal, goal.startDate, goal.targetDate).length || 1
    return (goal.targetAmount - goal.initialSaved) / total
  }

  const remaining = Math.max(0, goal.targetAmount - currentSaved(goal))
  const bufferWeeks = goal.strategy === 'slightly_early' ? 3 : goal.strategy === 'asap' ? 6 : 0
  const adjustedTargetDate = dayjs(goal.targetDate).subtract(bufferWeeks, 'week').valueOf()
  const upcoming = Math.max(1, rawCheckInDates(goal, today, Math.max(today, adjustedTargetDate)).length)
  return remaining / upcoming
}

export function checkInWeekKey(date: number): string {
  return dateKey(date)
}
