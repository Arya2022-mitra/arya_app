#!/usr/bin/env node
/**
 * Validation script to check Firebase configuration
 * Run: node scripts/validate-firebase-config.js
 */

const fs = require('fs');
const path = require('path');

// Load .env file manually (simple parser)
function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const env = {};
  
  content.split('\n').forEach(line => {
    line = line.trim();
    
    // Skip comments and empty lines
    if (!line || line.startsWith('#')) {
      return;
    }
    
    // Parse KEY="VALUE" or KEY=VALUE
    const match = line.match(/^([A-Z_]+)=["']?(.*)["']?$/);
    if (match) {
      env[match[1]] = match[2];
    }
  });
  
  return env;
}

// Main validation
const envPath = path.join(__dirname, '..', '.env');
console.log('🔍 Validating Firebase configuration...\n');
console.log('Loading .env from:', envPath);

const env = loadEnv(envPath);

if (Object.keys(env).length === 0) {
  console.error('❌ ERROR: No .env file found or it is empty!');
  console.error('   Please copy .env.example to .env and configure your Firebase values.');
  process.exit(1);
}

// Required Firebase configuration fields
const requiredFields = [
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'EXPO_PUBLIC_FIREBASE_APP_ID',
];

// Optional but recommended
const optionalFields = [
  'EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID',
  'GOOGLE_WEB_CLIENT_ID',
  'EXPO_PUBLIC_API_URL',
];

// Placeholder values that should be replaced
const placeholderPatterns = [
  /^YOUR_/i,
  /^your-/i,
  /\byour\b/i,
  /placeholder/i,
  /example/i,
  /^$/, // empty string
];

function isPlaceholder(value) {
  if (!value) return true;
  return placeholderPatterns.some(pattern => pattern.test(value));
}

let hasErrors = false;
let hasWarnings = false;

console.log('\n📋 Checking required fields:\n');

requiredFields.forEach(field => {
  const value = env[field];
  
  if (!value) {
    console.error(`❌ ${field}: MISSING`);
    hasErrors = true;
  } else if (isPlaceholder(value)) {
    console.error(`❌ ${field}: Contains placeholder value "${value}"`);
    console.error(`   Please replace with actual Firebase configuration value.`);
    hasErrors = true;
  } else {
    console.log(`✅ ${field}: Configured`);
  }
});

console.log('\n📋 Checking optional fields:\n');

optionalFields.forEach(field => {
  const value = env[field];
  
  if (!value) {
    console.warn(`⚠️  ${field}: Not configured (optional)`);
    hasWarnings = true;
  } else if (isPlaceholder(value)) {
    console.warn(`⚠️  ${field}: Contains placeholder value "${value}"`);
    hasWarnings = true;
  } else {
    console.log(`✅ ${field}: Configured`);
  }
});

// Validate specific field formats
console.log('\n📋 Validating field formats:\n');

if (env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN && 
    !env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN.endsWith('.firebaseapp.com')) {
  console.warn('⚠️  FIREBASE_AUTH_DOMAIN should end with .firebaseapp.com');
  hasWarnings = true;
}

if (env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET && 
    (!env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET.includes('.') || 
     (!env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET.includes('appspot.com') && 
      !env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET.includes('firebasestorage.app')))) {
  console.warn('⚠️  FIREBASE_STORAGE_BUCKET should end with .appspot.com or .firebasestorage.app');
  hasWarnings = true;
}

if (env.EXPO_PUBLIC_API_URL && !env.EXPO_PUBLIC_API_URL.match(/^https?:\/\//)) {
  console.warn('⚠️  EXPO_PUBLIC_API_URL should start with http:// or https://');
  hasWarnings = true;
}

// Summary
console.log('\n' + '='.repeat(60));
if (hasErrors) {
  console.error('\n❌ Validation FAILED: Please fix the errors above.\n');
  console.error('To fix:');
  console.error('1. Open mitra_mobile/.env');
  console.error('2. Replace ALL placeholder values with actual Firebase config');
  console.error('3. Get values from Firebase Console or google-services.json');
  console.error('4. See FIREBASE_TROUBLESHOOTING.md for detailed instructions');
  console.error('5. Run this script again to verify\n');
  process.exit(1);
} else if (hasWarnings) {
  console.log('\n⚠️  Validation passed with warnings.');
  console.log('   Please review the warnings above.\n');
  process.exit(0);
} else {
  console.log('\n✅ Validation PASSED: All required Firebase configuration is set!\n');
  console.log('Next steps:');
  console.log('1. Restart Metro bundler: npx expo start -c');
  console.log('2. Verify Firebase initializes: Look for success message in console');
  console.log('3. Test authentication: Try Google Sign-In or Email/Password\n');
  process.exit(0);
}
