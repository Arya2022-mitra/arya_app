import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';

declare global {
  // eslint-disable-next-line no-var
  var __FIREBASE_APP__: FirebaseApp | undefined;
}

// Validate required environment variables
const requiredEnvVars = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Check for missing environment variables
const missingVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => {
    // Convert camelCase to SNAKE_CASE: apiKey -> API_KEY, authDomain -> AUTH_DOMAIN
    const snakeCase = key
      .replace(/([A-Z])/g, '_$1')
      .replace(/^_/, '') // Remove leading underscore
      .toUpperCase();
    return `NEXT_PUBLIC_FIREBASE_${snakeCase}`;
  });

if (missingVars.length > 0 && typeof window !== 'undefined') {
  console.error(
    `Missing required Firebase environment variables: ${missingVars.join(', ')}. ` +
    'Please copy .env.example to .env and configure your Firebase credentials.'
  );
}

const firebaseConfig = {
  apiKey: requiredEnvVars.apiKey || '',
  authDomain: requiredEnvVars.authDomain || '',
  projectId: requiredEnvVars.projectId || '',
  storageBucket: requiredEnvVars.storageBucket || '',
  messagingSenderId: requiredEnvVars.messagingSenderId || '',
  appId: requiredEnvVars.appId || '',
  measurementId: requiredEnvVars.measurementId || '',
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
