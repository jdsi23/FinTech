import { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { useAuthStore } from '../../store/authStore'
import { useCollection } from '../../lib/useCollection'
import { buildOccurrenceEntries, computeBalanceByDay, groupByDay } from './calendarMath'
import { DailyView } from './DailyView'
import { ManageItemsList } from './ManageItemsList'
import { LogTodayButton } from './LogTodayButton'
import { setStartingBalance } from '../finance/actions'
import { getCheckInDates } from '../goals/goalMath'
import { dateKey } from '../../lib/recurrence'
import type { ExpenseDoc, GoalDoc, IncomeDoc, MerchantDoc } from '../../types/firestore'

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function CalendarPage() {
  const uid = useAuthStore((s) => s.firebaseUser?.uid)
  const startingBalance = useAuthStore((s) => s.userDoc?.startingBalance ?? 0)

  const incomeSources = useCollection<IncomeDoc>(uid, 'incomeSources')
  const expenses = useCollection<ExpenseDoc>(uid, 'expenses')
  const merchants = useCollection<MerchantDoc>(uid, 'merchants')
  const goals = useCollection<GoalDoc>(uid, 'goals')

  const [monthStart, setMonthStart] = useState(() => dayjs().startOf('month').valueOf())
  const [selectedDate, setSelectedDate] = useState<number | null>(null)
  const [showManage, setShowManage] = useState(false)
  const [balanceInput, setBalanceInput] = useState(String(startingBalance))

  useEffect(() => {
    setBalanceInput(String(startingBalance))
  }, [startingBalance])

  const grid = useMemo(() => {
    const monthStartDay = dayjs(monthStart)
    const gridStart = monthStartDay.startOf('week').valueOf()
    const gridEnd = monthStartDay.endOf('month').endOf('week').valueOf()

    const dayKeys: string[] = []
    for (let cursor = gridStart; cursor <= gridEnd; cursor = dayjs(cursor).add(1, 'day').valueOf()) {
      dayKeys.push(dayjs(cursor).format('YYYY-MM-DD'))
    }

    const earliestItemDate = Math.min(gridStart, ...incomeSources.map((i) => i.date), ...expenses.map((e) => e.date))

    const allEntries = buildOccurrenceEntries(incomeSources, expenses, earliestItemDate, gridEnd)
    const visibleEntries = allEntries.filter((e) => e.date >= gridStart && e.date <= gridEnd)
    const entriesByDay = groupByDay(visibleEntries)
    const balances = computeBalanceByDay(allEntries, dayKeys, startingBalance)

    const checkInsByDay = new Map<string, (GoalDoc & { id: string })[]>()
    for (const goal of goals) {
      for (const d of getCheckInDates(goal, gridStart, gridEnd)) {
        const key = dateKey(d)
        const bucket = checkInsByDay.get(key)
        if (bucket) bucket.push(goal)
        else checkInsByDay.set(key, [goal])
      }
    }

    return { dayKeys, entriesByDay, balances, checkInsByDay }
  }, [monthStart, incomeSources, expenses, startingBalance, goals])

  if (!uid) return null

  async function handleSaveBalance(e: React.FormEvent) {
    e.preventDefault()
    if (!uid) return
    await setStartingBalance(uid, Number(balanceInput) || 0)
  }

  const weeks: string[][] = []
  for (let i = 0; i < grid.dayKeys.length; i += 7) {
    weeks.push(grid.dayKeys.slice(i, i + 7))
  }

  return (
    <div className="mx-auto max-w-5xl p-6 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMonthStart(dayjs(monthStart).subtract(1, 'month').valueOf())}
            className="rounded-md border border-slate-300 px-2 py-1 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            ‹
          </button>
          <h1 className="w-40 text-center text-xl font-semibold text-slate-900 dark:text-slate-100">
            {dayjs(monthStart).format('MMMM YYYY')}
          </h1>
          <button
            onClick={() => setMonthStart(dayjs(monthStart).add(1, 'month').valueOf())}
            className="rounded-md border border-slate-300 px-2 py-1 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            ›
          </button>
          <button
            onClick={() => setMonthStart(dayjs().startOf('month').valueOf())}
            className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-4">
          <form onSubmit={handleSaveBalance} className="flex items-center gap-2 text-sm">
            <span className="text-slate-500 dark:text-slate-400">Starting balance</span>
            <div className="relative w-28">
              <span className="pointer-events-none absolute inset-y-0 left-2 flex items-center text-slate-500 dark:text-slate-400">
                $
              </span>
              <input
                type="number"
                step="0.01"
                value={balanceInput}
                onChange={(e) => setBalanceInput(e.target.value)}
                className="w-full rounded-md border border-slate-300 py-1 pl-5 pr-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <button type="submit" className="text-indigo-600 hover:underline dark:text-indigo-400">
              Save
            </button>
          </form>
          <button
            onClick={() => setShowManage(true)}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Manage items
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 dark:border-slate-800 dark:bg-slate-800">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="bg-slate-50 p-2 text-center text-xs font-medium text-slate-500 dark:bg-slate-900 dark:text-slate-400"
          >
            {label}
          </div>
        ))}

        {weeks.map((week) =>
          week.map((dayKey) => {
            const dayMs = dayjs(dayKey, 'YYYY-MM-DD').valueOf()
            const isCurrentMonth = dayjs(dayKey).month() === dayjs(monthStart).month()
            const isToday = dayKey === dayjs().format('YYYY-MM-DD')
            const entries = grid.entriesByDay.get(dayKey) ?? []
            const incomeTotal = entries
              .filter((e) => e.kind === 'income' && e.status !== 'skipped')
              .reduce((sum, e) => sum + e.amount, 0)
            const expenseTotal = entries
              .filter((e) => e.kind === 'expense' && e.status !== 'skipped')
              .reduce((sum, e) => sum + e.amount, 0)
            const balance = grid.balances.get(dayKey) ?? startingBalance
            const checkIns = grid.checkInsByDay.get(dayKey) ?? []

            return (
              <button
                key={dayKey}
                onClick={() => setSelectedDate(dayMs)}
                className={`min-h-24 bg-white p-1.5 text-left dark:bg-slate-950 ${
                  isCurrentMonth ? '' : 'opacity-40'
                } ${isToday ? 'ring-2 ring-inset ring-indigo-500' : ''} hover:bg-slate-50 dark:hover:bg-slate-900`}
              >
                <div className="text-xs text-slate-500 dark:text-slate-400">{dayjs(dayKey).format('D')}</div>
                {incomeTotal > 0 && (
                  <div className="mt-1 truncate text-xs font-medium text-green-700 dark:text-green-400">
                    +${incomeTotal.toFixed(0)}
                  </div>
                )}
                {expenseTotal > 0 && (
                  <div className="truncate text-xs font-medium text-slate-700 dark:text-slate-300">
                    -${expenseTotal.toFixed(0)}
                  </div>
                )}
                {(incomeTotal > 0 || expenseTotal > 0) && (
                  <div className="mt-1 truncate text-xs text-slate-400">${balance.toFixed(0)}</div>
                )}
                {checkIns.length > 0 && <div className="mt-1 truncate text-xs">🎯 Goal check-in</div>}
              </button>
            )
          }),
        )}
      </div>

      <LogTodayButton uid={uid} merchants={merchants} />

      {selectedDate !== null && (
        <DailyView
          uid={uid}
          date={selectedDate}
          incomeSources={incomeSources}
          expenses={expenses}
          merchants={merchants}
          goals={goals}
          onClose={() => setSelectedDate(null)}
        />
      )}

      {showManage && (
        <ManageItemsList
          uid={uid}
          incomeSources={incomeSources}
          expenses={expenses}
          merchants={merchants}
          onClose={() => setShowManage(false)}
        />
      )}
    </div>
  )
}
