import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { API_BASE } from '@/lib/api';
import { useActiveProfile } from '@/lib/useActiveProfile';
import { useAuth } from '@/lib/useAuth';
import { handleUnauthorized } from '@/lib/handleUnauthorized';
import { useTranslation } from 'react-i18next';
import AiSummaryDisplay from '@/components/AiSummaryDisplay';
import { useAiSummary } from '@/hooks/useAiSummary';
import SecureAutoPlayVideo from '@/components/SecureAutoPlayVideo';

type EducationPrimitive = string | number | boolean | null;
export type EducationValue =
  | EducationPrimitive
  | EducationValue[]
  | { [key: string]: EducationValue | undefined };

type EducationResponse = {
  profile_id: number;
  updated_at?: string | null;
  summary?: EducationValue;
  planetary_influences?: EducationValue;
  subject_recommendations?: EducationValue;
  yogas_detected?: EducationValue;
  siddhamsa_summary?: EducationValue;
  exam_timeline?: EducationValue;
  remedies?: EducationValue;
  spiritual_message?: EducationValue;
};

type SectionKey =
  | 'summary'
  | 'planetary_influences'
  | 'subject_recommendations'
  | 'yogas_detected'
  | 'siddhamsa_summary'
  | 'exam_timeline'
  | 'remedies'
  | 'spiritual_message';

type SectionConfig = {
  key: SectionKey;
  title: string;
  blurb: string;
};

function isEmptyValue(value: EducationValue | undefined | null): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.every((item) => isEmptyValue(item));
  if (typeof value === 'object')
    return Object.values(value).every((entry) => isEmptyValue(entry));
  return false;
}

function formatLabel(label: string): string {
  return label
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function renderValue(value: EducationValue, level = 0): JSX.Element {
  if (value === null || value === undefined) {
    return (
      <p className="text-sm italic text-slate-400">Data not available.</p>
    );
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
      return (
        <p className="text-sm italic text-slate-400">Data not available.</p>
      );
    }
    return (
      <ul className="mt-2 list-disc space-y-3 pl-5 text-slate-100">
        {value.map((item, index) => (
          <li key={`list-${level}-${index}`} className="space-y-2">
            {renderValue(item as EducationValue, level + 1)}
          </li>
        ))}
      </ul>
    );
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value).filter(
      ([, entryValue]) => !isEmptyValue(entryValue as EducationValue),
    );
    if (!entries.length) {
      return (
        <p className="text-sm italic text-slate-400">Data not available.</p>
      );
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
              {renderValue(entryValue as EducationValue, level + 1)}
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
    console.warn('[Education] Failed to format timestamp', err);
    return value;
  }
}

