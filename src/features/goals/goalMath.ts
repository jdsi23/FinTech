import dayjs from 'dayjs'
import { dateKey, getOccurrenceDates } from '../../lib/recurrence'
import type { GoalDoc } from '../../types/firestore'

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
  const base = suggestedWeekly(goal, today)
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

/** Weekly check-in dates within [rangeStart, rangeEnd], reusing the same
 * weekly-stepping logic as recurring income/expenses rather than a second
 * date generator. Stops once the goal is already fully funded. */
export function getCheckInDates(goal: GoalDoc, rangeStart: number, rangeEnd: number): number[] {
  if (currentSaved(goal) >= goal.targetAmount) return []
  return getOccurrenceDates({ date: goal.startDate, recurring: true, frequency: 'weekly' }, rangeStart, rangeEnd)
}

export function checkInWeekKey(date: number): string {
  return dateKey(date)
}
