/**
 * web/lib/cleanSummaryWithWindows.ts
 *
 * Utilities to clean AI summaries and expand time_windows[n] tokens into
 * human-friendly time window strings.
 *
 * Defensive and type-safe: accepts numeric slots, HH:MM, AM/PM, ISO datetimes,
 * and prefers preformatted display fields when available.
 */

/* ---------------------- Types ---------------------- */

export interface TimeWindow {
  label?: string;
  name?: string;
  category?: string;
  start?: string | number;
  end?: string | number;
  start_iso?: string;
  end_iso?: string;
  start_display?: string;
  end_display?: string;
  impact?: string;
  description?: string;
  drivers?: string[];
  note?: string;
  // allow other arbitrary fields from API
  [k: string]: any;
}

/**
 * Normalized time window with computed display fields.
 */
export type WindowSeverity = 'auspicious' | 'inauspicious' | 'neutral';
export type CategoryVariant = 'auspicious' | 'neutral' | 'inauspicious' | 'default';

export interface NormalizedTimeWindow extends TimeWindow {
  /** Canonical name for the window */
  name: string;
  /** Index of the window in canonical ordering */
  index?: number;
  /** ISO start time (if available) */
  startISO?: string | null;
  /** ISO end time (if available) */
  endISO?: string | null;
  /** Pre-formatted start time for display (AM/PM format) */
  startDisplay: string;
  /** Pre-formatted end time for display (AM/PM format) */
  endDisplay: string;
  /** Optional short description */
  short_desc?: string;
  /** Optional quantitative score */
  score?: number;
  /** Normalized score label for display */
  scoreText?: string;
  /** Score variant for styling */
  scoreVariant?: 'good' | 'neutral' | 'bad';
  /** Severity indicator (canonical) */
  severity?: WindowSeverity;
  /** Pakshi metadata */
  pakshi_day?: string;
  pakshi_night?: string;
  pakshi_status?: string;
  /** Card date subtitle */
  card_date?: string;

  /** Optional narrative fields for expandable details */
  facts_html?: string;
  interpretation_html?: string;
  practical_html?: string;

  /** Raw window payload retained for debug */
  raw?: any;

  /** Optional window type (e.g., 'favourable', 'caution') */
  type?: string;
}

export interface FormatOptions {
  useAmpm?: boolean;
  slotMinutes?: number;
  date?: string;
  tz?: string;
}

const DEFAULT_TIME_PLACEHOLDER = '--:--';
const DEFAULT_SCORE_TEXT = '-';
const DEFAULT_RANGE_PLACEHOLDER = `${DEFAULT_TIME_PLACEHOLDER} → ${DEFAULT_TIME_PLACEHOLDER}`;

/* ------------------- Helper: Construct ISO from date and time ------------------- */

/**
 * Constructs an ISO datetime string from a date string and a time string (e.g., "06:24 AM").
 * 
 * @param dateStr - ISO date string (e.g., "2025-12-10")
 * @param timeStr - Time string in various formats (e.g., "06:24 AM", "6:24 AM", "18:24")
 * @param tz - Optional timezone (currently uses browser's local timezone as fallback)
 * @returns ISO datetime string or null if parsing fails
 * 
 * Note: This function creates a datetime in the browser's local timezone.
 * For accurate timezone handling, the backend should provide full ISO timestamps with timezone.
 * This is a fallback for cases where only display times are available.
 */
function constructISOFromDateAndTime(dateStr: string, timeStr: string, tz?: string): string | null {
  try {
    // Parse the time string to extract hours and minutes
    const timePattern = /(\d{1,2}):(\d{2})\s*(AM|PM)?/i;
    const match = timeStr.match(timePattern);
    
    if (!match) return null;
    
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const meridiem = match[3]?.toUpperCase();
    
    // Convert 12-hour format to 24-hour format
    if (meridiem === 'PM' && hours !== 12) {
      hours += 12;
    } else if (meridiem === 'AM' && hours === 12) {
      hours = 0;
    }
    
    // Construct datetime string in local timezone
    // The Date constructor will interpret this in the browser's local timezone
    const datePart = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const hoursStr = String(hours).padStart(2, '0');
    const minutesStr = String(minutes).padStart(2, '0');
    
    // Create a Date object - this will be in the user's browser timezone
    // which is reasonable for current window detection purposes
    const dateTime = new Date(`${datePart}T${hoursStr}:${minutesStr}:00`);
    
    if (isNaN(dateTime.getTime())) return null;
    
    return dateTime.toISOString();
  } catch {
    return null;
  }
}

/* ------------------- JSON pattern detection utilities ------------------- */

/**
 * Check if text contains patterns that look like raw JSON/backend data.
 * Used to filter out leaked backend data from user-facing content.
 * 
 * @param text - The text to check
 * @param minLength - Minimum meaningful text length (default: 3)
 * @returns true if text looks like raw JSON data or is too short to be meaningful
 */
function looksLikeRawJsonData(text: string | null | undefined, minLength = 3): boolean {
  if (!text) return true;
  const trimmed = text.trim();
  if (trimmed.length < minLength) return true; // Too short to be meaningful
  
  // Patterns that indicate raw JSON or backend data leaks
  const jsonPatterns = [
    /"\w+"\s*:\s*"/,              // "key": "value"
    /\{\s*"\w+"/,                  // { "key"
    /\[\s*\{/,                     // [ {
    /}\s*,\s*\{/,                  // }, {
    /_status"\s*:/,                // _status":
    /_pakshi"\s*:/,                // _pakshi":
    /__windows_json__/i,           // JSON marker
    /\}\}\}/,                      // }}}
  ];
  return jsonPatterns.some(pattern => pattern.test(trimmed));
}

/* ------------------- Time parsing/formatting utilities ------------------- */

/**
 * Check if a value looks like a numeric slot index.
 */
function isNumericSlot(value: string | number | undefined): value is number | string {
  if (typeof value === 'number') return true;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return /^\d+(\.\d+)?$/.test(trimmed);
  }
  return false;
}

/**
 * Convert a numeric slot index to a human range (AM/PM).
 * Slots are 1-based, starting at midnight with slotMinutes length.
 */
