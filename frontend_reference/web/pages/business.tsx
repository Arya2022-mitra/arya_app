import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';

import { API_BASE } from '@/lib/api';
import { useActiveProfile } from '@/lib/useActiveProfile';
import { useAuth } from '@/lib/useAuth';
import { handleUnauthorized } from '@/lib/handleUnauthorized';
import { useTranslation } from 'react-i18next';
import AiSummaryDisplay from '@/components/AiSummaryDisplay';
import { useAiSummary } from '@/hooks/useAiSummary';

type BusinessPrimitive = string | number | boolean | null;
export type BusinessValue =
  | BusinessPrimitive
  | BusinessValue[]
  | { [key: string]: BusinessValue | undefined };

type BusinessResponse = {
  profile_id: number;
  updated_at?: string | null;
  summary?: BusinessValue;
  core_indicators?: BusinessValue;
  sector_recommendations?: BusinessValue;
  planetary_strength?: BusinessValue;
  business_yogas?: BusinessValue;
  timing_windows?: BusinessValue;
  risk_assessment?: BusinessValue;
  remedies?: BusinessValue;
  spiritual_message?: BusinessValue;
};

type SectionKey =
  | 'summary'
  | 'core_indicators'
  | 'sector_recommendations'
  | 'planetary_strength'
  | 'business_yogas'
  | 'timing_windows'
  | 'risk_assessment'
  | 'remedies'
  | 'spiritual_message';

type SectionConfig = {
  key: SectionKey;
  title: string;
  blurb: string;
};

function isEmptyValue(value: BusinessValue | undefined | null): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.every((item) => isEmptyValue(item as BusinessValue));
  if (typeof value === 'object')
    return Object.values(value).every((entry) => isEmptyValue(entry as BusinessValue));
  return false;
}

