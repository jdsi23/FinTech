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
  // Check-in schedule (Phase 7). Absent checkInFrequency = 'weekly'; absent/
  // empty checkInDays = derive a single day from startDate's weekday -- both
  // reproduce the original single-weekly-check-in behavior exactly.
  checkInFrequency?: Frequency // only 'weekly' | 'biweekly' | 'monthly' are offered in the UI
  checkInDays?: number[] // 0=Sun..6=Sat; only meaningful when checkInFrequency is weekly/biweekly
  // Absent/true = adaptive (suggested amount recalculates from actual
  // progress, folding in any missed check-ins). false = flat/steady pace
  // computed once from the goal's original numbers, ignoring misses.
  checkInRolloverEnabled?: boolean
  // First check-in date; also the day-of-week (weekly/biweekly) or
  // day-of-month (monthly) anchor. Defaults to createdAt.
  startDate: number
  // Keyed by the exact ISO occurrence date (YYYY-MM-DD) -> amount logged.
  checkIns: Record<string, number>
  createdAt: number
}

export type LayoutMode = 'default' | 'simple' | 'custom'

// Per-user cosmetic preferences (Phase 8), stored at users/{uid}/appearance/prefs.
// Absent doc (or absent field) reproduces the app's original default look
// exactly -- see src/lib/theme.ts DEFAULT_APPEARANCE.
export interface AppearancePrefs {
  presetId: string // 'default' | 'simple' | 'midnight' | 'ocean' | 'sunset' | 'forest' | 'custom'
  primaryColor: string // hex; drives the indigo-* CSS variable ramp app-wide
  backgroundImageUrl?: string // pasted image URL, shown behind app content
  // Absent = keep the original dark-mode-responsive slate background/header
  // classes. Set = a fixed hex override applied regardless of light/dark
  // mode (full custom colors don't auto-adjust for system theme).
  backgroundColor?: string
  headerColor?: string // applied to the nav header and Calendar's weekday-label row
  layoutMode: LayoutMode
  // Only independently editable when layoutMode === 'custom' -- 'simple'
  // always forces showBranding false / compactNav true.
  showBranding: boolean
  compactNav: boolean
  // Per-user home screen name/icon for "Add to Home Screen" (iOS/Android).
  // Takes effect the next time this user (re-)adds the site to their home
  // screen -- there's no way to update an icon already pinned on a device.
  homeScreenName?: string
  homeScreenIconUrl?: string // pasted image URL
  updatedAt: number
}
