import { addDoc, collection, deleteDoc, deleteField, doc, updateDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import type { ExpenseDoc, IncomeDoc, OccurrenceOverride } from '../../types/firestore'

function incomeCol(uid: string) {
  return collection(db, 'users', uid, 'incomeSources')
}
function expenseCol(uid: string) {
  return collection(db, 'users', uid, 'expenses')
}
function merchantCol(uid: string) {
  return collection(db, 'users', uid, 'merchants')
}

export async function createIncome(uid: string, data: Omit<IncomeDoc, 'createdAt'>): Promise<string> {
  const ref = await addDoc(incomeCol(uid), { ...data, createdAt: Date.now() })
  return ref.id
}

export async function updateIncome(uid: string, id: string, data: Partial<IncomeDoc>): Promise<void> {
  await updateDoc(doc(db, 'users', uid, 'incomeSources', id), data)
}

export async function deleteIncome(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'incomeSources', id))
}

export async function createExpense(uid: string, data: Omit<ExpenseDoc, 'createdAt'>): Promise<string> {
  const ref = await addDoc(expenseCol(uid), { ...data, createdAt: Date.now() })
  return ref.id
}

export async function updateExpense(uid: string, id: string, data: Partial<ExpenseDoc>): Promise<void> {
  await updateDoc(doc(db, 'users', uid, 'expenses', id), data)
}

export async function deleteExpense(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'expenses', id))
}

type ItemKind = 'incomeSources' | 'expenses'

export async function setOccurrenceOverride(
  uid: string,
  kind: ItemKind,
  id: string,
  dateKey: string,
  override: OccurrenceOverride,
): Promise<void> {
  await updateDoc(doc(db, 'users', uid, kind, id), { [`overrides.${dateKey}`]: override })
}

export async function clearOccurrenceOverride(
  uid: string,
  kind: ItemKind,
  id: string,
  dateKey: string,
): Promise<void> {
  await updateDoc(doc(db, 'users', uid, kind, id), { [`overrides.${dateKey}`]: deleteField() })
}

/** Case-insensitive find-or-create against an already-loaded merchant list,
 * so adding an expense never needs an extra round-trip query. */
export async function ensureMerchant(
  uid: string,
  name: string,
  existing: { id: string; name: string }[],
): Promise<string> {
  const trimmed = name.trim()
  const match = existing.find((m) => m.name.toLowerCase() === trimmed.toLowerCase())
  if (match) return match.id
  const ref = await addDoc(merchantCol(uid), { name: trimmed, createdAt: Date.now() })
  return ref.id
}

export async function setStartingBalance(uid: string, amount: number): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { startingBalance: amount })
}
