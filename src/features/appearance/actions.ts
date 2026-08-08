import { doc, setDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import type { AppearancePrefs } from '../../types/firestore'

export async function saveAppearance(uid: string, prefs: Omit<AppearancePrefs, 'updatedAt'>): Promise<void> {
  // Optional fields (backgroundImageUrl, headerColor, etc.) are `undefined`
  // whenever unset -- Firestore's setDoc rejects any field with an
  // undefined value outright, so those must be dropped rather than written.
  // Since setDoc replaces the whole doc, omitting a key here already means
  // "no override," matching what draft state intends.
  const clean = Object.fromEntries(Object.entries(prefs).filter(([, v]) => v !== undefined))
  await setDoc(doc(db, 'users', uid, 'appearance', 'prefs'), { ...clean, updatedAt: Date.now() })
}
