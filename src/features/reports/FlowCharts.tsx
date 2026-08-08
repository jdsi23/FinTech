import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { incomeHex, expenseHex } from '../../lib/chartColors'
import type { CashFlowPoint, MonthlyTotal } from './reportMath'

const GRID_COLOR = '#e2e8f0'

export function IncomeVsExpenseChart({ data }: { data: MonthlyTotal[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
        <XAxis dataKey="monthLabel" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
        <Bar dataKey="income" name="Income" fill={incomeHex} radius={[4, 4, 0, 0]} />
        <Bar dataKey="expense" name="Expenses" fill={expenseHex} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function CashFlowChart({ data }: { data: CashFlowPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
        <Line type="monotone" dataKey="balance" name="Balance" stroke={incomeHex} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