function slotToTimeRange(slotIndex: number, slotMinutes = 90, useAmpm = true): string {
  if (!Number.isFinite(slotIndex) || slotIndex < 1) return 'time window';
  const slotsPerDay = Math.floor((24 * 60) / slotMinutes);
  if (slotIndex > slotsPerDay) return 'time window';
  const startMinutes = (slotIndex - 1) * slotMinutes;
  const endMinutes = startMinutes + slotMinutes;

  const formatMinutes = (m: number) => {
    const hours24 = Math.floor(m / 60) % 24;
    const mins = m % 60;
    if (useAmpm) {
      const period = hours24 >= 12 ? 'PM' : 'AM';
      const hours12 = hours24 === 0 ? 12 : hours24 > 12 ? hours24 - 12 : hours24;
      return `${hours12}:${String(mins).padStart(2, '0')} ${period}`;
    } else {
      return `${String(hours24).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    }
  };

  return `${formatMinutes(startMinutes)} – ${formatMinutes(endMinutes)}`;
}

/**
 * Parse simple time strings like "9:30", "9:30 AM", "21:10"
 */
function parseTimeString(timeStr: string): { hours: number; minutes: number } | null {
  if (!timeStr) return null;
  const trimmed = timeStr.trim();
  // 12-hour with AM/PM
  const ampm = /^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/.exec(trimmed);
  if (ampm) {
    let hours = parseInt(ampm[1], 10);
    const mins = parseInt(ampm[2], 10);
    const mer = ampm[3].toUpperCase();
    if (mer === 'PM' && hours !== 12) hours += 12;
    if (mer === 'AM' && hours === 12) hours = 0;
    if (hours >= 0 && hours < 24 && mins >= 0 && mins < 60) return { hours, minutes: mins };
    return null;
  }
  // 24-hour HH:MM
  const hhmm = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(trimmed);
  if (hhmm) {
    const hours = parseInt(hhmm[1], 10);
    const mins = parseInt(hhmm[2], 10);
    if (hours === 24) return { hours: 0, minutes: mins };
    if (hours >= 0 && hours < 24 && mins >= 0 && mins < 60) return { hours, minutes: mins };
  }
  return null;
}

function formatHoursMinutes(hours: number, minutes: number, useAmpm = true): string {
  if (useAmpm) {
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
  } else {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }
}

/**
 * Format a time-like value to a short localized time string.
 * Accepts: number (slot index), string numeric slot, HH:MM, H:MM AM/PM, ISO datetimes.
 */
function formatTime(dateTimeStr: string | number | undefined, options: FormatOptions = {}): string | null {
  if (dateTimeStr === undefined || dateTimeStr === null) return null;
  const useAmpm = options.useAmpm ?? true;
  const slotMinutes = options.slotMinutes ?? 90;

  // Numeric slot as number
  if (typeof dateTimeStr === 'number') {
    const startMinutes = (dateTimeStr - 1) * slotMinutes;
    if (!Number.isFinite(startMinutes) || dateTimeStr < 1) return null;
    return formatHoursMinutes(Math.floor(startMinutes / 60) % 24, startMinutes % 60, useAmpm);
  }

  // Numeric slot as string
  if (isNumericSlot(dateTimeStr)) {
    const slotIndex = parseInt(String(dateTimeStr), 10);
    const startMinutes = (slotIndex - 1) * slotMinutes;
    if (!Number.isFinite(startMinutes) || slotIndex < 1) return null;
    return formatHoursMinutes(Math.floor(startMinutes / 60) % 24, startMinutes % 60, useAmpm);
  }

  const str = String(dateTimeStr).trim();
  if (!str) return null;

  // Try HH:MM or H:MM AM/PM
  const parsed = parseTimeString(str);
  if (parsed) {
    return formatHoursMinutes(parsed.hours, parsed.minutes, useAmpm);
  }

  // Try ISO datetime parsing fallback
  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      // Use browser locale short time
      if (useAmpm) {
        // prefer 12h
        return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: options.tz });
      } else {
        return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: options.tz });
      }
    }
  } catch {
    // noop
  }

  return null;
}

/**
 * Convenience wrapper for formatting dates/times.
 * 
 * @param value - The value to format (ISO datetime string, number, or null/undefined)
 * @param mode - The formatting mode:
 *   - 'time': Returns just the time (e.g., "11:49 AM")
 *   - 'datetime': Returns date and time (e.g., "Nov 28, 2025, 11:49 AM") - DEFAULT
 *   - 'date': Returns just the date (e.g., "11/28/2025")
 * 
 * @returns The formatted string, or '—' (em-dash) for null/undefined values
 * 
 * Note: The default mode is 'datetime' to show both date and time for user display.
 * Callers who need time-only display should explicitly pass 'time' as the mode.
 */
function formatLocal(value?: string | number | null, mode: 'time' | 'datetime' | 'date' = 'datetime'): string {
  if (!value && value !== 0) return '—';
  if (mode === 'time') {
    const formatted = formatTime(value as string | number, { useAmpm: true });
    return formatted ?? '—';
  }
  // For datetime/date, use simple conversion
  try {
    const d = new Date(String(value));
    if (isNaN(d.getTime())) return String(value ?? '');
    if (mode === 'datetime') {
      // Format with date and time including AM/PM
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } else {
      return d.toLocaleDateString();
    }
  } catch {
    return String(value ?? '');
  }
}

/**
 * Find and format ISO datetime-like tokens in free text.
 * Very defensive: matches common ISO patterns and replaces them with readable AM/PM text.
 * Also converts " to " between time ranges into " – ".
 */
function formatIsoDatetimesInText(text?: string | null): string {
  if (!text) return '';
  // Simplistic ISO regex: 2023-08-12T09:30:00Z or 2023-08-12 09:30 or 2023-08-12T09:30
  const isoPattern = /(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?(?:Z|[+\-]\d{2}:?\d{2})?)/g;
  let result = text.replace(isoPattern, (m) => {
    try {
      const d = new Date(m);
      if (!isNaN(d.getTime())) return d.toLocaleString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch {
      // noop
    }
    return m;
  });
  
  // Convert " to " between time values to " – " for cleaner range display
  // Match patterns like "9:30 AM to 10:30 AM" and replace " to " with " – "
  result = result.replace(/(\d{1,2}:\d{2}\s*(?:AM|PM)?)\s+to\s+(\d{1,2}:\d{2}\s*(?:AM|PM)?)/gi, '$1 – $2');
  
  return result;
}

function normalizeScoreValue(rawScore: any): number | null {
  if (rawScore === null || rawScore === undefined) return null;
  const num = typeof rawScore === 'string' ? Number(rawScore) : rawScore;
  if (!Number.isFinite(num)) return null;
  const clamped = Math.max(0, Math.min(10, num));
  return clamped;
}

function getScoreVariant(score: number | null | undefined): 'good' | 'neutral' | 'bad' {
  if (score === null || score === undefined || Number.isNaN(score)) return 'neutral';
  if (score >= 7) return 'good';
  if (score >= 4) return 'neutral';
  return 'bad';
}

function getScoreText(score: number | null | undefined): string {
  if (score === null || score === undefined || Number.isNaN(score)) return DEFAULT_SCORE_TEXT;
  const rounded = Math.round(score * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}` : `${rounded}`;
}

/* ------------------- Time window formatting helpers ------------------- */

function getWindowLabel(window: TimeWindow | undefined, index: number): string {
  if (!window) return `Window ${index + 1}`;
  return window.label || window.name || window.category || `Window ${index + 1}`;
}

/**
 * Format time range for a TimeWindow using available fields.
 */
function formatTimeRange(window: TimeWindow | undefined, options: FormatOptions = {}): string | null {
  if (!window) return null;
  // Prefer backend-provided display fields
  const startDisplay = (window as any).start_display ?? (window as any).startDisplay ?? null;
  const endDisplay = (window as any).end_display ?? (window as any).endDisplay ?? null;
  // Prefer ISO fields if present, else raw fields
  const startValue = (window as any).startISO ?? (window as any).start_iso ?? window.start;
  const endValue = (window as any).endISO ?? (window as any).end_iso ?? window.end;

  // If both numeric slots - special handling
  if (isNumericSlot(startValue) && isNumericSlot(endValue)) {
    const startSlot = typeof startValue === 'number' ? startValue : parseInt(String(startValue), 10);
    const endSlot = typeof endValue === 'number' ? endValue : parseInt(String(endValue), 10);
    if (startSlot === endSlot) {
      const range = slotToTimeRange(startSlot, options.slotMinutes ?? 90, options.useAmpm ?? true);
      return range?.replace(' – ', ' → ');
    }
  }

  const s = startDisplay || formatTime(startValue as any, options);
  const e = endDisplay || formatTime(endValue as any, options);
  const safeStart = s || DEFAULT_TIME_PLACEHOLDER;
  const safeEnd = e || DEFAULT_TIME_PLACEHOLDER;
  if (!s && !e && !startDisplay && !endDisplay) return DEFAULT_RANGE_PLACEHOLDER;
  return `${safeStart} → ${safeEnd}`;
}

function buildWindowString(window: TimeWindow | undefined, index: number, options: FormatOptions = {}): string {
  const label = getWindowLabel(window, index);
  const timeRange = formatTimeRange(window, options);
  if (timeRange) return `${label} (${timeRange})`;
  return label;
}

/* ------------------- Token expansion ------------------- */

/**
 * Expand tokens like time_windows[0] in text into readable time ranges.
 *
 * windows may contain TimeWindow objects OR raw string/number entries from the API.
 */
function expandTimeWindowTokens(
  text: string,
  windows: Array<TimeWindow | string | number> | null | undefined,
  options: FormatOptions = {},
): string {
  if (!text) return '';
  const tokenPattern = /time_windows\[(\d+)\]/gi;

  const fallbackMarkup = `<span class="mv-time-window mv-severity--neutral mv-neutral" data-severity="neutral"><span class="mv-time-range">${DEFAULT_RANGE_PLACEHOLDER}</span> <span class="mv-score mv-score--neutral">${DEFAULT_SCORE_TEXT}</span></span>`;

  // ensure we won't spam console in development
  let missingLogged = false;

  return text.replace(tokenPattern, (_match, idxStr) => {
    const idx = parseInt(idxStr, 10);
    if (!windows || !Array.isArray(windows)) {
      if (!missingLogged && process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('[cleanSummaryWithWindows] No windows provided for time_windows tokens');
        missingLogged = true;
      }
      return fallbackMarkup;
    }
    if (idx < 0 || idx >= windows.length) return fallbackMarkup;

    // Read the raw entry as unknown and normalize
    const windowEntry: unknown = windows[idx];

    let normalized: NormalizedTimeWindow;
    if (typeof windowEntry === 'object' || typeof windowEntry === 'number' || typeof windowEntry === 'string') {
      normalized = normalizeTimeWindow(windowEntry as any, idx, options);
    } else {
      return fallbackMarkup;
    }

    const timeRange = formatTimeRange(normalized, options) || DEFAULT_RANGE_PLACEHOLDER;
    const scoreText = normalized.scoreText ?? getScoreText(normalized.score ?? null);
    const variant = normalized.scoreVariant ?? getScoreVariant(normalized.score ?? null);
    const severity = normalized.severity ?? 'neutral';
    const scoreClass = `mv-score mv-score--${variant}`;
    const pakshiBadges: string[] = [];
    if (normalized.pakshi_day) {
      pakshiBadges.push(`<span class="mv-pakshi-badge mv-pakshi--${severity}">Day: ${normalized.pakshi_day}</span>`);
    }
    if (normalized.pakshi_night) {
      pakshiBadges.push(`<span class="mv-pakshi-badge mv-pakshi--${severity}">Night: ${normalized.pakshi_night}</span>`);
    }
    return `<span class="mv-time-window mv-severity--${severity} mv-${severity}" data-severity="${severity}"><span class="mv-time-range">${timeRange}</span> <span class="${scoreClass}">${scoreText}</span>${pakshiBadges.length ? ' ' + pakshiBadges.join(' ') : ''}</span>`;
  });
}

/* ------------------- Normalization: buildTimeWindows ------------------- */

/**
 * Generate a unique key for a time window for deduplication purposes.
 * Key format: "name|start|end"
 * 
 * @param window - Time window object
 * @returns Deduplication key string
 */
function getWindowDedupeKey(window: TimeWindow): string {
  const name = window.name ?? window.label ?? window.category ?? '';
  const start = window.start ?? '';
  const end = window.end ?? '';
  return `${name}|${start}|${end}`;
}

/**
 * Remove duplicate time windows from an array.
 * Keeps the first occurrence of each unique window.
 * 
 * @param windows - Array of time windows (may contain duplicates)
 * @returns Deduplicated array of time windows
 */
function dedupeTimeWindows<T extends TimeWindow>(windows: T[] | null | undefined): T[] {
  if (!windows || !Array.isArray(windows)) return [];

  const seen = new Set<string>();
  const result: T[] = [];
  
  for (const window of windows) {
    const key = getWindowDedupeKey(window);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(window);
    }
  }

  return result;
}

function normalizePakshi(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    return trimmed;
  }
  if (typeof value === 'object' && (value as any).pakshi) {
    return normalizePakshi((value as any).pakshi);
  }
  return 'Unknown Pakshi';
}

