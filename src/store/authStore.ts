import { create } from 'zustand'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { doc, onSnapshot, type Unsubscribe } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import type { AppMetaDoc, UserDoc } from '../types/firestore'

interface AuthState {
  firebaseUser: User | null
  userDoc: UserDoc | null
  appMeta: AppMetaDoc | null
  // Each flips true once its respective listener has fired at least once,
  // so consumers can tell "still loading" apart from "confirmed empty".
  authReady: boolean
  userDocReady: boolean
  metaReady: boolean
}

export const useAuthStore = create<AuthState>(() => ({
  firebaseUser: null,
  userDoc: null,
  appMeta: null,
  authReady: false,
  userDocReady: false,
  metaReady: false,
}))

export function isAuthReady(state: AuthState): boolean {
  return state.authReady && state.userDocReady && state.metaReady
}

/**
 * Firebase's User.reload() mutates the existing User object in place rather
 * than replacing it, so components must select a primitive field (e.g.
 * `s.firebaseUser?.emailVerified`) rather than the whole object to see the
 * update — selecting the whole object keeps the same reference and React
 * will correctly (but unhelpfully) bail out of re-rendering.
 */
export async function refreshFirebaseUser(): Promise<void> {
  await auth.currentUser?.reload()
  useAuthStore.setState((s) => ({ firebaseUser: s.firebaseUser }))
}

let userDocUnsubscribe: Unsubscribe | null = null
let initialized = false

/** Wire up the Firebase auth/user-doc/app-meta listeners. Call once at startup. */
export function initAuthListeners(): void {
  if (initialized) return
  initialized = true

  onSnapshot(doc(db, 'meta', 'app'), (snap) => {
    useAuthStore.setState({
      appMeta: snap.exists() ? (snap.data() as AppMetaDoc) : null,
      metaReady: true,
    })
  })

  onAuthStateChanged(auth, (firebaseUser) => {
    userDocUnsubscribe?.()
    userDocUnsubscribe = null

    if (!firebaseUser) {
      useAuthStore.setState({
        firebaseUser: null,
        userDoc: null,
        authReady: true,
        userDocReady: true,
      })
      return
    }

    useAuthStore.setState({ firebaseUser, authReady: true, userDocReady: false })

    userDocUnsubscribe = onSnapshot(doc(db, 'users', firebaseUser.uid), (snap) => {
      useAuthStore.setState({
        userDoc: snap.exists() ? (snap.data() as UserDoc) : null,
        userDocReady: true,
      })
    })
  })
}
