import { useTranslation } from 'react-i18next';
import astroTranslations from './astroTranslations.json';

type AstroCategory = 'zodiac' | 'nakshatras' | 'planets' | 'tithis' | 'paksha' | 'deities' | 'choghadiya';

/**
 * Hook to translate astrological terms (zodiac, nakshatras, planets, tithis, deities)
 * based on the current language.
 * 
 * @example
 * const { translateZodiac, translateNakshatra } = useAstroTranslation();
 * const zodiacName = translateZodiac('aries'); // Returns "मेष" in Hindi
 * const starName = translateNakshatra('ashwini'); // Returns "अश्विनी" in Hindi
 */
export function useAstroTranslation() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'en';

  /**
   * Generic translation function for astrological terms
   */
  const translateAstro = (category: AstroCategory, key: string): string => {
    const normalizedKey = key.toLowerCase().replace(/[\s-]/g, '_');
    const translations = (astroTranslations as any)[category];
    
    if (!translations || !translations[normalizedKey]) {
      // Return original key if translation not found
      return key;
    }

    const langTranslations = translations[normalizedKey];
    return langTranslations[currentLang] || langTranslations['en'] || key;
  };

  return {
    /**
     * Translate zodiac/rashi names (e.g., 'aries' -> 'मेष' in Hindi)
     */
    translateZodiac: (zodiacKey: string) => translateAstro('zodiac', zodiacKey),

    /**
     * Translate nakshatra/star names (e.g., 'ashwini' -> 'अश्विनी' in Hindi)
     */
    translateNakshatra: (nakshatraKey: string) => translateAstro('nakshatras', nakshatraKey),

    /**
     * Translate planet names (e.g., 'sun' -> 'सूर्य' in Hindi)
     */
    translatePlanet: (planetKey: string) => translateAstro('planets', planetKey),

    /**
     * Translate tithi names (e.g., 'ekadashi' -> 'एकादशी' in Hindi)
     */
    translateTithi: (tithiKey: string) => translateAstro('tithis', tithiKey),

    /**
     * Translate paksha names (e.g., 'shukla' -> 'शुक्ल पक्ष' in Hindi)
     */
    translatePaksha: (pakshaKey: string) => translateAstro('paksha', pakshaKey),

    /**
     * Translate deity names (e.g., 'ganesha' -> 'गणेश' in Hindi)
     */
    translateDeity: (deityKey: string) => translateAstro('deities', deityKey),

    /**
     * Translate choghadiya period names (e.g., 'amrit' -> 'अमृत' in Hindi)
     */
    translateChoghadiya: (choghadiyaKey: string) => translateAstro('choghadiya', choghadiyaKey),

    /**
     * Get current language code
     */
    currentLanguage: currentLang,
  };
}

/**
 * Utility function to normalize astrological names for translation lookup
 * Converts various formats to a standard key format
 * 
 * @example
 * normalizeAstroKey('Purva Phalguni') // Returns 'purva_phalguni'
 * normalizeAstroKey('Uttara-Ashadha') // Returns 'uttara_ashadha'
 */
export function normalizeAstroKey(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[\s-]/g, '_')
    .replace(/[^\w_]/g, '');
}
