import {
  doc, getDoc, setDoc, updateDoc, serverTimestamp,
  collection, query, where, getDocs,
} from 'firebase/firestore';
import { db } from './firebase';

export interface FSUser {
  uid: string;
  name: string;
  email: string;
  avatar: string;
  college: string;
  createdAt: unknown;
}

export async function createUser(uid: string, data: Omit<FSUser, 'uid' | 'createdAt'>) {
  await setDoc(doc(db, 'users', uid), { ...data, uid, createdAt: serverTimestamp() });
}

export async function getUser(uid: string): Promise<FSUser | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as FSUser) : null;
}

export async function updateUser(uid: string, data: Partial<FSUser>) {
  await updateDoc(doc(db, 'users', uid), data);
}

export async function getUsersByCollege(college: string): Promise<FSUser[]> {
  const q = query(collection(db, 'users'), where('college', '==', college));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as FSUser);
}
