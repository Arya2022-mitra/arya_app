#!/usr/bin/env node
/**
 * Setup script to help configure Firebase environment variables
 * This script extracts Firebase configuration from google-services.json
 * and creates a properly configured .env file
 * 
 * Run: node scripts/setup-firebase-env.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('🔧 Firebase Environment Setup\n');
  console.log('This script will help you create a .env file with Firebase configuration.\n');

  const envPath = path.join(__dirname, '..', '.env');
  const envExamplePath = path.join(__dirname, '..', '.env.example');
  const googleServicesPath = path.join(__dirname, '..', 'android', 'app', 'google-services.json');

  // Check if .env already exists
  if (fs.existsSync(envPath)) {
    const overwrite = await question('.env file already exists. Overwrite? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Setup cancelled.');
      rl.close();
      return;
    }
  }

  console.log('\n📋 Choose configuration source:\n');
  console.log('1. Extract from android/app/google-services.json (recommended)');
  console.log('2. Copy from .env.example and edit manually');
  console.log('3. Enter values interactively\n');

  const choice = await question('Enter your choice (1-3): ');

  let envContent = '';

  if (choice === '1') {
    // Extract from google-services.json
    if (!fs.existsSync(googleServicesPath)) {
      console.error('❌ Error: google-services.json not found at:', googleServicesPath);
      console.error('   Please ensure you have downloaded it from Firebase Console.');
      rl.close();
      process.exit(1);
    }

    try {
      const googleServices = JSON.parse(fs.readFileSync(googleServicesPath, 'utf-8'));
      const projectInfo = googleServices.project_info;
      
      // Find the client that matches our package name
      const client = googleServices.client.find(c => 
        c.client_info.android_client_info.package_name === 'com.mitraveda.mitra_mobile'
      ) || googleServices.client[0];

      const apiKey = client.api_key[0].current_key;
      const appId = client.client_info.mobilesdk_app_id;
      const messagingSenderId = projectInfo.project_number;
      const projectId = projectInfo.project_id;
      const storageBucket = projectInfo.storage_bucket;
      const authDomain = `${projectId}.firebaseapp.com`;

      // Extract web client ID from services
      let webClientId = '';
      try {
        const otherClients = client.services?.appinvite_service?.other_platform_oauth_client;
        if (otherClients && otherClients.length > 0) {
          webClientId = otherClients[0].client_id;
        }
      } catch (e) {
        // Web client ID is optional
      }

      console.log('\n✅ Successfully extracted Firebase configuration from google-services.json\n');

      // Get API URL
      const apiUrl = await question('Enter your API URL (e.g., https://api.mitraveda.com/api): ');

      envContent = `# Google OAuth Configuration
GOOGLE_WEB_CLIENT_ID="${webClientId}"

# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY="${apiKey}"
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN="${authDomain}"
EXPO_PUBLIC_FIREBASE_PROJECT_ID="${projectId}"
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET="${storageBucket}"
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="${messagingSenderId}"
EXPO_PUBLIC_FIREBASE_APP_ID="${appId}"
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=""

# API Configuration
EXPO_PUBLIC_API_URL="${apiUrl}"
`;

    } catch (error) {
      console.error('❌ Error parsing google-services.json:', error.message);
      rl.close();
      process.exit(1);
    }

  } else if (choice === '2') {
    // Copy from .env.example
    if (!fs.existsSync(envExamplePath)) {
      console.error('❌ Error: .env.example not found');
      rl.close();
      process.exit(1);
    }

    envContent = fs.readFileSync(envExamplePath, 'utf-8');
    console.log('\n✅ Copied .env.example to .env');
    console.log('⚠️  Please edit .env and replace all placeholder values!');

  } else if (choice === '3') {
    // Interactive input
    console.log('\nEnter Firebase configuration values:');
    console.log('(Get these from Firebase Console > Project Settings > Your apps > Web app)\n');

    const apiKey = await question('Firebase API Key: ');
    const authDomain = await question('Firebase Auth Domain (e.g., your-project.firebaseapp.com): ');
    const projectId = await question('Firebase Project ID: ');
    const storageBucket = await question('Firebase Storage Bucket (e.g., your-project.appspot.com): ');
    const messagingSenderId = await question('Firebase Messaging Sender ID: ');
    const appId = await question('Firebase App ID: ');
    const measurementId = await question('Firebase Measurement ID (optional): ');
    const webClientId = await question('Google Web Client ID: ');
    const apiUrl = await question('API URL: ');

    envContent = `# Google OAuth Configuration
GOOGLE_WEB_CLIENT_ID="${webClientId}"

# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY="${apiKey}"
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN="${authDomain}"
EXPO_PUBLIC_FIREBASE_PROJECT_ID="${projectId}"
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET="${storageBucket}"
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="${messagingSenderId}"
EXPO_PUBLIC_FIREBASE_APP_ID="${appId}"
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID="${measurementId}"

# API Configuration
EXPO_PUBLIC_API_URL="${apiUrl}"
`;

  } else {
    console.error('Invalid choice');
    rl.close();
    process.exit(1);
  }

  // Write .env file
  fs.writeFileSync(envPath, envContent, 'utf-8');
  console.log('\n✅ .env file created successfully!\n');

  rl.close();

  // Run validation
  console.log('🔍 Validating configuration...\n');
  const validateScript = path.join(__dirname, 'validate-firebase-config.js');
  const { execSync } = require('child_process');
  
  try {
    execSync(`node "${validateScript}"`, { stdio: 'inherit' });
  } catch (error) {
    console.error('\n⚠️  Validation found issues. Please review and fix them.');
  }
}

main().catch(error => {
  console.error('Error:', error);
  rl.close();
  process.exit(1);
});
