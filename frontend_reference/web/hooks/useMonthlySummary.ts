import { useState, useEffect, useCallback, useRef } from 'react';
import { API_BASE } from '@/lib/api';

interface MonthlySummaryData {
  safe_payload: {
    month_key: string;
    month_name: string;
    overall_score: number;
    verdict: string;
    top_domains: Array<{
      name: string;
      display_name: string;
      score: number;
      outlook: string;
      reason_short: string;
      key_houses: string[];
      key_planets: string[];
    }>;
    weekly_summary: Record<string, {
      score: number;
      outlook: string;
      date_range: string;
    }>;
    key_dates: Array<{
      date: string;
      event: string;
      significance: string;
    }>;
  };
  one_line: string;
  narration: string;
  month_key: string;
  profile_id: number;
  created_at: string;
  locale?: string;
  qa_check?: {
    passed: boolean;
    notes: string;
  };
  qa_details?: Record<string, any>;
  regeneration_attempts?: number;
  // Additional fields from monthly-summary API
  golden_dates_summary?: {
    count: number;
    golden_dates: Array<{
      date: string;
      start_time?: string;
      end_time?: string;
      score?: number;
      reasons?: Record<string, boolean>;
      windows?: any[];
    }>;
  };
  chandrashtama_periods?: Array<{
    date?: string;
    start_time?: string;
    end_time?: string;
    current_nakshatra?: string;
  }>;
  chandrashtama_days?: string[];
  dasha_summary?: {
    current?: {
      mahadasha?: string;
      antardasha?: string;
      pratyantardasha?: string;
    };
    current_dasha?: string;
  };
}

interface UseMonthlySummaryOptions {
  profileId: number | null;
  monthKey?: string;
  locale?: string;
  enabled?: boolean;
  sessionRestored?: boolean;
  firebaseReady?: boolean;
  token: string | null;
  refreshToken?: (force?: boolean) => Promise<string | null>;
  ensureSession?: (options?: { forceRefresh?: boolean }) => Promise<string>;
}

interface UseMonthlySummaryResult {
  data: MonthlySummaryData | null;
  loading: boolean;
  error: string | null;
  refetch: (refresh?: boolean) => Promise<void>;
}

