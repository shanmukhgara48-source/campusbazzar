import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey:            'AIzaSyBUf6MZ4YA76I5d2of2QCo8SDfdvvXMcas',
  authDomain:        'campusbazaar-a222f.firebaseapp.com',
  projectId:         'campusbazaar-a222f',
  storageBucket:     'campusbazaar-a222f.firebasestorage.app',
  messagingSenderId: '326300059970',
  appId:             '1:326300059970:web:3c0e15867397faf01fa0db',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// ignoreUndefinedProperties: true prevents Firestore from throwing when a field
// value is `undefined` at runtime (e.g. optional fields not present on a document).
// Without this, any undefined field in addDoc/updateDoc throws immediately.
// We try initializeFirestore first; on hot-reload it's already initialised so
// we fall back to getFirestore() which returns the existing instance.
function getDb() {
  try {
    return initializeFirestore(app, { ignoreUndefinedProperties: true });
  } catch {
    return getFirestore(app);
  }
}
export const db = getDb();

export const auth    = getAuth(app);
export const storage = getStorage(app);
