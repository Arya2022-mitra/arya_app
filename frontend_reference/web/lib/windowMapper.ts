/**
 * windowMapper.ts
 * Deterministic window mapper for daily AI summaries
 * 
 * This module provides strict validation and deterministic merging of AI time windows
 * with engine time windows. It does NOT perform fuzzy fallbacks or text parsing.
 */

/**
 * AI Time Window structure from backend (validated by API)
 */
export interface AiTimeWindow {
  /** Unique key identifier (format: "tw_N") */
  key: string;
  /** Window index (1-based, e.g., 1..16) */
  window_index: number;
  /** Human-readable summary text (required, non-empty) */
  summary: string;
  /** ISO-8601 datetime with timezone for window start */
  start_iso?: string;
  /** Human-readable start time (AM/PM format) */
  start_display?: string;
  /** ISO-8601 datetime with timezone for window end */
  end_iso?: string;
  /** Human-readable end time (AM/PM format) */
  end_display?: string;
  /** Numeric score (optional but strongly recommended) */
  score?: number;
  /** Category string (optional but strongly recommended) */
  category?: string;
  /** Interpretation text (optional) */
  interpretation?: string;
  /** Interpretation as HTML (optional) */
  interpretation_html?: string;
  /** Practical advice text (optional) */
  practical?: string;
  /** Practical advice as HTML (optional) */
  practical_html?: string;
  /** Metadata object (optional) */
  metadata?: {
    /** Confidence score (0-1) */
    confidence?: number;
    [key: string]: unknown;
  };
  /** Additional fields allowed */
  [key: string]: unknown;
}

/**
 * Engine Window structure from day prediction API
 */
export interface EngineWindow {
  /** ISO-8601 datetime with timezone for window start */
  start_iso?: string;
  /** ISO-8601 datetime with timezone for window start (snake_case variant) */
  start_Iso?: string;
  /** Human-readable start time */
  start_display?: string;
  /** Human-readable start time (snake_case variant) */
  startDisplay?: string;
  /** ISO-8601 datetime with timezone for window end */
  end_iso?: string;
  /** ISO-8601 datetime with timezone for window end (snake_case variant) */
  endISO?: string;
  /** Human-readable end time */
  end_display?: string;
  /** Human-readable end time (camelCase variant) */
  endDisplay?: string;
  /** Window name/label */
  name?: string;
  label?: string;
  /** Score from engine */
  score?: number | null;
  /** Category from engine */
  category?: string;
  /** Short description */
  short_desc?: string;
  /** Any other fields from engine */
  [key: string]: unknown;
}

/**
 * Merged Window combining engine times with AI content
 */
export interface MergedWindow extends EngineWindow {
  /** AI summary text (human-readable) */
  ai_summary?: string;
  /** AI interpretation (HTML preferred, text fallback) */
  interpretation_html?: string;
  /** AI practical advice (HTML preferred, text fallback) */
  practical_html?: string;
  /** Raw AI window data for debugging */
  ai_raw?: AiTimeWindow;
}

/**
 * Validate AI time windows array against expected structure
 * 
 * @param aiWindows - Array of AI time windows from backend
 * @param expectedCount - Expected number of windows (default: 16 for daily prediction)
 * @param strict - If true, require exact count; if false, allow partial data (default: false)
 * @returns true if validation passes, false otherwise
 */
