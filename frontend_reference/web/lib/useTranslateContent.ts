import { useAstroTranslation } from './useAstroTranslation';

/**
 * Hook for translating content that may contain inline astrological terms.
 * This is useful for AI-generated text, descriptions, and other dynamic content.
 * 
 * @example
 * const { translateContent } = useTranslateContent();
 * const translated = translateContent("Today is Ekadashi with Ashwini nakshatra");
 * // Returns: "Today is [translated Ekadashi] with [translated Ashwini] nakshatra"
 */
export function useTranslateContent() {
  const astroTranslation = useAstroTranslation();
  
  /**
   * Translates text content that may contain astrological terms inline.
   * Only translates if the current language is not English.
   */
  const translateContent = (text: string): string => {
    if (!text || typeof text !== 'string') return text;
    
    // Skip translation for English
    if (astroTranslation.currentLanguage === 'en') return text;
    
    let translated = text;
    
    // Common tithi names (including variations)
    const tithiPattern = /(Pratipada|Dwitiya|Dvitiya|Tritiya|Chaturthi|Panchami|Shashthi|Shashti|Saptami|Ashtami|Navami|Dashami|Ekadashi|Dwadashi|Dvadashi|Trayodashi|Chaturdashi|Purnima|Pournami|Amavasya)/gi;
    
    // Nakshatra names
    const nakshatraPattern = /(Ashwini|Bharani|Krittika|Rohini|Mrigashira|Mrigashirsha|Ardra|Punarvasu|Pushya|Ashlesha|Magha|Purva Phalguni|Uttara Phalguni|Hasta|Chitra|Swati|Vishakha|Anuradha|Jyeshtha|Mula|Purva Ashadha|Uttara Ashadha|Shravana|Dhanishta|Shatabhisha|Purva Bhadrapada|Uttara Bhadrapada|Revati)/gi;
    
    // Planet names
    const planetPattern = /\b(Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu)\b/gi;
    
    // Zodiac/Rashi names
    const zodiacPattern = /\b(Aries|Taurus|Gemini|Cancer|Leo|Virgo|Libra|Scorpio|Sagittarius|Capricorn|Aquarius|Pisces|Mesha|Vrishabha|Mithuna|Karka|Simha|Kanya|Tula|Vrischika|Dhanu|Makara|Kumbha|Meena)\b/gi;
    
    // Choghadiya names
    const choghadiyaPattern = /\b(Amrit|Kaal|Shubh|Rog|Udveg|Chal|Labh)\b/gi;
    
    // Paksha names
    const pakshaPattern = /\b(Shukla Paksha|Krishna Paksha|Shukla|Krishna)\b/gi;
    
    // Replace tithi names
    translated = translated.replace(tithiPattern, (match) => {
      return astroTranslation.translateTithi(match);
    });
    
    // Replace nakshatra names
    translated = translated.replace(nakshatraPattern, (match) => {
      return astroTranslation.translateNakshatra(match);
    });
    
    // Replace planet names
    translated = translated.replace(planetPattern, (match) => {
      return astroTranslation.translatePlanet(match);
    });
    
    // Replace zodiac names
    translated = translated.replace(zodiacPattern, (match) => {
      return astroTranslation.translateZodiac(match);
    });
    
    // Replace choghadiya names
    translated = translated.replace(choghadiyaPattern, (match) => {
      return astroTranslation.translateChoghadiya(match);
    });
    
    // Replace paksha names
    translated = translated.replace(pakshaPattern, (match) => {
      return astroTranslation.translatePaksha(match);
    });
    
    return translated;
  };
  
  return {
    translateContent,
    currentLanguage: astroTranslation.currentLanguage,
  };
}
