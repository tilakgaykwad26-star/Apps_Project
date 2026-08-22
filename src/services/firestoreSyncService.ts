import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';

export const COLLECTIONS = {
  DONATIONS: 'dm_donations',
  MEMBERS: 'dm_members',
  PAYMENTS: 'dm_payments',
  EXPENSES: 'dm_expenses',
  EVENTS: 'dm_events',
  NOTICES: 'dm_notices',
  SPONSORS: 'dm_sponsors',
  COMMITTEE: 'dm_committee',
  CONFIG: 'dm_config',
  AUDIT_LOGS: 'dm_audit_logs'
} as const;

/**
 * Subscribe to a Firestore collection in real time
 */
export function subscribeToCollection<T extends { id: string }>(
  collectionName: string,
  onUpdate: (data: T[]) => void,
  onError?: (err: any) => void
) {
  try {
    const colRef = collection(db, collectionName);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const items: T[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...docSnap.data() } as T);
        });
        if (items.length > 0) {
          onUpdate(items);
        }
      },
      (err) => {
        console.warn(`[FirestoreSync] Snapshot error for ${collectionName}:`, err);
        if (onError) onError(err);
      }
    );
  } catch (err) {
    console.warn(`[FirestoreSync] Subscription failed for ${collectionName}:`, err);
    return () => {};
  }
}

/**
 * Save single document to Firestore
 */
export async function saveToFirestore<T extends { id: string }>(
  collectionName: string,
  data: T
): Promise<boolean> {
  try {
    if (!data.id) return false;
    const docRef = doc(db, collectionName, String(data.id));
    // Clean undefined values for Firestore compatibility
    const cleanData = JSON.parse(JSON.stringify(data));
    await setDoc(docRef, cleanData, { merge: true });
    return true;
  } catch (err) {
    console.warn(`[FirestoreSync] Failed to save doc to ${collectionName}:`, err);
    return false;
  }
}

/**
 * Delete single document from Firestore
 */
export async function deleteFromFirestore(
  collectionName: string,
  docId: string
): Promise<boolean> {
  try {
    const docRef = doc(db, collectionName, String(docId));
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.warn(`[FirestoreSync] Failed to delete doc ${docId} from ${collectionName}:`, err);
    return false;
  }
}

/**
 * Push all local state array items to Firestore batch
 */
export async function pushCollectionToCloud<T extends { id: string }>(
  collectionName: string,
  items: T[]
): Promise<number> {
  try {
    if (!items || items.length === 0) return 0;
    const batch = writeBatch(db);
    let count = 0;

    for (const item of items) {
      if (item && item.id) {
        const docRef = doc(db, collectionName, String(item.id));
        const cleanData = JSON.parse(JSON.stringify(item));
        batch.set(docRef, cleanData, { merge: true });
        count++;
      }
    }

    await batch.commit();
    return count;
  } catch (err) {
    console.warn(`[FirestoreSync] Failed to push collection ${collectionName} to cloud:`, err);
    // Fallback: push one by one
    let count = 0;
    for (const item of items) {
      const res = await saveToFirestore(collectionName, item);
      if (res) count++;
    }
    return count;
  }
}

/**
 * Push all local PC data (Members, Donations, Expenses, Events, Notices, Sponsors, Committee) to Cloud
 */
export async function pushAllLocalDataToCloud(localData: {
  members?: any[];
  donations?: any[];
  expenses?: any[];
  events?: any[];
  notices?: any[];
  sponsors?: any[];
  committee?: any[];
  payments?: any[];
}): Promise<{ success: boolean; totalSynced: number; message: string }> {
  try {
    let total = 0;
    if (localData.members?.length) total += await pushCollectionToCloud(COLLECTIONS.MEMBERS, localData.members);
    if (localData.donations?.length) total += await pushCollectionToCloud(COLLECTIONS.DONATIONS, localData.donations);
    if (localData.expenses?.length) total += await pushCollectionToCloud(COLLECTIONS.EXPENSES, localData.expenses);
    if (localData.events?.length) total += await pushCollectionToCloud(COLLECTIONS.EVENTS, localData.events);
    if (localData.notices?.length) total += await pushCollectionToCloud(COLLECTIONS.NOTICES, localData.notices);
    if (localData.sponsors?.length) total += await pushCollectionToCloud(COLLECTIONS.SPONSORS, localData.sponsors);
    if (localData.committee?.length) total += await pushCollectionToCloud(COLLECTIONS.COMMITTEE, localData.committee);
    if (localData.payments?.length) total += await pushCollectionToCloud(COLLECTIONS.PAYMENTS, localData.payments);

    return {
      success: true,
      totalSynced: total,
      message: `सफलतापूर्वक ${total} रेकॉर्ड्स क्लाउड डेटाबेसवर अपलोड केले!`
    };
  } catch (err: any) {
    console.error('[FirestoreSync] Failed pushAllLocalDataToCloud:', err);
    return {
      success: false,
      totalSynced: 0,
      message: `क्लाउड अपलोड अयशस्वी: ${err?.message || 'अनोखी त्रुटी'}`
    };
  }
}
