/**
 * web/components/TodayPrediction.tsx
 * 
 * This component fetches ai_summary/daily and displays the AI summary for the active profile.
 * It is used as a standalone summary display component for embedding in various pages.
 * 
 * Usage locations:
 * - Can be embedded in dashboard or homepage sections
 * - Provides a lighter-weight alternative to the full daily-prediction page
 * 
 * Note: For the canonical Divine UI daily prediction page, see web/pages/daily-prediction.tsx
 * which uses AiSummaryDisplay for richer rendering.
 */
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useActiveProfile } from '@/lib/useActiveProfile';
import { useAuth } from '@/lib/useAuth';
import { handleUnauthorized } from '@/lib/handleUnauthorized';
import { cleanSummaryWithWindows } from '@/lib/cleanSummaryWithWindows';
import { dedupeSummary } from '@/lib/dedupeSummary';
import { fetchApi, isAbortError } from '@/lib/fetchApi';
import SummarySections from '@/components/SummarySections';

type ApiResponse = {
  profile_id?: number;
  target_date?: string;
  summary?: string;
  score?: number;
  locale?: string;
  translation_status?: string;
};

export default function TodayPrediction(): JSX.Element {
  const router = useRouter();
  const { profile, loading: loadingProfile } = useActiveProfile();
  const { token, sessionRestored, logout, refreshToken } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [dateStr, setDateStr] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Use today's date by default (YYYY-MM-DD)
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const loadingAuth = !sessionRestored;
  const severity = useMemo(() => {
    if (score == null) return 'neutral';
    if (score >= 7) return 'auspicious';
    if (score <= 4) return 'inauspicious';
    return 'neutral';
  }, [score]);

  useEffect(() => {
    // reset when profile changes
    setSummary(null);
    setScore(null);
    setError(null);
    setDateStr('');
  }, [profile?.id]);

  const fetchPrediction = useCallback(async () => {
    if (!profile?.id) return;

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        profile_id: String(profile.id),
      });
      const aiPath = `/api/ai_summary/daily?${params.toString()}`;

      const result = await fetchApi<ApiResponse>(aiPath, {
        method: 'GET',
        token,
        refreshToken,
      });

      // Handle 401 without a successful retry
      if (result.status === 401 && !result.ok) {
        await handleUnauthorized(router, { logout, refreshToken });
        setError('Unauthorized. Please sign in.');
        return;
      }

      if (!result.ok) {
        setError(`Failed to fetch AI summary: ${result.status} ${result.error || ''}`);
        return;
      }

      const payload = result.data ?? {} as ApiResponse;
      const summaryText = payload.summary ?? '';

      // canonicalize date field - ai_summary returns profile-level summary; we don't rely on a date here
      setDateStr(String(payload.target_date ?? today));
      setScore(typeof payload.score === 'number' ? payload.score : null);
      setSummary(String(summaryText || '').trim() || null);
    } catch (err: unknown) {
      if (isAbortError(err)) {
        return;
      }
      setError('Unexpected error loading AI summary.');
    } finally {
      setLoading(false);
    }
  }, [profile?.id, token, router, logout, refreshToken, today]);

  useEffect(() => {
    if (loadingProfile || loadingAuth) return;
    if (!profile?.id) return;
    fetchPrediction();
  }, [loadingProfile, loadingAuth, profile?.id, fetchPrediction]);

  // We no longer fetch a separate time_windows payload.
  // Pass undefined for windows — AI summary should contain final text.
  const cleanedSummary = useMemo(() => {
    const expanded = cleanSummaryWithWindows(summary, undefined);
    return dedupeSummary(expanded, {
      mode: 'consecutive',
      similarityThreshold: 0.9,
    });
  }, [summary]);

  if (loadingProfile) {
    return (
      <div className="flex justify-center items-center py-8">
        <p className="text-gray-400">Loading profile…</p>
      </div>
    );
  }

  if (!profile?.id) {
    return (
      <div className="py-6">
        <p className="text-gray-400">Select a profile to view today’s prediction.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <p className="text-blue-400">Loading AI summary…</p>
      </div>
    );
  }

  return (
    <section className="p-6 bg-transparent">
      <header className="mb-4">
        <h2 className="text-lg font-semibold" style={{ color: '#D4AF37' }}>
          AI Summary
        </h2>
        <div className="text-sm text-gray-400">Date: {dateStr || today}</div>
      </header>

      <div
        className={`mb-4 rounded-lg border border-slate-700 bg-slate-800/50 p-6 mv-severity--${severity} mv-${severity}`}
        data-severity={severity}
      >
        {cleanedSummary ? (
          <SummarySections text={cleanedSummary} />
        ) : (
          <p className="text-gray-400">AI summary is not available for this profile yet.</p>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <span className="font-semibold">Score: </span>
        <span className={`mv-score mv-score--${severity === 'auspicious' ? 'good' : severity === 'inauspicious' ? 'bad' : 'neutral'} mv-pakshi--${severity}`}>
          {score !== null ? score.toFixed(2) : '—'}
        </span>
      </div>

      {error ? (
        <div className="mt-4 text-red-400">
          <p>{error}</p>
        </div>
      ) : null}
    </section>
  );
}
