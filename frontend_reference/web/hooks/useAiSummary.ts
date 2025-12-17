import { useCallback, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { API_BASE } from '@/lib/api';
import { useAuth } from '@/lib/useAuth';
import { handleUnauthorized } from '@/lib/handleUnauthorized';
import { useTranslation } from 'react-i18next';

export type AiSummaryData = {
  profile_id: number;
  engine: string;
  /** HTML content (preferred when available, server-sanitized) */
  html?: string;
  /** Plain text summary (fallback when html is not available) */
  summary?: string;
  updated_at?: string | null;
  /** Time windows for expanding time_windows[n] tokens */
  time_windows?: unknown[];
  /** Debug data containing layers and sources (for developer use only) */
  debug?: {
    /** Layers data from AI Summary service */
    layers?: Record<string, unknown>;
    /** Sources data */
    sources?: unknown[];
  };
  /** @deprecated Use debug.layers instead - kept for backward compatibility */
  layers?: Record<string, unknown>;
  /** @deprecated Use debug.sources instead - kept for backward compatibility */
  sources?: unknown[];
  /** Summary metadata containing engine output and other metadata */
  summary_metadata?: {
    engine_name?: string;
    vertex_ai_model?: string;
    windows_processed?: number;
    layers?: Record<string, unknown>;
    engine_output?: {
      windows?: unknown[];
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
};

type UseAiSummaryReturn = {
  data: AiSummaryData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

/**
 * Retry configuration for AI summary fetching.
 * For new profiles, AI summary may not be available immediately.
 * Retry with exponential backoff to handle eventual consistency.
 */
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelayMs: 2000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
};

/**
 * Simple in-memory cache for AI summaries to ensure persistence across re-renders.
 * Key format: `${engine}:${profileId}`
 * Limited to MAX_CACHE_SIZE entries to prevent memory leaks.
 */
const aiSummaryCache = new Map<string, { data: AiSummaryData; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache TTL
const MAX_CACHE_SIZE = 50; // Maximum number of cached entries

function getCacheKey(engine: string, profileId: number): string {
  return `${engine}:${profileId}`;
}

function getCachedData(engine: string, profileId: number): AiSummaryData | null {
  const key = getCacheKey(engine, profileId);
  const cached = aiSummaryCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }
  // Remove stale entry if expired
  if (cached) {
    aiSummaryCache.delete(key);
  }
  return null;
}

function setCachedData(engine: string, profileId: number, data: AiSummaryData): void {
  const key = getCacheKey(engine, profileId);
  
  // Cleanup old entries if cache is getting too large
  if (aiSummaryCache.size >= MAX_CACHE_SIZE) {
    const now = Date.now();
    // Remove expired entries first
    for (const [k, v] of aiSummaryCache.entries()) {
      if (now - v.timestamp >= CACHE_TTL_MS) {
        aiSummaryCache.delete(k);
      }
    }
    // If still too large, remove oldest entries
    if (aiSummaryCache.size >= MAX_CACHE_SIZE) {
      const entries = Array.from(aiSummaryCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toRemove = entries.slice(0, Math.floor(MAX_CACHE_SIZE / 2));
      for (const [k] of toRemove) {
        aiSummaryCache.delete(k);
      }
    }
  }
  
  aiSummaryCache.set(key, { data, timestamp: Date.now() });
}

/**
 * Normalize AI summary API response to a consistent frontend shape.
 * Handles multiple backend response formats:
 * - Wrapper responses: {status: 'ok', data: {...}}
 * - DB model shapes: {summary: {summary_text, html_text, summary_metadata}}
 * - Direct AiSummaryData objects
 * - Legacy per-column fields: window_1_summary..window_16_summary
 * 
 * @param raw - Raw JSON response from AI summary API (may be wrapper, DB model, or direct format)
 * @returns Normalized AiSummaryData object with consistent field structure
 */
function normalizeAiSummaryApiResponse(raw: unknown): AiSummaryData {
  if (!raw || typeof raw !== 'object') {
    // Return minimal valid structure for invalid input
    // This is defensive to prevent crashes, but the hook will handle errors appropriately
    return { profile_id: 0, engine: 'unknown' };
  }

  let workingData = raw as Record<string, any>;

  // Handle wrapper response {status: 'ok', data: {...}}
  if (workingData.status === 'ok' && workingData.data && typeof workingData.data === 'object') {
    workingData = workingData.data;
  }

  // Check if workingData.summary is a DB model object (has summary_text, html_text, etc.)
  const summaryField = workingData.summary;
  const isDbModelShape = summaryField && typeof summaryField === 'object' && 
    ('summary_text' in summaryField || 'html_text' in summaryField || 'summary_metadata' in summaryField);

  if (isDbModelShape) {
    // Extract from DB model shape - cast to Record for property access
    const dbSummary = summaryField as Record<string, any>;
    
    // Extract time_windows from structured metadata layers
    let timeWindows: unknown[] | undefined;
    const layersSource = dbSummary.summary_metadata?.layers || dbSummary.layers;
    if (layersSource && typeof layersSource === 'object') {
      const layers = layersSource as Record<string, any>;
      timeWindows = layers.time_windows;
    }
    
    // Fall back to top-level time_windows or dbSummary.time_windows
    if (!timeWindows || !Array.isArray(timeWindows)) {
      timeWindows = dbSummary.time_windows || workingData.time_windows;
    }

    // Fall back to legacy per-column fields (window_1_summary..window_16_summary)
    if (!timeWindows || !Array.isArray(timeWindows) || timeWindows.length === 0) {
      const legacyWindows: any[] = [];
      for (let i = 1; i <= 16; i++) {
        const windowField = dbSummary[`window_${i}_summary`];
        if (windowField && typeof windowField === 'string') {
          legacyWindows.push({
            window_index: i,
            summary: windowField,
            interpretation: windowField,
          });
        }
      }
      if (legacyWindows.length > 0) {
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.debug('[useAiSummary] Using legacy window_N_summary fallback for AI windows');
        }
        timeWindows = legacyWindows;
      }
    }

    return {
      profile_id: workingData.profile_id ?? dbSummary.profile_id ?? 0,
      engine: workingData.engine ?? workingData.engine_name ?? 'unknown',
      html: dbSummary.html_text ?? dbSummary.html,
      summary: dbSummary.summary_text ?? dbSummary.summary,
      updated_at: dbSummary.updated_at,
      time_windows: timeWindows,
      debug: {
        layers: dbSummary.summary_metadata?.layers ?? dbSummary.layers,
        sources: dbSummary.summary_metadata?.sources ?? dbSummary.sources,
      },
      layers: dbSummary.summary_metadata?.layers ?? dbSummary.layers,
      sources: dbSummary.summary_metadata?.sources ?? dbSummary.sources,
      summary_metadata: dbSummary.summary_metadata ?? (dbSummary.layers ? { layers: dbSummary.layers } : undefined),
    };
  }

  // Check if workingData already looks like AiSummaryData
  // (has profile_id and either html/summary or time_windows)
  if ('profile_id' in workingData || 'engine' in workingData) {
    // Extract time_windows from structured layers if available
    let timeWindows = workingData.time_windows;
    const layersSource = workingData.summary_metadata?.layers || workingData.layers || workingData.debug?.layers;
    if (layersSource && typeof layersSource === 'object' && !timeWindows) {
      timeWindows = (layersSource as any).time_windows;
    }

    return {
      profile_id: workingData.profile_id ?? 0,
      engine: workingData.engine ?? workingData.engine_name ?? 'unknown',
      html: workingData.html,
      summary: workingData.summary,
      updated_at: workingData.updated_at,
      time_windows: timeWindows,
      debug: workingData.debug,
      layers: workingData.layers,
      sources: workingData.sources,
      summary_metadata: workingData.summary_metadata,
    };
  }

  // Last resort: return raw data as-is with type assertion
  // This handles unexpected formats gracefully
  return raw as AiSummaryData;
}

export function useAiSummary(engine: string, profileId: number | null): UseAiSummaryReturn {
  const router = useRouter();
  const { token, sessionRestored, logout, refreshToken } = useAuth();
  const { i18n } = useTranslation();
  
  // Initialize with cached data if available for immediate display
  const [data, setData] = useState<AiSummaryData | null>(() => {
    if (profileId) {
      return getCachedData(engine, profileId);
    }
    return null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Track retry state with a ref to persist across renders
  // sequenceId ensures we don't interfere with concurrent/stale retry sequences
  const retryStateRef = useRef<{
    retryCount: number;
    retryTimeoutId: ReturnType<typeof setTimeout> | null;
    sequenceId: number;
  }>({ retryCount: 0, retryTimeoutId: null, sequenceId: 0 });

  const fetchSummary = useCallback(
    async (signal?: AbortSignal, isRetry: boolean = false, currentSequenceId?: number) => {
      if (!profileId || !engine) {
        return;
      }

      // Only set loading state on initial fetch, not on retries
      if (!isRetry) {
        setLoading(true);
        setError(null);
        // Reset retry count and increment sequence ID for new fetch
        retryStateRef.current.retryCount = 0;
        retryStateRef.current.sequenceId += 1;
      }
      
      // Use current sequence ID or get from ref for initial fetch
      const sequenceId = currentSequenceId ?? retryStateRef.current.sequenceId;
      
      // Check if this retry sequence is still valid
      if (isRetry && sequenceId !== retryStateRef.current.sequenceId) {
        // Stale retry sequence, abort
        return;
      }

      try {
        let authTok = token;
        if (!authTok && typeof window !== 'undefined') {
          authTok = localStorage.getItem('firebase_token');
        }
        if (!authTok && refreshToken) {
          authTok = await refreshToken(true);
        }
        if (!authTok) {
          await logout();
          router.replace('/auth');
          return;
        }

        // Build URL with compact=true for daily engine to minimize payload
        // Add locale parameter for translation support
        const queryParams = new URLSearchParams({ profile_id: String(profileId) });
        if (engine === 'daily') {
          queryParams.append('compact', 'true');
        }
        // Pass current language to API for localized content
        const currentLocale = i18n.language || 'en';
        queryParams.append('locale', currentLocale);

        const performFetch = (auth: string | null) =>
          fetch(`${API_BASE}/api/profiles/ai_summary/${engine}?${queryParams.toString()}`, {
            headers: auth ? { Authorization: `Bearer ${auth}` } : {},
            credentials: 'include',
            signal,
          });

        let res = await performFetch(authTok);
        if (res.status === 401 || res.status === 403) {
          const retryRes = await handleUnauthorized(router, {
            logout,
            refreshToken,
            retry: async (fresh) => performFetch(fresh),
          });
          if (!retryRes) {
            return;
          }
          res = retryRes;
        }

        // Don't abort if we have valid data - always try to update state
        // This prevents race conditions where valid data is discarded
        if (signal?.aborted) {
          // If we're aborted but have valid cached data, that's fine
          return;
        }

        if (res.ok) {
          const json = await res.json();
          // Normalize the response to ensure consistent shape
          const normalized = normalizeAiSummaryApiResponse(json);
          // Even if aborted after parsing, still update state with valid data
          // This ensures the summary always displays when data is available
          setData(normalized);
          setError(null);
          // Cache the normalized data for persistence
          setCachedData(engine, profileId, normalized);
        } else if (res.status === 404) {
          // AI summary not available yet - retry with exponential backoff for new profiles
          const currentRetryCount = retryStateRef.current.retryCount;
          if (currentRetryCount < RETRY_CONFIG.maxRetries && sequenceId === retryStateRef.current.sequenceId) {
            // Calculate delay with exponential backoff
            const delay = Math.min(
              RETRY_CONFIG.initialDelayMs * Math.pow(RETRY_CONFIG.backoffMultiplier, currentRetryCount),
              RETRY_CONFIG.maxDelayMs
            );
            
            retryStateRef.current.retryCount = currentRetryCount + 1;
            
            // Schedule retry with sequence ID check
            retryStateRef.current.retryTimeoutId = setTimeout(() => {
              if (!signal?.aborted && sequenceId === retryStateRef.current.sequenceId) {
                fetchSummary(signal, true, sequenceId);
              }
            }, delay);
          } else {
            // Max retries reached, set error but don't clear existing data
            setError('AI summary not available');
          }
        } else {
          // Set error but don't clear existing data for persistence
          setError('Failed to load AI summary');
        }
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'name' in err && err.name === 'AbortError') {
          // On abort, don't clear existing data
          return;
        }
        // Set error but don't clear existing data
        setError('Failed to load AI summary');
      } finally {
        // Always set loading to false after fetch completes (success or failure)
        // But not if aborted - another fetch might be starting
        if (!signal?.aborted) {
          if (!isRetry || retryStateRef.current.retryCount >= RETRY_CONFIG.maxRetries) {
            setLoading(false);
          }
        }
      }
    },
    [engine, profileId, token, refreshToken, logout, router, i18n.language]
  );

  // Effect to check cache when profileId changes
  useEffect(() => {
    if (profileId) {
      const cached = getCachedData(engine, profileId);
      if (cached) {
        setData(cached);
      }
    }
  }, [engine, profileId]);

  // Fetch data when session is restored, profile changes, or language changes
  // Language change should trigger refetch to get localized AI content
  useEffect(() => {
    if (!sessionRestored || !profileId) {
      return;
    }
    
    // Check if we already have cached data - if so, still fetch but don't block display
    const cached = getCachedData(engine, profileId);
    if (cached) {
      setData(cached);
    }

    const controller = new AbortController();
    fetchSummary(controller.signal);

    return () => {
      controller.abort();
      // Clear any pending retry timeout
      if (retryStateRef.current.retryTimeoutId) {
        clearTimeout(retryStateRef.current.retryTimeoutId);
        retryStateRef.current.retryTimeoutId = null;
      }
    };
  }, [sessionRestored, profileId, fetchSummary, engine, i18n.language]);

  return {
    data,
    loading,
    error,
    refetch: () => fetchSummary(),
  };
}
