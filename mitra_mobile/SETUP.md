# Environment Setup for Mitra Mobile

This document explains how to set up the required environment variables for the Mitra Mobile app.

## Prerequisites

- Firebase project set up at [Firebase Console](https://console.firebase.google.com/)
- Google Sign-In configured in Firebase Authentication

## Setup Instructions

### 1. Firebase Configuration

1. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Get your Firebase configuration:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Go to Project Settings > General
   - Scroll down to "Your apps" section
   - Copy the Firebase SDK configuration values

3. Update the `.env` file with your Firebase credentials:
   ```env
   FIREBASE_API_KEY=your-actual-api-key
   FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   FIREBASE_APP_ID=your-app-id
   FIREBASE_MEASUREMENT_ID=your-measurement-id
   ```

4. Get your Google Web Client ID:
   - In Firebase Console, go to Authentication > Sign-in method
   - Enable Google sign-in
   - Copy the Web client ID
   - Add it to `.env`:
   ```env
   GOOGLE_WEB_CLIENT_ID=your-google-web-client-id
   ```

### 2. Android Configuration (google-services.json)

1. In Firebase Console, go to Project Settings
2. Under "Your apps", select your Android app (or create one)
3. Download the `google-services.json` file
4. Place it in `android/app/` directory

**Important**: Never commit `google-services.json` to version control as it contains sensitive credentials.

### 3. Verify Setup

After configuration, restart your development server:
```bash
npm start
```

If you see errors about missing environment variables, check that:
- Your `.env` file exists in the root of `mitra_mobile/`
- All required variables are set
- You've restarted the Metro bundler

## Security Notes

- Never commit `.env` or `google-services.json` files to version control
- These files are automatically ignored by `.gitignore`
- Use `.env.example` and `google-services.json.example` as templates for other developers
- Rotate your API keys if they are ever exposed publicly
