import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import { firebaseConfig } from './firebaseConfig.shared';

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

// Initialize Firebase if not already initialized
if (firebase.apps.length === 0) {
  try {
    firebase.initializeApp(firebaseConfig);
    console.log('[Firebase] Successfully initialized with project:', firebaseConfig.projectId);
  } catch (error) {
    console.error('[Firebase] Initialization error:', error);
    throw new Error(
      `Firebase initialization failed: ${error instanceof Error ? error.message : String(error)}. ` +
      `Please verify your Firebase configuration in .env file.`
    );
  }
}

export const app = firebase;
export const authInstance = auth();
export { firebaseConfig };
