// Firestore document shapes for Phase 1 (auth/owner/invites).
// Future collections (income, expenses, goals, etc.) will follow the same
// pattern of an `ownerId` field checked against `request.auth.uid` in rules.

export type UserRole = 'owner' | 'user'

export interface AppMetaDoc {
  ownerUid: string
  setupComplete: true
}

export interface UserDoc {
  email: string
  displayName: string
  role: UserRole
  invitedBy: string | null
  createdAt: number
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
