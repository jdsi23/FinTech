import { addDoc, collection, deleteDoc, deleteField, doc, updateDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import type { GoalDoc } from '../../types/firestore'

function goalsCol(uid: string) {
  return collection(db, 'users', uid, 'goals')
}

export async function createGoal(uid: string, data: Omit<GoalDoc, 'createdAt'>): Promise<string> {
  const ref = await addDoc(goalsCol(uid), { ...data, createdAt: Date.now() })
  return ref.id
}

export async function updateGoal(uid: string, id: string, data: Partial<GoalDoc>): Promise<void> {
  await updateDoc(doc(db, 'users', uid, 'goals', id), data)
}

export async function deleteGoal(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'goals', id))
}

export async function logCheckIn(uid: string, goalId: string, weekKey: string, amount: number): Promise<void> {
  await updateDoc(doc(db, 'users', uid, 'goals', goalId), { [`checkIns.${weekKey}`]: amount })
}

export async function clearCheckIn(uid: string, goalId: string, weekKey: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid, 'goals', goalId), { [`checkIns.${weekKey}`]: deleteField() })
}
