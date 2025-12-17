import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { LANGUAGE_CODES } from './languages';
import fs from 'fs';
import path from 'path';

// Load translations from file system for testing
const loadTranslationsFromFS = (lng: string) => {
  try {
    const translationPath = path.join(process.cwd(), 'public/locales', lng, 'translation.json');
    const data = fs.readFileSync(translationPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Failed to load translations for ${lng}:`, error);
    return {};
  }
};

// Build resources object for all languages
const resources: Record<string, { translation: any }> = {};
LANGUAGE_CODES.forEach((lng) => {
  resources[lng] = {
    translation: loadTranslationsFromFS(lng),
  };
});

// Initialize i18n for testing with bundled resources
i18n
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    
    interpolation: {
      escapeValue: false,
    },
    
    react: {
      useSuspense: false,
    },
    
    supportedLngs: LANGUAGE_CODES,
    ns: ['translation'],
    defaultNS: 'translation',
  });

export default i18n;
