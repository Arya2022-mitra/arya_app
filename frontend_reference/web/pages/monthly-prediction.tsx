// web/pages/monthly-prediction.tsx
import { useMemo, useState, ChangeEvent, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { useActiveProfile } from '@/lib/useActiveProfile';
import { useAuth } from '@/lib/useAuth';
import MonthlyDivineSummary from '@/components/MonthlyDivineSummary';
import { useTranslation } from 'react-i18next';
import AiSummaryDisplay from '@/components/AiSummaryDisplay';
import { useAiSummary } from '@/hooks/useAiSummary';
import { useMonthlySummary } from '@/hooks/useMonthlySummary';
import { useMonthlySpecialDates } from '@/hooks/useMonthlySpecialDates';
import { getApiUrl } from '@/lib/api';

const getDefaultMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export default function MonthlyPredictionPage() {
  const router = useRouter();
  const { profile, loading } = useActiveProfile();
  const { token, sessionRestored, firebaseReady, logout, refreshToken, ensureSession } = useAuth();
  const { t, i18n } = useTranslation();

  const [month, setMonth] = useState<string>(getDefaultMonth);

  const profileId = useMemo(() => profile?.id || profile?.profile_id, [profile]);
  const loadingAuth = !sessionRestored;
  const numProfileId = profileId ? Number(profileId) : null;
  const aiSummary = useAiSummary('monthly', numProfileId);

  // Use the existing monthly summary hook
  const monthlySummary = useMonthlySummary({
    profileId: numProfileId,
    monthKey: month,
    locale: i18n.language || 'en',
    enabled: sessionRestored && firebaseReady && !!numProfileId,
    sessionRestored,
    firebaseReady,
    token,
    refreshToken: async (force?: boolean) => {
      if (refreshToken) {
        return await refreshToken(force ?? false);
      }
      return null;
    },
    ensureSession: async (options?: { forceRefresh?: boolean }) => {
      if (ensureSession) {
        return await ensureSession(options);
      }
      return 'invalid';
    },
  });

  // Extract special dates from monthly summary using the dedicated hook
  const specialDates = useMonthlySpecialDates({
    monthlySummaryData: monthlySummary.data,
  });

  const handleMonthChange = (event: ChangeEvent<HTMLInputElement>) => {
    setMonth(event.target.value);
  };

  // ------------------ get_prediction fetch (direct) ------------------
  const [predictionData, setPredictionData] = useState<any | null>(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [predictionError, setPredictionError] = useState<string | null>(null);

  // Refs to reuse same token-resolution mechanism
  const tokenRef = useRef<string | null>(token);
  const refreshTokenRef = useRef(refreshToken);
  const ensureSessionRef = useRef(ensureSession);
  const sessionRestoredRef = useRef(sessionRestored);
  const firebaseReadyRef = useRef(firebaseReady);

  useEffect(() => { tokenRef.current = token; }, [token]);
  useEffect(() => { refreshTokenRef.current = refreshToken; }, [refreshToken]);
  useEffect(() => { ensureSessionRef.current = ensureSession; }, [ensureSession]);
  useEffect(() => { sessionRestoredRef.current = sessionRestored; }, [sessionRestored]);
  useEffect(() => { firebaseReadyRef.current = firebaseReady; }, [firebaseReady]);

  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const retryCountRef = useRef(0);

  // Robust token resolution (mirrors useMonthlySummary)
  const resolveTokenForPrediction = useCallback(async (forceRefresh = false): Promise<string | null> => {
    if (!forceRefresh && tokenRef.current) return tokenRef.current;

    if (refreshTokenRef.current) {
      try {
        const refreshed = await refreshTokenRef.current(true);
        if (refreshed) return refreshed;
      } catch (err) {
        if (process.env.NODE_ENV === 'development') console.warn('[monthly-prediction] refreshToken failed:', err);
      }
    }

    if (ensureSessionRef.current) {
      try {
        const status = await ensureSessionRef.current({ forceRefresh: true });
        if (status === 'ok' && tokenRef.current) return tokenRef.current;
      } catch (err) {
        if (process.env.NODE_ENV === 'development') console.warn('[monthly-prediction] ensureSession failed:', err);
      }
    }

    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('firebase_token') ?? localStorage.getItem('token');
      if (storedToken) return storedToken;
    }

    return null;
  }, []);

  const fetchPrediction = useCallback(async (forceRefresh = false) => {
    const currentId = ++requestIdRef.current;
    if (!numProfileId) return;
    if (!sessionRestoredRef.current || !firebaseReadyRef.current) return;

    // abort previous
    if (abortRef.current) abortRef.current.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setPredictionLoading(true);
    setPredictionError(null);
    retryCountRef.current = 0;

    try {
      const authToken = await resolveTokenForPrediction();
      if (!authToken) {
        setPredictionError('Authentication required');
        setPredictionLoading(false);
        return;
      }

      const params = new URLSearchParams({
        profile_id: String(numProfileId),
        locale: i18n.language || 'en',
      });
      if (month) params.set('month', month);
      if (forceRefresh) params.set('refresh', '1');

      const url = getApiUrl(`/api/get_prediction?${params.toString()}`);

      let resp = await fetch(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${authToken}` },
        credentials: 'include',
        signal: ac.signal,
      });

      // If 401, try a one-time forced refresh
      if (resp.status === 401 && retryCountRef.current < 1) {
        retryCountRef.current += 1;
        const fresh = await resolveTokenForPrediction(true);
        if (fresh) {
          resp = await fetch(url, {
            method: 'GET',
            headers: { Authorization: `Bearer ${fresh}` },
            credentials: 'include',
            signal: ac.signal,
          });
        }
      }

      if (currentId !== requestIdRef.current) return;

      if (resp.status === 404) {
        setPredictionError('Prediction not available');
        setPredictionData(null);
        setPredictionLoading(false);
        return;
      }
      if (!resp.ok) throw new Error('Failed to fetch prediction');

      const result = await resp.json();
      setPredictionData(result);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      if (currentId === requestIdRef.current) {
        console.error('Prediction fetch error', err);
        setPredictionError('Failed to load prediction');
        setPredictionData(null);
      }
    } finally {
      if (currentId === requestIdRef.current) setPredictionLoading(false);
    }
  }, [numProfileId, month, i18n.language, resolveTokenForPrediction]);

  // fetch when ready / month changes
  useEffect(() => {
    if (sessionRestored && firebaseReady && numProfileId) fetchPrediction();
    return () => { if (abortRef.current) abortRef.current.abort(); };
  }, [sessionRestored, firebaseReady, numProfileId, month, i18n.language, fetchPrediction]);

  if (loading || loadingAuth) {
    return <div className="flex justify-center items-center h-screen text-blue-400">{t('common.loading')}</div>;
  }

  return (
    <div className="scroll-smooth bg-neo-dark/95">
      <div className="mx-auto flex min-h-screen max-w-screen-xl flex-col gap-8 px-4 py-10 text-white sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-neon-cyan/50 bg-gradient-to-br from-neo-dark via-[#0b1b36] to-neo-dark p-8 shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,255,255,0.12),_transparent_55%)]" />
          <div className="relative z-10 flex flex-col items-center gap-6 text-center">
            <div className="relative h-48 w-48 overflow-hidden rounded-full border border-neon-cyan/60 shadow-[0_0_25px_rgba(0,255,255,0.35)]">
              <Image src="/logo/logo.png" alt="Monthly Prediction mandala" fill className="object-cover" priority />
            </div>
            <div className="space-y-3">
              <h1 className="font-orbitron text-3xl font-semibold text-neon-cyan sm:text-4xl">
                {t('monthlyPrediction.title')}
              </h1>
              <p className="mx-auto max-w-2xl text-base text-slate-200">
                {t('monthlyPrediction.subtitle')}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-neon-cyan/80">
              <span className="rounded-full border border-neon-cyan/40 px-4 py-1 uppercase tracking-[0.4em]">
                {t('monthlyPrediction.vedicForecast')}
              </span>
              <span className="rounded-full border border-neon-cyan/40 px-4 py-1 uppercase tracking-[0.4em]">
                {t('monthlyPrediction.cosmicTiming')}
              </span>
            </div>
            <div className="mt-2 flex flex-col items-center gap-3 text-sm text-slate-300 sm:flex-row">
              <label className="flex items-center gap-2 text-sm text-slate-300">
                {t('monthlyPrediction.month')}
                <input
                  type="month"
                  value={month}
                  onChange={handleMonthChange}
                  className="rounded-full border border-neon-cyan/30 bg-neo-dark/60 px-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-neon-cyan"
                />
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    monthlySummary.refetch(true);
                    fetchPrediction(true);
                  }}
                  className="rounded-full border border-neon-cyan px-5 py-2 text-sm font-semibold text-neon-cyan transition hover:bg-neon-cyan hover:text-neo-dark"
                >
                  {t('monthlyPrediction.refresh')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {aiSummary.data && (
          <AiSummaryDisplay variant="hero"
            summary={aiSummary.data.summary}
            html={aiSummary.data.html}
            updatedAt={aiSummary.data.updated_at}
          />
        )}
        {aiSummary.loading && (
          <AiSummaryDisplay variant="hero" loading={true} />
        )}
        {aiSummary.error && !aiSummary.loading && (
          <AiSummaryDisplay variant="hero" error={aiSummary.error} />
        )}

        {/* Existing monthly divine summary (unchanged) */}
        <MonthlyDivineSummary
          data={monthlySummary.data}
          loading={monthlySummary.loading}
          error={monthlySummary.error}
          onRefresh={() => {
            monthlySummary.refetch(true);
            fetchPrediction(true);
          }}
        />

        {/* ---- Special Dates & Dasha from monthly-summary ---- */}
        <section className="rounded-3xl bg-slate-900/60 border border-slate-700/60 shadow-xl p-6">
          <h2 className="text-2xl font-semibold text-accent mb-4">Special Dates & Dasha</h2>

          {/* Golden Dates */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-yellow-300 mb-2">Golden Dates</h3>
            {monthlySummary.loading && !monthlySummary.data && <div className="text-sm text-slate-400">Loading...</div>}
            {monthlySummary.error && <div className="text-sm text-red-400">{monthlySummary.error}</div>}

            {(() => {
              // Priority 1: Use specialDates from hook (extracts from monthlySummary)
              const goldenDates = specialDates.data?.golden_dates || [];
              
              // Fallback: Try predictionData if monthlySummary doesn't have the data
              const fallbackGoldenDates = !goldenDates.length && predictionData?.golden_dates_summary?.golden_dates 
                ? predictionData.golden_dates_summary.golden_dates 
                : [];
              
              const finalGoldenDates = goldenDates.length > 0 ? goldenDates : fallbackGoldenDates;

              if (Array.isArray(finalGoldenDates) && finalGoldenDates.length > 0) {
                return (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {finalGoldenDates.map((g: any, idx: number) => {
                      const date = g?.date || (g?.windows && g.windows[0] && (g.windows[0].start || g.windows[0].start_time))?.slice(0,10) || '—';
                      let start = g?.start_time || g?.start || null;
                      let end = g?.end_time || g?.end || null;
                      if ((!start || !end) && Array.isArray(g?.windows) && g.windows.length) {
                        const starts = g.windows.map((w: any) => w.start_time || w.start).filter(Boolean);
                        const ends = g.windows.map((w: any) => w.end_time || w.end).filter(Boolean);
                        if (!start && starts.length) start = starts.sort()[0];
                        if (!end && ends.length) end = ends.sort().slice(-1)[0];
                      }
                      const score = typeof g?.score === 'number' ? Math.round(g.score) + '%' : null;
                      const fmt = (s?: string|null) => {
                        if (!s) return '—';
                        try {
                          const d = new Date(s);
                          if (!isNaN(d.getTime())) return d.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
                        } catch {}
                        return String(s).slice(0,5);
                      };
                      return (
                        <div key={idx} className="rounded-xl bg-gradient-to-r from-yellow-900/10 to-amber-900/10 border border-yellow-700/30 p-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-semibold text-yellow-200">{date}</div>
                              <div className="text-sm text-yellow-100">{fmt(start)} {start && end ? '—' : ''} {fmt(end)}</div>
                            </div>
                            {score && <div className="px-2 py-1 rounded bg-yellow-600/20 text-yellow-300 text-sm font-semibold">{score}</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              } else if (!monthlySummary.loading) {
                return <div className="text-sm text-slate-400">No golden dates found for this month.</div>;
              }
              return null;
            })()}
          </div>

          {/* Chandrashtama */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-rose-300 mb-2">Chandrashtama</h3>
            {(() => {
              // Priority 1: Use specialDates from hook (extracts from monthlySummary)
              const periods = specialDates.data?.chandrashtama_periods || [];
              const dates = specialDates.data?.chandrashtama_dates || [];
              
              // Fallback: Try predictionData if monthlySummary doesn't have the data
              const fallbackPeriods = !periods.length && predictionData?.chandrashtama_periods 
                ? predictionData.chandrashtama_periods 
                : [];
              const fallbackDays = !dates.length && predictionData?.chandrashtama_days
                ? predictionData.chandrashtama_days
                : [];
              
              const finalPeriods = periods.length > 0 ? periods : fallbackPeriods;
              const finalDays = dates.length > 0 ? dates : fallbackDays;

              if (Array.isArray(finalPeriods) && finalPeriods.length > 0) {
                return (
                  <div className="space-y-2">
                    {finalPeriods.map((p: any, idx: number) => (
                      <div key={idx} className="rounded-xl bg-gradient-to-r from-rose-900/10 to-red-900/10 border border-rose-700/30 p-3">
                        <div className="font-semibold text-rose-200">{p.date || '—'}</div>
                        <div className="text-sm text-rose-200">
                          {(p.start_time || p.end_time) ? (
                            <>
                              {p.start_time ? new Date(p.start_time).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) : '—'}
                              {p.start_time && p.end_time ? ' — ' : ''}
                              {p.end_time ? new Date(p.end_time).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) : ''}
                            </>
                          ) : 'Full day'}
                        </div>
                        {p.current_nakshatra && <div className="text-sm text-rose-300/80 mt-1">{p.current_nakshatra}</div>}
                      </div>
                    ))}
                  </div>
                );
              } else if (Array.isArray(finalDays) && finalDays.length > 0) {
                return (
                  <div className="flex flex-wrap gap-2">
                    {finalDays.map((d: any, i: number) => (
                      <div key={i} className="px-3 py-1 rounded bg-rose-500/10 border border-rose-600/20 text-rose-300 text-sm">
                        {typeof d === 'string' ? d : d.date || '—'}
                      </div>
                    ))}
                  </div>
                );
              } else if (!monthlySummary.loading) {
                return <div className="text-sm text-slate-400">No Chandrashtama data for this month.</div>;
              }
              return null;
            })()}
          </div>

          {/* Current Dasha */}
          <div>
            <h3 className="text-lg font-semibold text-accent mb-2">Current Dasha</h3>
            {(() => {
              // Priority 1: Use monthlySummary.data.dasha_summary
              const dashaSummary = monthlySummary.data?.dasha_summary;
              
              // Fallback: Try predictionData if monthlySummary doesn't have it
              const fallbackDashaSummary = !dashaSummary && predictionData?.dasha_summary 
                ? predictionData.dasha_summary 
                : null;
              
              const finalDashaSummary = dashaSummary || fallbackDashaSummary || predictionData?.dasha;

              if (finalDashaSummary) {
                return (
                  <div className="rounded-xl bg-slate-950/20 border border-slate-700/40 p-3">
                    <div className="text-sm text-slate-200">
                      <div><strong>Mahadasha:</strong> {finalDashaSummary.current?.mahadasha || finalDashaSummary.current_dasha || '—'}</div>
                      <div><strong>Antardasha:</strong> {finalDashaSummary.current?.antardasha || '—'}</div>
                      <div><strong>Pratyantar:</strong> {finalDashaSummary.current?.pratyantardasha || '—'}</div>
                    </div>
                  </div>
                );
              } else if (!monthlySummary.loading) {
                return <div className="text-sm text-slate-400">Dasha information unavailable.</div>;
              }
              return null;
            })()}
          </div>

          {/* Small debug (optional) */}
          <details className="mt-4 rounded-lg bg-slate-800/40 p-3 text-xs text-slate-300">
            <summary className="cursor-pointer font-medium">Debug: Data Sources</summary>
            <div className="mt-2 space-y-2">
              <div>
                <div className="font-semibold mb-1">Monthly Summary (primary source):</div>
                <pre className="overflow-auto max-h-48 text-xs bg-slate-900/60 p-2 rounded">{JSON.stringify({
                  golden_dates_summary: monthlySummary.data?.golden_dates_summary || null,
                  chandrashtama_periods: monthlySummary.data?.chandrashtama_periods || null,
                  chandrashtama_days: monthlySummary.data?.chandrashtama_days || null,
                  dasha_summary: monthlySummary.data?.dasha_summary || null,
                }, null, 2)}</pre>
              </div>
              <div>
                <div className="font-semibold mb-1">Prediction Data (fallback):</div>
                <pre className="overflow-auto max-h-48 text-xs bg-slate-900/60 p-2 rounded">{JSON.stringify({
                  golden_dates_summary: predictionData?.golden_dates_summary || null,
                  chandrashtama_periods: predictionData?.chandrashtama_periods || null,
                  chandrashtama_days: predictionData?.chandrashtama_days || null,
                  dasha_summary: predictionData?.dasha_summary || null,
                }, null, 2)}</pre>
              </div>
            </div>
          </details>
        </section>
      </div>
    </div>
  );
}
