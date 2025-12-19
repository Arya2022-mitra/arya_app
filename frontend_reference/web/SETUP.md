# Environment Setup for Frontend Reference Web

This document explains how to set up the required environment variables for the Frontend Reference web application.

## Prerequisites

- Firebase project set up at [Firebase Console](https://console.firebase.google.com/)
- Firebase Authentication enabled

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
   NEXT_PUBLIC_FIREBASE_API_KEY=your-actual-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
   ```

   **Note**: The `NEXT_PUBLIC_` prefix is required for Next.js to expose these variables to the browser.

### 2. Additional Configuration (Optional)

If you're using other services (Redis, GEO API, etc.), add their configuration to `.env`:

```env
# Redis Configuration (if applicable)
REDIS_URL=your-redis-url
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=your-password

# GEO API Configuration (if applicable)
GEO_API_URL=your-geo-api-url
GEO_API_KEY=your-geo-api-key
```

### 3. Verify Setup

After configuration, start the development server:
```bash
npm run dev
# or
yarn dev
```

If you see errors about missing Firebase environment variables in the console:
- Check that your `.env` file exists in `frontend_reference/web/`
- Verify all `NEXT_PUBLIC_FIREBASE_*` variables are set
- Restart the development server

## Security Notes

- Never commit `.env` or `.env.local` files to version control
- These files are automatically ignored by `.gitignore`
- Use `.env.example` as a template for other developers
- Environment variables prefixed with `NEXT_PUBLIC_` are embedded in the client-side bundle
- Rotate your API keys if they are ever exposed publicly

## Development vs Production

- For development: Use `.env.local` (takes precedence over `.env`)
- For production: Set environment variables in your hosting platform (Vercel, etc.)
- Never use development credentials in production
