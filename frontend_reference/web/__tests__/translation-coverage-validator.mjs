#!/usr/bin/env node
/**
 * Translation Coverage Validator
 * 
 * Generates a report on translation coverage across pages and validates
 * that the i18n implementation meets the playbook requirements.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n=== Translation Coverage Validator ===\n');

// Load English translations as the source of truth
const enTranslations = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../public/locales/en/translation.json'), 'utf8')
);

// Statistics
const stats = {
  totalKeys: Object.keys(enTranslations).length,
  domains: new Set(),
  locales: ['en', 'hi', 'ta', 'te', 'bn', 'mr', 'gu', 'kn'],
  pagesWithTranslation: 0,
  pagesTotalCount: 0,
  hardcodedStringsFound: []
};

// Analyze translation key domains
console.log('📊 Translation Key Analysis\n');
Object.keys(enTranslations).forEach(key => {
  const domain = key.split('.')[0];
  stats.domains.add(domain);
});

console.log(`Total Translation Keys: ${stats.totalKeys}`);
console.log(`Key Domains: ${[...stats.domains].join(', ')}`);
console.log(`Supported Locales: ${stats.locales.length}`);
console.log('');

// Validate each locale
console.log('🌍 Locale Validation\n');
stats.locales.forEach(locale => {
  const localeFile = path.join(__dirname, `../public/locales/${locale}/translation.json`);
  const translations = JSON.parse(fs.readFileSync(localeFile, 'utf8'));
  const keyCount = Object.keys(translations).length;
  const completeness = ((keyCount / stats.totalKeys) * 100).toFixed(1);
  
  console.log(`${locale.toUpperCase()}: ${keyCount}/${stats.totalKeys} keys (${completeness}%)`);
});
console.log('');

// Analyze page coverage
console.log('📄 Page Translation Coverage\n');
const pagesDir = path.join(__dirname, '../pages');
const pages = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

const pageReport = [];

pages.forEach(page => {
  const pagePath = path.join(pagesDir, page);
  const content = fs.readFileSync(pagePath, 'utf8');
  
  stats.pagesTotalCount++;
  const usesTranslation = content.includes('useTranslation') || content.includes('{ t }');
  
  if (usesTranslation) {
    stats.pagesWithTranslation++;
  }
  
  // Check for common hardcoded patterns
  const hardcodedPatterns = [
    { pattern: />\s*Loading\.\.\.\s*</g, name: 'Loading...' },
    { pattern: /placeholder="[A-Z][^"]*"/g, name: 'Placeholder text' },
    { pattern: />\s*Sign In\s*</g, name: 'Sign In' },
    { pattern: />\s*Sign Up\s*</g, name: 'Sign Up' },
  ];
  
  const hardcoded = [];
  hardcodedPatterns.forEach(({ pattern, name }) => {
    const matches = content.match(pattern);
    if (matches && !usesTranslation) {
      hardcoded.push(`${name} (${matches.length}x)`);
    }
  });
  
  pageReport.push({
    page,
    usesTranslation,
    hardcoded: hardcoded.length > 0 ? hardcoded : null
  });
});

// Sort: pages needing work first
pageReport.sort((a, b) => {
  if (a.usesTranslation && !b.usesTranslation) return 1;
  if (!a.usesTranslation && b.usesTranslation) return -1;
  return a.page.localeCompare(b.page);
});

pageReport.forEach(({ page, usesTranslation, hardcoded }) => {
  if (usesTranslation) {
    console.log(`✅ ${page}`);
  } else {
    console.log(`⚠️  ${page}`);
    if (hardcoded) {
      hardcoded.forEach(h => console.log(`    - ${h}`));
    }
  }
});

console.log('');
console.log(`Pages using translations: ${stats.pagesWithTranslation}/${stats.pagesTotalCount} (${((stats.pagesWithTranslation / stats.pagesTotalCount) * 100).toFixed(1)}%)`);
console.log('');

// Backend validation
console.log('🔧 Backend Service Validation\n');

const backendChecks = [
  { file: '../../backend/translation_service.py', name: 'TranslationService' },
  { file: '../../backend/localization_manager.py', name: 'LocalizationManager' },
  { file: '../../backend/translation_utils.py', name: 'Translation Utils' },
  { file: '../../routes/monthly_routes.py', name: 'Monthly Routes (locale support)' },
  { file: '../../routes/daily_routes.py', name: 'Daily Routes (locale support)' },
];

backendChecks.forEach(({ file, name }) => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${name}`);
  } else {
    console.log(`❌ ${name} - File not found`);
  }
});

console.log('');

// API Integration Check
console.log('🔌 API Integration Check\n');

const monthlyPredictionPath = path.join(__dirname, '../pages/monthly-prediction.tsx');
if (fs.existsSync(monthlyPredictionPath)) {
  const content = fs.readFileSync(monthlyPredictionPath, 'utf8');
  if (content.includes('locale:') && content.includes('i18n.language')) {
    console.log('✅ Monthly prediction passes locale to API');
  } else {
    console.log('⚠️  Monthly prediction does not pass locale to API');
  }
}

console.log('');

// Requirements Checklist
console.log('📋 Playbook Requirements Checklist\n');

const requirements = [
  {
    name: 'Runtime translation loading (HttpBackend)',
    check: () => {
      const i18nPath = path.join(__dirname, '../lib/i18n.ts');
      const content = fs.readFileSync(i18nPath, 'utf8');
      return content.includes('HttpBackend') && content.includes('/locales/{{lng}}/{{ns}}.json');
    }
  },
  {
    name: 'Single source of truth (localStorage + LanguageSync)',
    check: () => {
      const langSyncPath = path.join(__dirname, '../components/LanguageSync.tsx');
      return fs.existsSync(langSyncPath);
    }
  },
  {
    name: 'Translation files complete (all locales)',
    check: () => {
      return stats.locales.every(locale => {
        const file = path.join(__dirname, `../public/locales/${locale}/translation.json`);
        return fs.existsSync(file);
      });
    }
  },
  {
    name: 'Backend translation service exists',
    check: () => {
      const file = path.join(__dirname, '../../backend/translation_service.py');
      return fs.existsSync(file);
    }
  },
  {
    name: 'Backend localization manager exists',
    check: () => {
      const file = path.join(__dirname, '../../backend/localization_manager.py');
      return fs.existsSync(file);
    }
  },
  {
    name: 'API routes accept locale parameter',
    check: () => {
      const monthlyPath = path.join(__dirname, '../../routes/monthly_routes.py');
      if (!fs.existsSync(monthlyPath)) return false;
      const content = fs.readFileSync(monthlyPath, 'utf8');
      return content.includes('locale') && content.includes('request.args.get');
    }
  },
  {
    name: 'Frontend passes locale to API calls',
    check: () => {
      const monthlyPath = path.join(__dirname, '../pages/monthly-prediction.tsx');
      if (!fs.existsSync(monthlyPath)) return false;
      const content = fs.readFileSync(monthlyPath, 'utf8');
      return content.includes('locale:') && content.includes('i18n.language');
    }
  },
  {
    name: 'i18n runtime configured for re-render on language change',
    check: () => {
      const i18nPath = path.join(__dirname, '../lib/i18n.ts');
      const content = fs.readFileSync(i18nPath, 'utf8');
      return content.includes('bindI18n');
    }
  },
];

let requirementsMet = 0;
requirements.forEach(({ name, check }) => {
  const passed = check();
  if (passed) {
    console.log(`✅ ${name}`);
    requirementsMet++;
  } else {
    console.log(`❌ ${name}`);
  }
});

console.log('');
console.log(`Requirements Met: ${requirementsMet}/${requirements.length} (${((requirementsMet / requirements.length) * 100).toFixed(1)}%)`);
console.log('');

// Overall Status
console.log('=== Overall Status ===\n');

const translationCoverage = (stats.pagesWithTranslation / stats.pagesTotalCount) * 100;
const requirementsCoverage = (requirementsMet / requirements.length) * 100;
const overallScore = (translationCoverage + requirementsCoverage) / 2;

console.log(`📊 Translation Coverage: ${translationCoverage.toFixed(1)}%`);
console.log(`📋 Requirements Coverage: ${requirementsCoverage.toFixed(1)}%`);
console.log(`🎯 Overall Score: ${overallScore.toFixed(1)}%`);
console.log('');

if (overallScore >= 90) {
  console.log('✅ Excellent! The i18n implementation meets or exceeds playbook requirements.');
} else if (overallScore >= 75) {
  console.log('⚠️  Good progress, but some areas need attention.');
} else {
  console.log('❌ More work needed to meet playbook requirements.');
}

console.log('');

// Recommendations
console.log('💡 Recommendations\n');

if (stats.pagesWithTranslation < stats.pagesTotalCount) {
  console.log(`- Update ${stats.pagesTotalCount - stats.pagesWithTranslation} remaining pages to use translations`);
}

if (requirementsMet < requirements.length) {
  console.log('- Complete missing playbook requirements (see checklist above)');
}

console.log('- Consider adding automated tests for locale parameter in API responses');
console.log('- Add observability metrics for translation coverage');
console.log('- Document translation workflow for new developers');

console.log('');
