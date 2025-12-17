/* eslint-disable react/no-unescaped-entities */

// File: web/pages/daily-prediction.tsx
// Divine UI version — fetches all data from /api/day_prediction_ai (single source of truth)

import Image from 'next/image';
import { useEffect, useMemo, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useTranslateContent } from '@/lib/useTranslateContent';
import { useActiveProfile } from '@/lib/useActiveProfile';
import { useAuth } from '@/lib/useAuth';
import { sanitizeHtml } from '@/lib/sanitizeHtml';
import { dedupeSummary } from '@/lib/dedupeSummary';
import { formatSelectedSummary, selectSummarySource } from '@/utils/selectSummarySource';
import SummarySections from '@/components/SummarySections';
import {
  cleanSummaryWithWindows,
  FormatOptions,
  NormalizedTimeWindow,
  TimeWindow,
  formatLocal,
  buildTimeWindows,
  stripDebugBlocks,
  getScoreVariant,
  getCategoryVariant,
  mapVariantToSeverity,
  looksLikeRawJsonData,
  replaceWindowNumbersWithTimeRanges,
} from '@/lib/cleanSummaryWithWindows';
import { API_BASE } from '@/lib/api';
import { useAiSummary } from '@/hooks/useAiSummary';
import {
  validateAiWindows,
  mapAiWindowsToEngineWindows,
  type AiTimeWindow,
  type EngineWindow,
  type MergedWindow,
} from '@/lib/windowMapper';

/* ---------- Constants ---------- */
const SHARE_TEXT_MAX_LENGTH = 200;
const EXPECTED_ENGINE_WINDOWS = 16;

/* ---------- Utilities ---------- */

/** Helper to count windows with AI summaries */
function countWindowsWithAiSummaries(windows: any[]): number {
  return windows.filter((w: any) => w.ai_summary).length;
}

