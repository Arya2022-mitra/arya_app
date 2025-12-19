// mitra_mobile/firebaseConfig.native.ts
import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, initializeAuth, type Auth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  // safe: this file will only be bundled/used on native platforms
  const { getReactNativePersistence } = require('firebase/auth/react-native');
  auth = initializeAuth(getFirebaseApp(), {
    persistence: getReactNativePersistence(AsyncStorage)
  });
  (globalThis as any).__FIREBASE_AUTH__ = auth;
  return auth;
}

export const app = getFirebaseApp();
export const authInstance = getFirebaseAuth();
export { firebaseConfig };
