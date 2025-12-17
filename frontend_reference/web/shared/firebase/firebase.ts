import { browserLocalPersistence, getAuth, setPersistence } from 'firebase/auth';
import { getFirebaseApp } from '@/utils/firebaseConfig';

const app = getFirebaseApp();

export const auth = getAuth(app);

if (typeof window !== 'undefined') {
  void setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.error('[FIREBASE] Failed to set auth persistence', err);
  });
}

export { app };
