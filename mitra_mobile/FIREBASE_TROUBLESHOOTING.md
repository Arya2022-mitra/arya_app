# Firebase Authentication Troubleshooting Guide

## Common Error: "No Firebase App '[DEFAULT]' has been created"

### Root Cause
This error occurs when Firebase environment variables are not properly configured in your `.env` file. The app tries to initialize Firebase but cannot find the required configuration values.

### Error Symptoms
You may see errors like:
- `[firebaseConfig] Missing Firebase values for: apiKey, authDomain, projectId...`
- `Error: No Firebase App '[DEFAULT]' has been created - call firebase.initializeApp()`
- `com.facebook.react.common.JavascriptException: Error: No Firebase App '[DEFAULT]' has been created`

### Solution Steps

#### 1. Verify `.env` File Exists
Ensure you have a `.env` file in the `mitra_mobile/` directory (not in the root of the repository).

```bash
cd mitra_mobile
ls -la .env
```

If it doesn't exist, copy from the example:
```bash
cp .env.example .env
```

#### 2. Update Firebase Configuration Values
Open `mitra_mobile/.env` and replace ALL placeholder values with your actual Firebase configuration:

```env
# Firebase Configuration - FROM FIREBASE CONSOLE
EXPO_PUBLIC_FIREBASE_API_KEY="your-actual-api-key"
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
EXPO_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
EXPO_PUBLIC_FIREBASE_APP_ID="your-app-id"
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=""

# Google OAuth Configuration
GOOGLE_WEB_CLIENT_ID="your-web-client-id.apps.googleusercontent.com"

# API Configuration
EXPO_PUBLIC_API_URL="https://your-api-domain.com/api"
```

⚠️ **IMPORTANT**: Do NOT use quotes around values like "YOUR_API_KEY" - these are placeholders that must be replaced with actual values!

#### 3. Getting Firebase Configuration Values

**Option A: From Firebase Console**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (e.g., `mitraveda-c1c03`)
3. Click the gear icon ⚙️ > **Project Settings**
4. Scroll to "Your apps" section
5. Select or add a **Web app**
6. Copy the configuration values

**Option B: From `google-services.json` (Android)**
If you already have `android/app/google-services.json`, you can extract:
- `project_id` → EXPO_PUBLIC_FIREBASE_PROJECT_ID
- `project_number` → EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
- `storage_bucket` → EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
- `current_key` → EXPO_PUBLIC_FIREBASE_API_KEY
- `mobilesdk_app_id` → EXPO_PUBLIC_FIREBASE_APP_ID
- Auth domain is typically: `{project_id}.firebaseapp.com`

#### 4. Clear Cache and Restart
After updating `.env`, you MUST restart Metro bundler with cleared cache:

```bash
# Stop the current Metro bundler (Ctrl+C)
npx expo start -c
```

The `-c` flag clears the cache and ensures new environment variables are loaded.

#### 5. Verify Configuration Loaded
When the app starts, you should see in the console:
```
[Firebase] Successfully initialized with project: your-project-id
```

If you see errors about missing values, double-check your `.env` file.

## Expo EAS Build Configuration

If you're building with EAS (Expo Application Services), you also need to configure secrets in Expo:

```bash
# Set individual secrets
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_API_KEY --value "your-value"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN --value "your-value"
# ... repeat for all EXPO_PUBLIC_FIREBASE_* variables
```

Or configure them in `eas.json`:
```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_FIREBASE_API_KEY": "your-value",
        "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN": "your-value",
        // ... etc
      }
    }
  }
}
```

## Security Best Practices

1. **Never commit `.env` to git**
   - Ensure `.env` is in `.gitignore`
   - Only commit `.env.example` with placeholder values

2. **Restrict Firebase API Key**
   - In Firebase Console, restrict your API key to specific apps
   - Set up App Check for additional security

3. **Use different projects for dev/prod**
   - Development: Use a separate Firebase project
   - Production: Use production Firebase project with proper security rules

## Still Having Issues?

### Check Environment Variable Loading
Add this debug code to `firebaseConfig.shared.ts` temporarily:

```typescript
console.log('DEBUG - Environment variables:');
console.log('API_KEY:', process.env.EXPO_PUBLIC_FIREBASE_API_KEY);
console.log('PROJECT_ID:', process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID);
```

### Verify Metro Bundler Cache Cleared
Sometimes cache persists. Try:

```bash
# Complete clean
rm -rf node_modules .expo
npm install
npx expo start -c
```

### Platform-Specific Issues

**Android:**
- Ensure `android/app/google-services.json` exists and is up-to-date
- Verify package name matches in Firebase Console and `app.json`
- Check SHA-1 fingerprint is registered in Firebase

**iOS:**
- Ensure `ios/GoogleService-Info.plist` exists (if using Xcode)
- Verify bundle ID matches in Firebase Console and `app.json`
- Run `cd ios && pod install` if using native modules

**Web:**
- Web Firebase uses different SDK (`firebase/app` instead of `@react-native-firebase`)
- Ensure CORS settings in Firebase if making direct requests

## Reference Files
- `.env.example` - Template with all required variables
- `ENV_CONFIG.md` - Complete environment configuration guide
- `SETUP_AUTH.md` - Authentication setup instructions
- `firebaseConfig.shared.ts` - Shared Firebase configuration logic
- `firebaseConfig.native.ts` - React Native Firebase setup
- `firebaseConfig.web.ts` - Web Firebase setup

## Summary Checklist

- [ ] Created `mitra_mobile/.env` from `.env.example`
- [ ] Replaced ALL placeholder values with actual Firebase config
- [ ] Added `EXPO_PUBLIC_API_URL` for backend API
- [ ] Restarted Metro bundler with cache clear: `npx expo start -c`
- [ ] Verified no console errors about missing Firebase values
- [ ] Confirmed successful Firebase initialization message
- [ ] Verified `.env` is in `.gitignore`
