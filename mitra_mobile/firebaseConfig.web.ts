// mitra_mobile/firebaseConfig.web.ts
import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import firebaseConfig from './firebaseConfig.shared';

let firebaseApp: FirebaseApp | null = null;
let auth: Auth | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (firebaseApp) return firebaseApp;
  if (getApps().length > 0) firebaseApp = getApp();
  else firebaseApp = initializeApp(firebaseConfig);
  (globalThis as any).__FIREBASE_APP__ = firebaseApp;
  return firebaseApp;
}

export function getFirebaseAuth(): Auth {
  if (auth) return auth;
  auth = getAuth(getFirebaseApp());
  (globalThis as any).__FIREBASE_AUTH__ = auth;
  return auth;
}

export const app = getFirebaseApp();
export const authInstance = getFirebaseAuth();
export { firebaseConfig };
