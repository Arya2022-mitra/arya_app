import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/router';
import { API_BASE } from '@/lib/api';
import { handleUnauthorized } from '@/lib/handleUnauthorized';
import { useActiveProfile } from '@/lib/useActiveProfile';
import { useAuth } from '@/lib/useAuth';
import type { DailyAlertData } from '@/types/DailyAlertData';
import type { Profile } from '@/types/Profile';
import { normalizeTimeWindow } from '@/lib/cleanSummaryWithWindows';

interface DailyPredictionContextValue {
  data: DailyAlertData | null;
  rawData: DailyAlertData | null;
  loading: boolean;
  error: string | null;
  refresh: (force?: boolean) => Promise<void>;
  lastUpdated: string | null;
  rawResponse: Record<string, any> | null;
}

const DailyPredictionContext = createContext<DailyPredictionContextValue | undefined>(undefined);

type CachedPrediction = {
  rawData: DailyAlertData | null;
  rawResponse: Record<string, any> | null;
  lastUpdated: string | null;
};

const buildKey = (profile: Profile | null, day: string): string | null => {
  if (!profile?.id) return null;
  return `${profile.id}-${day}`;
};

const normalisePrediction = (payload: any): DailyAlertData | null => {
  const base = payload?.raw_data?.data ?? payload?.raw_data ?? payload;
  if (!base || typeof base !== 'object') {
    return null;
  }

  const prediction: Record<string, any> = { ...base };

  // canonicalise domain_predictions -> top-level keys
  const domainPred = payload?.raw_data?.domain_predictions || base?.domain_predictions;
  if (domainPred && typeof domainPred === 'object') {
    if (!prediction.wealth && (domainPred as any).wealth) {
      prediction.wealth = (domainPred as any).wealth;
      prediction.wealth_block = prediction.wealth_block ?? (domainPred as any).wealth;
    }
    if (!prediction.health && (domainPred as any).health) {
      prediction.health = (domainPred as any).health;
      prediction.health_block = prediction.health_block ?? (domainPred as any).health;
    }
  }
  const pakshi = (base as any)?.pakshi_muhurta || {};

  prediction.pakshi_windows_all =
    prediction.pakshi_windows_all ?? pakshi.pakshi_windows_all ?? pakshi.segments;
  prediction.pakshi_windows_best =
    prediction.pakshi_windows_best ?? pakshi.pakshi_windows_best ?? pakshi.segments;
  if (prediction.filters == null && pakshi.filters != null) {
    prediction.filters = pakshi.filters;
  }

  const blackMagicSource =
    (prediction.black_magic && typeof prediction.black_magic === 'object'
      ? (prediction.black_magic as any).data ?? prediction.black_magic
      : null) ?? (base as any)?.black_magic?.data ?? (base as any)?.black_magic;

  if (blackMagicSource && typeof blackMagicSource === 'object') {
    prediction.black_magic = {
      ...blackMagicSource,
      proof_chain: Array.isArray((blackMagicSource as any).proof_chain)
        ? (blackMagicSource as any).proof_chain
        : [],
    };
  }

  const mapPakshiWindows = (windows: any[] | undefined | null) => {
    if (!Array.isArray(windows)) return [];
    return windows.map((w, idx) => normalizeTimeWindow(w, idx));
  };

  prediction.pakshi_windows_all = mapPakshiWindows(prediction.pakshi_windows_all);
  prediction.pakshi_windows_best = mapPakshiWindows(prediction.pakshi_windows_best);

  // Ensure layers/time_windows is canonical and normalized
  const layersSource: Record<string, any> =
    typeof prediction.layers === 'object' && prediction.layers !== null ? { ...prediction.layers } : {};
  const rawWindows =
    layersSource.time_windows ??
    (base as any)?.time_windows ??
    (prediction as any).time_windows ??
    payload?.raw_data?.layers?.time_windows ??
    payload?.layers?.time_windows ??
    [];

  const normalizedWindows = Array.isArray(rawWindows)
    ? rawWindows.map((w: any, idx: number) => normalizeTimeWindow(w, idx))
    : [];

  layersSource.time_windows = normalizedWindows;
  prediction.layers = layersSource as any;
  (prediction as any).time_windows = normalizedWindows;

  return prediction as DailyAlertData;
};