function mapSeverityText(value: unknown): WindowSeverity | undefined {
  if (!value) return undefined;
  const text = String(value).toLowerCase();
  if (/highly\s+inauspicious|\binauspicious\b|\bavoid\b|unfavourable|unfavorable|\bbad\b|malefic|caution|negative/.test(text))
    return 'inauspicious';
  if (/highly\s+auspicious|\bauspicious\b|favourable|favorable|\bgood\b|benefic|positive/.test(text)) return 'auspicious';
  if (/neutral|mixed|challenging|moderate/.test(text)) return 'neutral';
  return undefined;
}

function mapSeverityFromScore(score: number | null | undefined): WindowSeverity | undefined {
  if (score == null || Number.isNaN(score)) return undefined;
  if (score >= 7) return 'auspicious';
  if (score <= 3) return 'inauspicious';
  return 'neutral';
}

function mapCategoryToSeverity(category?: string): WindowSeverity | undefined {
  if (!category) return undefined;
  const lowerCategory = category.toLowerCase();

  if (
    lowerCategory.includes('highly inauspicious') ||
    lowerCategory.includes('inauspicious') ||
    lowerCategory.includes('bad') ||
    lowerCategory.includes('avoid') ||
    lowerCategory.includes('negative') ||
    lowerCategory.includes('unfavourable') ||
    lowerCategory.includes('unfavorable') ||
    lowerCategory.includes('malefic')
  ) {
    return 'inauspicious';
  }

  if (
    lowerCategory.includes('highly auspicious') ||
    lowerCategory.includes('auspicious') ||
    lowerCategory.includes('good') ||
    lowerCategory.includes('favourable') ||
    lowerCategory.includes('favorable') ||
    lowerCategory.includes('excellent') ||
    lowerCategory.includes('positive')
  ) {
    return 'auspicious';
  }

  if (
    lowerCategory.includes('challenging') ||
    lowerCategory.includes('neutral') ||
    lowerCategory.includes('mixed') ||
    lowerCategory.includes('moderate')
  ) {
    return 'neutral';
  }

  return undefined;
}

