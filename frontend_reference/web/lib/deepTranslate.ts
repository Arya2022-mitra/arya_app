import { useAstroTranslation } from './useAstroTranslation';

/**
 * Deep translation utility for nested objects and arrays containing astrological data.
 * 
 * This utility recursively traverses objects and arrays to translate:
 * - Tithi, Nakshatra, Planet, Zodiac, Paksha, Deity, and Choghadiya names
 * - Number-based IDs to their corresponding names (if needed)
 * - Nested data structures in AI summaries and API responses
 * 
 * @example
 * const translator = useDeepTranslation();
 * const translated = translator.translateObject({
 *   tithi: "Ekadashi",
 *   nakshatra: "Ashwini",
 *   choghadiya: { day: [{ name: "Amrit" }] }
 * });
 */

// Known astrological field names that should be translated
const ASTRO_FIELD_PATTERNS = {
  tithi: ['tithi', 'tithi_name', 'tithi_current'],
  nakshatra: ['nakshatra', 'nakshatra_name', 'star', 'birth_star'],
  planet: ['planet', 'planet_name', 'lord', 'planet_lord'],
  zodiac: ['rashi', 'sign', 'moon_sign', 'sun_sign', 'zodiac', 'lagna'],
  paksha: ['paksha'],
  deity: ['deity', 'deity_name', 'god', 'goddess'],
  choghadiya: ['name'], // Used within choghadiya arrays
};

/**
 * Checks if a field name matches any astrological field pattern
 */
function getAstroCategory(fieldName: string): 'tithi' | 'nakshatra' | 'planet' | 'zodiac' | 'paksha' | 'deity' | 'choghadiya' | null {
  const normalizedField = fieldName.toLowerCase();
  
  for (const [category, patterns] of Object.entries(ASTRO_FIELD_PATTERNS)) {
    if (patterns.some(pattern => normalizedField.includes(pattern))) {
      return category as any;
    }
  }
  
  return null;
}

/**
 * Hook for deep translation of nested astrological data
 */
export function useDeepTranslation() {
  const astroTranslation = useAstroTranslation();
  
  /**
   * Translates a value based on its category
   */
  const translateValue = (value: any, category: string | null, fieldName?: string): any => {
    if (typeof value !== 'string') return value;
    if (!category) return value;
    
    // Special handling for choghadiya - only translate if within choghadiya structure
    if (category === 'choghadiya' && fieldName === 'name') {
      return astroTranslation.translateChoghadiya(value);
    }
    
    switch (category) {
      case 'tithi':
        return astroTranslation.translateTithi(value);
      case 'nakshatra':
        return astroTranslation.translateNakshatra(value);
      case 'planet':
        return astroTranslation.translatePlanet(value);
      case 'zodiac':
        return astroTranslation.translateZodiac(value);
      case 'paksha':
        return astroTranslation.translatePaksha(value);
      case 'deity':
        return astroTranslation.translateDeity(value);
      default:
        return value;
    }
  };
  
  /**
   * Recursively translates an object or array
   */
  const translateObject = (obj: any, parentKey?: string): any => {
    // Handle null/undefined
    if (obj === null || obj === undefined) {
      return obj;
    }
    
    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map(item => translateObject(item, parentKey));
    }
    
    // Handle primitives
    if (typeof obj !== 'object') {
      return obj;
    }
    
    // Handle objects
    const translated: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      // Special handling for choghadiya arrays
      if ((key === 'choghadiya' || parentKey === 'choghadiya') && typeof value === 'object') {
        if (Array.isArray(value)) {
          // Array of choghadiya periods
          translated[key] = value.map(period => {
            if (typeof period === 'object' && period !== null) {
              return {
                ...period,
                name: period.name ? translateValue(period.name, 'choghadiya', 'name') : period.name
              };
            }
            return period;
          });
        } else if (value && typeof value === 'object') {
          // Object with day/night properties
          translated[key] = {};
          for (const [subKey, subValue] of Object.entries(value)) {
            if (Array.isArray(subValue)) {
              translated[key][subKey] = subValue.map(period => {
                if (typeof period === 'object' && period !== null) {
                  return {
                    ...period,
                    name: period.name ? translateValue(period.name, 'choghadiya', 'name') : period.name
                  };
                }
                return period;
              });
            } else {
              translated[key][subKey] = translateObject(subValue, key);
            }
          }
        } else {
          translated[key] = value;
        }
        continue;
      }
      
      const category = getAstroCategory(key);
      
      // If the value is a string and matches an astro category, translate it
      if (typeof value === 'string' && category) {
        translated[key] = translateValue(value, category, key);
      }
      // If the value is an object or array, recurse
      else if (typeof value === 'object' && value !== null) {
        translated[key] = translateObject(value, key);
      }
      // Otherwise, keep as is
      else {
        translated[key] = value;
      }
    }
    
    return translated;
  };
  
  /**
   * Translates text content that may contain astrological terms inline
   * This is useful for AI-generated summaries that mention astrological terms
   */
  const translateText = (text: string): string => {
    if (!text || typeof text !== 'string') return text;
    
    let translated = text;
    
    // Common astrological terms that might appear in text
    const tithiPattern = /(Pratipada|Dvitiya|Tritiya|Chaturthi|Panchami|Shashti|Saptami|Ashtami|Navami|Dashami|Ekadashi|Dvadashi|Trayodashi|Chaturdashi|Pournami|Amavasya)/gi;
    const nakshatraPattern = /(Ashwini|Bharani|Krittika|Rohini|Mrigashira|Mrigashirsha|Ardra|Punarvasu|Pushya|Ashlesha|Magha|Purva Phalguni|Uttara Phalguni|Hasta|Chitra|Swati|Vishakha|Anuradha|Jyeshtha|Mula|Purva Ashadha|Uttara Ashadha|Shravana|Dhanishta|Shatabhisha|Purva Bhadrapada|Uttara Bhadrapada|Revati)/gi;
    const choghadiyaPattern = /\b(Amrit|Kaal|Shubh|Rog|Udveg|Chal|Labh)\b/gi;
    
    // Replace tithi names
    translated = translated.replace(tithiPattern, (match) => {
      return astroTranslation.translateTithi(match);
    });
    
    // Replace nakshatra names
    translated = translated.replace(nakshatraPattern, (match) => {
      return astroTranslation.translateNakshatra(match);
    });
    
    // Replace choghadiya names
    translated = translated.replace(choghadiyaPattern, (match) => {
      return astroTranslation.translateChoghadiya(match);
    });
    
    return translated;
  };
  
  return {
    translateObject,
    translateText,
    translateValue,
    currentLanguage: astroTranslation.currentLanguage,
  };
}
