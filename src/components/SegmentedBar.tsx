export interface BarSegment {
  label: string
  value: number
  colorClass: string
}

/** Proportional-width segmented bar — the spec's Monthly Financial Summary
 * bar (Income/Debit/Credit/Cash, colored consistently with the rest of the
 * app). `total` sets what 100% of the bar width represents. */
export function SegmentedBar({ segments, total }: { segments: BarSegment[]; total: number }) {
  return (
    <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
      {segments.map(
        (seg) =>
          seg.value > 0 && (
            <div
              key={seg.label}
              className={seg.colorClass}
              style={{ width: `${total > 0 ? (seg.value / total) * 100 : 0}%` }}
              title={`${seg.label}: $${seg.value.toFixed(2)}`}
            />
          ),
      )}
    </div>
  )
}
