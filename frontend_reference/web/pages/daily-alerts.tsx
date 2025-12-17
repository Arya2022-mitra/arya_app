/**
 * Daily Prediction page (simplified)
 * - Left "Today's Divine Forecast" removed
 * - Page relies on AI summary proxy (ai_summary/daily)
 */
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTranslation } from 'react-i18next';
import { useAiSummary } from '@/hooks/useAiSummary';
import { useActiveProfile } from '@/lib/useActiveProfile';
import { useAuth } from '@/lib/useAuth';
import { cleanSummaryWithWindows, FormatOptions } from '@/lib/cleanSummaryWithWindows';
import { dedupeSummary } from '@/lib/dedupeSummary';
import { sanitizeHtml } from '@/lib/sanitizeHtml';

export default function DailyPredictionPage() {
  const router = useRouter();
  const { profile, loading: profileLoading } = useActiveProfile();
  const { sessionRestored, token, refreshToken, logout } = useAuth();
  const loadingAuth = !sessionRestored;
  const { t } = useTranslation();

  const [heroReady, setHeroReady] = useState(false);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [dailyError, setDailyError] = useState<string | null>(null);
  const [dailyNarration, setDailyNarration] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setHeroReady(true), 80);
    return () => window.clearTimeout(timer);
  }, []);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const profileId = profile?.id ? Number(profile.id) : null;
  const aiSummary = useAiSummary('daily', profileId);

  // When aiSummary updates, update the narration state
  useEffect(() => {
    if (!profile?.id) return;
    const html = aiSummary.data?.html ?? null;
    const text = aiSummary.data?.summary ?? null;
    setDailyNarration(html ?? text ?? null);
  }, [aiSummary.data, profile?.id]);

  const todayLabel = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(new Date());
    } catch {
      return new Date().toDateString();
    }
  }, []);

  // Formatting options (kept for potential fallback text cleaning)
  const formatOptions: FormatOptions = useMemo(() => ({
    useAmpm: true,
    slotMinutes: 90,
    date: today,
  }), [today]);

  // mergedSummary: fallback cleaned summary when HTML not available
  const mergedSummary = useMemo(() => {
    if (aiSummary.data?.html) return '';
    const cleanedAi = cleanSummaryWithWindows(aiSummary.data?.summary ?? '', undefined, formatOptions);
    const parts = [cleanedAi, dailyNarration ?? ''].map((part) => part?.trim()).filter(Boolean);
    if (!parts.length) return '';
    return dedupeSummary(parts.join('\n\n'), {
      mode: 'consecutive',
      similarityThreshold: 0.9,
    });
  }, [aiSummary.data?.html, aiSummary.data?.summary, dailyNarration, formatOptions]);

  const handleRefresh = () => {
    void aiSummary.refetch();
  };

  if (loadingAuth || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#040a15] text-accent">
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#040a15] text-white">
      <main className="mx-auto max-w-screen-lg px-4 py-8 space-y-8">
        <header
          className={`relative overflow-hidden rounded-3xl border border-accent/30 bg-gradient-to-r from-[#0a1629] via-[#0f2036] to-[#0a1629] p-6 shadow-[0_10px_45px_rgba(0,0,0,0.45)] transition-all duration-500 ease-out ${
            heroReady ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
          }`}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_30%,rgba(25,198,214,0.12),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(45,212,191,0.08),transparent_45%)]" />
          <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-full bg-white/5 shadow-[0_0_28px_rgba(25,198,214,0.32)] mv-breathing-logo">
                <Image
                  src="/logo/logo.png"
                  alt="Mitraveda mandala"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.35em] text-accent/70">Divine Rhythm</p>
                <h1 className="text-3xl font-semibold text-accent sm:text-4xl">
                  {t('dailyPrediction.title', { defaultValue: 'Daily Prediction' })}
                </h1>
                <p className="max-w-2xl text-sm text-slate-300">
                  {t('dailyPrediction.subtitle', { defaultValue: "Receive today's time windows, remedies, and confidence notes." })}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() =>
                  document.getElementById('daily-main')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
                className="inline-flex items-center justify-center rounded-full bg-accent/80 px-5 py-2 text-sm font-semibold text-[#0d1320] shadow-[0_15px_35px_rgba(25,198,214,0.35)] transition hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-[0_18px_40px_rgba(25,198,214,0.4)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {t('dailyPrediction.beginCta', { defaultValue: 'Begin Divine Journey' })}
              </button>
              <button
                type="button"
                onClick={handleRefresh}
                className="inline-flex items-center justify-center rounded-full border border-accent/70 px-5 py-2 text-sm font-semibold text-accent transition hover:-translate-y-0.5 hover:border-accent hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {t('dailyPrediction.refreshCta', { defaultValue: 'Refresh Predictions' })}
              </button>
            </div>
          </div>
        </header>

        {!profile && (
          <section className="rounded-2xl border border-slate-700 bg-slate-800/40 p-6 text-slate-200">
            <p className="text-lg font-semibold text-accent">{t('dailyPrediction.title', { defaultValue: 'Daily Prediction' })}</p>
            <p className="mt-2 text-sm text-slate-300">
              {t('dailyPrediction.missingProfile', {
                defaultValue: "Select a profile to view today's prediction.",
              })}
            </p>
          </section>
        )}

        {profile && (
          <div className="grid gap-6 md:grid-cols-3" id="daily-main">
            {/* Left "Today's Divine Forecast" removed per design */}

            {/* Right column: AI Companion */}
            <aside className="md:col-span-1 space-y-4">
              <section className="rounded-3xl border border-slate-700 bg-slate-800/40 p-5 shadow-[0_12px_32px_rgba(0,0,0,0.35)]">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.32em] text-accent/80">AI Companion</p>
                    <h3 className="text-lg font-semibold text-accent">
                      {t('dailyPrediction.summaryTitle', { defaultValue: 'Daily Guidance' })}
                    </h3>
                  </div>
                  {aiSummary.data?.updated_at && (
                    <span className="rounded-full border border-accent/50 bg-accent/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
                      {t('dailyPrediction.updated', { defaultValue: 'Updated' })}
                    </span>
                  )}
                </div>

                {(aiSummary.loading || dailyLoading) && (
                  <div className="mb-4 flex items-center gap-3 text-sm text-slate-300">
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-600/30" />
                    <span>{t('common.loading')}</span>
                  </div>
                )}

                {dailyError ? <div className="text-red-400">{dailyError}</div> : null}

                <div>
                  {aiSummary.data?.html ? (
                    <div className="prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHtml(aiSummary.data.html) }} />
                  ) : (
                    <div className="prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiSummary.data?.summary ?? mergedSummary ?? ''}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </section>

              {/* Additional right-side widgets can remain here if needed */}
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