function normalizeSeverityValue(severity: unknown): WindowSeverity | undefined {
  const mapped = mapSeverityText(severity);
  if (mapped) return mapped;
  if (!severity) return undefined;
  const raw = String(severity).toLowerCase();
  if (raw === 'auspicious' || raw === 'inauspicious' || raw === 'neutral') return raw;
  return undefined;
}

function getCategoryVariant(category?: string, score?: number | null): CategoryVariant {
  if (category) {
    const fromCategory = mapCategoryToSeverity(category) ?? mapSeverityText(category);
    if (fromCategory) return fromCategory;
  }

  const fromScore = mapSeverityFromScore(score ?? undefined);
  if (fromScore) return fromScore;

  return 'default';
}

function mapVariantToSeverity(
  twSeverity: NormalizedTimeWindow['severity'] | undefined,
  variant: CategoryVariant,
): WindowSeverity {
  const explicit = normalizeSeverityValue(twSeverity);
  if (explicit) return explicit;
  if (variant === 'auspicious') return 'auspicious';
  if (variant === 'inauspicious') return 'inauspicious';
  return 'neutral';
}

function determineSeverity(window: Partial<TimeWindow>, normalizedScore: number | null | undefined): WindowSeverity {
  const explicitSeverity =
    (window as any).severity ??
    (window as any).impact ??
    (window as any).status ??
    (window as any).ght_status ??
    (window as any).pakshi_status;

  const normalizedExplicit = normalizeSeverityValue(explicitSeverity);
  if (normalizedExplicit) return normalizedExplicit;

  const categorySeverity = mapCategoryToSeverity((window as any).category ?? (window as any).type);
  if (categorySeverity) return categorySeverity;

  const scoreSeverity = mapSeverityFromScore(normalizedScore ?? undefined);
  if (scoreSeverity) return scoreSeverity;

  return 'neutral';
}

