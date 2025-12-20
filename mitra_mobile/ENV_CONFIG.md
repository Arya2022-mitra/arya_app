# CODEX MOBILE INSTRUCTION — ENVIRONMENT CONFIGURATION (UNIFIED COPY / PASTE)

## PURPOSE

Provide exact, copyable guidance to configure environment variables for the Expo mobile app (mitra_mobile) so local development and device/emulator runs work reliably and securely. This document intentionally focuses on **mobile native platforms (iOS/Android) only**.

> **🌐 For Web platform setup:** See [WEB_ENV_CONFIG.md](./WEB_ENV_CONFIG.md) for web-specific Firebase and environment configuration.

## TARGET LOCATION

- **File**: `mitra_mobile/.env`
- **Placement**: create the file inside the mitra_mobile folder. This file must be git-ignored (do not commit real credentials).
- **Project docs require** a `mitra_mobile/.env` for mobile setup. (See SETUP_AUTH.md.)

## REQUIRED KEYS (MINIMUM)

The mobile app requires these keys at minimum (replace values with your own):

- `EXPO_PUBLIC_API_URL` ← **required** (the mobile lib reads this at module initialization)
- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`
- `EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID`
- `GOOGLE_WEB_CLIENT_ID`

## NOTES ON EXPO_PUBLIC_API_URL

- `mitra_mobile/lib/api.ts` reads `process.env.EXPO_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL` during module import and will throw if neither is present. Ensure `EXPO_PUBLIC_API_URL` exists before starting Metro.
- Mobile generally needs an **absolute, reachable URL** (e.g., `https://...` or `http://192.168.x.y:3000`) so the app on a device/emulator can reach the backend.

## LOCAL BACKEND HOST GUIDANCE

- **iOS simulator / web**: `http://localhost:PORT` is usually reachable.
- **Android emulator (AVD)**: use emulator loopback (commonly `http://10.0.2.2:PORT`).
- **Physical device / Expo Go**: use your machine's LAN IP (e.g., `http://192.168.1.100:PORT`) so the phone can reach your backend.
- Use an **absolute URL** for `EXPO_PUBLIC_API_URL` when testing on devices/emulators.

## RESTART REQUIREMENT

- After creating or changing `mitra_mobile/.env`, fully restart Metro/Expo (`npx expo start -c`) so the bundler picks up the env values. The API base is validated at bundle/module import time.

## OPTIONAL: app.config.js INJECTION (RELIABLE LOCAL BINDING)

- If you prefer deterministic binding of local .env values into Expo config, add an `app.config.js` in mitra_mobile that loads `.env` and injects values into `expo.extra`. This makes values available via `Constants.expoConfig.extra`. `app.json` currently has `extra`, so this is a natural extension.
- Use this approach if you want the same root `.env` to be consumed by Expo at build time.

## SECURITY & BEST PRACTICES

- Keep `mitra_mobile/.env` git-ignored. Commit only `mitra_mobile/.env.example` with placeholders.
- Do **not** put server-only secrets (Redis, DB credentials, server GEO keys) in any `EXPO_PUBLIC_` or client-exposed file. Server secrets belong in the deployment host settings (Railway/EAS/Vercel) and must never be prefixed with `EXPO_PUBLIC_`.
- If a key must remain secret, call that service from your server, not from the client mobile app.

## SAMPLE .env CONTENT (TEMPLATE — DO NOT COMMIT REAL VALUES)

```env
# Google OAuth Configuration
# Get this from Google Cloud Console > APIs & Services > Credentials
# Create an OAuth 2.0 Client ID of type "Web application"
GOOGLE_WEB_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com

# API Configuration
# Your backend API base URL
# EXPO_PUBLIC_ prefix is required for Expo mobile app
EXPO_PUBLIC_API_URL=https://your-api-domain.com/api

# Firebase Configuration
# Get these from Firebase Console > Project Settings > General > Your apps > Web app
# EXPO_PUBLIC_ prefix is required for Expo mobile app
EXPO_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

## CHECKLIST (IMMEDIATE ACTIONS)

1. ✅ Create `mitra_mobile/.env` and add the **required** keys above.
2. ✅ Add `mitra_mobile/.env` to `.gitignore`. Keep `.env.example` in repo as template.
3. ⚠️ For local backend runs, set `EXPO_PUBLIC_API_URL` to an address reachable from your emulator/device.
4. ⚠️ Restart Metro/Expo with cleared cache (`npx expo start -c`).
5. ⚠️ Confirm the app no longer throws the API URL error at startup.

## REFERENCES (project files)

- `mitra_mobile/lib/api.ts` — requires EXPO_PUBLIC_API_URL or NEXT_PUBLIC_API_URL at module import and throws if missing.
- `mitra_mobile/.env.example` — canonical template of mobile env keys.
- `mitra_mobile/SETUP_AUTH.md` — instructs creating mitra_mobile/.env and lists mobile setup steps.
- `mitra_mobile/app.json` — contains `expo.extra` metadata (useful for app.config.js injection).

## TROUBLESHOOTING

### Error: "API URL is not defined"

**Symptom**: App crashes on startup with error message about missing API URL.

**Solution**:
1. Verify `EXPO_PUBLIC_API_URL` is set in `mitra_mobile/.env`
2. Restart Metro bundler with clear cache: `npx expo start -c`
3. Check that the URL is absolute (starts with `http://` or `https://`)

### Android Emulator Cannot Reach Backend

**Symptom**: Network requests timeout or fail on Android emulator.

**Solution**:
- Change `EXPO_PUBLIC_API_URL` from `http://localhost:3000` to `http://10.0.2.2:3000`
- Android emulator uses `10.0.2.2` as the special alias to the host machine's localhost

### Physical Device Cannot Reach Backend

**Symptom**: Network requests fail on physical device but work on simulator.

**Solution**:
1. Find your computer's local IP address:
   - macOS/Linux: `ifconfig | grep "inet "` or `ip addr show`
   - Windows: `ipconfig`
2. Update `EXPO_PUBLIC_API_URL` to use your LAN IP: `http://192.168.1.100:3000`
3. Ensure your backend is listening on `0.0.0.0` not just `localhost`
4. Both devices must be on the same network

### Environment Variables Not Updating

**Symptom**: Changed .env values but app still uses old values.

**Solution**:
1. Stop Metro bundler completely (Ctrl+C)
2. Clear Metro cache: `npx expo start -c`
3. If still not working, clear node_modules and reinstall:
   ```bash
   rm -rf node_modules .expo
   npm install
   npx expo start -c
   ```

## EXPO_PUBLIC_ vs NEXT_PUBLIC_ PREFIXES

**Why both exist in the codebase:**
- `EXPO_PUBLIC_` — Required for Expo mobile apps (React Native)
- `NEXT_PUBLIC_` — Required for Next.js web apps

**For this mobile app:**
- Always use `EXPO_PUBLIC_` prefix for mobile environment variables
- The code checks both prefixes for compatibility: `process.env.EXPO_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL`
- You may include both in .env for projects that share code between web and mobile

**Best practice:**
- In mobile-only projects: use `EXPO_PUBLIC_` exclusively
- In monorepos with web + mobile: include both prefixes with same values
