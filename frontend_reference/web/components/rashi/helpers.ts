export const PLANET_ABBREVIATIONS: Record<string, string> = {
  Sun: 'Su',
  Moon: 'Mo',
  Mars: 'Ma',
  Mercury: 'Me',
  Jupiter: 'Ju',
  Venus: 'Ve',
  Saturn: 'Sa',
  Rahu: 'Ra',
  Ketu: 'Ke',
  Asc: 'As',
  Lagna: 'La',
};

export const STROKE_COLOR = '#b8860b';
export const STROKE_WIDTH = 1.5;

/**
 * Convert an array of planet names to two-letter abbreviations.
 * Unrecognized names are trimmed to their first two characters.
 */
export function getPlanetAbbreviations(planets: string[]): string[] {
  return planets.map(p => {
    const key = p.split(/[\s(]/)[0];
    const abbr = PLANET_ABBREVIATIONS[key];
    return abbr ? abbr : key.slice(0, 2);
  });
}