function parseEmbeddedWindowsJson(note?: string | null): { embeddedData?: Record<string, any>; cleanedNote: string } {
  if (!note) return { cleanedNote: '' };
  // First, look for explicit markers that may prefix JSON blobs
  const marker = '__windows_json__';
  const lower = note.toLowerCase();
  const idx = lower.indexOf(marker);
  if (idx === -1) {
    // If no explicit marker is present, attempt to find and parse any JSON object embedded in the note
    const genericParse = extractAndParseJson(note);
    if (genericParse.embeddedData) {
      return genericParse;
    }
    return { cleanedNote: stripDebugBlocks(note) };
  }

  const afterMarker = note.slice(idx + marker.length);
  const braceMatch = /[\[{]/.exec(afterMarker);
  let embeddedData: Record<string, any> | undefined;
  let cleanedNote = note;

  if (braceMatch && braceMatch.index !== undefined) {
    const braceIdx = idx + marker.length + braceMatch.index;
    const open = note[braceIdx];
    const close = open === '[' ? ']' : '}';
    let depth = 0;
    let endIdx = note.length;

    for (let i = braceIdx; i < note.length; i++) {
      const ch = note[i];
      if (ch === open) depth += 1;
      if (ch === close) {
        depth -= 1;
        if (depth === 0) {
          endIdx = i + 1;
          break;
        }
      }
    }

    const candidate = note.slice(braceIdx, endIdx).trim();
    const attempts = [candidate, candidate.replace(/&quot;|&#34;/gi, '"'), candidate.replace(/\\\"/g, '"')];

    for (const attempt of attempts) {
      try {
        const parsed = JSON.parse(attempt);
        if (parsed && typeof parsed === 'object') {
          embeddedData = parsed as Record<string, any>;
          break;
        }
      } catch {
        // continue to next attempt
      }
    }

    cleanedNote = note.slice(0, idx) + note.slice(endIdx);
  } else {
    cleanedNote = note.replace(marker, '');
  }

  return { embeddedData, cleanedNote: stripDebugBlocks(cleanedNote) };
}

function extractAndParseJson(text: string): { embeddedData?: Record<string, any>; cleanedNote: string } {
  if (!text) return { cleanedNote: '' };

  const source = String(text);
  const braceMatch = /[\[{]/.exec(source);
  if (!braceMatch || braceMatch.index === undefined) {
    return { cleanedNote: stripDebugBlocks(source) };
  }

  const open = source[braceMatch.index];
  const close = open === '[' ? ']' : '}';
  let depth = 0;
  let endIdx = source.length;

  for (let i = braceMatch.index; i < source.length; i++) {
    const ch = source[i];
    if (ch === open) depth += 1;
    if (ch === close) {
      depth -= 1;
      if (depth === 0) {
        endIdx = i + 1;
        break;
      }
    }
  }

  const candidate = source.slice(braceMatch.index, endIdx).trim();
  if (!candidate || candidate.length < 4) {
    return { cleanedNote: stripDebugBlocks(source) };
  }

  const attempts = [candidate, candidate.replace(/&quot;|&#34;/gi, '"'), candidate.replace(/\\\"/g, '"')];
  for (const attempt of attempts) {
    try {
      const parsed = JSON.parse(attempt);
      if (parsed && typeof parsed === 'object') {
        const cleanedNote = `${source.slice(0, braceMatch.index)}${source.slice(endIdx)}`;
        return { embeddedData: parsed as Record<string, any>, cleanedNote: stripDebugBlocks(cleanedNote) };
      }
    } catch {
      // ignore
    }
  }

  return { cleanedNote: stripDebugBlocks(source) };
}

/**
 * Normalize a single time window into NormalizedTimeWindow format.
 * Computes display fields, ISO times, and card_date.
 * 
 * @param window - Raw time window object
 * @param idx - Index of the window (used for fallback naming)
 * @returns Normalized time window with all computed fields
 */
function normalizeTimeWindow(
  window: TimeWindow | Partial<TimeWindow>,
  idx: number,
  options: FormatOptions = {},
): NormalizedTimeWindow {
  // Accept raw shapes: number, string, or object
  let wObj: Partial<TimeWindow> = {};
  if (typeof window === 'number' || typeof window === 'string') {
    // Treat as a simple slot or time-range string
    wObj = { start: window as any };
  } else if (typeof window === 'object' && window !== null) {
    wObj = { ...window };
  } else {
    wObj = {};
  }

  const { embeddedData, cleanedNote } = parseEmbeddedWindowsJson(
    (wObj as any).note ?? (wObj as any).short_desc ?? (wObj as any).description,
  );

  if (embeddedData) {
    wObj = { ...embeddedData, ...wObj };
  }

  const name = (wObj.name || (wObj as any).title || wObj.label || wObj.category || `Window ${idx + 1}`) as string;
  
  // Determine ISO fields from possible keys
  // Extract ISO timestamps with fallback to constructing from target_date + display times
  let startISO =
    (wObj as any).startISO ?? (wObj as any).start_iso ?? (typeof wObj.start === 'string' ? wObj.start : undefined) ?? null;
  let endISO =
    (wObj as any).endISO ?? (wObj as any).end_iso ?? (typeof wObj.end === 'string' ? wObj.end : undefined) ?? null;
  
  // If ISO timestamps are missing but we have display times and target_date, construct them
  if ((!startISO || !endISO) && options.date) {
    const startDisplay = (wObj as any).startDisplay ?? (wObj as any).start_display;
    const endDisplay = (wObj as any).endDisplay ?? (wObj as any).end_display;

    if (startDisplay && !startISO) {
      // Try to construct ISO from date + display time
      const constructedISO = constructISOFromDateAndTime(options.date, startDisplay, options.tz);
      if (constructedISO) {
        startISO = constructedISO;
      }
    }

    if (endDisplay && !endISO) {
      // Try to construct ISO from date + display time
      const constructedISO = constructISOFromDateAndTime(options.date, endDisplay, options.tz);
      if (constructedISO) {
        endISO = constructedISO;
      }
    }
  }

  // prefer backend display, otherwise format
  const startDisplayRaw =
    (wObj as any).startDisplay ?? (wObj as any).start_display ?? (startISO ? formatLocal(startISO, 'time') : (wObj.start ? formatLocal(wObj.start, 'time') : ''));
  const endDisplayRaw =
    (wObj as any).endDisplay ?? (wObj as any).end_display ?? (endISO ? formatLocal(endISO, 'time') : (wObj.end ? formatLocal(wObj.end, 'time') : ''));

  const startDisplay = startDisplayRaw || DEFAULT_TIME_PLACEHOLDER;
  const endDisplay = endDisplayRaw || DEFAULT_TIME_PLACEHOLDER;
  const normalizedScore = normalizeScoreValue((wObj as any).score);
  const severity = determineSeverity(wObj, normalizedScore) ?? 'neutral';
  const pakshi_day = normalizePakshi(
    (wObj as any).pakshi_day ??
      (wObj as any).day_ruling_pakshi ??
      (wObj as any).day_pakshi ??
      (wObj as any).pakshi ??
      (wObj as any).dayPakshi,
  );
  const pakshi_night = normalizePakshi(
    (wObj as any).pakshi_night ??
      (wObj as any).night_ruling_pakshi ??
      (wObj as any).night_pakshi ??
      (wObj as any).nightPakshi,
  );
  const pakshi_status = (wObj as any).pakshi_status ?? (wObj as any).ght_status ?? undefined;

  const cleanedShortDesc = stripDebugBlocks(
    (wObj as any).short_desc ?? (wObj as any).description ?? cleanedNote ?? '',
  );

  // Also apply aggressive cleaning to the note field
  const cleanedNoteProcessed = stripDebugBlocks(cleanedNote || '');
  // If the cleaned note looks empty or still contains raw data patterns, use the cleaned short desc instead
  const finalNote = looksLikeRawJsonData(cleanedNoteProcessed) 
    ? (cleanedShortDesc || undefined) 
    : cleanedNoteProcessed;

  const scoreVariant: 'good' | 'neutral' | 'bad' = getScoreVariant(normalizedScore);

  // Generate card_date from the start ISO if available
  let card_date: string | undefined = (wObj as any).card_date;
  if (!card_date && startISO) {
    try {
      const d = new Date(startISO);
      if (!isNaN(d.getTime())) {
        card_date = d.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      }
    } catch {
      // ignore
    }
  }

  const normalized: NormalizedTimeWindow = {
    ...(wObj as TimeWindow),
    name,
    index: idx,
    startISO: startISO ?? undefined,
    endISO: endISO ?? undefined,
    start_iso: startISO ?? undefined,
    end_iso: endISO ?? undefined,
    startDisplay,
    endDisplay,
    start_display: startDisplay,
    end_display: endDisplay,
    short_desc: cleanedShortDesc || undefined,
    note: finalNote,
    score: normalizedScore ?? null,
    scoreText: getScoreText(normalizedScore),
    scoreVariant,
    severity,
    pakshi_day,
    pakshi_night,
    pakshi_status,
    card_date,
    type: (wObj as any).type ?? undefined,
    facts_html: (wObj as any).facts_html ?? (wObj as any).facts ?? undefined,
    interpretation_html: (wObj as any).interpretation_html ?? (wObj as any).interpretation ?? undefined,
    practical_html: (wObj as any).practical_html ?? (wObj as any).practical ?? undefined,
    raw: window,
  } as NormalizedTimeWindow;

  return normalized;
}

/**
 * Normalize an incoming 'time_windows' structure into an array of NormalizedTimeWindow.
 *
 * The function accepts a variety of shapes and produces consistent fields:
 * - name (canonical)
 * - startISO / endISO
 * - startDisplay / endDisplay
 * - short_desc, severity, card_date, type
 * 
 * Also deduplicates windows based on name, start, and end times.
 * Looks for time_windows in: top-level, debug.layers, layers (deprecated)
 */
function buildTimeWindows(data: any, options: FormatOptions = {}): NormalizedTimeWindow[] {
  // Normalize layers early (string -> object) so callers can send raw DB content
  let layers: any = data?.layers ?? data?.layer ?? data?.data ?? null;
  if (typeof layers === 'string') {
    try {
      layers = JSON.parse(layers);
    } catch {
      // Silently ignore parse errors in production; layers will be null
      layers = null;
    }
  }

  const windowsRaw: any[] =
    (layers && Array.isArray(layers.time_windows) ? layers.time_windows : null) ??
    data?.time_windows ??
    (data?.debug?.layers && data.debug.layers.time_windows) ??
    (data?.layers && data.layers.time_windows) ??
    [];
  if (!Array.isArray(windowsRaw)) return [];

  // First deduplicate raw windows
  const dedupedRaw = dedupeTimeWindows(windowsRaw);

  return dedupedRaw.map((wRaw: any, idx: number): NormalizedTimeWindow => {
    return normalizeTimeWindow(wRaw, idx, options);
  });
}

/* ------------------- Summary cleaning utilities ------------------- */

/**
 * Warning flag state for expandTimeWindowTokens - used by tests to reset warning state.
 */
let _warningLogged = false;

/**
 * Reset the warning flag used in expandTimeWindowTokens.
 * This is primarily for testing purposes.
 */
function resetWarningFlag(): void {
  _warningLogged = false;
}

/**
 * Collapse consecutive identical lines into a single line.
 * Preserves empty lines for paragraph spacing.
 * 
 * @param text - Input text to collapse
 * @returns Text with consecutive duplicates removed
 */
function collapseIdenticalLines(text: string): string {
  if (!text) return '';
  
  const lines = text.split('\n');
  const result: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const currentLine = lines[i];
    const prevLine = result.length > 0 ? result[result.length - 1] : null;
    
    // Always keep empty lines for paragraph spacing
    // Only skip if current line equals the previous non-empty line
    if (currentLine.trim() === '' || currentLine !== prevLine) {
      result.push(currentLine);
    }
  }
  
  return result.join('\n');
}

/**
 * Collapse repeated boilerplate phrases in text.
 * Common phrases like "Stay observant today." can appear multiple times
 * in AI-generated content. This function reduces them to at most 2 occurrences.
 * 
 * @param text - Input text to clean
 * @returns Text with repeated boilerplate reduced
 */
function collapseBoilerplate(text: string): string {
  if (!text) return '';
  
  // Common boilerplate patterns that might be repeated
  const boilerplatePatterns = [
    /Stay observant today\./gi,
    /Be mindful of changes\./gi,
    /Trust your intuition\./gi,
    /Focus on positive energy\./gi,
  ];
  
  let out = text;
  
  for (const pattern of boilerplatePatterns) {
    // Find all matches
    const matches = out.match(pattern);
    if (matches && matches.length > 2) {
      // Keep only the first 2 occurrences
      let count = 0;
      out = out.replace(pattern, (match) => {
        count++;
        return count <= 2 ? match : '';
      });
    }
  }
  
  // Clean up any double horizontal spaces or multiple periods from removal
  // Use [^\S\n\r] to match whitespace except newlines (preserve line breaks)
  out = out.replace(/[^\S\n\r]{2,}/g, ' ').replace(/\.{2,}/g, '.').trim();
  
  return out;
}

/**
 * Convert metadata bracketed hints to readable format.
 * Transforms patterns like [based on core_layers.panchang.data.moon_sign]
 * into human-readable hints like *(based on moon sign)*
 * 
 * @param text - Input text with metadata brackets
 * @returns Text with metadata converted to readable hints
 */
function convertMetadataToHints(text: string): string {
  if (!text) return '';
  
  // Match patterns like [based on some.dotted.path.field_name]
  const metadataPattern = /\[based on\s+([^\]]+)\]/gi;
  
  return text.replace(metadataPattern, (_match, path: string) => {
    // Extract the last segment of the path (the most meaningful part)
    const segments = path.split('.');
    const lastSegment = segments[segments.length - 1] || path;
    
    // Convert snake_case to spaces
    const readable = lastSegment.replace(/_/g, ' ').trim();
    
    // Return as a styled hint
    return `*(based on ${readable})*`;
  });
}

/* ------------------- Summary cleaning ------------------- */

/**
 * Strip backend-only metadata sections from summary text.
 * Removes sections like "Windows Explanation", "Appendix", "References", etc.
 * that should not appear in user-facing previews.
 * 
 * @param text - Input text that may contain backend metadata sections
 * @returns Text with metadata sections removed
 */
function stripMetadataSections(text: string): string {
  if (!text) return '';
  
  let result = text;
  
  // Remove leading "Updated: <date>" pattern (case-insensitive)
  result = result.replace(/^Updated:\s*[^\n]+\n*/i, '');
  
  // Pattern to match backend-only section headers and everything after them
  // Matches: "Windows Explanation", "## Windows Explanation", "# Windows Explanation:", etc.
  const backendSectionPatterns = [
    // Windows Explanation (most common)
    /(?:^|\n)\s*(?:#{1,6}\s*)?Windows\s+Explanation[:\s]?[\s\S]*$/i,
    // Appendix sections
    /(?:^|\n)\s*(?:#{1,6}\s*)?Appendix[:\s]?[\s\S]*$/i,
    // Technical/Debug sections
    /(?:^|\n)\s*(?:#{1,6}\s*)?(?:Technical\s+)?(?:Debug|Debugging)\s+(?:Info|Information|Notes?)[:\s]?[\s\S]*$/i,
    // Internal notes
    /(?:^|\n)\s*(?:#{1,6}\s*)?Internal\s+Notes?[:\s]?[\s\S]*$/i,
  ];
  
  for (const pattern of backendSectionPatterns) {
    const match = result.match(pattern);
    if (match && match.index !== undefined) {
      result = result.slice(0, match.index).trim();
    }
  }
  
  return result;
}

/**
 * Remove standalone JSON objects and arrays from text.
 * Looks for balanced {...} or [...] patterns that look like raw JSON data
 * and removes them while preserving surrounding text.
 * 
 * @param text - Text that may contain embedded JSON blobs
 * @returns Text with JSON blobs removed
 */
function stripStandaloneJsonBlobs(text: string): string {
  if (!text) return '';
  
  // Named constants for magic numbers
  const MAX_ITERATIONS = 100; // Safety limit to prevent infinite loops
  const MAX_JSON_BLOB_SIZE = 5000; // Maximum size of a JSON blob to process
  const MIN_JSON_BLOB_LENGTH = 4; // Minimum length for a JSON blob to be stripped (smallest valid: '{"a":1}' = 7 chars)
  
  let result = text;
  
  // Pattern to detect JSON-like structures: {...} or [...]
  // We look for opening braces/brackets that might indicate a JSON blob
  let searchStart = 0;
  let iterations = 0;
  
  while (searchStart < result.length && iterations < MAX_ITERATIONS) {
    iterations++;
    
    // Find the next opening brace or bracket
    const braceMatch = /[\[{]/.exec(result.slice(searchStart));
    if (!braceMatch || braceMatch.index === undefined) break;
    
    const startIdx = searchStart + braceMatch.index;
    const openChar = result[startIdx];
    const closeChar = openChar === '{' ? '}' : ']';
    
    // Track depth to find matching close
    let depth = 0;
    let endIdx = startIdx;
    let foundEnd = false;
    
    for (let i = startIdx; i < result.length && i < startIdx + MAX_JSON_BLOB_SIZE; i++) {
      const ch = result[i];
      if (ch === openChar) depth++;
      if (ch === closeChar) {
        depth--;
        if (depth === 0) {
          endIdx = i + 1;
          foundEnd = true;
          break;
        }
      }
    }
    
    if (!foundEnd) {
      // Unclosed brace - skip past it
      searchStart = startIdx + 1;
      continue;
    }
    
    const candidate = result.slice(startIdx, endIdx);
    
    // Check if this looks like JSON (contains quoted keys or array elements)
    // We want to remove it if it looks like raw data, not natural prose
    const looksLikeJson = (
      // Object with quoted keys: {"key": or {'key':
      /^[\[{]\s*"[\w_-]+"\s*:/.test(candidate) ||
      // Array of objects: [{"key": or [{'key':
      /^\[\s*\{\s*"[\w_-]+"\s*:/.test(candidate) ||
      // Array starting with quoted string: ["
      /^\[\s*"/.test(candidate) ||
      // Object with multiple key:value pairs (indicates structured data)
      (candidate.match(/"\w+"\s*:/g)?.length ?? 0) >= 2
    );
    
    if (looksLikeJson && candidate.length > MIN_JSON_BLOB_LENGTH) {
      // Remove the JSON blob
      result = result.slice(0, startIdx) + result.slice(endIdx);
      // Don't advance searchStart - check same position again
    } else {
      // Not JSON-like, skip past this position
      searchStart = startIdx + 1;
    }
  }
  
  return result;
}

/**
 * Aggressive debug-stripper: removes markers, fenced JSON, leaked key:value pairs,
 * stray backticks, and collapses whitespace/punctuation. Designed to run early
 * in the summary pipeline to prevent raw JSON from leaking into UI.
 */
export function stripDebugBlocks(text?: string | null): string {
  if (!text) return '';
  let out = String(text);

  const lowerMarkers = ['__windows_json__', '__debug__'];

  // 1) Remove marker-prefixed JSON blobs
  for (const marker of lowerMarkers) {
    let searchStart = 0;
    while (searchStart < out.length) {
      const idx = out.toLowerCase().indexOf(marker, searchStart);
      if (idx === -1) break;
      let cursor = idx + marker.length;
      while (cursor < out.length && /[\s:\r\n]/.test(out[cursor])) cursor += 1;
      if (cursor < out.length && (out[cursor] === '{' || out[cursor] === '[')) {
        const open = out[cursor];
        const close = open === '{' ? '}' : ']';
        let depth = 0;
        let endIdx = cursor;
        while (endIdx < out.length) {
          const ch = out[endIdx];
          if (ch === open) depth += 1;
          if (ch === close) {
            depth -= 1;
            if (depth === 0) {
              endIdx += 1;
              break;
            }
          }
          endIdx += 1;
        }
        out = `${out.slice(0, idx)}${out.slice(endIdx)}`;
        searchStart = Math.max(idx - 1, 0);
      } else {
        out = `${out.slice(0, idx)}${out.slice(cursor)}`;
        searchStart = idx;
      }
    }
  }

  // 2) Remove explicit markers and fenced JSON/code blocks
  out = out.replace(/__windows_json__|__debug__/gi, '');
  out = out.replace(/```(?:json|javascript|js)?[\s\S]*?```/gi, '');
  out = out.replace(/``+/g, ' ');

  // 3) Remove standalone JSON objects/arrays that look like raw data
  // This catches cases like: {"key": "value", ...} or [{"key": "value"}, ...]
  out = stripStandaloneJsonBlobs(out);

  // 4) Remove obvious leaked JSON key:value fragments and empty structures
  out = out.replace(/"[\w\s-]+"\s*:\s*("[^"]*"|\d+|true|false|null)\s*,?/gi, '');
  out = out.replace(/\{\s*\}|\[\s*\]/g, '');

  // 5) Remove partial JSON fragments that look like backend data leaks
  // Patterns like: ght_status":"Neutral", "day_ruling_pakshi":"Owl", etc.
  // These are partial JSON that didn't get fully stripped
  // Match unquoted keys ending with quote+colon, or quoted keys with value
  out = out.replace(/\w+_\w+"\s*:\s*"[^"]*"\s*,?/gi, '');
  out = out.replace(/"\w+"\s*:\s*"[^"]*"\s*,?/gi, '');
  // Remove patterns like: }}},{"index":1,"label":"  or  }}}}} (3+ consecutive closing braces/brackets)
  out = out.replace(/[}\]]{3,}\s*,?\s*\{?"?[\w]*"?:?/g, '');
  // Remove patterns like: {"index":0,"label":" or [{"index": (but not time_windows[0])
  out = out.replace(/[\[{]\s*"\w+"\s*:\s*\d*\s*,?\s*"?\w*"?\s*:?\s*"?/g, '');

  // 6) Remove trailing debug labels
  out = out.replace(/(?:Debug|Raw payload|Raw data)[:\-]?\s*[\s\S]*$/i, '');

  // 7) Collapse punctuation/whitespace artifacts from removals
  out = out
    .replace(/\s+[,.]/g, (m) => m.trim())
    .replace(/[\t ]{2,}/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s+,/g, ',')
    .replace(/\s+\./g, '.')
    .replace(/,+/g, ',')
    // Remove multiple consecutive braces/brackets (but preserve single brackets for time_windows[n])
    .replace(/[{}]{2,}|[\[\]]{2,}/g, '')
    .trim();

  return out;
}

/**
 * Basic cleanup and expand function for AI-generated summary text.
 *
 * - Expands time_windows[n] tokens if windows array provided
 * - Replaces ISO datetimes with formatted strings where possible
 * - Converts metadata brackets to readable hints
 * - Collapses identical lines and boilerplate
 * - Strips backend-only metadata sections (Windows Explanation, Appendix, etc.)
 * - Removes obvious source footers or repeated metadata blocks
 *
 * Returns the cleaned summary string.
 */
function cleanSummaryWithWindows(summary: string | undefined | null, windows?: TimeWindow[] | null, options: FormatOptions = {}): string {
  if (!summary) return '';

  // 0. Aggressively strip debug markers/JSON up front
  let out = stripDebugBlocks(summary);

  // 1. Expand tokens
  if (/time_windows\[\d+\]/i.test(out)) {
    try {
      out = expandTimeWindowTokens(out, windows ?? undefined, options);
    } catch (e) {
      // be defensive: do not blow up rendering
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[cleanSummaryWithWindows] expandTimeWindowTokens failed', e);
      }
    }
  }

  // 2. Replace ISO datetimes with readable strings where applicable
  try {
    out = formatIsoDatetimesInText(out);
  } catch {
    // ignore
  }

  // 3. Convert metadata brackets to readable hints
  try {
    out = convertMetadataToHints(out);
  } catch {
    // ignore
  }

  // 4. Collapse identical consecutive lines
  try {
    out = collapseIdenticalLines(out);
  } catch {
    // ignore
  }

  // 5. Collapse repeated boilerplate phrases
  try {
    out = collapseBoilerplate(out);
  } catch {
    // ignore
  }

  // 6. Remove trailing "Sources:" blocks or "Raw sources:" often appended
  out = out.replace(/(?:\n|\r|\r\n)\s*(Sources?|Raw sources?|References|Credits)\s*[:\-]\s*[\s\S]*$/i, '');

  // 7. Strip backend-only metadata sections (Windows Explanation, Appendix, etc.)
  try {
    out = stripMetadataSections(out);
  } catch {
    // ignore
  }

  // 8. Normalize excessive newlines to max 2 (preserve paragraph breaks)
  out = out.replace(/(\r?\n){3,}/g, '\n\n');

  // 9. Normalize horizontal whitespace (spaces, tabs) but not newlines
  out = out.replace(/[^\S\n]{2,}/g, ' ').trim();

  // 10. Final defensive strip of debug markers / JSON blocks
  try {
    out = stripDebugBlocks(out);
  } catch {
    // ignore
  }
  return out;
}

/* ------------------- Window Number Replacement ------------------- */

/**
 * Converts window number references in text to human-readable time ranges.
 * E.g., "Windows 3, 4, 6, 7, 8, 9, 12, 13, 14, and 15" becomes time ranges like "9:16 AM – 10:46 AM, ..."
 * 
 * @param text - The text containing window number references
 * @param windows - The array of normalized time windows with start/end times
 * @returns Text with window numbers replaced by time ranges
 */
function replaceWindowNumbersWithTimeRanges(
  text: string, 
  windows: NormalizedTimeWindow[]
): string {
  if (!text || !windows || windows.length === 0) return text;
  
  // Helper to get display time from a window index (1-based as shown in AI text)
  const getTimeRangeForWindow = (windowNum: number): string | null => {
    const idx = windowNum - 1; // Convert to 0-indexed
    if (idx < 0 || idx >= windows.length) return null;
    const w = windows[idx];
    const start = w.startDisplay || formatLocal(w.startISO ?? w.start, 'time') || '--:--';
    const end = w.endDisplay || formatLocal(w.endISO ?? w.end, 'time') || '--:--';
    return `${start} – ${end}`;
  };
  
  let result = text;
  
  // Pattern to match window list references in text
  // Matches: "Windows 3, 4, 6, 7, 8, 9, 12, 13, 14, and 15" or "windows 3 and 4"
  // 
  // Pattern breakdown:
  //   (?:Windows?|windows?)         - Match "Window", "Windows", "window", or "windows"
  //   \s*                           - Optional whitespace
  //   ((?:\d+\s*[,\s]+)*            - Match digits followed by comma/space (repeated)
  //   (?:\d+\s*(?:and|&)\s*)?       - Optional "and" or "&" before last number
  //   \d+)                          - Final digit(s) to complete the list
  const windowListPattern = /(?:Windows?|windows?)\s*((?:\d+\s*[,\s]+)*(?:\d+\s*(?:and|&)\s*)?\d+)/gi;
  
  result = result.replace(windowListPattern, (_match, windowList: string) => {
    // Extract all window numbers from the list
    const numbers = windowList.match(/\d+/g);
    if (!numbers || numbers.length === 0) return _match;
    
    const windowNums = numbers.map(n => parseInt(n, 10)).filter(n => !isNaN(n));
    if (windowNums.length === 0) return _match;
    
    // Find contiguous ranges in the window numbers
    const sortedNums = [...new Set(windowNums)].sort((a, b) => a - b);
    const ranges: { start: number; end: number }[] = [];
    let rangeStart = sortedNums[0];
    let rangeEnd = sortedNums[0];
    
    for (let i = 1; i < sortedNums.length; i++) {
      if (sortedNums[i] === rangeEnd + 1) {
        rangeEnd = sortedNums[i];
      } else {
        ranges.push({ start: rangeStart, end: rangeEnd });
        rangeStart = sortedNums[i];
        rangeEnd = sortedNums[i];
      }
    }
    ranges.push({ start: rangeStart, end: rangeEnd });
    
    // Convert ranges to time strings
    const timeRanges: string[] = [];
    for (const range of ranges) {
      const startTime = getTimeRangeForWindow(range.start);
      const endTime = getTimeRangeForWindow(range.end);
      
      if (startTime && endTime) {
        if (range.start === range.end) {
          // Single window
          timeRanges.push(startTime);
        } else {
          // Range of windows - use start of first and end of last
          const startWindow = windows[range.start - 1];
          const endWindow = windows[range.end - 1];
          const rangeStartTime = startWindow?.startDisplay || formatLocal(startWindow?.startISO ?? startWindow?.start, 'time') || '--:--';
          const rangeEndTime = endWindow?.endDisplay || formatLocal(endWindow?.endISO ?? endWindow?.end, 'time') || '--:--';
          timeRanges.push(`${rangeStartTime} to ${rangeEndTime}`);
        }
      }
    }
    
    if (timeRanges.length > 0) {
      return timeRanges.join(', ');
    }
    return _match;
  });
  
  // Also handle individual "window N" references
  result = result.replace(/\b(?:window)\s*(\d+)\b/gi, (_match, num: string) => {
    const windowNum = parseInt(num, 10);
    const timeRange = getTimeRangeForWindow(windowNum);
    return timeRange || _match;
  });
  
  return result;
}

/* ------------------- Exports ------------------- */

/**
 * Named export list (only defined once for each symbol).
 * Also create a named variable for default export to satisfy import/no-anonymous-default-export.
 */
const exported = {
  cleanSummaryWithWindows,
  expandTimeWindowTokens,
  buildTimeWindows,
  formatTime,
  formatLocal,
  formatIsoDatetimesInText,
  slotToTimeRange,
  formatHoursMinutes,
  getScoreVariant,
  getScoreText,
  normalizeScoreValue,
  getWindowLabel,
  formatTimeRange,
  buildWindowString,
  collapseIdenticalLines,
  collapseBoilerplate,
  convertMetadataToHints,
  stripDebugBlocks,
  stripMetadataSections,
  resetWarningFlag,
  isNumericSlot,
  parseTimeString,
  normalizeTimeWindow,
  getWindowDedupeKey,
  dedupeTimeWindows,
  mapVariantToSeverity,
  getCategoryVariant,
  looksLikeRawJsonData,
  replaceWindowNumbersWithTimeRanges,
};

export default exported;

export {
  cleanSummaryWithWindows,
  expandTimeWindowTokens,
  buildTimeWindows,
  formatTime,
  formatLocal,
  formatIsoDatetimesInText,
  slotToTimeRange,
  formatHoursMinutes,
  getScoreVariant,
  getScoreText,
  normalizeScoreValue,
  getWindowLabel,
  formatTimeRange,
  buildWindowString,
  collapseIdenticalLines,
  collapseBoilerplate,
  convertMetadataToHints,
  stripMetadataSections,
  resetWarningFlag,
  isNumericSlot,
  parseTimeString,
  normalizeTimeWindow,
  getWindowDedupeKey,
  dedupeTimeWindows,
  mapVariantToSeverity,
  getCategoryVariant,
  looksLikeRawJsonData,
  replaceWindowNumbersWithTimeRanges,
};