export default function EducationPage() {
  const router = useRouter();
  const { profile, loading: profileLoading } = useActiveProfile();
  const { token, sessionRestored, logout, refreshToken } = useAuth();
  const loadingAuth = !sessionRestored;
  const { t, i18n } = useTranslation();

  const [educationData, setEducationData] = useState<EducationResponse | null>(
    null,
  );
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [heroVideoError, setHeroVideoError] = useState(false);

  const profileId = profile?.id ? Number(profile.id) : null;
  const aiSummary = useAiSummary('education', profileId);

  const fetchEducation = useCallback(
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
        const url = `${API_BASE}/api/education?${params.toString()}`;
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
                headers: freshToken
                  ? { Authorization: `Bearer ${freshToken}` }
                  : {},
              }),
          });
          if (!retryResponse) {
            return;
          }
          response = retryResponse;
        }
        if (response.status === 404) {
          setEducationData(null);
          setError('Education guidance is not available yet.');
          return;
        }
        if (!response.ok) {
          setEducationData(null);
          setError('Failed to load Education guidance.');
          return;
        }
        const payload = (await response.json()) as EducationResponse;
        setEducationData(payload);
      } catch (err) {
        console.error('[Education] fetch failed', err);
        setEducationData(null);
        setError('Failed to load Education guidance.');
      } finally {
        setLoadingData(false);
      }
    },
    [profileId, token, refreshToken, logout, router, i18n.language],
  );

  useEffect(() => {
    if (profileLoading || loadingAuth) return;
    if (!profileId) return;
    fetchEducation();
  }, [profileId, profileLoading, loadingAuth, fetchEducation]);

  const SECTION_CONFIG: SectionConfig[] = useMemo(() => [
    {
      key: 'summary',
      title: t('education.summaryTitle'),
      blurb: t('education.summaryBlurb'),
    },
    {
      key: 'planetary_influences',
      title: t('education.planetaryTitle'),
      blurb: t('education.planetaryBlurb'),
    },
    {
      key: 'subject_recommendations',
      title: t('education.subjectTitle'),
      blurb: t('education.subjectBlurb'),
    },
    {
      key: 'yogas_detected',
      title: t('education.yogasTitle'),
      blurb: t('education.yogasBlurb'),
    },
    {
      key: 'siddhamsa_summary',
      title: t('education.siddhamsaTitle'),
      blurb: t('education.siddhamsaBlurb'),
    },
    {
      key: 'exam_timeline',
      title: t('education.examTitle'),
      blurb: t('education.examBlurb'),
    },
    {
      key: 'remedies',
      title: t('education.remediesTitle'),
      blurb: t('education.remediesBlurb'),
    },
    {
      key: 'spiritual_message',
      title: t('education.spiritualTitle'),
      blurb: t('education.spiritualBlurb'),
    },
  ], [t]);

  const sections = useMemo(
    () =>
      SECTION_CONFIG.map((section) => ({
        ...section,
        value: (educationData?.[section.key] ?? null) as EducationValue | null,
      })),
    [educationData, SECTION_CONFIG],
  );

  const updatedAt = formatTimestamp(educationData?.updated_at);

  if (profileLoading || loadingAuth) {
    return (
      <div className="flex h-screen items-center justify-center bg-neo-dark text-neon-cyan">
        {t('education.loading')}
      </div>
    );
  }

  return (
    <div className="scroll-smooth bg-neo-dark/95">
      <div className="mx-auto flex min-h-screen max-w-screen-xl flex-col gap-8 px-4 py-10 text-white sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-neon-cyan/50 bg-gradient-to-br from-neo-dark via-[#0c1b3d] to-neo-dark p-8 shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,255,255,0.12),_transparent_55%)]" />
          <div className="relative z-10 flex flex-col items-center gap-6 text-center">
            {heroVideoError ? (
              <div className="h-48 w-48 rounded-full border border-neon-cyan/60 bg-black/30 flex items-center justify-center text-center text-sm">
                {t('common.unavailable', { defaultValue: 'Education intro video unavailable.' })}
              </div>
            ) : (
              <SecureAutoPlayVideo
                sources={[{ src: '/videos/Aryabhatta.mp4', type: 'video/mp4' }]}
                className="h-48 w-48 rounded-full border border-neon-cyan/60 object-cover shadow-[0_0_25px_rgba(0,255,255,0.35)]"
                onError={() => setHeroVideoError(true)}
                description="Education intelligence introduction"
              />
            )}
            <div className="space-y-3">
              <h1 className="font-orbitron text-3xl font-semibold text-neon-cyan sm:text-4xl">
                Education Intelligence
              </h1>
              <p className="mx-auto max-w-2xl text-base text-slate-200">
                Decode the karmic syllabus guiding your learning journey. Each section
                distils planetary signals, yogas, and remedial wisdom from MitraVeda&apos;s
                education engine so you can align effort with destiny.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-neon-cyan/80">
              <span className="rounded-full border border-neon-cyan/40 px-4 py-1 uppercase tracking-[0.4em]">
                Saraswati Pulse
              </span>
              <span className="rounded-full border border-neon-cyan/40 px-4 py-1 uppercase tracking-[0.4em]">
                D24 Synchronicity
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
                onClick={() => fetchEducation(true)}
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
            Synchronising MitraVeda education layers...
          </div>
        )}

        {error && !loadingData && (
          <div className="rounded-3xl border border-rose-500/40 bg-rose-900/30 p-6 text-rose-100 shadow-lg">
            {error}
          </div>
        )}

        {!error && educationData && (
          <div className="space-y-10 pb-12">
            {sections.map((section) => {
              const hasContent = !isEmptyValue(section.value);
              return (
                <section
                  key={section.key}
                  id={section.key}
                  className="rounded-3xl border border-neon-cyan/50 bg-gradient-to-br from-neo-dark via-[#0b1834] to-neo-dark p-8 shadow-2xl transition hover:border-neon-cyan"
                >
                  <header className="flex flex-col gap-2 border-b border-neon-cyan/30 pb-4">
                    <h2 className="text-2xl font-semibold text-neon-cyan">
                      {section.title}
                    </h2>
                    <p className="text-sm uppercase tracking-[0.35em] text-neon-cyan/80">
                      {section.blurb}
                    </p>
                  </header>
                  <div className="mt-4 space-y-4 text-base">
                    {hasContent ? (
                      renderValue((section.value ?? null) as EducationValue)
                    ) : (
                      <p className="text-sm italic text-slate-400">
                        Data not available.
                      </p>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {!error && !educationData && !loadingData && (
          <div className="rounded-3xl border border-neon-cyan/40 bg-neo-dark/70 p-6 text-slate-200">
            Education guidance is being prepared. Please revisit shortly.
          </div>
        )}
      </div>
    </div>
  );
}
