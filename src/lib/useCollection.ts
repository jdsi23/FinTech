import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from './firebase'

/** Live-subscribes to users/{uid}/{path} and returns its docs. Shared by
 * every screen reading a private per-user subcollection (Calendar,
 * Dashboard, Goals). */
export function useCollection<T>(uid: string | undefined, path: string): (T & { id: string })[] {
  const [items, setItems] = useState<(T & { id: string })[]>([])

  useEffect(() => {
    if (!uid) return
    return onSnapshot(collection(db, 'users', uid, path), (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as T) })))
    })
  }, [uid, path])

  return items
}
