import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence, type Auth } from 'firebase/auth';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

declare global {
  // eslint-disable-next-line no-var
  var __FIREBASE_APP__: FirebaseApp | undefined;
  // eslint-disable-next-line no-var
  var __FIREBASE_AUTH__: Auth | undefined;
}

const firebaseConfig = {
  apiKey: 'AIzaSyCP-NGVQC5iNQcoSHZGj0eKOjhKFFqZ6Q8',
  authDomain: 'mitraveda-c1c03.firebaseapp.com',
  projectId: 'mitraveda-c1c03',
  storageBucket: 'mitraveda-c1c03.appspot.com',
  messagingSenderId: '230188375703',
  appId: '1:230188375703:web:28af92dbe94651321c53d2',
  measurementId: 'G-MT17PVPXLQ',
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
