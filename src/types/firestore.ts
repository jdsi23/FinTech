// Firestore document shapes for Phase 1 (auth/owner/invites).
// Future collections (income, expenses, goals, etc.) will follow the same
// pattern of an `ownerId` field checked against `request.auth.uid` in rules.

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
