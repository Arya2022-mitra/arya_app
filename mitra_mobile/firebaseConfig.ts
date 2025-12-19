import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, initializeAuth, type Auth } from 'firebase/auth';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

declare global {
  // eslint-disable-next-line no-var
  var __FIREBASE_APP__: FirebaseApp | undefined;
  // eslint-disable-next-line no-var
  var __FIREBASE_AUTH__: Auth | undefined;
}

// Validate required environment variables
const requiredEnvVars = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
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
    return `EXPO_PUBLIC_FIREBASE_${snakeCase}`;
  });

if (missingVars.length > 0) {
  console.error(
    `Missing required Firebase environment variables: ${missingVars.join(', ')}. ` +
    'Please make sure to run `npx expo prebuild --clean` and that your secrets are set in Expo.'
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
let auth: Auth | null = null;

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

export function getFirebaseAuth(): Auth {
    if (auth) return auth;

    const globalAuth = typeof globalThis !== 'undefined' ? globalThis.__FIREBASE_AUTH__ : undefined;
    if(globalAuth) {
        auth = globalAuth;
        return auth;
    }

    if (Platform.OS !== 'web') {
        const { getReactNativePersistence } = require('firebase/auth/react-native');
        auth = initializeAuth(getFirebaseApp(), {
            persistence: getReactNativePersistence(AsyncStorage)
        });
    } else {
        auth = getAuth(getFirebaseApp());
    }

    if (typeof globalThis !== 'undefined') {
        globalThis.__FIREBASE_AUTH__ = auth;
    }

    return auth;
}

export const app = getFirebaseApp();
export const authInstance = getFirebaseAuth();

export { firebaseConfig };
