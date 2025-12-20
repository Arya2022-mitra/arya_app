# CODEX WEB INSTRUCTION — FIREBASE & EXPO WEB ENVIRONMENT (COPY / PASTE)

## PURPOSE

Provide exact, copyable guidance to ensure the **web** (Expo Web) portion of the mitra_mobile project picks up Firebase and other environment variables so Firebase initializes correctly in the browser build.

## SCOPE

This document covers the mitra_mobile Expo app's **web platform**, how Expo Web expects environment variables, how to validate them locally and in CI/CD, and how to troubleshoot the common error:

**"No Firebase App '[DEFAULT]' has been created - call firebase.initializeApp()"**

This does NOT include mobile native (iOS/Android) instructions; see the mobile ENV_CONFIG.md document for mobile-specific steps.

## SUMMARY OF ROOT CAUSE

The Expo Web build/runtime did not have the required `EXPO_PUBLIC_FIREBASE_*` or `NEXT_PUBLIC_FIREBASE_*` environment variables available at runtime, so firebaseConfig code logs the missing variables and the app fails to initialize Firebase in the browser. The project's firebaseConfig code (`firebaseConfig.shared.ts`) inspects `process.env` and logs missing keys when they're absent. The code path used by the web app initializes Firebase eagerly during module import, so missing build-time environment variables produce the runtime error.

## REQUIRED KEYS (web)

The web app requires the following environment keys (sourced from Firebase project > Project settings):

- `EXPO_PUBLIC_FIREBASE_API_KEY` (preferred for Expo) or `NEXT_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` or `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID` or `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` or `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` or `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID` or `NEXT_PUBLIC_FIREBASE_APP_ID`
- `EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID` or `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

**Note:** The code supports both `EXPO_PUBLIC_*` and `NEXT_PUBLIC_*` prefixes for compatibility. Use `EXPO_PUBLIC_*` for Expo apps.

## LOCAL DEVELOPMENT — EXACT STEPS

### 1. Place the keys

1. Copy `mitra_mobile/.env.example` to `mitra_mobile/.env`:
   ```bash
   cd mitra_mobile
   cp .env.example .env
   ```

2. Replace placeholders with the real Firebase values from your Firebase console:
   ```env
   # Firebase Configuration
   EXPO_PUBLIC_FIREBASE_API_KEY=your-actual-firebase-api-key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
   EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
   ```

3. Confirm that the keys are prefixed with `EXPO_PUBLIC_` so Expo will expose them to the browser bundle.

### 2. Ensure environment variables are available at build-time

- Expo resolves `EXPO_PUBLIC_*` environment variables at build time for the browser bundle.
- Make sure you run the dev server or production build **after** the `.env` file exists and contains the keys.

### 3. Restart the Expo dev server

- Fully stop the Expo dev server and restart it with cache clearing after creating or updating `.env` files:
  ```bash
  npx expo start -c
  # or
  npm run web
  ```

- The Expo bundler must be restarted to pick up changed environment variables.

### 4. Confirm runtime values

- Open the browser console and look for the firebaseConfig missing-vars log.
- The project's `firebaseConfig.shared.ts` will print an explicit error if keys are missing:
  ```
  [firebaseConfig] Missing Firebase values for: apiKey, authDomain. Tried env keys -> ...
  ```
- If you do not see any missing-vars log and you still see the Firebase error, confirm the build step used the correct `.env` file and that it contains the `EXPO_PUBLIC_*` keys.

## PRODUCTION / DEPLOYMENT — EXACT STEPS

### 1. Configure your hosting provider

Add the `EXPO_PUBLIC_FIREBASE_*` keys to your hosting provider's environment settings (e.g., Vercel, Netlify, Railway, or your CI/CD) **and** ensure they are available for the build step (not only runtime).

For Expo Web, the variables must be present at build time so the client bundle contains them.

**Example environment variables for hosting providers:**
```env
EXPO_PUBLIC_FIREBASE_API_KEY=your-production-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

### 2. Build for web

Build the web version of the app:
```bash
npm run build:web
# or
expo export -p web
```

The build will create static files in the `dist/` directory.

### 3. Trigger a fresh build

- After adding environment variables in the host, trigger a fresh production build.
- The client bundle will only include `EXPO_PUBLIC_*` values that were present during the build.

### 4. Validate in production

- After deployment, open the browser console and ensure the firebaseConfig missing-vars message does not appear.
- Verify that Firebase initializes successfully without throwing errors.

## CODE-LEVEL GUIDANCE (design decisions)

### 1. Be explicit about where values come from

The web firebaseConfig (`firebaseConfig.shared.ts`) explicitly reads `EXPO_PUBLIC_*` or `NEXT_PUBLIC_*` from `process.env` and logs missing variables. Use this log to validate.