export function DailyPredictionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { profile, loading: profileLoading } = useActiveProfile();
  const { token, sessionRestored, logout, refreshToken } = useAuth();

  const [data, setData] = useState<DailyAlertData | null>(null);
  const [rawData, setRawData] = useState<DailyAlertData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchedRawKey, setFetchedRawKey] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [rawResponse, setRawResponse] = useState<Record<string, any> | null>(null);
  const [dateKey, setDateKey] = useState(() => new Date().toISOString().slice(0, 10));

  const profileRef = useRef<Profile | null>(null);
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  const dateRef = useRef(dateKey);
  useEffect(() => {
    dateRef.current = dateKey;
  }, [dateKey]);

  const cacheRef = useRef<Map<string, CachedPrediction>>(new Map());
  const runningFetch = useRef(false);

  const applyCacheEntry = useCallback((rawKey: string, entry: CachedPrediction) => {
    setRawData(entry.rawData);
    setRawResponse(entry.rawResponse);
    setLastUpdated(entry.lastUpdated);
    setData(entry.rawData);
    setFetchedRawKey(rawKey);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }
    const interval = window.setInterval(() => {
      const today = new Date().toISOString().slice(0, 10);
      setDateKey((prev) => (prev === today ? prev : today));
    }, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const fetchPrediction = useCallback(
    async ({ force = false }: { force?: boolean } = {}) => {
      if (runningFetch.current && !force) {
        return;
      }
      runningFetch.current = true;
      try {
        const activeProfile = profileRef.current;
        if (!activeProfile?.id || !sessionRestored) {
          return;
        }
        const activeDay = dateRef.current;
        const rawKey = buildKey(activeProfile, activeDay);
        if (rawKey == null) {
          return;
        }
        if (!force && fetchedRawKey === rawKey) {
          const existing = cacheRef.current.get(rawKey);
          if (existing) {
            applyCacheEntry(rawKey, existing);
            setError(null);
          }
          setLoading(false);
          return;
        }

        setLoading(true);
        const cached = cacheRef.current.get(rawKey);
        if (!force && cached) {
          applyCacheEntry(rawKey, cached);
          setError(null);
          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);
        try {
          let authTok = token;
          if (!authTok && refreshToken) {
            authTok = await refreshToken(true);
          }

          if (!authTok) {
            await handleUnauthorized(router, { logout, refreshToken });
            setError('Unauthorized');
            setData(null);
            setLastUpdated(null);
            setFetchedRawKey(rawKey);
            setLoading(false);
            return;
          }

          const makeRequest = (bearer: string) =>
            fetch(`${API_BASE}/get_prediction`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${bearer}`,
              },
              credentials: 'include',
              body: JSON.stringify({
                active_profile: activeProfile,
                page: 'daily_alert',
                engine_name: 'daily_alert_engine',
                daily: true,
              }),
            });

          let response = await makeRequest(authTok);

          if (response.status === 401) {
            const retryRes = await handleUnauthorized(router, {
              logout,
              refreshToken,
              retry: async (fresh) => {
                if (!fresh) {
                  return new Response(null, { status: 401 });
                }
                return makeRequest(fresh);
              },
            });
            if (!retryRes) {
              setError('Unauthorized');
              setData(null);
              setLastUpdated(null);
              setFetchedRawKey(rawKey);
              setLoading(false);
              return;
            }
            response = retryRes;
          }

          if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
          }

          const payload = await response.json();
          const parsed = normalisePrediction(payload);

          const rawPayload =
            payload && typeof payload === 'object' ? (payload as Record<string, any>) : null;

          if (!parsed) {
            setData(null);
            setRawData(null);
            setError('Missing prediction data');
            setLastUpdated(null);
            setRawResponse(rawPayload);
            cacheRef.current.delete(rawKey);
            setFetchedRawKey(rawKey);
          } else {
            const nowIso = new Date().toISOString();
            const cacheEntry: CachedPrediction = {
              rawData: parsed,
              rawResponse: rawPayload,
              lastUpdated: nowIso,
            };
            cacheRef.current.set(rawKey, cacheEntry);
            applyCacheEntry(rawKey, cacheEntry);
            setRawData(parsed);
            setError(null);
            setLastUpdated(nowIso);
            setRawResponse(rawPayload);
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to fetch daily prediction');
          setData(null);
          setRawData(null);
          setLastUpdated(null);
          setRawResponse(null);
          setFetchedRawKey(rawKey ?? null);
        } finally {
          setLoading(false);
        }
      } finally {
        runningFetch.current = false;
      }
    },
    [applyCacheEntry, fetchedRawKey, logout, router, sessionRestored, token, refreshToken],
  );

  const previousProfileId = useRef<string | number | null>(null);
  useEffect(() => {
    const currentId = profile?.id ?? null;
    if (currentId !== previousProfileId.current) {
      previousProfileId.current = currentId;
      setData(null);
      setRawData(null);
      setLastUpdated(null);
      setFetchedRawKey(null);
      setRawResponse(null);
      cacheRef.current.clear();
    }
  }, [profile?.id]);

  useEffect(() => {
    if (!sessionRestored || profileLoading) {
      return;
    }
    if (!profile?.id) {
      return;
    }
    const rawKey = buildKey(profile, dateKey);
    if (rawKey && fetchedRawKey !== rawKey) {
      void fetchPrediction();
    }
  }, [dateKey, fetchPrediction, fetchedRawKey, profile, profileLoading, sessionRestored]);

  const refresh = useCallback(
    async (force = true) => {
      await fetchPrediction({ force });
    },
    [fetchPrediction],
  );

  const value = useMemo(
    () => ({
      data,
      rawData,
      loading,
      error,
      refresh,
      lastUpdated,
      rawResponse,
    }),
    [data, error, lastUpdated, loading, rawData, rawResponse, refresh],
  );

  return <DailyPredictionContext.Provider value={value}>{children}</DailyPredictionContext.Provider>;
}

export const useDailyPrediction = () => {
  const ctx = useContext(DailyPredictionContext);
  if (!ctx) {
    throw new Error('useDailyPrediction must be used within DailyPredictionProvider');
  }
  return ctx;
};

