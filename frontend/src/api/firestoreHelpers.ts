import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit as fbLimit, runTransaction,
  type QueryConstraint, type DocumentData,
} from 'firebase/firestore';
import { db } from '../firebase';

// Every helper stores/returns a plain `{ id, ...fields }` object with the same snake_case
// shape the app already used against the old REST API - only the transport changes.

export async function createDoc<T extends DocumentData>(collectionName: string, data: T) {
  const ref = doc(collection(db, collectionName));
  const payload = { ...data, id: ref.id };
  await setDoc(ref, payload);
  return payload as T & { id: string };
}

export async function setDocById<T extends DocumentData>(collectionName: string, id: string, data: Partial<T>) {
  const ref = doc(db, collectionName, id);
  const payload = { ...data, id };
  await setDoc(ref, payload, { merge: true });
  return payload as T & { id: string };
}

export async function getDocById<T = DocumentData>(collectionName: string, id: string): Promise<(T & { id: string }) | null> {
  const snap = await getDoc(doc(db, collectionName, id));
  return snap.exists() ? ({ ...(snap.data() as T), id: snap.id }) : null;
}

export async function updateDocById<T extends DocumentData>(collectionName: string, id: string, data: Partial<T>) {
  await updateDoc(doc(db, collectionName, id), data as DocumentData);
  return getDocById<T>(collectionName, id);
}

export async function deleteDocById(collectionName: string, id: string) {
  await deleteDoc(doc(db, collectionName, id));
}

export async function queryDocs<T = DocumentData>(collectionName: string, ...constraints: QueryConstraint[]): Promise<(T & { id: string })[]> {
  const snap = await getDocs(query(collection(db, collectionName), ...constraints));
  return snap.docs.map((d) => ({ ...(d.data() as T), id: d.id }));
}

export { where, orderBy, fbLimit as limit };

// Generates the next "P{year}-0001" style code using a transactional counter document,
// so two assistants registering patients at the same moment never collide on the same code.
export async function nextSequenceCode(counterId: string, prefix: string): Promise<string> {
  const ref = doc(db, 'counters', counterId);
  const next = await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const count = snap.exists() ? (snap.data().count as number) : 0;
    const updated = count + 1;
    tx.set(ref, { count: updated }, { merge: true });
    return updated;
  });
  return `${prefix}-${String(next).padStart(4, '0')}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

// Routine activity logging, written directly by the client (security-critical entries -
// PIN lockouts, payment verification - are written server-side by Cloud Functions
// instead; see functions/index.js). Firestore rules only allow `create` on this
// collection, never update/delete, so the trail can grow but never be rewritten.
export async function logAudit(entry: {
  userName: string;
  role: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  patientId?: string | null;
  description: string;
}) {
  try {
    await createDoc('audit_logs', {
      user_name: entry.userName || 'Unknown',
      role: entry.role || 'staff',
      action: entry.action,
      entity_type: entry.entityType,
      entity_id: entry.entityId || null,
      patient_id: entry.patientId || null,
      description: entry.description,
      created_at: nowIso(),
    });
  } catch {
    // Never let a logging failure block the actual user-facing action.
  }
}