The repo's firebase initialization code for web (`firebaseConfig.web.ts`) is intentionally eager (Firebase is created at module import). If you prefer, change initialization to be lazy (initialize only on first client access) so early imports cannot cause a fatal client error.

### 2. Guard initialization for SSR/SSG

Because Expo Web can perform static rendering, ensure any browser-only Firebase calls are guarded with a client environment check. The project already guards some runtime-only calls (persistence) with `typeof window` checks. Ensure initialization is safe for static generation contexts or happens only client-side when needed.

### 3. Use build-time injection, not runtime-only dashboard injection

For Expo Web, rely on `EXPO_PUBLIC_*` at build-time. Do not assume runtime-only injection from an external dashboard will make values available to the already-built client bundle.

### 4. Fallback prefix support

The code checks for both `EXPO_PUBLIC_*` and `NEXT_PUBLIC_*` prefixes for maximum compatibility:
```typescript
getEnvVar('EXPO_PUBLIC_FIREBASE_API_KEY', 'NEXT_PUBLIC_FIREBASE_API_KEY', 'FIREBASE_API_KEY')
```

This allows the same codebase to work in Expo and Next.js environments. For Expo apps, always use `EXPO_PUBLIC_*`.

## TROUBLESHOOTING CHECKLIST (if the error persists)

### 1. Confirm .env location

- Ensure `.env` is in the `mitra_mobile/` directory.
- Compare to the project's `.env.example` for required names.

### 2. Confirm key names exactly match

- Key names must be spelled exactly: `EXPO_PUBLIC_FIREBASE_API_KEY`, etc.
- Case-sensitive.
- Prefix must be `EXPO_PUBLIC_` for Expo apps.

### 3. Confirm the build used the correct env file

- For CI/CD, verify the hosting settings show the variables and the build logs reference them.
- For local dev, verify the dev server was restarted with cache clearing after `.env` changes:
  ```bash
  npx expo start -c
  ```

### 4. Check the browser console for the "Missing Firebase values" log

The project's `firebaseConfig.shared.ts` prints a clear message listing which keys were missing:
```
[firebaseConfig] Missing Firebase values for: apiKey, authDomain. 
Tried env keys -> apiKey: EXPO_PUBLIC_FIREBASE_API_KEY | NEXT_PUBLIC_FIREBASE_API_KEY | FIREBASE_API_KEY; ...
```

Use this to identify the missing variables or wrong environment.

### 5. Check lazy vs eager initialization

- If Firebase initialization happens at module import time, ensure that import path only runs after environment variables are guaranteed to exist.
- Alternatively, delay Firebase initialization until a runtime check or first client call.

Currently, `firebaseConfig.web.ts` exports:
```typescript
export const app = getFirebaseApp();
export const authInstance = getFirebaseAuth();
```

These are **eager** — they initialize Firebase immediately when the module is imported. If this causes issues, consider making them lazy.

### 6. If issues only in CI/CD or preview builds

- Confirm preview builds use the same environment variables as production builds for your hosting provider.
- Set values for both preview and production as needed.
- Check that the build command includes the environment variables.

### 7. Verify Metro bundler cache is cleared

If changes don't seem to take effect:
```bash
# Clear Metro cache
npx expo start -c

# or fully reset
rm -rf node_modules .expo
npm install
npx expo start -c
```

## DOCUMENTS IN REPO YOU CAN REFERENCE

- **`firebaseConfig.shared.ts`** — Shared firebase config that validates environment variables and logs missing keys. This file demonstrates the app's environment lookup logic and how mobile and web fallbacks differ.

- **`firebaseConfig.web.ts`** — The web firebase initialization. This import triggers `getFirebaseApp` and will fail early if the config is missing.

- **`firebaseConfig.native.ts`** — Native firebase config for iOS/Android (not used on web).

- **`.env.example`** — Example environment template. Provides the canonical `EXPO_PUBLIC_*` keys you must set.

- **`ENV_CONFIG.md`** — Explains the mobile (native) environment configuration and the distinction between `EXPO_PUBLIC_*` and `NEXT_PUBLIC_*` prefixes.

- **`lib/api.ts`** — Requires `EXPO_PUBLIC_API_URL` or `NEXT_PUBLIC_API_URL` at module import and throws if missing.

## EXPECTED OUTCOME

After ensuring `EXPO_PUBLIC_*` keys are present in the `.env` file and in your deployment host (and after rebuilding/restarting the dev server), the firebaseConfig code will no longer log missing Firebase values and Firebase will initialize in the browser without throwing:

**"No Firebase App '[DEFAULT]' has been created - call firebase.initializeApp()"**

