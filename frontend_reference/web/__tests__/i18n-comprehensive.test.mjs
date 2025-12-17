#!/usr/bin/env node
/**
 * Comprehensive i18n Implementation Test Suite
 * 
 * Tests the internationalization and localization implementation against
 * the requirements specified in the problem statement.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test results
const results = {
  passed: 0,
  failed: 0,
  errors: []
};

function test(name, fn) {
  try {
    fn();
    results.passed++;
    console.log(`✅ ${name}`);
  } catch (error) {
    results.failed++;
    results.errors.push({ test: name, error: error.message });
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

// Test Suite
console.log('\n=== Comprehensive i18n Implementation Tests ===\n');

// Test 1: Translation Files Exist
test('All supported locale translation files exist', () => {
  const locales = ['en', 'hi', 'ta', 'te', 'bn', 'mr', 'gu', 'kn'];
  const localesDir = path.join(__dirname, '../public/locales');
  
  locales.forEach(locale => {
    const filePath = path.join(localesDir, locale, 'translation.json');
    assert(fs.existsSync(filePath), `Translation file missing for locale: ${locale}`);
  });
});

// Test 2: Translation Keys Consistency
test('All locales have the same translation keys', () => {
  const locales = ['en', 'hi', 'ta', 'te', 'bn', 'mr', 'gu', 'kn'];
  const localesDir = path.join(__dirname, '../public/locales');
  
  const enKeys = JSON.parse(
    fs.readFileSync(path.join(localesDir, 'en', 'translation.json'), 'utf8')
  );
  const enKeySet = new Set(Object.keys(enKeys));
  
  locales.slice(1).forEach(locale => {
    const localeKeys = JSON.parse(
      fs.readFileSync(path.join(localesDir, locale, 'translation.json'), 'utf8')
    );
    const localeKeySet = new Set(Object.keys(localeKeys));
    
    // Check for missing keys
    const missing = [...enKeySet].filter(k => !localeKeySet.has(k));
    assert(
      missing.length === 0,
      `Locale ${locale} is missing keys: ${missing.join(', ')}`
    );
    
    // Check for extra keys
    const extra = [...localeKeySet].filter(k => !enKeySet.has(k));
    assert(
      extra.length === 0,
      `Locale ${locale} has extra keys: ${extra.join(', ')}`
    );
  });
});

// Test 3: No Empty Translation Values
test('No locale has empty translation values', () => {
  const locales = ['en', 'hi', 'ta', 'te', 'bn', 'mr', 'gu', 'kn'];
  const localesDir = path.join(__dirname, '../public/locales');
  
  locales.forEach(locale => {
    const translations = JSON.parse(
      fs.readFileSync(path.join(localesDir, locale, 'translation.json'), 'utf8')
    );
    
    const emptyKeys = Object.entries(translations)
      .filter(([_, value]) => !value || value.trim() === '')
      .map(([key, _]) => key);
    
    assert(
      emptyKeys.length === 0,
      `Locale ${locale} has empty values for keys: ${emptyKeys.join(', ')}`
    );
  });
});

// Test 4: i18n Configuration Exists
test('i18n configuration file exists and is valid', () => {
  const i18nPath = path.join(__dirname, '../lib/i18n.ts');
  assert(fs.existsSync(i18nPath), 'i18n.ts configuration file not found');
  
  const content = fs.readFileSync(i18nPath, 'utf8');
  assert(content.includes('HttpBackend'), 'HttpBackend not configured');
  assert(content.includes('LanguageDetector'), 'LanguageDetector not configured');
  assert(content.includes('bindI18n'), 'bindI18n not configured for reactivity');
  assert(content.includes('/locales/{{lng}}/{{ns}}.json'), 'Dynamic loading path not configured');
});

// Test 5: LanguageSync Component Exists
test('LanguageSync component exists', () => {
  const langSyncPath = path.join(__dirname, '../components/LanguageSync.tsx');
  assert(fs.existsSync(langSyncPath), 'LanguageSync component not found');
  
  const content = fs.readFileSync(langSyncPath, 'utf8');
  assert(content.includes('useTranslation'), 'LanguageSync does not use useTranslation');
  assert(content.includes('localStorage.getItem'), 'LanguageSync does not read from localStorage');
  assert(content.includes('changeLanguage'), 'LanguageSync does not change language');
});

// Test 6: LanguageSync Integrated in _app.tsx
test('LanguageSync is integrated in _app.tsx', () => {
  const appPath = path.join(__dirname, '../pages/_app.tsx');
  assert(fs.existsSync(appPath), '_app.tsx not found');
  
  const content = fs.readFileSync(appPath, 'utf8');
  assert(content.includes('LanguageSync'), 'LanguageSync not imported or used in _app.tsx');
  assert(content.includes('<LanguageSync'), 'LanguageSync component not rendered');
});

// Test 7: Pages Use Translation Hook
test('Critical pages use translation hooks', () => {
  const criticalPages = [
    'index.tsx',
    'auth.tsx',
    'monthly-prediction.tsx',
    'settings.tsx'
  ];
  
  const pagesDir = path.join(__dirname, '../pages');
  
  criticalPages.forEach(page => {
    const pagePath = path.join(pagesDir, page);
    if (!fs.existsSync(pagePath)) return; // Skip if page doesn't exist
    
    const content = fs.readFileSync(pagePath, 'utf8');
    assert(
      content.includes('useTranslation') || content.includes('{ t }'),
      `Page ${page} does not use translation hook`
    );
  });
});

// Test 8: Monthly Prediction Passes Locale Parameter
test('Monthly prediction page passes locale parameter to API', () => {
  const monthlyPath = path.join(__dirname, '../pages/monthly-prediction.tsx');
  if (!fs.existsSync(monthlyPath)) {
    console.log('   ⚠️  Skipping - page not found');
    return;
  }
  
  const content = fs.readFileSync(monthlyPath, 'utf8');
  assert(
    content.includes('locale:') && content.includes('i18n.language'),
    'Monthly prediction does not pass locale parameter'
  );
});

// Test 9: Translation Keys Cover Common UI Elements
test('Translation keys cover common UI elements', () => {
  const localesDir = path.join(__dirname, '../public/locales');
  const enTranslations = JSON.parse(
    fs.readFileSync(path.join(localesDir, 'en', 'translation.json'), 'utf8')
  );
  
  const requiredKeys = [
    'common.loading',
    'common.send',
    'common.cancel',
    'common.confirm',
    'settings.language',
    'header.signOut',
    'auth.email',
    'auth.password'
  ];
  
  requiredKeys.forEach(key => {
    assert(
      enTranslations[key],
      `Required translation key missing: ${key}`
    );
  });
});

// Test 10: Backend Translation Service Exists
test('Backend translation service exists', () => {
  const translationServicePath = path.join(__dirname, '../../backend/translation_service.py');
  assert(fs.existsSync(translationServicePath), 'Backend translation_service.py not found');
  
  const content = fs.readFileSync(translationServicePath, 'utf8');
  assert(content.includes('TranslationService'), 'TranslationService class not found');
  assert(content.includes('translate_text'), 'translate_text method not found');
  assert(content.includes('SUPPORTED_LOCALES'), 'SUPPORTED_LOCALES not defined');
});

// Test 11: Backend LocalizationManager Exists
test('Backend LocalizationManager exists', () => {
  const localizationPath = path.join(__dirname, '../../backend/localization_manager.py');
  assert(fs.existsSync(localizationPath), 'Backend localization_manager.py not found');
  
  const content = fs.readFileSync(localizationPath, 'utf8');
  assert(content.includes('LocalizationManager'), 'LocalizationManager class not found');
  assert(content.includes('create_localized_summaries'), 'create_localized_summaries method not found');
  assert(content.includes('get_localized_summary'), 'get_localized_summary method not found');
});

// Test 12: Backend Routes Support Locale Parameter
test('Backend routes support locale parameter', () => {
  const routesToCheck = [
    '../../routes/monthly_routes.py',
    '../../routes/daily_routes.py'
  ];
  
  routesToCheck.forEach(routePath => {
    const fullPath = path.join(__dirname, routePath);
    if (!fs.existsSync(fullPath)) return;
    
    const content = fs.readFileSync(fullPath, 'utf8');
    assert(
      content.includes('locale') && content.includes('request.args.get'),
      `Route ${routePath} does not support locale parameter`
    );
  });
});

// Test 13: Package.json Has Required Dependencies
test('package.json includes required i18n dependencies', () => {
  const packagePath = path.join(__dirname, '../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  const requiredDeps = [
    'i18next',
    'react-i18next',
    'i18next-http-backend',
    'i18next-browser-languagedetector'
  ];
  
  requiredDeps.forEach(dep => {
    assert(
      packageJson.dependencies[dep],
      `Required dependency missing: ${dep}`
    );
  });
});

// Test 14: Translation Keys Are Organized by Domain
test('Translation keys are organized by domain (auth, common, settings, etc.)', () => {
  const localesDir = path.join(__dirname, '../public/locales');
  const enTranslations = JSON.parse(
    fs.readFileSync(path.join(localesDir, 'en', 'translation.json'), 'utf8')
  );
  
  const domains = new Set();
  Object.keys(enTranslations).forEach(key => {
    const domain = key.split('.')[0];
    domains.add(domain);
  });
  
  const expectedDomains = ['common', 'settings', 'header', 'auth'];
  expectedDomains.forEach(domain => {
    assert(
      domains.has(domain),
      `Expected domain "${domain}" not found in translation keys`
    );
  });
  
  assert(domains.size >= 5, 'Translation keys should be organized into multiple domains');
});

// Test 15: No Hardcoded English in Auth Page
test('Auth page has no hardcoded English strings', () => {
  const authPath = path.join(__dirname, '../pages/auth.tsx');
  if (!fs.existsSync(authPath)) {
    console.log('   ⚠️  Skipping - page not found');
    return;
  }
  
  const content = fs.readFileSync(authPath, 'utf8');
  
  // Check for common hardcoded patterns
  const hardcodedPatterns = [
    /placeholder="Email"/,
    /placeholder="Password"/,
    /"Login"/,
    /"Sign Up"/
  ];
  
  hardcodedPatterns.forEach(pattern => {
    assert(
      !pattern.test(content),
      `Auth page contains hardcoded string matching pattern: ${pattern}`
    );
  });
});

// Print Summary
console.log('\n=== Test Summary ===\n');
console.log(`✅ Passed: ${results.passed}`);
console.log(`❌ Failed: ${results.failed}`);
console.log(`📊 Total: ${results.passed + results.failed}`);
console.log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);

if (results.failed > 0) {
  console.log('\n=== Failed Tests Details ===\n');
  results.errors.forEach(({ test, error }) => {
    console.log(`❌ ${test}`);
    console.log(`   ${error}\n`);
  });
  process.exit(1);
} else {
  console.log('\n✅ All tests passed!\n');
  process.exit(0);
}
