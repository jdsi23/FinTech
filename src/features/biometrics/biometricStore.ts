import { create } from 'zustand'

/**
 * Whether this page-load's session has been "unlocked" — either by a fresh
 * interactive sign-in, or by passing the biometric gate on a silently
 * restored session. Deliberately not persisted: a full page reload should
 * always re-evaluate the gate.
 */
export const useBiometricStore = create<{ unlocked: boolean }>(() => ({
  unlocked: false,
}))

export function markUnlocked(): void {
  useBiometricStore.setState({ unlocked: true })
}