## ADDITIONAL NOTES

### Security

- **Client-exposed Firebase keys are safe to publish**: They are intended to be public as part of Firebase's configuration. Firebase security is enforced through Firebase Security Rules, not by hiding these keys.
- **Do not place server-only secrets in `EXPO_PUBLIC_*` variables**: Server secrets belong in the deployment host settings and must never be prefixed with `EXPO_PUBLIC_` or `NEXT_PUBLIC_`.

### Lazy initialization option

If you prefer extra resilience, the project's firebase code can be updated to initialize Firebase lazily and to fail gracefully when keys are missing rather than throwing at module import time.

**Current (eager) approach:**
```typescript
// firebaseConfig.web.ts
export const app = getFirebaseApp(); // Runs immediately on import
export const authInstance = getFirebaseAuth(); // Runs immediately on import
```

**Lazy approach (optional):**
```typescript
// firebaseConfig.web.ts
let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;

export function getApp(): FirebaseApp {
  if (!app) app = getFirebaseApp();
  return app;
}

export function getAuth(): Auth {
  if (!authInstance) authInstance = getFirebaseAuth();
  return authInstance;
}
```

Then update consuming code to call `getApp()` and `getAuth()` instead of using the exported instances.

## EXPO_PUBLIC_ vs NEXT_PUBLIC_ PREFIXES

**Why both exist in the codebase:**
- `EXPO_PUBLIC_*` — Required for Expo apps (React Native and Expo Web)
- `NEXT_PUBLIC_*` — Required for Next.js apps

**For this Expo app:**
- Always use `EXPO_PUBLIC_*` prefix for environment variables in mitra_mobile
- The code checks both prefixes for compatibility: `getEnvVar('EXPO_PUBLIC_...', 'NEXT_PUBLIC_...', '...')`
- You may include both in `.env` if sharing environment files across projects

**Best practice:**
- In Expo-only projects: use `EXPO_PUBLIC_*` exclusively
- In monorepos with Next.js web + Expo mobile: include both prefixes with same values for shared variables

## PLATFORM DETECTION

The app uses platform-specific Firebase configurations:

- **Web**: Uses `firebaseConfig.web.ts` (via Metro bundler's platform extensions)
- **Native (iOS/Android)**: Uses `firebaseConfig.native.ts`
- **Shared**: Both platforms use `firebaseConfig.shared.ts` for the base configuration

The Metro bundler automatically resolves `.web.ts` and `.native.ts` files based on the target platform.

## API URL REQUIREMENT

In addition to Firebase keys, the app requires an API URL:

- `EXPO_PUBLIC_API_URL` or `NEXT_PUBLIC_API_URL`

This is validated in `lib/api.ts` at module import time. See ENV_CONFIG.md for details on API URL configuration.

## REFERENCES (repo)

- `mitra_mobile/firebaseConfig.shared.ts` — Shared environment lookup; shows EXPO vs NEXT_PUBLIC behavior
- `mitra_mobile/firebaseConfig.web.ts` — Web firebase initialization; imports getFirebaseApp and uses Firebase in browser
- `mitra_mobile/firebaseConfig.native.ts` — Native firebase config (iOS/Android only)
- `mitra_mobile/.env.example` — Example EXPO_PUBLIC_* keys
- `mitra_mobile/ENV_CONFIG.md` — Mobile (native) environment configuration guide
- `mitra_mobile/lib/api.ts` — API URL validation and configuration
- `mitra_mobile/app.json` — Expo configuration; shows web platform is enabled

## CHECKLIST (IMMEDIATE ACTIONS)

1. ✅ Create `mitra_mobile/.env` with Firebase keys (use `.env.example` as template)
2. ✅ Ensure all keys use `EXPO_PUBLIC_` prefix
3. ⚠️ Restart Expo dev server with cleared cache: `npx expo start -c`
4. ⚠️ Check browser console for missing-vars log
5. ⚠️ Verify Firebase initializes without errors when running `npm run web`
6. ⚠️ For production, add `EXPO_PUBLIC_*` keys to hosting provider environment settings
7. ⚠️ Trigger fresh production build after adding environment variables

## SUPPORT

If you encounter issues:

1. Check the browser console for the firebaseConfig missing-vars message
2. Verify `.env` file exists in `mitra_mobile/` directory
3. Ensure all keys are prefixed with `EXPO_PUBLIC_`
4. Clear Metro cache: `npx expo start -c`
5. Check that Firebase values are correct in Firebase Console
6. Review the code files listed in the References section

For persistent issues, enable verbose logging by adding console logs to `firebaseConfig.shared.ts` and `firebaseConfig.web.ts`.
