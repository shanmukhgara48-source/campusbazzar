import {
  doc, setDoc, deleteDoc, collection,
  onSnapshot, serverTimestamp, Unsubscribe,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from './firebase';

// Firestore path: users/{userId}/savedItems/{listingId}

export async function saveItem(userId: string, listingId: string): Promise<void> {
  await setDoc(doc(db, 'users', userId, 'savedItems', listingId), {
    listingId,
    savedAt: serverTimestamp(),
  });
}

export async function unsaveItem(userId: string, listingId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', userId, 'savedItems', listingId));
}

export function useSavedItems(userId: string | undefined) {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    const unsub: Unsubscribe = onSnapshot(
      collection(db, 'users', userId, 'savedItems'),
      snap => {
        setSavedIds(new Set(snap.docs.map(d => d.id)));
        setLoading(false);
      },
      () => { setLoading(false); },
    );
    return unsub;
  }, [userId]);

  return { savedIds, loading };
}
