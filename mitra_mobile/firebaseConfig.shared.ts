// mitra_mobile/firebaseConfig.shared.ts
import Constants from 'expo-constants';

function fromProcessEnv(key: string): string | undefined {
  const v = (process.env as any)[key];
  return v === undefined || v === '' ? undefined : String(v);
}

function fromExpoConstants(key: string): string | undefined {
  try {
    const expo = (Constants as any);
    const extra = expo?.expoConfig?.extra ?? expo?.manifest?.extra;
    if (extra && extra[key]) return String(extra[key]);
  } catch (e) {
    // ignore
  }
  return undefined;
}

function getEnvVar(...keys: string[]): string | undefined {
  for (const key of keys) {
    const v = fromProcessEnv(key) ?? fromExpoConstants(key);
    if (v !== undefined) return v;
  }
  return undefined;
}

export const firebaseConfig = {
  apiKey: getEnvVar('EXPO_PUBLIC_FIREBASE_API_KEY', 'NEXT_PUBLIC_FIREBASE_API_KEY', 'FIREBASE_API_KEY') ?? '',
  authDomain: getEnvVar('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN', 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 'FIREBASE_AUTH_DOMAIN') ?? '',
  projectId: getEnvVar('EXPO_PUBLIC_FIREBASE_PROJECT_ID', 'NEXT_PUBLIC_FIREBASE_PROJECT_ID', 'FIREBASE_PROJECT_ID') ?? '',
  storageBucket: getEnvVar('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET', 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', 'FIREBASE_STORAGE_BUCKET') ?? '',
  messagingSenderId: getEnvVar('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', 'FIREBASE_MESSAGING_SENDER_ID') ?? '',
  appId: getEnvVar('EXPO_PUBLIC_FIREBASE_APP_ID', 'NEXT_PUBLIC_FIREBASE_APP_ID', 'FIREBASE_APP_ID') ?? '',
  measurementId: getEnvVar('EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID', 'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID', 'FIREBASE_MEASUREMENT_ID') ?? '',
};

const missing = Object.entries(firebaseConfig)
  .filter(([_, v]) => !v)
  .map(([k]) => k);

if (missing.length > 0) {
  const mapping: Record<string, string[]> = {
    apiKey: ['EXPO_PUBLIC_FIREBASE_API_KEY','NEXT_PUBLIC_FIREBASE_API_KEY','FIREBASE_API_KEY'],
    authDomain: ['EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN','NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN','FIREBASE_AUTH_DOMAIN'],
    projectId: ['EXPO_PUBLIC_FIREBASE_PROJECT_ID','NEXT_PUBLIC_FIREBASE_PROJECT_ID','FIREBASE_PROJECT_ID'],
    storageBucket: ['EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET','NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET','FIREBASE_STORAGE_BUCKET'],
    messagingSenderId: ['EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID','NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID','FIREBASE_MESSAGING_SENDER_ID'],
    appId: ['EXPO_PUBLIC_FIREBASE_APP_ID','NEXT_PUBLIC_FIREBASE_APP_ID','FIREBASE_APP_ID'],
    measurementId: ['EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID','NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID','FIREBASE_MEASUREMENT_ID'],
  };
  const tried = missing.map(k => `${k}: ${mapping[k].join(' | ')}`).join('; ');
  console.error(`[firebaseConfig] Missing Firebase values for: ${missing.join(', ')}. Tried env keys -> ${tried}.`);
}

export default firebaseConfig;