export function validateAiWindows(
  aiWindows: unknown,
  expectedCount: number = 16,
  strict: boolean = false
): aiWindows is AiTimeWindow[] {
  // Must be an array
  if (!Array.isArray(aiWindows)) {
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('[windowMapper] Validation failed: aiWindows is not an array', typeof aiWindows);
    }
    return false;
  }

  // In non-strict mode, allow partial data (at least 1 window)
  // In strict mode, require exact count
  const minRequired = strict ? expectedCount : 1;
  
  if (aiWindows.length < minRequired) {
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn(
        `[windowMapper] Validation: aiWindows has ${aiWindows.length} entries, ` +
        `${strict ? 'expected exactly' : 'expected at least'} ${strict ? expectedCount : minRequired}. ` +
        `Validation ${strict || aiWindows.length < minRequired ? 'failed' : 'passed (partial data allowed)'}.`
      );
    }
    // In strict mode, fail if less than expected
    // In non-strict mode, fail if less than minimum (1)
    return false;
  }

  // Validate each entry
  for (let i = 0; i < aiWindows.length; i++) {
    const window = aiWindows[i];

    // Must be an object
    if (!window || typeof window !== 'object') {
      if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.error(`[windowMapper] Validation failed: aiWindows[${i}] is not an object`, typeof window);
      }
      return false;
    }

    const w = window as Record<string, unknown>;

    // Required fields: key, window_index, summary
    if (typeof w.key !== 'string') {
      if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.error(`[windowMapper] Validation failed: aiWindows[${i}].key is not a string`);
      }
      return false;
    }

    if (typeof w.window_index !== 'number') {
      if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.error(`[windowMapper] Validation failed: aiWindows[${i}].window_index is not a number`);
      }
      return false;
    }

    if (typeof w.summary !== 'string' || !w.summary.trim()) {
      if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.error(`[windowMapper] Validation failed: aiWindows[${i}].summary is not a non-empty string`);
      }
      return false;
    }

    // At least one time field is recommended but not strictly required
    // Legacy data may not have time fields, and frontend can handle this gracefully
    const hasTime = 
      typeof w.start_iso === 'string' ||
      typeof w.start_display === 'string' ||
      typeof w.end_iso === 'string' ||
      typeof w.end_display === 'string';

    // Log warning in development but don't fail validation
    if (!hasTime && typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn(
        `[windowMapper] Warning: aiWindows[${i}] has no time fields. Legacy data may not include time information.`
      );
    }
  }

  return true;
}

/**
 * Map AI time windows to engine windows deterministically
 * 
 * This function merges AI content into engine windows by matching on window index.
 * Engine window times are preserved as authoritative for current-window detection.
 * AI content (summary, interpretation, practical) is attached to each window.
 * 
 * @param aiWindows - Validated AI time windows array
 * @param engineWindows - Engine time windows array
 * @returns Array of merged windows in engine order (0..N-1)
 */
export function mapAiWindowsToEngineWindows(
  aiWindows: AiTimeWindow[],
  engineWindows: EngineWindow[]
): MergedWindow[] {
  // Create a map of AI windows by index for fast lookup
  const aiWindowMap = new Map<number, AiTimeWindow>();

  for (const aiWindow of aiWindows) {
    // Determine AI window index (prefer window_index - 1 for 0-based indexing)
    let aiIndex: number;

    if (typeof aiWindow.window_index === 'number') {
      // window_index is 1-based, convert to 0-based
      aiIndex = aiWindow.window_index - 1;
    } else if (typeof aiWindow.key === 'string') {
      // Parse key like "tw_0", "tw_1", etc.
      const match = /tw_(\d+)/i.exec(aiWindow.key);
      if (match) {
        aiIndex = parseInt(match[1], 10);
      } else {
        // Cannot determine index from key, skip this window
        if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.warn(`[windowMapper] Cannot parse index from key: ${aiWindow.key}`);
        }
        continue;
      }
    } else {
      // No valid index found, skip
      if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('[windowMapper] AI window missing both window_index and parseable key', aiWindow);
      }
      continue;
    }

    aiWindowMap.set(aiIndex, aiWindow);
  }

  // Merge AI content into engine windows
  return engineWindows.map((engineWindow, index) => {
    const aiData = aiWindowMap.get(index);

    if (!aiData) {
      // No AI data for this window, return engine window as-is
      return engineWindow as MergedWindow;
    }

    // Merge AI content into engine window
    // Engine times are preserved as authoritative
    // AI content fields are attached
    const merged: MergedWindow = {
      ...engineWindow,
      // AI human text fields
      ai_summary: aiData.summary || aiData.interpretation || aiData.practical || '',
      interpretation_html: aiData.interpretation_html || aiData.interpretation || '',
      practical_html: aiData.practical_html || aiData.practical || '',
      // Store raw AI data for debugging
      ai_raw: aiData,
    };

    // If engine doesn't have category/score, use AI values as fallback
    if (!merged.category && aiData.category) {
      merged.category = aiData.category;
    }
    if ((merged.score === null || merged.score === undefined) && typeof aiData.score === 'number') {
      merged.score = aiData.score;
    }

    return merged;
  });
}
