import type {
  Auth,
  GoogleAuthProvider,
  Unsubscribe,
  User,
  UserCredential,
} from 'firebase/auth';
import { getAuth } from 'firebase/auth';
import { getFirebaseApp } from './firebaseConfig';

let authPromise: Promise<Auth> | null = null;
let googleProviderPromise: Promise<GoogleAuthProvider> | null = null;
let authModulePromise:
  | Promise<typeof import('firebase/auth')>
  | null = null;

function loadAuthModule() {
  if (!authModulePromise) {
    authModulePromise = import('firebase/auth');
  }

  return authModulePromise;
}

async function ensureAuth(): Promise<Auth> {
  if (!authPromise) {
    authPromise = loadAuthModule().then(({ getAuth }) => getAuth(getFirebaseApp()));
  }

  return authPromise;
}

async function ensureGoogleProvider(): Promise<GoogleAuthProvider> {
  if (!googleProviderPromise) {
    googleProviderPromise = loadAuthModule().then(
      ({ GoogleAuthProvider }) => new GoogleAuthProvider(),
    );
  }

  return googleProviderPromise;
}

export async function subscribeToIdTokenChanged(
  handler: (user: User | null) => void,
): Promise<Unsubscribe> {
  const [authModule, auth] = await Promise.all([loadAuthModule(), ensureAuth()]);
  return authModule.onIdTokenChanged(auth, handler);
}

export async function emailSignIn(
  email: string,
  password: string,
): Promise<UserCredential> {
  const [authModule, auth] = await Promise.all([loadAuthModule(), ensureAuth()]);
  return authModule.signInWithEmailAndPassword(auth, email, password);
}

export async function emailSignUp(
  email: string,
  password: string,
): Promise<UserCredential> {
  const [authModule, auth] = await Promise.all([loadAuthModule(), ensureAuth()]);
  return authModule.createUserWithEmailAndPassword(auth, email, password);
}

let googlePopupPromise: Promise<UserCredential> | null = null;

export async function googleSignInWithPopup(): Promise<UserCredential> {
  if (!googlePopupPromise) {
    googlePopupPromise = Promise.all([
      loadAuthModule(),
      ensureAuth(),
      ensureGoogleProvider(),
    ])
      .then(([authModule, auth, provider]) => authModule.signInWithPopup(auth, provider))
      .finally(() => {
        googlePopupPromise = null;
      });
  }

  return googlePopupPromise;
}

export async function preloadFirebaseAuth() {
  await Promise.all([loadAuthModule(), ensureAuth(), ensureGoogleProvider()]);
}

// ------------------------------------------------------
// 🔒 Static Firebase Auth export for shared access
// ------------------------------------------------------
export const auth = getAuth(getFirebaseApp());