function formatLabel(label: string): string {
  return label
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function renderValue(value: BusinessValue, t: any, level = 0): JSX.Element {
  if (value === null || value === undefined) {
    return <p className="text-sm italic text-slate-400">{t('business.failed')}</p>;
  }

  const baseTextClass =
    'text-slate-100 leading-relaxed whitespace-pre-line tracking-wide';

  if (typeof value === 'string') {
    return <p className={baseTextClass}>{value}</p>;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return <p className={baseTextClass}>{String(value)}</p>;
  }

  if (Array.isArray(value)) {
    if (!value.length) {
      return <p className="text-sm italic text-slate-400">{t('business.failed')}</p>;
    }
    return (
      <ul className="mt-2 list-disc space-y-3 pl-5 text-slate-100">
        {value.map((item, index) => (
          <li key={`list-${level}-${index}`} className="space-y-2">
            {renderValue(item as BusinessValue, t, level + 1)}
          </li>
        ))}
      </ul>
    );
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value).filter(
      ([, entryValue]) => !isEmptyValue(entryValue as BusinessValue),
    );
    if (!entries.length) {
      return <p className="text-sm italic text-slate-400">{t('business.failed')}</p>;
    }
    return (
      <dl className="mt-2 space-y-3">
        {entries.map(([key, entryValue]) => (
          <div
            key={`${key}-${level}`}
            className="rounded-2xl border border-neon-cyan/30 bg-neo-dark/40 p-4"
          >
            <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-neon-cyan">
              {formatLabel(key)}
            </dt>
            <dd className="mt-2 text-slate-100">
              {renderValue(entryValue as BusinessValue, t, level + 1)}
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  return <p className={baseTextClass}>{String(value)}</p>;
}

function formatTimestamp(value?: string | null): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) {
    return value;
  }
  try {
    return parsed.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (err) {
    console.warn('[Business] Failed to format timestamp', err);
    return value;
  }
}

export default function BusinessPage() {
  const router = useRouter();
  const { profile, loading: profileLoading } = useActiveProfile();
  const { token, sessionRestored, logout, refreshToken } = useAuth();
  const loadingAuth = !sessionRestored;
  const { t, i18n } = useTranslation();

  const [businessData, setBusinessData] = useState<BusinessResponse | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const profileId = profile?.id ? Number(profile.id) : null;

  // Fetch AI summary for business engine
  const aiSummary = useAiSummary('business', profileId);

  const SECTION_CONFIG: SectionConfig[] = useMemo(() => [
    {
      key: 'summary',
      title: t('business.summaryTitle'),
      blurb: t('business.summaryBlurb'),
    },
    {
      key: 'core_indicators',
      title: t('business.coreIndicatorsTitle'),
      blurb: t('business.coreIndicatorsBlurb'),
    },
    {
      key: 'sector_recommendations',
      title: t('business.sectorTitle'),
      blurb: t('business.sectorBlurb'),
    },
    {
      key: 'planetary_strength',
      title: t('business.strengthTitle'),
      blurb: t('business.strengthBlurb'),
    },
    {
      key: 'business_yogas',
      title: t('business.yogasTitle'),
      blurb: t('business.yogasBlurb'),
    },
    {
      key: 'timing_windows',
      title: t('business.timingTitle'),
      blurb: t('business.timingBlurb'),
    },
    {
      key: 'risk_assessment',
      title: t('business.riskTitle'),
      blurb: t('business.riskBlurb'),
    },
    {
      key: 'remedies',
      title: t('business.remediesTitle'),
      blurb: t('business.remediesBlurb'),
    },
    {
      key: 'spiritual_message',
      title: t('business.spiritualTitle'),
      blurb: t('business.spiritualBlurb'),
    },
  ], [t]);

  const fetchBusiness = useCallback(
    async (forceRefresh: boolean = false) => {
      if (!profileId) return;
      setLoadingData(true);
      setError(null);
      try {
        let authToken = token;
        if ((!authToken || forceRefresh) && refreshToken) {
          authToken = await refreshToken(true);
        }
        if (!authToken) {
          await handleUnauthorized(router, { logout, refreshToken });
          return;
        }
        const params = new URLSearchParams({
          profile_id: String(profileId),
          locale: i18n.language || 'en'
        });
        const url = `${API_BASE}/api/business?${params.toString()}`;
        const requestInit: RequestInit = {
          credentials: 'include',
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        };
        let response = await fetch(url, requestInit);
        if (response.status === 401) {
          const retryResponse = await handleUnauthorized(router, {
            logout,
            refreshToken,
            retry: async (freshToken) =>
              fetch(url, {
                credentials: 'include',
                headers: freshToken ? { Authorization: `Bearer ${freshToken}` } : {},
              }),
          });
          if (!retryResponse) {
            return;
          }
          response = retryResponse;
        }
        if (response.status === 404) {
          setBusinessData(null);
          setError('Business intelligence is not available yet.');
          return;
        }
        if (!response.ok) {
          setBusinessData(null);
          setError('Failed to load Business intelligence.');
          return;
        }
        const payload = (await response.json()) as BusinessResponse;
        setBusinessData(payload);
      } catch (err) {
        console.error('[Business] fetch failed', err);
        setBusinessData(null);
        setError('Failed to load Business intelligence.');
      } finally {
        setLoadingData(false);
      }
    },
    [profileId, token, refreshToken, logout, router, i18n.language],
  );

  useEffect(() => {
    if (profileLoading || loadingAuth) return;
    if (!profileId) return;
    fetchBusiness();
  }, [profileId, profileLoading, loadingAuth, fetchBusiness]);

  const sections = useMemo(
    () =>
      SECTION_CONFIG.map((section) => ({
        ...section,
        value: (businessData?.[section.key] ?? null) as BusinessValue | null,
      })),
    [businessData, SECTION_CONFIG],
  );

  const updatedAt = formatTimestamp(businessData?.updated_at);

  if (profileLoading || loadingAuth) {
    return (
      <div className="flex h-screen items-center justify-center bg-neo-dark text-neon-cyan">
        {t('business.calibrating')}
      </div>
    );
  }

  return (
    <div className="scroll-smooth bg-neo-dark/95">
      <div className="mx-auto flex min-h-screen max-w-screen-xl flex-col gap-8 px-4 py-10 text-white sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-neon-cyan/50 bg-gradient-to-br from-neo-dark via-[#0b1b36] to-neo-dark p-8 shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,255,255,0.12),_transparent_55%)]" />
          <div className="relative z-10 flex flex-col items-center gap-6 text-center">
            <div className="relative h-48 w-48 overflow-hidden rounded-full border border-neon-cyan/60 shadow-[0_0_25px_rgba(0,255,255,0.35)]">
              <Image src="/logo/logo.png" alt="Business mandala" fill className="object-cover" priority />
            </div>
            <div className="space-y-3">
              <h1 className="font-orbitron text-3xl font-semibold text-neon-cyan sm:text-4xl">
                {t('business.title')}
              </h1>
              <p className="mx-auto max-w-2xl text-base text-slate-200">
                {t('business.subtitle')}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-neon-cyan/80">
              <span className="rounded-full border border-neon-cyan/40 px-4 py-1 uppercase tracking-[0.4em]">
                D10 Assurance
              </span>
              <span className="rounded-full border border-neon-cyan/40 px-4 py-1 uppercase tracking-[0.4em]">
                Wealth Pillars
              </span>
            </div>
            <div className="mt-2 flex flex-col items-center gap-3 text-sm text-slate-300 sm:flex-row">
              {updatedAt && (
                <span className="rounded-full border border-neon-cyan/30 bg-neo-dark/60 px-4 py-2 text-slate-200">
                  Last updated {updatedAt}
                </span>
              )}
              <button
                type="button"
                onClick={() => fetchBusiness(true)}
                className="rounded-full border border-neon-cyan px-5 py-2 text-sm font-semibold text-neon-cyan transition hover:bg-neon-cyan hover:text-neo-dark"
              >
                Refresh Insights
              </button>
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

        {loadingData && (
          <div className="rounded-3xl border border-neon-cyan/30 bg-neo-dark/70 p-6 text-neon-cyan">
            Synchronising MitraVeda business layers...
          </div>
        )}

        {error && !loadingData && (
          <div className="rounded-3xl border border-rose-500/40 bg-rose-900/30 p-6 text-rose-100 shadow-lg">
            {error}
          </div>
        )}

        {!error && businessData && (
          <div className="space-y-10 pb-12">
            {sections.map((section) => {
              const hasContent = !isEmptyValue(section.value);
              return (
                <section
                  key={section.key}
                  id={section.key}
                  className="rounded-3xl border border-neon-cyan/50 bg-gradient-to-br from-neo-dark via-[#0a1832] to-neo-dark p-8 shadow-2xl transition hover:border-neon-cyan"
                >
                  <header className="flex flex-col gap-2 border-b border-neon-cyan/30 pb-4">
                    <h2 className="text-2xl font-semibold text-neon-cyan">{section.title}</h2>
                    <p className="text-sm uppercase tracking-[0.35em] text-neon-cyan/80">{section.blurb}</p>
                  </header>
                  <div className="mt-4 space-y-4 text-base">
                    {hasContent ? (
                      renderValue((section.value ?? null) as BusinessValue, t)
                    ) : (
                      <p className="text-sm italic text-slate-400">{t('business.failed')}</p>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {!error && !businessData && !loadingData && (
          <div className="rounded-3xl border border-neon-cyan/40 bg-neo-dark/70 p-6 text-slate-200">
            Business intelligence is being prepared. Please revisit shortly.
          </div>
        )}
      </div>
    </div>
  );
}