function addToCalendar(title: string, startISO: string, endISO: string) {
  try {
    const start = startISO.replace(/[-:]/g, '').split('.')[0] + 'Z';
    const end = endISO.replace(/[-:]/g, '').split('.')[0] + 'Z';
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `SUMMARY:${title}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = title.replace(/\s+/g, '_') + '.ics';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch {
    // Silently fail - calendar download is a best-effort feature
  }
}

function copyToClipboard(txt: string, t: TFunction) {
  navigator.clipboard
    ?.writeText(txt)
    .then(() => {
      // eslint-disable-next-line no-alert
      alert(t('dailyPrediction.actions.copiedToClipboard'));
    })
    .catch(() => {
      // eslint-disable-next-line no-alert
      alert(t('dailyPrediction.actions.copyFailed'));
    });
}

function stripHtmlTags(html: string | null | undefined) {
  if (!html) return '';
  // quick strip — good enough for preview text generation
  return html.replace(/<\/?[^>]+(>|$)/g, ' ').replace(/\s+/g, ' ').trim();
}

function toEngineWindow(normalized: NormalizedTimeWindow): EngineWindow {
  return {
    ...normalized,
    start_iso: normalized.startISO ?? undefined,
    end_iso: normalized.endISO ?? undefined,
    start_display: normalized.startDisplay ?? undefined,
    end_display: normalized.endDisplay ?? undefined,
    startISO: normalized.startISO ?? undefined,
    endISO: normalized.endISO ?? undefined,
    startDisplay: normalized.startDisplay ?? undefined,
    endDisplay: normalized.endDisplay ?? undefined,
    score: normalized.score ?? undefined,
    category: normalized.category ?? undefined,
    raw: normalized.raw ?? undefined,
  } as EngineWindow;
}

/* ---------- Share functionality ---------- */
async function shareWindow(
  title: string,
  category: string,
  score: string,
  timeRange: string,
  summary: string,
  t: TFunction
) {
  const summaryTrimmed = summary.slice(0, SHARE_TEXT_MAX_LENGTH);
  const shareText = `${title}\n📊 ${category} | Score: ${score}\n🕐 ${timeRange}\n\n${summaryTrimmed}${summary.length > SHARE_TEXT_MAX_LENGTH ? '…' : ''}`;
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  
  // Try Web Share API first
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: title,
        text: shareText,
        url: shareUrl,
      });
      return;
    } catch {
      // Fall through to clipboard
    }
  }
  
  // Fallback to clipboard
  copyToClipboard(shareText, t);
}

/* ---------- Format countdown helper ---------- */
function formatCountdown(totalSeconds: number): string {
  if (totalSeconds <= 0) return '00:00:00';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((v) => String(v).padStart(2, '0')).join(':');
}

/**
 * Constructs an ISO datetime string from a date string and a time string (e.g., "06:24 AM").
 * This is a client-side fallback when backend doesn't provide ISO timestamps.
 * 
 * The returned ISO string is in UTC (with 'Z' suffix), but the datetime is interpreted
 * in the user's local timezone. This is appropriate for current window detection since
 * we're comparing against the user's local current time.
 * 
 * @param dateStr - ISO date string (e.g., "2025-12-10")
 * @param timeStr - Time string in various formats (e.g., "06:24 AM", "6:24 AM", "18:24")
 * @returns ISO datetime string in UTC, or null if parsing fails
 */
function constructISOFromDisplayTime(dateStr: string, timeStr: string): string | null {
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
    
    // Extract date components for reliable Date construction
    const datePart = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const [year, month, day] = datePart.split('-').map(Number);
    
    // Validate date components
    if (!year || !month || !day || month < 1 || month > 12 || day < 1 || day > 31) {
      return null;
    }
    
    // Create Date object using constructor for reliable timezone handling
    // month is 0-indexed in Date constructor
    const dateTime = new Date(year, month - 1, day, hours, minutes, 0, 0);
    
    if (isNaN(dateTime.getTime())) return null;
    
    return dateTime.toISOString();
  } catch {
    return null;
  }
}

/* ---------- AI Summary Helper Functions ---------- */

/**
 * Removes "(based on ...)" reference patterns from text.
 * These are debug/source markers from the AI summary that shouldn't be displayed to users.
 */
function removeBasedOnReferences(text: string): string {
  return text.replace(/\s*\(based on[^)]*\)\s*/gi, '').replace(/\s+/g, ' ').trim();
}

/**
 * Formats a quick decision reason text for display.
 * Removes "(based on ...)" references and replaces window numbers with actual time ranges.
 *
 * @param reason - The raw reason text from AI summary
 * @param windows - The array of time windows with start/end times
 * @returns Formatted reason text with human-readable time ranges
 */
function formatQuickDecisionReason(
  reason: string | undefined,
  windows: NormalizedTimeWindow[]
): string {
  if (!reason) return '';
  let formatted = removeBasedOnReferences(reason);
  formatted = replaceWindowNumbersWithTimeRanges(formatted, windows);
  return formatted;
}

/**
 * Extracts the layers object from AI summary data, handling both new and legacy formats.
 */
function getAiLayers(aiSummaryData: { layers?: Record<string, unknown>; debug?: { layers?: Record<string, unknown> } } | null): Record<string, unknown> | null {
  if (!aiSummaryData) return null;
  const layers = aiSummaryData.layers ?? aiSummaryData.debug?.layers;
  if (!layers || typeof layers !== 'object') return null;
  return layers as Record<string, unknown>;
}

/**
 * Returns the appropriate CSS classes for a quick decision status badge.
 */
function getDecisionStatusClass(decision: { ok?: boolean; answer?: string } | undefined): string {
  const isPositive = decision?.ok || decision?.answer === 'YES';
  return `text-xs font-bold px-2 py-0.5 rounded ${isPositive ? 'bg-green-600/30 text-green-400' : 'bg-red-600/30 text-red-400'}`;
}

/**
 * Regex pattern for extracting per-window interpretation and practical advice from AI summary text.
 * 
 * Expected AI summary format from layers.summary.text or layers.radar.text:
 *   "1.  **06:15 AM – 07:41 AM** — **Highly auspicious** — Good
 *    Facts: Tara = Parama-Mitra (friend), Tithi = Amavasya (bad), ...
 *    Interpretation: This window holds a good score due to...
 *    Practical: Engage in gentle activities and prepare for the day ahead."
 * 
 * Pattern breakdown:
 *   (\d+)\.?\s*                         - Capture group 1: Window number (1-16) with optional period
 *   \*\*([^*]+)\*\*                     - Capture group 2: Time range in bold (e.g., "06:15 AM – 07:41 AM")
 *   \s*[—–-]+\s*                        - Em dash or hyphen separator
 *   \*\*([^*]+)\*\*                     - Capture group 3: Category in bold (e.g., "Highly auspicious", "Mixed")
 *   .*?Interpretation:\s*([^]*?)        - Capture group 4: Interpretation text
 *   (?:Practical:\s*([^]*?))?           - Capture group 5: Optional practical advice text
 *   (?=\n\s*\d+\.?\s*\*\*|$|\n##)      - Lookahead: next window, end of string, or section header
 */
const WINDOW_SUMMARY_REGEX = /(\d+)\.?\s*\*\*([^*]+)\*\*\s*[—–-]+\s*\*\*([^*]+)\*\*[^]*?Interpretation:\s*([^]*?)(?:Practical:\s*([^]*?))?(?=\n\s*\d+\.?\s*\*\*|$|\n##)/gi;

/* ---------- Types ---------- */

/**
 * AI-generated window data extracted from various sources
 */
interface AiWindowData {
  summary?: string;
  interpretation: string;
  practical: string;
  category?: string;
  score?: number;
  raw?: unknown;
}

/**
 * Shape of a structured time window entry from AI layers
 */
interface StructuredWindowEntry {
  window_index?: number;
  key?: string;
  summary?: string;
  short_desc?: string;
  description?: string;
  interpretation?: string;
  interpretation_html?: string;
  practical?: string;
  practical_html?: string;
  category?: string;
  score?: number;
  [key: string]: unknown;
}

/**
 * Shape of time window items from API response
 */
interface ApiTimeWindowItem {
  label?: string;
  name?: string;
  start?: string;
  end?: string;
  score?: number;
  [key: string]: unknown;
}

/* ---------- Helper Functions ---------- */

/**
 * Parse the time_windows array from API response.
 * The array contains BOTH numbered windows (0-15) AND special muhurta periods.
 * 
 * @param timeWindows - Array of time window items from API
 * @returns Object with numbered windows and special muhurtas separated
 */
function parseTimeWindows(timeWindows: ApiTimeWindowItem[]): {
  numberedWindows: TimeWindow[];
  specialMuhurtas: TimeWindow[];
} {
  const numberedWindows: TimeWindow[] = [];
  const specialMuhurtas: TimeWindow[] = [];
  
  if (!Array.isArray(timeWindows)) {
    return { numberedWindows, specialMuhurtas };
  }
  
  timeWindows.forEach((item) => {
    // Special periods have a label or name field (e.g., "Rahukaalam", "Yamagandam")
    if (item.label || item.name) {
      specialMuhurtas.push(item as TimeWindow);
    } else {
      // Numbered windows (0-15) - these are the main time slots
      numberedWindows.push(item as TimeWindow);
    }
  });
  
  return { numberedWindows, specialMuhurtas };
}

/* ---------- Page Component ---------- */

export default function DailyPredictionPage() {
  const { t, i18n } = useTranslation();
  const { translateContent } = useTranslateContent();
  const { profile, loading: profileLoading } = useActiveProfile();
  const { sessionRestored, token, logout, refreshToken } = useAuth();
  const loadingAuth = !sessionRestored;

  const [heroReady, setHeroReady] = useState(false);
  const [dailyError, setDailyError] = useState<string | null>(null);
  const [aiValidationError, setAiValidationError] = useState<string | null>(null);
  const [dayScore, setDayScore] = useState<number | null>(null);
  // Time windows fetched directly from Day API (single source of truth)
  const [dayApiTimeWindows, setDayApiTimeWindows] = useState<TimeWindow[]>([]);
  // Special muhurta windows (Rahukaalam, Yamagandam, Gulika, Abhijit, etc.)
  const [dayApiMuhurtas, setDayApiMuhurtas] = useState<TimeWindow[]>([]);
  const [dayApiSummary, setDayApiSummary] = useState<string>('');
  const [dayApiTargetDate, setDayApiTargetDate] = useState<string>('');
  const [dayApiLoading, setDayApiLoading] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setHeroReady(true), 80);
    return () => window.clearTimeout(timer);
  }, []);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const profileId = profile?.id ? Number(profile.id) : null;

  // Fetch AI summary data (layers with quick_decisions and human-readable content)
  // The hook includes retry logic for new profiles where data may not be immediately available
  const { data: aiSummaryData, loading: aiSummaryLoading } = useAiSummary('daily', profileId);

  const formatOptions: FormatOptions = useMemo(
    () => ({
      useAmpm: true,
      slotMinutes: 90,
      date: dayApiTargetDate || today,
    }),
    [today, dayApiTargetDate]
  );

  // Extract quick_decisions from AI summary layers
  const quickDecisions = useMemo(() => {
    const layers = getAiLayers(aiSummaryData);
    if (!layers) return null;
    const qd = layers.quick_decisions;
    if (!qd || typeof qd !== 'object') return null;
    return qd as {
      take_new_initiative?: { answer?: string; reason?: string; ok?: boolean };
      give_ask_money?: { answer?: string; reason?: string; ok?: boolean };
      talk_with_strangers?: { answer?: string; reason?: string; ok?: boolean };
    };
  }, [aiSummaryData]);

  // Build a cleaned summary from Day API data (for preview or fallback)
  const mergedSummary = useMemo(() => {
    if (!dayApiSummary) return '';
    // Clean the summary text - Day API provides raw data, not pre-rendered content
    const cleanedAi = cleanSummaryWithWindows(
      dayApiSummary,
      undefined, // No window token expansion needed - we render cards from time_windows array
      formatOptions
    );
    const parts = [cleanedAi].map((p) => p?.trim()).filter(Boolean) as string[];
    if (!parts.length) return '';
    return dedupeSummary(parts.join('\n\n'), {
      mode: 'consecutive',
      similarityThreshold: 0.9,
    });
  }, [dayApiSummary, formatOptions]);

  useEffect(() => {
    setDailyError(null);
  }, [dayApiTimeWindows]);

  /* ---------- Derived Data ---------- */

  // Defensive cap: limit time windows to expected count.
  // Build time windows from Day API response (always prefer engine_windows if available)
  // AI summary windows are only used to enhance, not replace
  const timeWindows: NormalizedTimeWindow[] = useMemo(() => {
    // Always use Day API windows as the source of truth for 16 engine windows
    if (!dayApiTimeWindows || dayApiTimeWindows.length === 0) {
      // Log warning if no engine windows available
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('[DailyPredictionPage] No engine windows available from Day API');
      }
      return [];
    }

    const canonicalWindows = buildTimeWindows({ time_windows: dayApiTimeWindows }, formatOptions);
    const capped =
      canonicalWindows.length > EXPECTED_ENGINE_WINDOWS 
        ? canonicalWindows.slice(0, EXPECTED_ENGINE_WINDOWS) 
        : canonicalWindows;
    
    // Log if we have fewer than expected windows
    if (capped.length < EXPECTED_ENGINE_WINDOWS && process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn(`[DailyPredictionPage] Only ${capped.length} engine windows available (expected ${EXPECTED_ENGINE_WINDOWS})`);
    }
    
    return capped;
  }, [dayApiTimeWindows, formatOptions]);

  const engineWindowsForMapper = useMemo(() => {
    if (!timeWindows || timeWindows.length === 0) return [];
    return timeWindows.map((tw) => toEngineWindow(tw));
  }, [timeWindows]);

  const summarySelection = useMemo(
    () => selectSummarySource({ aiSummaryData, daySummary: dayApiSummary }),
    [aiSummaryData, dayApiSummary]
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !summarySelection.source) return;
    // eslint-disable-next-line no-console
    console.debug(`[DailyPredictionPage] Using summary source: ${summarySelection.source}`);
  }, [summarySelection.source]);

  const selectedSummaryText = useMemo(
    () => formatSelectedSummary(summarySelection, timeWindows, formatOptions),
    [summarySelection, timeWindows, formatOptions]
  );

  // Merge AI window summaries into engine windows using deterministic mapper
  // This ensures each window card has AI content attached when available
  // Even if AI data is partial, we still display all 16 engine windows
  const mergedWindows: MergedWindow[] = useMemo(() => {
    if (!engineWindowsForMapper || engineWindowsForMapper.length === 0) return [];

    setAiValidationError(null);

    const aiWindowsRaw =
      aiSummaryData?.summary_metadata?.layers?.time_windows ?? aiSummaryData?.time_windows;

    const expectedWindowCount = engineWindowsForMapper.length || 16;
    
    // Use non-strict validation to allow partial AI data
    const isValid = validateAiWindows(aiWindowsRaw, expectedWindowCount, false);

    if (!isValid) {
      // No AI data available at all - just return engine windows without AI enhancements
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.debug('[DailyPredictionPage] No AI windows available - displaying engine windows only', {
          hasAiSummaryData: Boolean(aiSummaryData),
          aiWindowsRaw: aiWindowsRaw,
          expectedCount: expectedWindowCount,
        });
      }

      return engineWindowsForMapper as MergedWindow[];
    }

    const merged = mapAiWindowsToEngineWindows(aiWindowsRaw as AiTimeWindow[], engineWindowsForMapper);

    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.debug('[DailyPredictionPage] Merged AI windows into engine windows', {
        engineWindowCount: engineWindowsForMapper.length,
        aiWindowCount: (aiWindowsRaw as AiTimeWindow[]).length,
        mergedCount: merged.length,
      });
    }

    return merged;
  }, [aiSummaryData, engineWindowsForMapper]);

  const aiWindowSummaries = useMemo(() => {
    const summaries = new Map<number, AiTimeWindow>();
    mergedWindows.forEach((window, idx) => {
      const aiRaw = (window as any).ai_raw as AiTimeWindow | undefined;
      if (aiRaw) {
        summaries.set(idx, aiRaw);
      }
    });
    return summaries;
  }, [mergedWindows]);

  // ---------- Helper: formatMaybe ----------
  // Accepts string | number | null | undefined and returns a safe string for display.
  // Converts numbers to string before calling formatLocal(...).
  function formatMaybe(v?: string | number | null) {
    if (v === undefined || v === null) return '';
    if (typeof v === 'number') {
      // Convert numeric slot/index to string for formatLocal.
      // If you want numeric slots to be treated specially, expand this block.
      return formatLocal(String(v), 'time') ?? '';
    }
    // v is string
    return formatLocal(v, 'time') ?? '';
  }

  /* ---------- Current Window Detection & Countdown ---------- */
  const [now, setNow] = useState(() => new Date());
  
  // Update 'now' every second for countdown
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Find the current time window
  const currentWindowData = useMemo(() => {
    if (!mergedWindows || mergedWindows.length === 0) return null;
    
    const nowTime = now.getTime();
    
    for (let idx = 0; idx < mergedWindows.length; idx++) {
      const tw = mergedWindows[idx];
      
      // Try ISO timestamps first - check both camelCase and snake_case variants
      let startISO = tw.startISO ?? (tw as any).start_iso;
      let endISO = tw.endISO ?? (tw as any).end_iso;
      
      // Fallback: If ISO timestamps are missing, try to construct from display times and target date
      if ((!startISO || !endISO) && dayApiTargetDate) {
        const startDisplay = tw.startDisplay ?? (tw as any).start_display;
        const endDisplay = tw.endDisplay ?? (tw as any).end_display;
        
        if (startDisplay && !startISO) {
          startISO = constructISOFromDisplayTime(dayApiTargetDate, startDisplay);
        }
        if (endDisplay && !endISO) {
          endISO = constructISOFromDisplayTime(dayApiTargetDate, endDisplay);
        }
      }
      
      if (startISO && endISO) {
        const startTime = new Date(startISO).getTime();
        const endTime = new Date(endISO).getTime();
        
        if (!isNaN(startTime) && !isNaN(endTime) && startTime <= nowTime && nowTime < endTime) {
          return {
            window: tw,
            windowIndex: idx,
            endTime,
            isActive: true
          };
        }
      }
    }
    
    return null;
  }, [mergedWindows, now, dayApiTargetDate]);

  // Calculate countdown seconds
  const countdownSeconds = useMemo(() => {
    if (!currentWindowData || !currentWindowData.endTime) return null;
    const remaining = Math.floor((currentWindowData.endTime - now.getTime()) / 1000);
    return remaining > 0 ? remaining : 0;
  }, [currentWindowData, now]);

  // Get AI summary for the current time window
  const currentWindowAiSummary = useMemo(() => {
    if (!currentWindowData || !currentWindowData.window || currentWindowData.windowIndex === undefined) return null;
    
    return aiWindowSummaries.get(currentWindowData.windowIndex) ?? null;
  }, [currentWindowData, aiWindowSummaries]);

  /* ---------- Day API fetch (score, summary, time_windows - single source of truth) ---------- */

  const fetchDayPrediction = useCallback(async () => {
    if (!profile?.id) {
      setDayScore(null);
      setDayApiTimeWindows([]);
      setDayApiMuhurtas([]);
      setDayApiSummary('');
      setDayApiTargetDate('');
      return;
    }

    setDailyError(null);
    setDayApiLoading(true);
    try {
      let authTok = token;
      // Fallback to local storage for authentication token
      if (!authTok && typeof window !== 'undefined') {
        const localTok = localStorage.getItem('firebase_token');
        if (localTok) {
          authTok = localTok;
        }
      }

      // Try to refresh token if still missing and refreshToken is available
      if (!authTok && refreshToken) {
        try {
          authTok = await refreshToken(true);
        } catch {
          // Silently continue - will try cookie-based session
        }
      }

      // If still no authTok, we'll still try a credentials: 'include' request (cookie-based session)
      const headers: Record<string, string> = {};
      if (authTok) {
        headers.Authorization = `Bearer ${authTok}`;
      }

      const res = await fetch(`${API_BASE}/api/day_prediction_ai?profile_id=${profile.id}&locale=${i18n.language || 'en'}`, {
        headers: headers,
        credentials: 'include',
      });

      if (!res.ok) {
        setDayScore(null);
        setDayApiTimeWindows([]);
        setDayApiMuhurtas([]);
        setDayApiSummary('');
        setDayApiTargetDate('');
        if (res.status === 401 && refreshToken) {
          try {
            const fresh = await refreshToken(true);
            if (fresh) {
              const retry = await fetch(`${API_BASE}/api/day_prediction_ai?profile_id=${profile.id}&locale=${i18n.language || 'en'}`, {
                headers: { Authorization: `Bearer ${fresh}` },
                credentials: 'include',
              });
              if (retry.ok) {
                const payload = await retry.json();
                setDayScore(typeof payload.score === 'number' ? payload.score : null);
                
                // NEW APPROACH: Prefer engine_windows as authoritative source
                // engine_windows contains the canonical 16 windows with AI summaries attached
                let windowsData = [];
                
                if (Array.isArray(payload.engine_windows) && payload.engine_windows.length >= 16) {
                  // Use engine_windows as primary source (NEW)
                  windowsData = payload.engine_windows;
                  
                  if (process.env.NODE_ENV !== 'production') {
                    // eslint-disable-next-line no-console
                    console.debug('[DailyPredictionPage] Using engine_windows from API (canonical source)', {
                      count: windowsData.length,
                      hasAiSummaries: windowsData.filter((w: any) => w.ai_summary).length
                    });
                  }
                } else if (Array.isArray(payload.windows) && payload.windows.length > 0) {
                  // Fallback to windows for backward compatibility
                  windowsData = payload.windows;
                  
                  if (process.env.NODE_ENV !== 'production') {
                    // eslint-disable-next-line no-console
                    console.warn('[DailyPredictionPage] Using fallback windows field (engine_windows unavailable)', {
                      count: windowsData.length
                    });
                  }
                }
                
                // Special muhurtas now come from time_windows or muhurtas fields
                const muhurtasData = payload.muhurtas ?? payload.time_windows ?? [];
                
                // Debug logging
                if (process.env.NODE_ENV !== 'production') {
                  // eslint-disable-next-line no-console
                  console.debug('[DailyPredictionPage] Loaded time windows data (retry):', {
                    engineWindowsCount: windowsData.length,
                    muhurtasCount: muhurtasData.length,
                    muhurtaLabels: muhurtasData.map((m: any) => m.label ?? m.name).filter(Boolean),
                  });
                }
                
                setDayApiTimeWindows(windowsData);
                setDayApiMuhurtas(muhurtasData);
                setDayApiSummary(typeof payload.summary === 'string' ? payload.summary : '');
                setDayApiTargetDate(typeof payload.target_date === 'string' ? payload.target_date : '');
              }
            }
          } catch {
            // Silently continue
          }
        }
        return;
      }

      const payload = await res.json();
      setDayScore(typeof payload.score === 'number' ? payload.score : null);
      
      // NEW APPROACH: Prefer engine_windows as authoritative source
      // engine_windows contains the canonical 16 windows with AI summaries attached
      let windowsData = [];
      
      if (Array.isArray(payload.engine_windows) && payload.engine_windows.length >= 16) {
        // Use engine_windows as primary source (NEW)
        windowsData = payload.engine_windows;
        
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.debug('[DailyPredictionPage] Using engine_windows from API (canonical source)', {
            count: windowsData.length,
            hasAiSummaries: windowsData.filter((w: any) => w.ai_summary).length
          });
        }
      } else if (Array.isArray(payload.windows) && payload.windows.length > 0) {
        // Fallback to windows for backward compatibility
        windowsData = payload.windows;
        
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.warn('[DailyPredictionPage] Using fallback windows field (engine_windows unavailable)', {
            count: windowsData.length
          });
        }
      }
      
      // Special muhurtas now come from time_windows or muhurtas fields
      const muhurtasData = payload.muhurtas ?? payload.time_windows ?? [];
      
      // Debug logging
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.debug('[DailyPredictionPage] Loaded time windows data:', {
          engineWindowsCount: windowsData.length,
          muhurtasCount: muhurtasData.length,
          muhurtaLabels: muhurtasData.map((m: any) => m.label ?? m.name).filter(Boolean),
        });
      }
      
      setDayApiTimeWindows(windowsData);
      setDayApiMuhurtas(muhurtasData);
      setDayApiSummary(typeof payload.summary === 'string' ? payload.summary : '');
      setDayApiTargetDate(typeof payload.target_date === 'string' ? payload.target_date : '');
    } catch (err: unknown) {
      // Safely narrow unknown to check for AbortError name property
      if (typeof err === 'object' && err !== null && 'name' in err && (err as any).name === 'AbortError') {
        return;
      }
      setDayScore(null);
      setDayApiTimeWindows([]);
      setDayApiMuhurtas([]);
      setDayApiSummary('');
      setDayApiTargetDate('');
      setDailyError(t('dailyPrediction.actions.unexpectedError'));
    } finally {
      setDayApiLoading(false);
    }
  }, [profile?.id, token, refreshToken, t, i18n.language]);

  /* ---------- Trigger fetchDayPrediction when profile is present or when auth becomes available ---------- */
  useEffect(() => {
    const hasLocalToken = typeof window !== 'undefined' && !!localStorage.getItem('firebase_token');
    const canAttemptAuth = sessionRestored || hasLocalToken || !!refreshToken;

    if (!profile?.id || !canAttemptAuth) {
      return;
    }

    fetchDayPrediction();
  }, [profile?.id, sessionRestored, refreshToken, fetchDayPrediction]);

  /* ---------- Render ---------- */

  if (profileLoading || loadingAuth) {
    return (
      <div className="min-h-screen bg-[#040a15] text-white">
        <main className="mx-auto max-w-screen-lg px-4 py-12">
          <div className="flex items-center gap-3 text-slate-300">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-600/40" />
            <span>{t('dailyPrediction.loadingProfile')}</span>
          </div>
        </main>
      </div>
    );
  }

  // Helper to render layers-based fallback - no longer needed, time windows come from Day API
  // Keeping a simplified version for potential summary display

  return (
    <div className="scroll-smooth bg-neo-dark/95">
      <div className="mx-auto flex min-h-screen max-w-screen-xl flex-col gap-8 px-4 py-10 text-white sm:px-6 lg:px-8">
        {/* Hero: business-style */}
        <div
          className={`relative overflow-hidden rounded-3xl border border-neon-cyan/50 bg-gradient-to-br from-neo-dark via-[#0b1b36] to-neo-dark p-8 shadow-2xl transition-all duration-500 ease-out ${
            heroReady ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
          }`}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,255,255,0.12),_transparent_55%)]" />
          <div className="relative z-10 flex flex-col items-center gap-6 text-center">
            <div className="relative h-48 w-48 overflow-hidden rounded-full border border-neon-cyan/60 shadow-[0_0_25px_rgba(0,255,255,0.35)]">
              <Image
                src="/logo/logo.png"
                alt="MitraVeda mandala"
                fill
                className="object-cover"
                priority
              />
            </div>

            <div className="space-y-3">
              <h1 className="font-orbitron text-3xl font-semibold text-neon-cyan sm:text-4xl">
                {t('dailyPrediction.hero.title', { name: profile?.first_name || 'You' })}
              </h1>
              <p className="mx-auto max-w-2xl text-base text-slate-200">
                {t('dailyPrediction.hero.subtitle')}
              </p>
            </div>

            {/* AI-generated day summary sections */}
            {(summarySelection.structured || summarySelection.text || summarySelection.html) && (
              <div className="mx-auto max-w-4xl mt-6">
                <SummarySections 
                  structured={summarySelection.structured}
                  html={summarySelection.html}
                  text={summarySelection.text}
                  timeWindows={timeWindows}
                />
              </div>
            )}

            {/* Quick Decisions - Horizontal alignment */}
            <div className="w-full max-w-4xl rounded-lg border border-neon-cyan/30 bg-neo-dark/60 p-4">
              <h4 className="text-sm font-semibold text-[#ffd166] text-center mb-3">{t('dailyPrediction.quickDecisions.title')}</h4>
              {aiSummaryLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600/40 border-t-slate-300" />
                  <p className="text-sm text-slate-300">{t('dailyPrediction.quickDecisions.loadingInsights')}</p>
                </div>
              ) : quickDecisions ? (
                <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-8">
                  {/* Take new initiative */}
                  {quickDecisions.take_new_initiative && (
                    <div className="flex flex-col items-center text-center gap-1 flex-1 max-w-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-100">{t('dailyPrediction.quickDecisions.takeNewInitiative')}</span>
                        <span className={getDecisionStatusClass(quickDecisions.take_new_initiative)}>
                          {quickDecisions.take_new_initiative.answer ?? 'N/A'}
                        </span>
                      </div>
                      {quickDecisions.take_new_initiative.reason && (
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {translateContent(formatQuickDecisionReason(quickDecisions.take_new_initiative.reason, timeWindows))}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Give/ask money */}
                  {quickDecisions.give_ask_money && (
                    <div className="flex flex-col items-center text-center gap-1 flex-1 max-w-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-100">{t('dailyPrediction.quickDecisions.giveAskMoney')}</span>
                        <span className={getDecisionStatusClass(quickDecisions.give_ask_money)}>
                          {quickDecisions.give_ask_money.answer ?? 'N/A'}
                        </span>
                      </div>
                      {quickDecisions.give_ask_money.reason && (
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {translateContent(formatQuickDecisionReason(quickDecisions.give_ask_money.reason, timeWindows))}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Talk with strangers */}
                  {quickDecisions.talk_with_strangers && (
                    <div className="flex flex-col items-center text-center gap-1 flex-1 max-w-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-100">{t('dailyPrediction.quickDecisions.talkWithStrangers')}</span>
                        <span className={getDecisionStatusClass(quickDecisions.talk_with_strangers)}>
                          {quickDecisions.talk_with_strangers.answer ?? 'N/A'}
                        </span>
                      </div>
                      {quickDecisions.talk_with_strangers.reason && (
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {translateContent(formatQuickDecisionReason(quickDecisions.talk_with_strangers.reason, timeWindows))}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-200 text-center">{t('dailyPrediction.quickDecisions.noDecisions')}</p>
              )}
            </div>

            {/* Note section */}
            <div className="w-full max-w-4xl rounded-lg border border-neon-cyan/30 bg-neo-dark/60 p-4">
              <h4 className="text-sm font-semibold text-slate-100 text-center">{t('dailyPrediction.note.title')}</h4>
              <p className="mt-2 text-sm text-slate-200 text-center">{t('dailyPrediction.note.message')}</p>
            </div>

            <div className="mt-2 flex flex-col items-center gap-3 text-sm text-slate-300 sm:flex-row">
              {dayApiTargetDate && (
                <span className="rounded-full border border-neon-cyan/30 bg-neo-dark/60 px-4 py-2 text-slate-200">
                  {t('dailyPrediction.hero.date')} {dayApiTargetDate}
                </span>
              )}
              <button
                type="button"
                onClick={async () => {
                  // Refresh day prediction data from Day API
                  try {
                    await fetchDayPrediction();
                  } catch {
                    // Silently continue
                  }
                }}
                className="rounded-full border border-neon-cyan px-5 py-2 text-sm font-semibold text-neon-cyan transition hover:bg-neon-cyan hover:text-neo-dark"
              >
                {t('dailyPrediction.hero.refreshInsights')}
              </button>
            </div>
          </div>
        </div>

        {/* Content section */}
        <div className="space-y-6">
            {/* Loading state */}
            {dayApiLoading && (
              <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
                <div className="flex items-center space-x-3">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-transparent"></div>
                  <p className="text-sm text-slate-300">{t('dailyPrediction.loadingPrediction')}</p>
                </div>
              </div>
            )}

            {/* Current Time Window Card */}
            {currentWindowData && currentWindowData.window && (
              (() => {
                // Get AI data for current window for fallback values
                const currentAiData = currentWindowAiSummary;
                const currentCategory = currentWindowData.window.category ?? currentAiData?.category ?? '';
                // Extract score with proper type safety
                const windowScore = (currentWindowData.window as any).score;
                const currentScore: number | null = typeof windowScore === 'number' 
                  ? windowScore 
                  : (typeof currentAiData?.score === 'number' ? currentAiData.score : null);
                
                return (
                  <article 
                    className={`current-window current-window--${getCategoryVariant(currentCategory, currentScore)}`}
                    aria-label="Current Time Window"
                  >
                    <p className="current-window__title">{t('dailyPrediction.currentWindow.title')}</p>
                    <h2 className="current-window__name">
                      {currentCategory || currentWindowData.window.name || t('dailyPrediction.currentWindow.activeWindow')}
                    </h2>
                    <div className="current-window__meta">
                      {currentCategory && (
                        <span className={`tw-card__category tw-card__category--${getCategoryVariant(currentCategory, currentScore)}`}>
                          {currentCategory}
                        </span>
                      )}
                      {typeof currentScore === 'number' && (
                        <span className="tw-card__score">
                          {t('dailyPrediction.currentWindow.score')} {currentScore.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <p className="current-window__time">
                      {currentWindowData.window.startDisplay} → {currentWindowData.window.endDisplay}
                    </p>
                    
                    {/* AI Summary for current window */}
                    {currentWindowAiSummary && (currentWindowAiSummary.interpretation || currentWindowAiSummary.practical) && (
                      <div className="current-window__ai-summary mt-4">
                        {currentWindowAiSummary.interpretation && (
                          <p className="text-sm text-slate-200 leading-relaxed">{translateContent(currentWindowAiSummary.interpretation)}</p>
                        )}
                        {currentWindowAiSummary.practical && (
                          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                            <span className="text-amber-400" role="img" aria-label="Tip">💡 </span>
                            {translateContent(currentWindowAiSummary.practical)}
                          </p>
                        )}
                      </div>
                    )}
                    
                    {countdownSeconds !== null && countdownSeconds > 0 ? (
                      <div className="mt-3">
                        <p className="current-window__countdown-label">{t('dailyPrediction.currentWindow.endsIn')}</p>
                        <p className="current-window__countdown">{formatCountdown(countdownSeconds)} ⏳</p>
                      </div>
                    ) : countdownSeconds === 0 ? (
                      <p className="text-sm text-slate-400 mt-2">{t('dailyPrediction.currentWindow.windowEnded')}</p>
                    ) : null}
                  </article>
                );
              })()
            )}

            {/* AI Validation Error - Show deterministic error when AI data is invalid */}
            {aiValidationError && (
              <div className="rounded-lg border border-red-500/50 bg-red-900/20 p-6">
                <h3 className="text-lg font-semibold text-red-400 mb-3">
                  {t('dailyPrediction.aiValidationError.title', 'AI Summary Unavailable')}
                </h3>
                <p className="text-sm text-slate-200 mb-4">
                  {t('dailyPrediction.aiValidationError.message', 
                    'Per-window AI data missing or invalid. To preserve Vedic accuracy, this page cannot show AI guidance until the summary is regenerated.'
                  )}
                </p>
                <div className="flex gap-3 flex-wrap">
                  <button
                    type="button"
                    onClick={async () => {
                      // Retry fetching AI summary
                      try {
                        await fetchDayPrediction();
                      } catch {
                        // Silently continue
                      }
                    }}
                    className="rounded-md border border-neon-cyan px-4 py-2 text-sm font-semibold text-neon-cyan transition hover:bg-neon-cyan hover:text-neo-dark"
                  >
                    {t('dailyPrediction.aiValidationError.retry', 'Retry')}
                  </button>
                  <a
                    href="/support"
                    className="rounded-md border border-slate-500 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-700"
                  >
                    {t('dailyPrediction.aiValidationError.contact', 'Contact Support')}
                  </a>
                </div>
                {process.env.NODE_ENV !== 'production' && (
                  <div className="mt-4 rounded bg-slate-800 p-2 text-xs text-slate-400 font-mono">
                    <div>Correlation ID: {profile?.id}-{Date.now()}</div>
                    <div className="mt-1">Error: {aiValidationError.slice(0, 150)}</div>
                  </div>
                )}
              </div>
            )}

            {/* Special Muhurtas Section - Display time_windows array (Rahukaalam, Yamagandam, etc.) */}
            {dayApiMuhurtas && dayApiMuhurtas.length > 0 && (
              <section aria-label="Special Muhurtas" className="mb-6">
                <h2 className="text-lg font-semibold text-slate-100 mb-4">{t('dailyPrediction.muhurtas.title', 'Auspicious & Inauspicious Periods')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dayApiMuhurtas.map((muhurta, idx) => {
                    const label = muhurta.label ?? muhurta.name ?? `Period ${idx + 1}`;
                    const impact = (muhurta as any).impact ?? '';
                    const isFavorable = impact.toLowerCase().includes('favorable') || impact.toLowerCase().includes('auspicious');
                    const isAvoidRisk = impact.toLowerCase().includes('avoid') || impact.toLowerCase().includes('inauspicious');
                    
                    // Determine variant class based on impact
                    const variantClass = isFavorable ? 'muhurta--favorable' : isAvoidRisk ? 'muhurta--avoid' : 'muhurta--neutral';
                    
                    // Extract display times - prefer display fields, fallback to ISO parsing
                    const startDisplay = (muhurta as any).start_display ?? (muhurta as any).startDisplay ?? 
                      (muhurta.start ? formatLocal(String(muhurta.start), 'time') : null);
                    const endDisplay = (muhurta as any).end_display ?? (muhurta as any).endDisplay ?? 
                      (muhurta.end ? formatLocal(String(muhurta.end), 'time') : null);
                    
                    return (
                      <article
                        key={idx}
                        className={`muhurta-card ${variantClass}`}
                        aria-label={`Muhurta: ${label}`}
                      >
                        <div className="muhurta-card__header">
                          <h3 className="muhurta-card__title">{label}</h3>
                          {impact && (
                            <span className={`muhurta-card__impact muhurta-card__impact--${isFavorable ? 'favorable' : isAvoidRisk ? 'avoid' : 'neutral'}`}>
                              {isFavorable ? '✨' : isAvoidRisk ? '⚠️' : '•'} {impact}
                            </span>
                          )}
                        </div>
                        {(startDisplay || endDisplay) && (
                          <p className="muhurta-card__time">
                            {startDisplay ?? '--:--'} → {endDisplay ?? '--:--'}
                          </p>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Time Windows Cards - Rendered from merged engine + AI data */}
            {mergedWindows && mergedWindows.length > 0 ? (
              <section aria-label="Time Windows">
                <h2 className="text-lg font-semibold text-slate-100 mb-4">{t('dailyPrediction.timeWindows.title')}</h2>
                <div className="tw-cards-grid">
                  {mergedWindows.map((tw, idx) => {
                    // mergedWindows already contains AI data merged in
                    // No need to look up aiWindowSummaries separately
                    
                    const title = tw.name ?? tw.label ?? `${t('dailyPrediction.timeWindows.window')} ${idx + 1}`;
                    const category = tw.category ?? '';
                    const twScore = (tw as any).score;
                    const score: number | null = typeof twScore === 'number' ? twScore : null;
                    const variant = getCategoryVariant(category, score ?? undefined);
                    const severityInput = typeof (tw as any).severity === 'string' ? (tw as any).severity : undefined;
                    const severity = mapVariantToSeverity(severityInput, variant) ?? 'neutral';
                    const severityClass = `mv-severity--${severity}`;

                    // Prefer ISO fields first, then raw start/end
                    const startRaw = (tw.startISO ?? (tw as any).start_iso ?? tw.start) as string | number | undefined;
                    const endRaw = (tw.endISO ?? (tw as any).end_iso ?? tw.end) as string | number | undefined;

                    // Prefer pre-computed display strings (backend may provide them), fall back to formatMaybe()
                    const startDisplay =
                      (tw as any).startDisplay ??
                      (tw as any).start_display ??
                      tw.startDisplay ??
                      formatMaybe(startRaw) ??
                      '--:--';
                    const endDisplay =
                      (tw as any).endDisplay ??
                      (tw as any).end_display ??
                      tw.endDisplay ??
                      formatMaybe(endRaw) ??
                      '--:--';

                    // Use ISO strings for calendar creation if available
                    const startIsoForCalendar = (tw as any).startISO ?? (tw as any).start_iso ?? (typeof startRaw === 'string' ? startRaw : undefined);
                    const endIsoForCalendar = (tw as any).endISO ?? (tw as any).end_iso ?? (typeof endRaw === 'string' ? endRaw : undefined);

                    // Build summary text from normalized, debug-stripped fields
                    // Use looksLikeRawJsonData to filter out raw backend data
                    const summaryParts: string[] = [];
                    if (tw.short_desc && !looksLikeRawJsonData(String(tw.short_desc))) {
                      summaryParts.push(String(tw.short_desc));
                    }
                    if ((tw as any).full_summary && !looksLikeRawJsonData(String((tw as any).full_summary))) {
                      summaryParts.push(stripHtmlTags(String((tw as any).full_summary)));
                    }
                    if (tw.description && tw.description !== tw.short_desc && !looksLikeRawJsonData(String(tw.description))) {
                      summaryParts.push(String(tw.description));
                    }
                    // Only include note if it doesn't look like raw JSON data
                    if ((tw as any).note && (tw as any).note !== tw.description && !looksLikeRawJsonData(String((tw as any).note))) {
                      summaryParts.push(String((tw as any).note));
                    }
                    const rawSummary = summaryParts.filter(Boolean).join(' ').trim();
                    const strippedSummary = stripDebugBlocks(rawSummary);
                    const fullSummary = dedupeSummary(
                      cleanSummaryWithWindows(strippedSummary, mergedWindows, formatOptions),
                      {
                        mode: 'consecutive',
                        similarityThreshold: 0.9,
                      }
                    );

                    // Extract AI interpretation and practical advice from merged window
                    // Check multiple fields: ai_summary (from backend), interpretation_html, interpretation
                    // Use || for ai_summary to treat empty string as falsy (intentional)
                    const aiSummaryText = (tw as any).ai_summary || (tw as any).interpretation_html || (tw as any).interpretation || '';
                    const aiInterpretation = translateContent(aiSummaryText);
                    // Use ?? for practical to preserve empty strings if explicitly set
                    const aiPractical = translateContent((tw as any).practical_html ?? (tw as any).practical ?? '');

                    const factsHtml = sanitizeHtml((tw as any).facts_html ?? (tw as any).facts ?? undefined) || '';
                    const interpretationHtml = sanitizeHtml((tw as any).interpretation_html ?? (tw as any).interpretation ?? undefined) || '';
                    const practicalHtml = sanitizeHtml((tw as any).practical_html ?? (tw as any).practical ?? undefined) || '';
                    const hasDetails = Boolean(factsHtml || interpretationHtml || practicalHtml);

                    const scoreVariant = (tw as any).scoreVariant ?? getScoreVariant(score);
                    const scoreText = (tw as any).scoreText ?? (score !== null ? score.toFixed(1) : '-');

                    return (
                      <article
                        key={idx}
                        className={`tw-card tw-card--${severity || 'default'} ${severityClass} mv-${severity}`}
                        data-severity={severity}
                        aria-label={`Time Window: ${title}`}
                      >
                        {/* Header row */}
                        <div className="tw-card__header">
                          <div>
                            <h3 className="tw-card__title">{title}</h3>
                          </div>
                          <span className="tw-card__time">
                            <span className="mv-time-range">
                              {(startDisplay && endDisplay) ? `${startDisplay} → ${endDisplay}` : ''}
                            </span>
                          </span>
                        </div>

                        {/* AI Summary block - Human-readable interpretation and practical advice */}
                        {(aiInterpretation || aiPractical) && (
                          <div className="tw-card__ai-summary">
                            {aiInterpretation && (
                              <p className="tw-card__interpretation">{aiInterpretation}</p>
                            )}
                            {aiPractical && (
                              <p className="tw-card__practical">
                                <span className="tw-card__practical-label">💡 </span>
                                {aiPractical}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Fallback summary block if no AI summary available */}
                        {!aiInterpretation && !aiPractical && fullSummary && (
                          <div className="tw-card__summary">
                            <p>{fullSummary}</p>
                          </div>
                        )}

                        {/* Meta row: category and score */}
                        <div className="tw-card__meta">
                          {category && (
                            <span className={`tw-card__category tw-card__category--${variant}`}>
                              {category}
                            </span>
                          )}
                          <span className={`mv-badge mv-badge--score mv-score--${scoreVariant}`}>
                            {scoreText}
                          </span>
                          {tw.type && !category && (
                            <span className="tw-card__category">
                              {String(tw.type)}
                            </span>
                          )}
                          {/* Display pakshi activity from state.pakshi.activity */}
                          {(tw as any).state?.pakshi?.activity && (
                            <span className={`mv-badge mv-badge--pakshi mv-pakshi--${severity}`}>
                              🐦 {(tw as any).state.pakshi.activity}
                            </span>
                          )}
                          {/* Display star/tara info from state.star */}
                          {(tw as any).state?.star?.tara_name && (
                            <span className="mv-badge mv-badge--tara">
                              ⭐ {(tw as any).state.star.tara_name}
                            </span>
                          )}
                          {/* Display nithya yoga from state.nithya */}
                          {(tw as any).state?.nithya?.yoga && (
                            <span className="mv-badge mv-badge--nithya">
                              🔮 {(tw as any).state.nithya.yoga}
                            </span>
                          )}
                          {(tw as any).pakshi_day && (
                            <span className={`mv-badge mv-badge--pakshi mv-pakshi--${severity}`}>
                              {t('dailyPrediction.timeWindows.day')} {(tw as any).pakshi_day}
                            </span>
                          )}
                          {(tw as any).pakshi_night && (
                            <span className={`mv-badge mv-badge--pakshi mv-pakshi--${severity}`}>
                              {t('dailyPrediction.timeWindows.night')} {(tw as any).pakshi_night}
                            </span>
                          )}
                        </div>

                        {/* Factors/drivers display hidden as per design requirement - see daily-prediction.png reference */}

                        {hasDetails && (
                          <div className="tw-card__details">
                            {factsHtml && (
                              <details open={false} className="tw-card__detail-block">
                                <summary className="tw-card__detail-title">{t('dailyPrediction.timeWindows.facts')}</summary>
                                <div
                                  className="tw-card__detail-body"
                                  dangerouslySetInnerHTML={{ __html: factsHtml }}
                                />
                              </details>
                            )}
                            {interpretationHtml && (
                              <details open={false} className="tw-card__detail-block">
                                <summary className="tw-card__detail-title">{t('dailyPrediction.timeWindows.interpretation')}</summary>
                                <div
                                  className="tw-card__detail-body"
                                  dangerouslySetInnerHTML={{ __html: interpretationHtml }}
                                />
                              </details>
                            )}
                            {practicalHtml && (
                              <details open={false} className="tw-card__detail-block">
                                <summary className="tw-card__detail-title">{t('dailyPrediction.timeWindows.practical')}</summary>
                                <div
                                  className="tw-card__detail-body"
                                  dangerouslySetInnerHTML={{ __html: practicalHtml }}
                                />
                              </details>
                            )}
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="tw-card__actions">
                          {startIsoForCalendar && endIsoForCalendar && (
                            <button
                              type="button"
                              className="tw-card__btn"
                              aria-label={`Add ${title} to calendar`}
                              onClick={() => addToCalendar(`${title} — ${t('dailyPrediction.hero.calendarTitleSuffix')}`, String(startIsoForCalendar), String(endIsoForCalendar))}
                            >
                              {t('dailyPrediction.timeWindows.addToCalendar')}
                            </button>
                          )}
                          
                          <button
                            type="button"
                            className="tw-card__btn tw-card__btn--secondary"
                            aria-label={`Share ${title}`}
                            onClick={() => shareWindow(
                              title,
                              category || t('dailyPrediction.timeWindows.category'),
                              score !== null ? score.toFixed(1) : '—',
                              `${startDisplay} → ${endDisplay}`,
                              fullSummary || '',
                              t
                            )}
                          >
                            {t('dailyPrediction.timeWindows.share')}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ) : !dayApiLoading ? (
              <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
                <p className="text-sm text-slate-400">{t('dailyPrediction.timeWindows.noWindows')}</p>
              </div>
            ) : null}

        </div>
      </div>
    </div>
  );
}

