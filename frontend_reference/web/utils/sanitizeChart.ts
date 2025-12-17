export interface RawChartEntry {
  label?: string;
  sign?: string;
  planets?: any;
  [key: string]: any;
}

export type RawChart = Record<string | number, RawChartEntry> | null | undefined;

export interface SanitizedChartEntry {
  label?: string;
  planets: string[];
}

/**
 * Normalize a chart object into the shape expected by chart components.
 */
export default function sanitizeChart(chart: RawChart): Record<number, SanitizedChartEntry> {
  const result: Record<number, SanitizedChartEntry> = {};
  if (!chart || typeof chart !== 'object') {
    return result;
  }
  for (const [key, value] of Object.entries(chart)) {
    const idx = Number(key);
    if (Number.isNaN(idx)) continue;
    const val: any = value || {};
    result[idx] = {
      label: val.label ?? val.sign,
      planets: Array.isArray(val.planets) ? val.planets : [],
    };
  }
  return result;
}
