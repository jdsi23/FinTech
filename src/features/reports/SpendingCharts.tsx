import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { SpendingBucket } from './reportMath'

const GRID_COLOR = '#e2e8f0'
const PIE_COLORS = [
  '#4f46e5',
  '#16a34a',
  '#f59e0b',
  '#9333ea',
  '#0d9488',
  '#ef4444',
  '#64748b',
  '#1d4ed8',
  '#ec4899',
  '#0ea5e9',
]

export function MerchantSpendingChart({ data }: { data: SpendingBucket[] }) {
  if (data.length === 0) return <p className="text-sm text-slate-400">No expense data in this range.</p>
  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 40)}>
      <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
        <XAxis type="number" tick={{ fontSize: 12 }} />
        <YAxis type="category" dataKey="label" width={120} tick={{ fontSize: 12 }} />
        <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
        <Bar dataKey="total" fill="#4f46e5" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function CategorySpendingChart({ data }: { data: SpendingBucket[] }) {
  if (data.length === 0) return <p className="text-sm text-slate-400">No expense data in this range.</p>
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={data} dataKey="total" nameKey="label" cx="50%" cy="50%" outerRadius={100} label={(entry) => entry.name}>
          {data.map((_, i) => (
            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
      </PieChart>
    </ResponsiveContainer>
  )
}
