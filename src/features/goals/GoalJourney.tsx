const MILESTONES = [0, 25, 50, 75, 100]

/** The spec's "Start ●──●──●──🏁 / 25% / 50% / 75% / Goal" journey — a
 * horizontal track with milestone dots that fill in as progress reaches
 * them. That fill-in *is* the milestone celebration: real, immediate visual
 * feedback without needing a toast/animation library for one feature. */
export function GoalJourney({ progress }: { progress: number }) {
  const clamped = Math.min(100, Math.max(0, progress))

  return (
    <div className="relative mt-3 pb-5">
      <div className="relative h-1.5 rounded-full bg-slate-200 dark:bg-slate-800">
        <div className="absolute inset-y-0 left-0 rounded-full bg-indigo-500" style={{ width: `${clamped}%` }} />
        {MILESTONES.map((m) => (
          <div key={m} className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: `${m}%` }}>
            <div
              className={`h-3.5 w-3.5 rounded-full border-2 ${
                clamped >= m
                  ? 'border-indigo-500 bg-indigo-500'
                  : 'border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900'
              }`}
            />
            <span className="absolute left-1/2 top-4 -translate-x-1/2 whitespace-nowrap text-[10px] text-slate-400">
              {m === 100 ? '🏁' : `${m}%`}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
