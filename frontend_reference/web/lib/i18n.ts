import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';
import { LANGUAGE_CODES } from './languages';

// SSR-safe i18n initialization
// Separate client and server initialization to avoid browser-only APIs on server
if (typeof window !== 'undefined') {
  // Client-side: use HttpBackend and LanguageDetector
  i18n
    .use(HttpBackend) // Load translations from backend
    .use(LanguageDetector) // Detect user language
    .use(initReactI18next) // Pass i18n to react-i18next
    .init({
      fallbackLng: 'en',
      debug: false,
      
      // Backend configuration - load translations from public/locales
      backend: {
        loadPath: '/locales/{{lng}}/{{ns}}.json',
        addPath: '/locales/add/{{lng}}/{{ns}}',
      },
      
      // Language detection order
      detection: {
        order: ['localStorage', 'navigator'],
        lookupLocalStorage: 'user_language',
        caches: ['localStorage'],
      },
      
      interpolation: {
        escapeValue: false, // React already escapes values
      },
      
      react: {
        useSuspense: false, // Disable suspense to avoid loading flicker
        bindI18n: 'languageChanged loaded',
        bindI18nStore: 'added removed',
      },
      
      // Supported languages - derived from centralized LANGUAGES constant
      supportedLngs: LANGUAGE_CODES,
      
      // Default namespace
      ns: ['translation'],
      defaultNS: 'translation',
    });
} else {
  // Server-side: minimal init with fallback to English
  // No HTTP backend or browser APIs on server to avoid SSR issues
  let enTranslations = {};
  
  // Attempt to load English translations synchronously for SSR
  // Note: Using require() here is intentional and follows i18next SSR best practices
  // The synchronous load is acceptable because:
  // 1. It only happens once during server initialization
  // 2. The translation file is small and loading is fast
  // 3. This prevents async issues during SSR rendering
  try {
    // Use dynamic require for Node.js environment
    // eslint-disable-next-line
    enTranslations = require('../public/locales/en/translation.json');
  } catch (err) {
    // If translation file can't be loaded, continue with empty translations
    // This ensures SSR doesn't crash even if translations are missing
    console.warn('Failed to load English translations for SSR:', err);
  }
  
  i18n
    .use(initReactI18next)
    .init({
      fallbackLng: 'en',
      debug: false,
      supportedLngs: LANGUAGE_CODES,
      ns: ['translation'],
      defaultNS: 'translation',
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
      // Initialize synchronously on server
      initImmediate: false,
      // Load English translations for SSR
      resources: {
        en: {
          translation: enTranslations,
        },
      },
    });
}

export default i18n;
