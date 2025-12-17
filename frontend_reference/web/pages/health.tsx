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

type HealthPrimitive = string | number | boolean | null;
export type HealthValue =
  | HealthPrimitive
  | HealthValue[]
  | { [key: string]: HealthValue | undefined };

type HealthResponse = {
  profile_id: number;
  updated_at?: string | null;
  generated_at?: string | null;
  severity?: string | null;
  analysis_degraded?: boolean;
  missing_inputs?: HealthValue;
  constitution?: HealthValue;
  physical_health?: HealthValue;
  mental_health?: HealthValue;
  condition_flags?: HealthValue;
  timelines?: HealthValue;
  body_map?: HealthValue;
  remedies?: HealthValue;
  provenance?: HealthValue;
  summary?: HealthValue;
  raw_data?: HealthValue;
};

type SectionKey =
  | 'summary'
  | 'constitution'
  | 'physical_health'
  | 'mental_health'
  | 'condition_flags'
  | 'timelines'
  | 'body_map'
  | 'remedies'
  | 'provenance'
  | 'missing_inputs'
  | 'raw_data';

type SectionConfig = {
  key: SectionKey;
  title: string;
  blurb: string;
};

function isEmptyValue(value: HealthValue | undefined | null): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.every((item) => isEmptyValue(item as HealthValue));
  if (typeof value === 'object')
    return Object.values(value).every((entry) => isEmptyValue(entry as HealthValue));
  return false;
}

