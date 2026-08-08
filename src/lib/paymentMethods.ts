import type { PaymentMethod } from '../types/firestore'

interface ColorMeta {
  label: string
  badge: string // full badge classes (bg + text, light + dark)
  dot: string // solid color for small calendar-cell indicators
}

/** Debit/Credit/Cash colors are specified by the spec (for the Dashboard's
 * segmented progress bar); Bank Transfer/Check/Digital Wallet aren't, so
 * these are our own reasonable, distinct choices. Reused wherever payment
 * method needs a consistent color, per the spec's "use consistent colors
 * throughout the application." */
export const paymentMethodMeta: Record<PaymentMethod, ColorMeta> = {
  debit: {
    label: 'Debit',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
    dot: 'bg-blue-700 dark:bg-blue-400',
  },
  credit: {
    label: 'Credit',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    dot: 'bg-amber-500 dark:bg-amber-400',
  },
  cash: {
    label: 'Cash',
    badge: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
    dot: 'bg-purple-600 dark:bg-purple-400',
  },
  bank_transfer: {
    label: 'Bank Transfer',
    badge: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300',
    dot: 'bg-teal-600 dark:bg-teal-400',
  },
  check: {
    label: 'Check',
    badge: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
    dot: 'bg-slate-500 dark:bg-slate-400',
  },
  digital_wallet: {
    label: 'Digital Wallet',
    badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
    dot: 'bg-indigo-600 dark:bg-indigo-400',
  },
}

export const incomeMeta: ColorMeta = {
  label: 'Income',
  badge: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
  dot: 'bg-green-600 dark:bg-green-400',
}

export const paymentMethodOptions: { value: PaymentMethod; label: string }[] = (
  Object.keys(paymentMethodMeta) as PaymentMethod[]
).map((value) => ({ value, label: paymentMethodMeta[value].label }))
