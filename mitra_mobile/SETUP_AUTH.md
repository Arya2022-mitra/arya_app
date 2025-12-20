# Mobile Authentication Setup Guide

This document describes how to set up authentication for the MitraVeda mobile app using Firebase Auth and Google Sign-In.

## Overview

The mobile app uses:
- **Firebase Authentication** for identity management
- **@react-native-google-signin/google-signin** for Google OAuth
- **expo-secure-store** for secure token persistence
- **MobileAuthService** for unified auth operations

## Prerequisites

1. Node.js >= 20.18.1
2. Expo CLI
3. Firebase project
4. Google Cloud Console project with OAuth 2.0 credentials

## Environment Variables

Create a `.env` file in the `mitra_mobile` directory with the following variables:

```env
# Google OAuth Configuration
GOOGLE_WEB_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com

# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id

# API Configuration
EXPO_PUBLIC_API_URL=https://your-api-domain.com/api
```

**Important:** Never commit the `.env` file to version control. Use `.env.example` as a template.

## Firebase Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select existing project
3. Follow the setup wizard

### 2. Enable Authentication Providers

1. In Firebase Console, navigate to **Authentication** > **Sign-in method**
2. Enable the following providers:
   - **Email/Password**
   - **Google**

### 3. Get Firebase Configuration

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Under "Your apps", select or add a **Web app**
3. Copy the configuration values to your `.env` file

### 4. Register Android/iOS Apps

For native platforms, you'll need to register platform-specific apps:

**Android:**
1. In Firebase Console, add an Android app
2. Enter your package name (from `app.json`)
3. Download `google-services.json` and place it in `android/app/`
4. Follow Firebase instructions for Gradle setup

**iOS:**
1. In Firebase Console, add an iOS app
2. Enter your bundle ID (from `app.json`)
3. Download `GoogleService-Info.plist` and add it to your Xcode project
4. Follow Firebase instructions for CocoaPods setup

## Google Sign-In Setup

### 1. Google Cloud Console Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Enable **Google+ API** and **Google Sign-In API**

### 2. Create OAuth 2.0 Credentials

You need to create credentials for each platform:

#### Web Client ID (Required)

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client ID**
3. Select **Web application**
4. Add authorized redirect URIs (if needed for web)
5. Copy the **Client ID** - this is your `GOOGLE_WEB_CLIENT_ID`

#### Android OAuth Client ID

1. Create another OAuth 2.0 Client ID
2. Select **Android**
3. Enter your package name
4. Get SHA-1 certificate fingerprint:
   ```bash
   cd android
   ./gradlew signingReport
   ```
5. Enter the SHA-1 fingerprint
6. Create the credential

#### iOS OAuth Client ID

1. Create another OAuth 2.0 Client ID
2. Select **iOS**
3. Enter your bundle ID (from `app.json`)
4. Create the credential

### 3. Configure Firebase with Google

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Click on **Google** provider
3. Enable it
4. Ensure the **Web SDK configuration** shows the correct OAuth client ID
5. Save

### 4. Update `app.json` (for Expo)

Add the following to your `app.json`:

```json
{
  "expo": {
    "ios": {
      "googleServicesFile": "./GoogleService-Info.plist"
    },
    "android": {
      "googleServicesFile": "./google-services.json"
    }
  }
}
```

## Installation

1. Install dependencies:
   ```bash
   cd mitra_mobile
   npm install
   ```

2. For development builds (required for native modules):
   ```bash
   npx expo prebuild
   ```

3. Build and run:
   ```bash
   # Android
   npm run android

   # iOS
   npm run ios

   # Web (limited auth functionality)
   npm run web
   ```

## Architecture Overview

### MobileAuthService

The `MobileAuthService` class (`mitra_mobile/shared/auth/MobileAuthService.ts`) provides:

- `init()`: Initialize Google Sign-In configuration
- `signInWithGoogle()`: Perform Google OAuth flow
- `signInWithEmail(email, password)`: Email/password authentication
- `signOut()`: Sign out from all providers
- `getToken()`: Get current ID token
- `getRefreshToken()`: Get refresh token
- `forceRefresh()`: Force token refresh via Firebase
- `onTokenChange(callback)`: Subscribe to token changes

### SessionProvider

The `SessionProvider` (`mitra_mobile/shared/context/SessionContext.tsx`):

- Initializes `MobileAuthService` on mount
- Subscribes to token changes
- Schedules periodic token refresh (every 55 minutes)
- Manages user profile and session state
- Calls `/api/me` after login to bootstrap user data

### Token Refresh Flow

1. **Client-side refresh** (primary): `MobileAuthService.forceRefresh()` calls Firebase `getIdToken(true)`
2. **Backend refresh** (fallback): If client refresh fails, calls `POST /auth/refresh` with refresh token
3. **Automatic retry**: On 401, `fetchApi` automatically attempts refresh and retries the request

## Security Notes

1. **Never commit secrets**: Keep `.env` out of version control
2. **Secure storage**: Tokens are stored in `expo-secure-store` (encrypted on device)
3. **Token rotation**: Tokens are automatically refreshed before expiry
4. **Sign-out**: Properly signs out from Firebase and Google, clearing all stored tokens

## Troubleshooting

### Google Sign-In Errors

**"SIGN_IN_CANCELLED"**: User cancelled the sign-in flow
**"PLAY_SERVICES_NOT_AVAILABLE"**: Update Google Play Services on Android device
**"DEVELOPER_ERROR"**: Check that SHA-1 fingerprint matches in Google Console

### Firebase Errors

**"auth/invalid-api-key"**: Check `EXPO_PUBLIC_FIREBASE_API_KEY` in `.env`
**"auth/network-request-failed"**: Check internet connection and API domain

### Token Refresh Errors

If tokens are not refreshing:
1. Check Firebase user is logged in: `firebase.auth().currentUser`
2. Verify refresh token exists in secure store
3. Check backend `/auth/refresh` endpoint is working (if using backend refresh)

## Testing

### Manual Testing Checklist

1. **Google Sign-In**:
   - Tap "Continue with Google"
   - Complete OAuth flow
   - Verify tokens stored and profile loaded

2. **Email Sign-In**:
   - Enter email and password
   - Tap "Sign In"
   - Verify authentication successful

3. **Token Refresh**:
   - Wait for scheduled refresh (55 minutes) or trigger manually
   - Verify new token obtained and stored

4. **Session Restore**:
   - Close and reopen app
   - Verify user remains logged in
   - Verify profile loaded

5. **Logout**:
   - Tap logout button
   - Verify tokens cleared
   - Verify Firebase and Google sign-out

6. **401 Retry**:
   - Simulate expired token
   - Make API request
   - Verify automatic refresh and retry

## Backend API Contract

The mobile app expects the following backend endpoints:

### GET /api/me

Returns current user information:

```json
{
  "activeProfileId": "profile-123",
  "profile": {
    "id": "profile-123",
    "first_name": "John",
    ...
  }
}
```

### POST /auth/refresh

Refreshes the access token using a refresh token:

**Request:**
```json
{
  "refreshToken": "firebase-refresh-token"
}
```

**Response:**
```json
{
  "token": "new-firebase-id-token",
  "refreshToken": "new-refresh-token"
}
```

## Support

For issues or questions:
1. Check Firebase Console logs
2. Check Expo logs: `npx expo start`
3. Enable verbose logging in `MobileAuthService`

## License

[Your License Here]
