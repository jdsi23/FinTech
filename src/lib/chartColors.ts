import type { PaymentMethod } from '../types/firestore'

/** Hex equivalents of the Tailwind colors already used in
 * `paymentMethods.ts` (the `dot` classes) — Recharts needs real color
 * values, not Tailwind classes, but the palette itself stays the same one
 * used everywhere else so charts read as part of the same app. */
export const paymentMethodHex: Record<PaymentMethod, string> = {
  debit: '#1d4ed8',
  credit: '#f59e0b',
  cash: '#9333ea',
  bank_transfer: '#0d9488',
  check: '#64748b',
  digital_wallet: '#4f46e5',
}

export const incomeHex = '#16a34a'
export const expenseHex = '#475569'