function formatLabel(label: string): string {
  return label
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function renderValue(value: HealthValue, t: any, level = 0): JSX.Element {
  if (value === null || value === undefined) {
    return <p className="text-sm italic text-slate-400">{t('health.failed')}</p>;
  }

  const baseTextClass = 'text-slate-100 leading-relaxed whitespace-pre-line tracking-wide';

  if (typeof value === 'string') {
    return <p className={baseTextClass}>{value}</p>;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return <p className={baseTextClass}>{String(value)}</p>;
  }

  if (Array.isArray(value)) {
    if (!value.length) {
      return <p className="text-sm italic text-slate-400">{t('health.failed')}</p>;
    }
    return (
      <ul className="mt-2 list-disc space-y-3 pl-5 text-slate-100">
        {value.map((item, index) => (
          <li key={`list-${level}-${index}`} className="space-y-2">
            {renderValue(item as HealthValue, t, level + 1)}
          </li>
        ))}
      </ul>
    );
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value).filter(
      ([, entryValue]) => !isEmptyValue(entryValue as HealthValue),
    );
    if (!entries.length) {
      return <p className="text-sm italic text-slate-400">{t('health.failed')}</p>;
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
              {renderValue(entryValue as HealthValue, t, level + 1)}
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
    console.warn('[Health] Failed to format timestamp', err);
    return value;
  }
}

export default function HealthPage() {
  const router = useRouter();
  const { profile, loading: profileLoading } = useActiveProfile();
  const { token, sessionRestored, logout, refreshToken } = useAuth();
  const loadingAuth = !sessionRestored;
  const { t, i18n } = useTranslation();

  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const profileId = profile?.id ? Number(profile.id) : null;
  const aiSummary = useAiSummary('health', profileId);

  const fetchHealth = useCallback(
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
        const url = `${API_BASE}/api/fortune/health?${params.toString()}`;
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
          setHealthData(null);
          setError('Health intelligence is not available yet.');
          return;
        }
        if (!response.ok) {
          setHealthData(null);
          setError('Failed to load health intelligence.');
          return;
        }
        const payload = (await response.json()) as HealthResponse;
        setHealthData(payload);
      } catch (err) {
        console.error('[Health] fetch failed', err);
        setHealthData(null);
        setError('Failed to load health intelligence.');
      } finally {
        setLoadingData(false);
      }
    },
    [profileId, token, refreshToken, logout, router, i18n.language],
  );

  useEffect(() => {
    if (profileLoading || loadingAuth) return;
    if (!profileId) return;
    fetchHealth();
  }, [profileId, profileLoading, loadingAuth, fetchHealth]);

  const SECTION_CONFIG: SectionConfig[] = useMemo(() => [
    {
      key: 'summary',
      title: t('health.summaryTitle'),
      blurb: t('health.summaryBlurb'),
    },
    {
      key: 'constitution',
      title: t('health.constitutionTitle'),
      blurb: t('health.constitutionBlurb'),
    },
    {
      key: 'physical_health',
      title: t('health.physicalTitle'),
      blurb: t('health.physicalBlurb'),
    },
    {
      key: 'mental_health',
      title: t('health.mentalTitle'),
      blurb: t('health.mentalBlurb'),
    },
    {
      key: 'condition_flags',
      title: t('health.conditionTitle'),
      blurb: t('health.conditionBlurb'),
    },
    {
      key: 'timelines',
      title: t('health.timelinesTitle'),
      blurb: t('health.timelinesBlurb'),
    },
    {
      key: 'body_map',
      title: t('health.bodyMapTitle'),
      blurb: t('health.bodyMapBlurb'),
    },
    {
      key: 'remedies',
      title: t('health.remediesTitle'),
      blurb: t('health.remediesBlurb'),
    },
    {
      key: 'provenance',
      title: t('health.provenanceTitle'),
      blurb: t('health.provenanceBlurb'),
    },
    {
      key: 'missing_inputs',
      title: t('health.missingInputsTitle'),
      blurb: t('health.missingInputsBlurb'),
    },
    {
      key: 'raw_data',
      title: t('health.rawDataTitle'),
      blurb: t('health.rawDataBlurb'),
    },
  ], [t]);

  const sections = useMemo(
    () =>
      SECTION_CONFIG.map((section) => ({
        ...section,
        value: (healthData?.[section.key] ?? null) as HealthValue | null,
      })),
    [healthData, SECTION_CONFIG],
  );

  const updatedAt = formatTimestamp(healthData?.updated_at);
  const generatedAt = formatTimestamp(healthData?.generated_at);
  const severity = healthData?.severity;
  const degraded = healthData?.analysis_degraded;

  if (profileLoading || loadingAuth) {
    return (
      <div className="flex h-screen items-center justify-center bg-neo-dark text-neon-cyan">
        {t('health.loading')}
      </div>
    );
  }

  return (
    <div className="scroll-smooth bg-neo-dark/95">
      <div className="mx-auto flex min-h-screen max-w-screen-xl flex-col gap-8 px-4 py-10 text-white sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-neon-cyan/50 bg-gradient-to-br from-neo-dark via-[#101e38] to-neo-dark p-8 shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,255,255,0.12),_transparent_55%)]" />
          <div className="relative z-10 flex flex-col items-center gap-6 text-center">
            <div className="relative h-48 w-48 overflow-hidden rounded-full border border-neon-cyan/60 shadow-[0_0_25px_rgba(0,255,255,0.35)]">
              <Image src="/logo/logo.png" alt="Health mandala" fill className="object-cover" priority />
            </div>
            <div className="space-y-3">
              <h1 className="font-orbitron text-3xl font-semibold text-neon-cyan sm:text-4xl">
                {t('health.title')}
              </h1>
              <p className="mx-auto max-w-2xl text-base text-slate-200">
                {t('health.subtitle')}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-neon-cyan/80">
              <span className="rounded-full border border-neon-cyan/40 px-4 py-1 uppercase tracking-[0.4em]">
                Ayurvedic Matrix
              </span>
              <span className="rounded-full border border-neon-cyan/40 px-4 py-1 uppercase tracking-[0.4em]">
                Wellness Protocols
              </span>
            </div>
            <div className="mt-2 flex flex-col items-center gap-3 text-sm text-slate-300 sm:flex-row">
              {updatedAt && (
                <span className="rounded-full border border-neon-cyan/30 bg-neo-dark/60 px-4 py-2 text-slate-200">
                  Last synced {updatedAt}
                </span>
              )}
              {generatedAt && (
                <span className="rounded-full border border-neon-cyan/30 bg-neo-dark/60 px-4 py-2 text-slate-200">
                  Generated {generatedAt}
                </span>
              )}
              {severity && (
                <span className="rounded-full border border-neon-cyan/30 bg-neo-dark/60 px-4 py-2 text-slate-200">
                  Severity: {severity}
                </span>
              )}
              {typeof degraded === 'boolean' && degraded && (
                <span className="rounded-full border border-accent/50 bg-accent/20 px-4 py-2 text-accent">
                  Analysis degraded — some signals missing
                </span>
              )}
              <button
                type="button"
                onClick={() => fetchHealth(true)}
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
            Harmonising MitraVeda health layers...
          </div>
        )}

        {error && !loadingData && (
          <div className="rounded-3xl border border-rose-500/40 bg-rose-900/30 p-6 text-rose-100 shadow-lg">
            {error}
          </div>
        )}

        {!error && healthData && (
          <div className="space-y-10 pb-12">
            {sections.map((section) => {
              const hasContent = !isEmptyValue(section.value);
              return (
                <section
                  key={section.key}
                  id={section.key}
                  className="rounded-3xl border border-neon-cyan/50 bg-gradient-to-br from-neo-dark via-[#0b1b36] to-neo-dark p-8 shadow-2xl transition hover:border-neon-cyan"
                >
                  <header className="flex flex-col gap-2 border-b border-neon-cyan/30 pb-4">
                    <h2 className="text-2xl font-semibold text-neon-cyan">{section.title}</h2>
                    <p className="text-sm uppercase tracking-[0.35em] text-neon-cyan/80">{section.blurb}</p>
                  </header>
                  <div className="mt-4 space-y-4 text-base">
                    {hasContent ? (
                      renderValue((section.value ?? null) as HealthValue, t)
                    ) : (
                      <p className="text-sm italic text-slate-400">{t('health.failed')}</p>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {!error && !healthData && !loadingData && (
          <div className="rounded-3xl border border-neon-cyan/40 bg-neo-dark/70 p-6 text-slate-200">
            Health intelligence is being prepared. Please revisit shortly.
          </div>
        )}
      </div>
    </div>
  );
}