export function useMonthlySummary({
  profileId,
  monthKey,
  locale = 'en',
  enabled = true,
  sessionRestored = true,
  firebaseReady = true,
  token,
  refreshToken,
  ensureSession,
}: UseMonthlySummaryOptions): UseMonthlySummaryResult {
  const [data, setData] = useState<MonthlySummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Store dependencies in refs to avoid effect re-runs when they change
  const tokenRef = useRef(token);
  const refreshTokenRef = useRef(refreshToken);
  const ensureSessionRef = useRef(ensureSession);
  const sessionRestoredRef = useRef(sessionRestored);
  const firebaseReadyRef = useRef(firebaseReady);
  
  // Keep refs updated
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);
  
  useEffect(() => {
    refreshTokenRef.current = refreshToken;
  }, [refreshToken]);

  useEffect(() => {
    ensureSessionRef.current = ensureSession;
  }, [ensureSession]);

  useEffect(() => {
    sessionRestoredRef.current = sessionRestored;
  }, [sessionRestored]);

  useEffect(() => {
    firebaseReadyRef.current = firebaseReady;
  }, [firebaseReady]);

  // Track in-flight requests to prevent duplicates
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const retryCountRef = useRef(0);

  /**
   * Robust token resolution using the fallback chain:
   * 1. Context token (from ref) - skipped if forceRefresh is true
   * 2. refreshToken(force=true) if available
   * 3. ensureSession(force=true) if available
   * 4. localStorage fallback
   */
  const resolveToken = useCallback(async (forceRefresh = false): Promise<string | null> => {
    // Step 1: Try context token (skip if forcing refresh after 401)
    if (!forceRefresh && tokenRef.current) {
      return tokenRef.current;
    }

    // Step 2: Try refreshToken with force
    if (refreshTokenRef.current) {
      try {
        const refreshed = await refreshTokenRef.current(true);
        if (refreshed) {
          return refreshed;
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[useMonthlySummary] refreshToken failed:', err);
        }
      }
    }

    // Step 3: Try ensureSession with force
    if (ensureSessionRef.current) {
      try {
        const status = await ensureSessionRef.current({ forceRefresh: true });
        // After ensureSession, token should be in context
        if (status === 'ok' && tokenRef.current) {
          return tokenRef.current;
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[useMonthlySummary] ensureSession failed:', err);
        }
      }
    }

    // Step 4: Try localStorage fallback
    if (typeof window !== 'undefined') {
      const storedToken = 
        localStorage.getItem('firebase_token') ?? 
        localStorage.getItem('token');
      if (storedToken) {
        return storedToken;
      }
    }

    return null;
  }, []);

  const fetchData = useCallback(
    async (forceRefresh = false) => {
      // Increment request ID
      const currentRequestId = ++requestIdRef.current;
      
      if (!enabled || !profileId) {
        return;
      }

      // Wait for auth to be ready before making requests
      if (!sessionRestoredRef.current || !firebaseReadyRef.current) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[useMonthlySummary] Waiting for auth to be ready', {
            sessionRestored: sessionRestoredRef.current,
            firebaseReady: firebaseReadyRef.current,
          });
        }
        return;
      }

      // Abort any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller for this request
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      setLoading(true);
      setError(null);
      retryCountRef.current = 0;

      try {
        // Resolve token using robust fallback chain
        const authToken = await resolveToken();

        if (!authToken) {
          setError('Authentication required');
          setLoading(false);
          return;
        }

        // Diagnostic logging (development only, token preview only)
        if (process.env.NODE_ENV === 'development') {
          console.log('[useMonthlySummary] Fetching with token preview:', authToken.substring(0, 10) + '...');
        }

        const params = new URLSearchParams({
          profile_id: String(profileId),
          locale: locale || 'en',
        });

        if (monthKey) {
          params.set('month', monthKey);
        }

        if (forceRefresh) {
          params.set('refresh', '1');
        }

        const response = await fetch(
          `${API_BASE}/api/monthly-summary?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
            credentials: 'include',
            signal: abortController.signal,
          }
        );

        // Check if this request was superseded
        if (currentRequestId !== requestIdRef.current) {
          console.log('Monthly summary request superseded, ignoring response');
          return;
        }

        // Handle 401 with controlled retry (single attempt only)
        if (response.status === 401) {
          if (retryCountRef.current < 1) {
            retryCountRef.current += 1;
            if (process.env.NODE_ENV === 'development') {
              console.log('[useMonthlySummary] Received 401, attempting forced token refresh and retry');
            }

            // Force token refresh via the robust resolver (skip context token)
            const freshToken = await resolveToken(true);
            
            if (freshToken) {
              const retryResponse = await fetch(
                `${API_BASE}/api/monthly-summary?${params.toString()}`,
                {
                  headers: {
                    Authorization: `Bearer ${freshToken}`,
                  },
                  credentials: 'include',
                  signal: abortController.signal,
                }
              );

              // Check again if superseded
              if (currentRequestId !== requestIdRef.current) {
                console.log('Monthly summary retry request superseded, ignoring response');
                return;
              }

              if (!retryResponse.ok) {
                if (retryResponse.status === 401) {
                  setError('Authentication required');
                } else {
                  throw new Error('Failed to fetch monthly summary');
                }
                setLoading(false);
                return;
              }

              const result = await retryResponse.json();
              setData(result);
              setLoading(false);
              return;
            }
          }
          
          setError('Authentication required');
          setLoading(false);
          return;
        }

        if (response.status === 404) {
          setError('Monthly summary not available');
          setData(null);
          setLoading(false);
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch monthly summary');
        }

        const result = await response.json();
        setData(result);
      } catch (err: any) {
        // Ignore abort errors - they're expected when cancelling requests
        if (err?.name === 'AbortError') {
          console.log('Monthly summary request aborted');
          return;
        }
        
        // Check if this request was superseded
        if (currentRequestId !== requestIdRef.current) {
          return;
        }
        
        console.error('Error fetching monthly summary:', err);
        setError('Failed to load monthly summary');
        setData(null);
      } finally {
        // Only update loading if this is still the current request
        if (currentRequestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    // Only depend on stable primitives and resolveToken
    [profileId, monthKey, locale, enabled, resolveToken]
  );

  // Effect runs only when the actual input parameters change
  useEffect(() => {
    // Add diagnostic logging (development only)
    if (process.env.NODE_ENV === 'development') {
      console.log('[useMonthlySummary] Effect triggered', {
        profileId,
        monthKey,
        locale,
        enabled,
        sessionRestored: sessionRestoredRef.current,
        firebaseReady: firebaseReadyRef.current,
        tokenPreview: tokenRef.current ? `${tokenRef.current.substring(0, 10)}...` : null,
      });
    }
    
    fetchData();
    
    // Cleanup: abort any in-flight request when component unmounts or deps change
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // Note: fetchData is stable because it only depends on primitives and resolveToken
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId, monthKey, locale, enabled]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}
