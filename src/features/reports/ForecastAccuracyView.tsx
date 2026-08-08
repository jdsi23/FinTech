import dayjs from 'dayjs'
import type { ForecastAccuracy } from './reportMath'

export function ForecastAccuracyView({ data }: { data: ForecastAccuracy }) {
  return (
    <div>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {data.accuracyPercent.toFixed(0)}%
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Accuracy</div>
        </div>
        <div>
          <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            ${data.totalExpected.toFixed(2)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Expected</div>
        </div>
        <div>
          <div
            className={`text-2xl font-semibold ${
              data.variance >= 0 ? 'text-amber-600 dark:text-amber-400' : 'text-green-700 dark:text-green-400'
            }`}
          >
            {data.variance >= 0 ? '+' : ''}${data.variance.toFixed(2)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Variance</div>
        </div>
      </div>

      {data.items.length > 0 ? (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">Largest variances</h3>
          <table className="mt-2 w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="py-1 font-medium">Item</th>
                <th className="py-1 font-medium">Date</th>
                <th className="py-1 font-medium">Expected</th>
                <th className="py-1 font-medium">Actual</th>
                <th className="py-1 font-medium">Variance</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, i) => (
                <tr key={i} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="py-1 text-slate-700 dark:text-slate-300">{item.label}</td>
                  <td className="py-1 text-slate-500 dark:text-slate-400">{dayjs(item.date).format('MMM D')}</td>
                  <td className="py-1 text-slate-700 dark:text-slate-300">${item.expected.toFixed(2)}</td>
                  <td className="py-1 text-slate-700 dark:text-slate-300">${item.actual.toFixed(2)}</td>
                  <td
                    className={`py-1 ${
                      item.variance >= 0 ? 'text-amber-600 dark:text-amber-400' : 'text-green-700 dark:text-green-400'
                    }`}
                  >
                    {item.variance >= 0 ? '+' : ''}${item.variance.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-400">No modified items in this range yet.</p>
      )}
    </div>
  )
}
