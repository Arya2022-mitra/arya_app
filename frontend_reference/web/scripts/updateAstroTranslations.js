#!/usr/bin/env node
/**
 * Script to update all translation JSON files with astrological terms
 * Run: node scripts/updateAstroTranslations.js
 */

const fs = require('fs');
const path = require('path');

// Load astrological translations
const astroTranslationsPath = path.join(__dirname, '../lib/astroTranslations.json');
const astroTranslations = JSON.parse(fs.readFileSync(astroTranslationsPath, 'utf8'));

// Languages to update
const languages = ['en', 'hi', 'ta', 'te', 'bn', 'mr', 'gu', 'kn', 'ml', 'ms', 'ne'];

// Function to flatten nested object into dot notation keys
function flattenAstroTranslations(lang) {
  const flattened = {};
  
  // Add zodiac translations
  Object.entries(astroTranslations.zodiac).forEach(([key, translations]) => {
    flattened[`astro.zodiac.${key}`] = translations[lang] || translations['en'];
  });
  
  // Add nakshatra translations
  Object.entries(astroTranslations.nakshatras).forEach(([key, translations]) => {
    flattened[`astro.nakshatra.${key}`] = translations[lang] || translations['en'];
  });
  
  // Add planet translations
  Object.entries(astroTranslations.planets).forEach(([key, translations]) => {
    flattened[`astro.planet.${key}`] = translations[lang] || translations['en'];
  });
  
  // Add tithi translations
  Object.entries(astroTranslations.tithis).forEach(([key, translations]) => {
    flattened[`astro.tithi.${key}`] = translations[lang] || translations['en'];
  });
  
  // Add paksha translations
  Object.entries(astroTranslations.paksha).forEach(([key, translations]) => {
    flattened[`astro.paksha.${key}`] = translations[lang] || translations['en'];
  });
  
  // Add deity translations
  Object.entries(astroTranslations.deities).forEach(([key, translations]) => {
    flattened[`astro.deity.${key}`] = translations[lang] || translations['en'];
  });
  
  return flattened;
}

// Update each language file
languages.forEach(lang => {
  const translationPath = path.join(__dirname, `../public/locales/${lang}/translation.json`);
  
  try {
    // Read existing translations
    const existing = JSON.parse(fs.readFileSync(translationPath, 'utf8'));
    
    // Get flattened astrological translations for this language
    const astroFlattened = flattenAstroTranslations(lang);
    
    // Merge with existing translations
    const updated = {
      ...existing,
      ...astroFlattened
    };
    
    // Sort keys alphabetically for consistency
    const sorted = Object.keys(updated)
      .sort()
      .reduce((acc, key) => {
        acc[key] = updated[key];
        return acc;
      }, {});
    
    // Write back to file with pretty formatting
    fs.writeFileSync(translationPath, JSON.stringify(sorted, null, 2) + '\n', 'utf8');
    
    console.log(`✓ Updated ${lang}/translation.json with astrological terms`);
  } catch (error) {
    console.error(`✗ Failed to update ${lang}/translation.json:`, error.message);
  }
});

console.log('\nDone! All translation files have been updated with astrological terms.');
