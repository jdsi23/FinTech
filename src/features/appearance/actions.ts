import { doc, setDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import type { AppearancePrefs } from '../../types/firestore'

export async function saveAppearance(uid: string, prefs: Omit<AppearancePrefs, 'updatedAt'>): Promise<void> {
  await setDoc(doc(db, 'users', uid, 'appearance', 'prefs'), { ...prefs, updatedAt: Date.now() })
}
