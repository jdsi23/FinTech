import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
  sendEmailVerification,
  updateProfile,
  signOut,
  type User,
} from 'firebase/auth'
import { addDoc, collection, doc, runTransaction } from 'firebase/firestore'
import { auth, db } from '../../lib/firebase'
import type { InviteDoc, UserRole } from '../../types/firestore'

const googleProvider = new GoogleAuthProvider()

async function applyPersistence(remember: boolean) {
  await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence)
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string,
  remember: boolean,
): Promise<User> {
  await applyPersistence(remember)
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(cred.user, { displayName })
  await sendEmailVerification(cred.user)
  return cred.user
}

export async function signInWithEmail(email: string, password: string, remember: boolean): Promise<User> {
  await applyPersistence(remember)
  const cred = await signInWithEmailAndPassword(auth, email, password)
  return cred.user
}

export async function signInWithGoogle(remember: boolean): Promise<User> {
  await applyPersistence(remember)
  const cred = await signInWithPopup(auth, googleProvider)
  return cred.user
}

export async function resendVerificationEmail(user: User): Promise<void> {
  await sendEmailVerification(user)
}

export async function signOutUser(): Promise<void> {
  await signOut(auth)
}

/**
 * Atomically creates the permanent meta/app gate doc + the first users/{uid}
 * doc with role 'owner'. Firestore rules independently re-check that
 * meta/app does not already exist, so this is safe even under a race.
 */
export async function bootstrapOwner(user: User): Promise<void> {
  const metaRef = doc(db, 'meta', 'app')
  const userRef = doc(db, 'users', user.uid)
  await runTransaction(db, async (tx) => {
    const metaSnap = await tx.get(metaRef)
    if (metaSnap.exists()) {
      throw new Error('An Owner account has already been created for this app.')
    }
    tx.set(metaRef, { ownerUid: user.uid, setupComplete: true })
    tx.set(userRef, {
      email: user.email,
      displayName: user.displayName ?? '',
      role: 'owner',
      invitedBy: null,
      createdAt: Date.now(),
    })
  })
}

/**
 * Atomically flips invites/{inviteId}.used to true and creates the new
 * users/{uid} doc with the role granted by the invite. Fails (and rolls
 * back) if the invite was already used/expired since it was last checked.
 */
export async function redeemInvite(inviteId: string, user: User): Promise<void> {
  const inviteRef = doc(db, 'invites', inviteId)
  const userRef = doc(db, 'users', user.uid)
  await runTransaction(db, async (tx) => {
    const inviteSnap = await tx.get(inviteRef)
    if (!inviteSnap.exists()) {
      throw new Error('This invite link is invalid.')
    }
    const invite = inviteSnap.data() as InviteDoc
    if (invite.used) {
      throw new Error('This invite has already been used.')
    }
    if (invite.expiresAt <= Date.now()) {
      throw new Error('This invite has expired.')
    }
    tx.update(inviteRef, { used: true, usedBy: user.uid, usedAt: Date.now() })
    tx.set(userRef, {
      email: user.email,
      displayName: user.displayName ?? '',
      role: invite.role,
      invitedBy: inviteId,
      createdAt: Date.now(),
    })
  })
}

/** Owner-only: create a new invite. Every invite is single-use — per spec,
 * an invite becomes permanently invalid the moment it is redeemed. */
export async function createInvite(ownerUid: string, role: UserRole, expiresAt: number): Promise<string> {
  const ref = await addDoc(collection(db, 'invites'), {
    role,
    singleUse: true,
    used: false,
    usedBy: null,
    usedAt: null,
    expiresAt,
    createdBy: ownerUid,
    createdAt: Date.now(),
  })
  return ref.id
}
