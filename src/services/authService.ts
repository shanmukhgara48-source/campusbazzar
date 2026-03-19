import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

export interface DBUser {
  uid: string;
  email: string;
  name: string;
  avatar: string;
  college: string;
  rollNumber: string;
  createdAt: unknown;
  // Optional fields populated from Firestore or legacy mock data
  rating?: number;
  reviewCount?: number;
  totalSales?: number;
  year?: string;
  department?: string;
  memberSince?: string;
  responseTime?: string;
  isVerified?: boolean;
  role?: string;
}

export async function createUserInDB(
  user: FirebaseUser,
  extra: { name: string; college: string; rollNumber: string },
): Promise<void> {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    console.log('[createUserInDB] user already exists, skipping write');
    return;
  }
  const data: DBUser = {
    uid:          user.uid,
    email:        user.email ?? '',
    name:         extra.name,
    avatar:       '',
    college:      extra.college,
    rollNumber:   extra.rollNumber,
    createdAt:    serverTimestamp(),
    rating:       0,
    reviewCount:  0,
    totalSales:   0,
    isVerified:   false,
    role:         'buyer',
    memberSince:  new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
  };
  console.log('[createUserInDB] writing to Firestore:', data);
  await setDoc(ref, data);
  console.log('[createUserInDB] success');
}

export async function signUp(
  email: string,
  password: string,
  extra: { name: string; college: string; rollNumber: string },
): Promise<FirebaseUser> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();
  console.log('[signUp] email:', cleanEmail);
  console.log('[signUp] password length:', cleanPassword.length);
  const { user } = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
  console.log('[signUp] Auth success, uid:', user.uid);
  await createUserInDB(user, extra);
  return user;
}

export async function signIn(email: string, password: string): Promise<FirebaseUser> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();
  console.log('[signIn] email:', cleanEmail);
  console.log('[signIn] password length:', cleanPassword.length);
  console.log('[signIn] firebase projectId:', auth.app.options.projectId);
  const { user } = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
  console.log('[signIn] success, uid:', user.uid);

  // Fallback: ensure user doc exists (e.g. created on another device)
  const snap = await getDoc(doc(db, 'users', user.uid));
  if (!snap.exists()) {
    console.log('[signIn] user doc missing, creating fallback');
    await setDoc(doc(db, 'users', user.uid), {
      uid:       user.uid,
      email:     user.email ?? '',
      name:      user.displayName ?? '',
      avatar:    '',
      college:   '',
      rollNumber:'',
      createdAt: serverTimestamp(),
    });
  }
  return user;
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export function subscribeToAuthState(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}
