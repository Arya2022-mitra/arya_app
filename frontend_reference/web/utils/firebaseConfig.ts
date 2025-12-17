import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';

declare global {
  // eslint-disable-next-line no-var
  var __FIREBASE_APP__: FirebaseApp | undefined;
}

const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ??
    'AIzaSyCP-NGVQC5iNQcoSHZGj0eKOjhKFFqZ6Q8',
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ??
    'mitraveda-c1c03.firebaseapp.com',
  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'mitraveda-c1c03',
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ??
    'mitraveda-c1c03.appspot.com',
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '230188375703',
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ??
    '1:230188375703:web:28af92dbe94651321c53d2',
  measurementId:
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? 'G-MT17PVPXLQ',
};

let firebaseApp: FirebaseApp | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (firebaseApp) return firebaseApp;

  const globalApp = typeof globalThis !== 'undefined' ? globalThis.__FIREBASE_APP__ : undefined;
  if (globalApp) {
    firebaseApp = globalApp;
    return firebaseApp;
  }

  if (getApps().length > 0) {
    firebaseApp = getApp();
  } else {
    firebaseApp = initializeApp(firebaseConfig);
  }

  if (typeof globalThis !== 'undefined') {
    globalThis.__FIREBASE_APP__ = firebaseApp;
  }

  return firebaseApp;
}

export { firebaseConfig };
