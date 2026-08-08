// Firestore document shapes for auth/owner/invites (Phase 1) and personal
// finance data (Phase 4). Financial data lives under users/{uid}/... as
// subcollections rather than top-level collections with an ownerId field —
// see firestore.rules for why (path-based isolation for strictly private
// per-user data, unlike users/invites which are legitimately Owner-visible).

export type UserRole = 'owner' | 'user'

export interface AppMetaDoc {
  ownerUid: string
  setupComplete: true
  // Owner-editable via Control Center -> Settings (Phase 3). Absent means
  // "use the default" — no migration needed for docs created before these
  // fields existed.
  appName?: string
  defaultInviteExpirationDays?: number
}

export interface UserDoc {
  email: string
  displayName: string
  role: UserRole
  invitedBy: string | null
  createdAt: number
  // Owner-only toggle (Phase 3). Absent/false = active. Never true for the
  // Owner's own doc — enforced in both firestore.rules and the UI.
  disabled?: boolean
  // Self-editable (Phase 4). Absent = 0. Used as the base for the Calendar's
  // per-day projected ending balance.
  startingBalance?: number
}

export interface InviteDoc {
  role: UserRole
  singleUse: boolean
  used: boolean
  usedBy: string | null
  usedAt: number | null
  expiresAt: number
  createdBy: string
  createdAt: number
}

export type Frequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom'

export type PaymentMethod = 'debit' | 'credit' | 'cash' | 'bank_transfer' | 'check' | 'digital_wallet'

export type OccurrenceStatus = 'scheduled' | 'completed' | 'modified' | 'skipped'

/** A per-occurrence exception on a recurring (or one-off) item, keyed by
 * ISO date (YYYY-MM-DD) on the parent doc's `overrides` map. */
export interface OccurrenceOverride {
  status: OccurrenceStatus
  actualAmount?: number
  notes?: string
}

interface RecurringFields {
  recurring: boolean
  // Only meaningful when recurring is true. Absent/true = generating future
  // occurrences; false = paused (history via `overrides` still shows).
  recurringEnabled?: boolean
  frequency?: Frequency
  // Only meaningful when frequency === 'custom': the interval in days.
  customIntervalDays?: number
  overrides?: Record<string, OccurrenceOverride>
  // Free-text tags (Phase 6), searchable via Search.
  tags?: string[]
}

export interface IncomeDoc extends RecurringFields {
  name: string
  amount: number
  // Anchor date (first/only occurrence), ms epoch.
  date: number
  depositAccount: string
  notes: string
  createdAt: number
}

export interface ExpenseDoc extends RecurringFields {
  merchant: string
  category: string
  amount: number
  date: number
  paymentMethod: PaymentMethod
  notes: string
  createdAt: number
}

export interface MerchantDoc {
  name: string
  createdAt: number
}

export type GoalType = 'short_term' | 'long_term'

export type SavingsStrategy = 'on_time' | 'slightly_early' | 'asap'

export interface GoalDoc {
  name: string
  goalType: GoalType
  category: string
  icon: string
  color: string
  // What the user already had saved when the goal was created. "Current
  // saved" is always initialSaved + sum(checkIns) — never stored directly,
  // so there's one source of truth (same reasoning as Income/Expense
  // `overrides`).
  initialSaved: number
  targetAmount: number
  targetDate: number
  notes: string
  strategy: SavingsStrategy
  // Only meaningful when strategy === 'slightly_early'.
  evenSoonerEnabled?: boolean
  // When weekly check-ins start counting from (defaults to createdAt).
  startDate: number
  // Keyed by ISO week-start date (YYYY-MM-DD) -> amount logged that week.
  checkIns: Record<string, number>
  createdAt: number
}
