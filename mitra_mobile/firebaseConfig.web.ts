// mitra_mobile/firebaseConfig.web.ts
import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import firebaseConfig from './firebaseConfig.shared';

// Validate that we have required Firebase configuration before initializing
const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
const missingFields = requiredFields.filter(field => !(firebaseConfig as any)[field]);

if (missingFields.length > 0) {
  throw new Error(
    `Firebase initialization failed: Missing required configuration fields: ${missingFields.join(', ')}. ` +
    `Please ensure your .env file in mitra_mobile/ has all required EXPO_PUBLIC_FIREBASE_* variables set. ` +
    `See .env.example for reference.`
  );
}

let firebaseApp: FirebaseApp | null = null;
let auth: Auth | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (firebaseApp) return firebaseApp;
  try {
    if (getApps().length > 0) {
      firebaseApp = getApp();
    } else {
      firebaseApp = initializeApp(firebaseConfig);
      console.log('[Firebase] Successfully initialized with project:', firebaseConfig.projectId);
    }
    (globalThis as any).__FIREBASE_APP__ = firebaseApp;
    return firebaseApp;
  } catch (error) {
    console.error('[Firebase] Initialization error:', error);
    throw new Error(
      `Firebase initialization failed: ${error instanceof Error ? error.message : String(error)}. ` +
      `Please verify your Firebase configuration in .env file.`
    );
  }
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
