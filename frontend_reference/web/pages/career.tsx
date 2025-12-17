import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';

import { API_BASE } from '@/lib/api';
import { handleUnauthorized } from '@/lib/handleUnauthorized';
import { useActiveProfile } from '@/lib/useActiveProfile';
import { useAuth } from '@/lib/useAuth';
import { useTranslation } from 'react-i18next';
import AiSummaryDisplay from '@/components/AiSummaryDisplay';
import { useAiSummary } from '@/hooks/useAiSummary';

type CareerSummaryBlock = {
  headline?: string | null;
  highlights?: string[] | null;
  divisional_notes?: string[] | null;
  karaka_traits?: string[] | null;
};

type CareerInfluencerEntry = {
  planet?: string | null;
  role?: string | null;
  summary?: string | null;
  dignity?: string | null;
  domains?: string[] | null;
  house?: number | string | null;
  sign?: string | null;
};

type CareerDivisionalEntry = {
  strong_planets?: string[] | null;
  weak_planets?: string[] | null;
  notes?: string[] | null;
};

type CareerTiming = {
  career_trend?: string | null;
  notes?: string | null;
  current_mahadasha?: string | null;
  current_antardasha?: string | null;
  period_start?: string | null;
  period_end?: string | null;
  transit_support?: Record<string, string | null | undefined> | null;
};

type CareerRawData = {
  summary?: CareerSummaryBlock | null;
  career_ecosystem?: {
    tenth_house?: {
      occupant_notes?: Record<string, { summary?: string | null; domains?: string[] | null } | null> | null;
    } | null;
  } | null;
  planetary_influencers?: CareerInfluencerEntry[] | null;
  divisional_verification?: Record<string, CareerDivisionalEntry | null> | null;
  karaka_summary?: Record<string, string | null | undefined> | null;
  timing?: CareerTiming | null;
};

type CareerApiResponse = {
  raw_data?: CareerRawData | null;
  summary?: string | null;
};

type PlanetaryInsight = {
  planet: string;
  occupantSummary: string | null;
  occupantDomains: string[];
  influencerSummary: string | null;
  influencerDomains: string[];
  role: string | null;
  dignity: string | null;
  house: string | number | null;
  sign: string | null;
};

type DivisionalInsight = {
  chart: string;
  strong: string[];
  weak: string[];
  notes: string[];
};

type TimingInsight = {
  careerTrend: string | null;
  notes: string | null;
  maha: string | null;
  antar: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  transitSupportEntries: { key: string; value: string }[];
};

const cleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const cleanStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => cleanString(entry))
    .filter((entry): entry is string => Boolean(entry));
};

const toDisplayString = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return cleanString(value);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return null;
};

const formatLabel = (label: string): string =>
  label
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatDateLabel = (value: string | null): string | null => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  try {
    return parsed.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (err) {
    console.warn('[Career] Failed to format date', err);
    return value;
  }
};

const hasMeaningfulCareerData = (payload: CareerApiResponse | null): boolean => {
  if (!payload) return false;
  const raw = payload.raw_data;
  if (!raw || typeof raw !== 'object') return false;
  return Object.keys(raw as Record<string, unknown>).length > 0;
};

export default function CareerPage() {
  const router = useRouter();
  const { profile, loading: profileLoading } = useActiveProfile();
  const { token, sessionRestored, logout, refreshToken } = useAuth();
  const loadingAuth = !sessionRestored;
  const { t, i18n } = useTranslation();

  const [careerReport, setCareerReport] = useState<CareerApiResponse | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const profileId = useMemo(() => {
    const pid = (profile?.id ?? profile?.profile_id) as number | string | undefined;
    if (pid === undefined || pid === null) {
      return null;
    }
    const numericId = Number(pid);
    if (Number.isNaN(numericId) || numericId <= 0) {
      return null;
    }
    return numericId;
  }, [profile]);

  const aiSummary = useAiSummary('career', profileId);

  const minimalProfile = useMemo(() => {
    if (!profileId || !profile) return null;
    const source = profile as Record<string, unknown>;
    const payload: Record<string, unknown> = {
      id: profileId,
      profile_id: profileId,
    };

    const setIfPresent = (targetKey: string, keys: string[]) => {
      for (const key of keys) {
        const value = source[key];
        if (value !== undefined && value !== null && value !== '') {
          payload[targetKey] = value;
          return;
        }
      }
    };

    setIfPresent('dob', ['dob']);
    setIfPresent('tob', ['tob']);
    setIfPresent('lat', ['lat', 'latitude']);
    setIfPresent('lon', ['lon', 'longitude']);
    setIfPresent('tz_str', ['tz_str', 'tzStr', 'tz', 'timezone']);

    return payload;
  }, [profile, profileId]);

  const fetchCareer = useCallback(async () => {
    if (!profileId) return;
    setLoadingData(true);
    setError(null);

    let authTokenValue = typeof token === 'string' ? token : null;

    try {
      if ((!authTokenValue || authTokenValue.trim().length === 0) && refreshToken) {
        authTokenValue = await refreshToken(true);
      }
    } catch (err) {
      console.error('[Career] Failed to refresh token', err);
    }

    if (!authTokenValue) {
      await handleUnauthorized(router, { logout, refreshToken });
      setLoadingData(false);
      return;
    }

    const parseCareerPayload = async (
      response: Response,
    ): Promise<{ payload: CareerApiResponse | null; errorMessage: string | null }> => {
      try {
        const data = (await response.json()) as unknown;
        if (!data || typeof data !== 'object') {
          return { payload: null, errorMessage: null };
        }
        if (
          'error' in data &&
          typeof (data as { error: unknown }).error === 'string'
        ) {
          return { payload: null, errorMessage: (data as { error: string }).error };
        }
        const record = data as Record<string, unknown>;
        const rawCandidate = record.raw_data;
        const rawData =
          rawCandidate && typeof rawCandidate === 'object'
            ? (rawCandidate as CareerRawData)
            : null;
        const summaryText = cleanString(record.summary);
        return {
          payload: { raw_data: rawData, summary: summaryText ?? null },
          errorMessage: null,
        };
      } catch (err) {
        console.error('[Career] Failed to parse response', err);
        return { payload: null, errorMessage: null };
      }
    };

    const performRequest = async (
      method: 'GET' | 'POST',
      body?: Record<string, unknown>,
    ): Promise<Response | null> => {
      const targetUrl =
        method === 'GET'
          ? (() => {
              const params = new URLSearchParams({
                profile_id: String(profileId),
                locale: i18n.language || 'en'
              });
              return `${API_BASE}/api/fortune/career?${params.toString()}`;
            })()
          : `${API_BASE}/api/fortune/career`;

      const execute = (tokenOverride: string | null) => {
        const headers: Record<string, string> = {};
        if (tokenOverride) {
          headers.Authorization = `Bearer ${tokenOverride}`;
        }
        if (method === 'POST') {
          headers['Content-Type'] = 'application/json';
        }
        return fetch(targetUrl, {
          method,
          credentials: 'include',
          headers,
          ...(method === 'POST' ? { body: JSON.stringify(body ?? {}) } : {}),
        });
      };

      let response = await execute(authTokenValue);
      if (response.status === 401) {
        const retryResponse = await handleUnauthorized(router, {
          logout,
          refreshToken,
          retry: async (freshToken) => {
            if (freshToken) {
              authTokenValue = freshToken;
            }
            return execute(freshToken);
          },
        });
        if (!retryResponse) {
          return null;
        }
        response = retryResponse;
      }
      return response;
    };

    try {
      const ensureCareerData = async (response: Response | null) => {
        if (!response) {
          return { payload: null, errorMessage: null };
        }
        const parsed = await parseCareerPayload(response);
        if (parsed.errorMessage) {
          return parsed;
        }
        if (!response.ok && !parsed.payload) {
          return parsed;
        }
        return parsed;
      };

      const fallbackBody = minimalProfile
        ? { profile: minimalProfile, active_profile: minimalProfile, profile_id: profileId }
        : null;

      const initialResponse = await performRequest('GET');
      if (!initialResponse) {
        return;
      }

      if (initialResponse.status === 404) {
        if (!fallbackBody) {
          setCareerReport(null);
          setError(t('career.notAvailable'));
          return;
        }
        const fallbackResponse = await performRequest('POST', fallbackBody);
        const { payload: fallbackPayload, errorMessage } = await ensureCareerData(
          fallbackResponse,
        );
        if (errorMessage) {
          setCareerReport(null);
          setError(errorMessage);
          return;
        }
        if (fallbackResponse && !fallbackResponse.ok) {
          setCareerReport(null);
          setError(t('career.notAvailable'));
          return;
        }
        if (hasMeaningfulCareerData(fallbackPayload)) {
          setCareerReport(fallbackPayload);
          setError(null);
          return;
        }
        setCareerReport(null);
        setError(t('career.notAvailable'));
        return;
      }

      const { payload: initialPayload, errorMessage: initialError } = await ensureCareerData(
        initialResponse,
      );

      if (initialError) {
        setCareerReport(null);
        setError(initialError);
        return;
      }

      if (!initialResponse.ok) {
        setCareerReport(null);
        setError('Failed to load career intelligence.');
        return;
      }

      if (hasMeaningfulCareerData(initialPayload)) {
        setCareerReport(initialPayload);
        setError(null);
        return;
      }

      if (!fallbackBody) {
        setCareerReport(null);
        setError(t('career.notAvailable'));
        return;
      }

      const fallbackResponse = await performRequest('POST', fallbackBody);
      const { payload: fallbackPayload, errorMessage } = await ensureCareerData(
        fallbackResponse,
      );
      if (errorMessage) {
        setCareerReport(null);
        setError(errorMessage);
        return;
      }
      if (fallbackResponse && !fallbackResponse.ok) {
        setCareerReport(null);
        setError(t('career.notAvailable'));
        return;
      }
      if (hasMeaningfulCareerData(fallbackPayload)) {
        setCareerReport(fallbackPayload);
        setError(null);
        return;
      }
      setCareerReport(null);
      setError(t('career.notAvailable'));
    } catch (err) {
      console.error('[Career] Fetch failed', err);
      setCareerReport(null);
      setError('Failed to load career intelligence.');
    } finally {
      setLoadingData(false);
    }
  }, [profileId, token, refreshToken, logout, router, minimalProfile, i18n.language, t]);

  useEffect(() => {
    if (profileLoading || loadingAuth) return;
    if (!profileId) return;
    fetchCareer();
  }, [profileLoading, loadingAuth, profileId, fetchCareer]);

  const summaryText = cleanString(careerReport?.summary);
  const careerPayload = careerReport?.raw_data ?? null;
  const summaryBlock = careerPayload?.summary ?? null;
  const summaryHeadline = cleanString(summaryBlock?.headline);
  const summaryHighlights = cleanStringArray(summaryBlock?.highlights);
  const karakaTraits = cleanStringArray(summaryBlock?.karaka_traits);
  const divisionalSummaryNotes = cleanStringArray(summaryBlock?.divisional_notes);

  const isLoading = profileLoading || loadingAuth;

  const planetaryInsights = useMemo<PlanetaryInsight[]>(() => {
    const entries = new Map<string, PlanetaryInsight>();
    const occupantNotes = careerPayload?.career_ecosystem?.tenth_house?.occupant_notes;
    if (occupantNotes && typeof occupantNotes === 'object') {
      Object.entries(occupantNotes).forEach(([planetKey, rawDetails]) => {
        const planetName = cleanString(planetKey);
        if (!planetName) return;
        const details = (rawDetails ?? {}) as {
          summary?: unknown;
          domains?: unknown;
        };
        const summary = cleanString(details.summary);
        const domains = cleanStringArray(details.domains);
        if (!summary && domains.length === 0) {
          return;
        }
        entries.set(planetName, {
          planet: planetName,
          occupantSummary: summary,
          occupantDomains: domains,
          influencerSummary: null,
          influencerDomains: [],
          role: null,
          dignity: null,
          house: null,
          sign: null,
        });
      });
    }

    if (Array.isArray(careerPayload?.planetary_influencers)) {
      careerPayload.planetary_influencers.forEach((item) => {
        const planetName = cleanString(item?.planet);
        if (!planetName) return;
        const existing =
          entries.get(planetName) ?? {
            planet: planetName,
            occupantSummary: null,
            occupantDomains: [],
            influencerSummary: null,
            influencerDomains: [],
            role: null,
            dignity: null,
            house: null,
            sign: null,
          };
        const influencerSummary = cleanString(item?.summary);
        if (influencerSummary) {
          existing.influencerSummary = influencerSummary;
        }
        const influencerDomains = cleanStringArray(item?.domains);
        if (influencerDomains.length > 0) {
          existing.influencerDomains = influencerDomains;
        }
        const role = cleanString(item?.role);
        if (role) {
          existing.role = role;
        }
        const dignity = cleanString(item?.dignity);
        if (dignity) {
          existing.dignity = dignity;
        }
        const houseValue = item?.house;
        if (typeof houseValue === 'number' && Number.isFinite(houseValue)) {
          existing.house = houseValue;
        } else {
          const houseText = cleanString(houseValue);
          if (houseText) {
            existing.house = houseText;
          }
        }
        const sign = cleanString(item?.sign);
        if (sign) {
          existing.sign = sign;
        }
        entries.set(planetName, existing);
      });
    }

    return Array.from(entries.values()).sort((a, b) => a.planet.localeCompare(b.planet));
  }, [careerPayload]);

  const divisionalEntries = useMemo<DivisionalInsight[]>(() => {
    const rawDivisional = careerPayload?.divisional_verification;
    if (!rawDivisional || typeof rawDivisional !== 'object') return [];
    return Object.entries(rawDivisional)
      .map(([chartKey, value]) => {
        if (!value || typeof value !== 'object') return null;
        const block = value as CareerDivisionalEntry;
        const strong = cleanStringArray(block.strong_planets);
        const weak = cleanStringArray(block.weak_planets);
        const notes = cleanStringArray(block.notes);
        if (strong.length === 0 && weak.length === 0 && notes.length === 0) {
          return null;
        }
        return {
          chart: formatLabel(chartKey),
          strong,
          weak,
          notes,
        };
      })
      .filter((entry): entry is DivisionalInsight => Boolean(entry));
  }, [careerPayload]);

  const karakaSummaryEntries = useMemo(() => {
    const summaryMap = careerPayload?.karaka_summary;
    if (!summaryMap || typeof summaryMap !== 'object') return [];
    return Object.entries(summaryMap)
      .map(([key, value]) => {
        const display = toDisplayString(value);
        if (!display) return null;
        return { label: formatLabel(key), value: display };
      })
      .filter((entry): entry is { label: string; value: string } => Boolean(entry));
  }, [careerPayload]);

  const timingDetails = useMemo<TimingInsight | null>(() => {
    const timing = careerPayload?.timing;
    if (!timing) return null;
    const careerTrend = cleanString(timing.career_trend);
    const notes = cleanString(timing.notes);
    const maha = cleanString(timing.current_mahadasha);
    const antar = cleanString(timing.current_antardasha);
    const periodStart = formatDateLabel(cleanString(timing.period_start));
    const periodEnd = formatDateLabel(cleanString(timing.period_end));
    const transitSupportEntries =
      timing.transit_support && typeof timing.transit_support === 'object'
        ? Object.entries(timing.transit_support)
            .map(([key, value]) => {
              const text = cleanString(value);
              if (!text) return null;
              return { key: formatLabel(key), value: text };
            })
            .filter((entry): entry is { key: string; value: string } => Boolean(entry))
        : [];
    if (
      !careerTrend &&
      !notes &&
      !maha &&
      !antar &&
      !periodStart &&
      !periodEnd &&
      transitSupportEntries.length === 0
    ) {
      return null;
    }
    return {
      careerTrend,
      notes,
      maha,
      antar,
      periodStart,
      periodEnd,
      transitSupportEntries,
    };
  }, [careerPayload]);

  const statusMessage = useMemo(() => {
    if (error) return error;
    if (loadingData) return t('career.synchronising');
    return null;
  }, [error, loadingData, t]);

  const statusVariant = error ? 'error' : loadingData ? 'loading' : null;

  const summaryContent = (
    <div className="space-y-4">
      {summaryHeadline && (
        <p className="text-lg leading-relaxed text-slate-100">{summaryHeadline}</p>
      )}
      {summaryHighlights.length > 0 && (
        <ul className="list-disc space-y-2 pl-5 text-slate-200">
          {summaryHighlights.map((item, index) => (
            <li key={`${item}-${index}`}>{item}</li>
          ))}
        </ul>
      )}
      {!summaryHeadline && summaryHighlights.length === 0 && (
        <p className="text-sm text-slate-400">
          {t('career.narrativeWillAppear')}
        </p>
      )}
    </div>
  );

  const planetaryContent = planetaryInsights.length > 0 ? (
    <div className="space-y-4">
      {planetaryInsights.map((entry) => {
        const domainSet = new Set<string>();
        entry.occupantDomains.forEach((domain) => domainSet.add(domain));
        entry.influencerDomains.forEach((domain) => domainSet.add(domain));
        const domains = Array.from(domainSet);
        return (
          <article
            key={entry.planet}
            className="rounded-2xl border border-accent/20 bg-neo-dark/40 p-4"
          >
            <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.3em] text-neon-cyan/80">
              <span className="text-sm font-semibold tracking-[0.35em] text-neon-cyan">
                {entry.planet}
              </span>
              {entry.role && (
                <span className="rounded-full border border-neon-cyan/40 px-3 py-1 text-[10px] font-semibold text-neon-cyan/80">
                  {formatLabel(entry.role)}
                </span>
              )}
              {entry.dignity && (
                <span className="rounded-full border border-neon-cyan/30 px-3 py-1 text-[10px] uppercase text-neon-cyan/70">
                  {formatLabel(entry.dignity)}
                </span>
              )}
              {entry.sign && (
                <span className="rounded-full border border-neon-cyan/30 px-3 py-1 text-[10px] uppercase text-neon-cyan/70">
                  {entry.sign}
                </span>
              )}
              {entry.house !== null && entry.house !== undefined && (
                <span className="rounded-full border border-neon-cyan/30 px-3 py-1 text-[10px] uppercase text-neon-cyan/70">
                  {t('career.house')} {entry.house}
                </span>
              )}
            </div>
            {entry.occupantSummary && (
              <p className="mt-3 text-sm leading-relaxed text-slate-200">
                {entry.occupantSummary}
              </p>
            )}
            {entry.influencerSummary && entry.influencerSummary !== entry.occupantSummary && (
              <p className="mt-3 text-sm leading-relaxed text-slate-200">
                {entry.influencerSummary}
              </p>
            )}
            {domains.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {domains.map((domain, index) => (
                  <span
                    key={`${entry.planet}-domain-${index}`}
                    className="rounded-full border border-neon-cyan/40 px-3 py-1 text-xs uppercase tracking-[0.3em] text-neon-cyan"
                  >
                    {formatLabel(domain)}
                  </span>
                ))}
              </div>
            )}
          </article>
        );
      })}
    </div>
  ) : (
    <p className="text-sm text-slate-400">
      {t('career.planetarySyncing')}
    </p>
  );

  const divisionalContent =
    divisionalEntries.length > 0 || divisionalSummaryNotes.length > 0 ? (
      <div className="space-y-4">
        {divisionalEntries.map((entry) => (
          <article
            key={entry.chart}
            className="rounded-2xl border border-accent/20 bg-neo-dark/40 p-4"
          >
            <h3 className="text-sm uppercase tracking-[0.3em] text-neon-cyan">{entry.chart}</h3>
            {entry.notes.length > 0 && (
              <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-200">
                {entry.notes.map((note, index) => (
                  <li key={`${entry.chart}-note-${index}`}>{note}</li>
                ))}
              </ul>
            )}
            {(entry.strong.length > 0 || entry.weak.length > 0) && (
              <div className="mt-3 flex flex-wrap gap-4 text-xs uppercase tracking-[0.3em] text-neon-cyan/80">
                {entry.strong.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-neon-cyan/40 px-3 py-1 text-[10px] font-semibold text-neon-cyan/90">
                      Strong
                    </span>
                    {entry.strong.map((planet, index) => (
                      <span
                        key={`${entry.chart}-strong-${index}`}
                        className="rounded-full border border-neon-cyan/30 px-3 py-1 text-[10px] text-neon-cyan/70"
                      >
                        {planet}
                      </span>
                    ))}
                  </div>
                )}
                {entry.weak.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-rose-400/50 px-3 py-1 text-[10px] font-semibold text-rose-200/80">
                      Watch
                    </span>
                    {entry.weak.map((planet, index) => (
                      <span
                        key={`${entry.chart}-weak-${index}`}
                        className="rounded-full border border-rose-400/40 px-3 py-1 text-[10px] text-rose-200/80"
                      >
                        {planet}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </article>
        ))}
        {divisionalSummaryNotes.length > 0 && (
          <div className="rounded-2xl border border-accent/20 bg-neo-dark/40 p-4">
            <h3 className="text-sm uppercase tracking-[0.3em] text-neon-cyan">{t('career.highlights')}</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-200">
              {divisionalSummaryNotes.map((note, index) => (
                <li key={`divisional-summary-${index}`}>{note}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    ) : (
      <p className="text-sm text-slate-400">
        {t('career.divisionalWillPopulate')}
      </p>
    );

  const karakaContent =
    karakaSummaryEntries.length > 0 || karakaTraits.length > 0 ? (
      <div className="space-y-4">
        {karakaSummaryEntries.length > 0 && (
          <dl className="grid gap-4 md:grid-cols-2">
            {karakaSummaryEntries.map((entry) => (
              <div
                key={entry.label}
                className="rounded-2xl border border-accent/20 bg-neo-dark/40 p-4"
              >
                <dt className="text-xs uppercase tracking-[0.3em] text-neon-cyan/80">
                  {entry.label}
                </dt>
                <dd className="mt-2 text-sm text-slate-100">{entry.value}</dd>
              </div>
            ))}
          </dl>
        )}
        {karakaTraits.length > 0 && (
          <div className="rounded-2xl border border-accent/20 bg-neo-dark/40 p-4">
            <h3 className="text-xs uppercase tracking-[0.3em] text-neon-cyan/80">
              {t('career.karakaTraits')}
            </h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-200">
              {karakaTraits.map((trait, index) => (
                <li key={`karaka-trait-${index}`}>{trait}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    ) : (
      <p className="text-sm text-slate-400">
        {t('career.karakaWillSurface')}
      </p>
    );

  const timingContent = timingDetails ? (
    <div className="space-y-4">
      {timingDetails.careerTrend && (
        <div className="rounded-2xl border border-neon-cyan/30 bg-neo-dark/40 p-4 text-sm text-neon-cyan">
          {t('career.careerTrend')} {formatLabel(timingDetails.careerTrend)}
        </div>
      )}
      {timingDetails.notes && (
        <p className="text-sm leading-relaxed text-slate-200">{timingDetails.notes}</p>
      )}
      {(timingDetails.maha || timingDetails.antar) && (
        <div className="flex flex-wrap gap-4 text-xs uppercase tracking-[0.3em] text-neon-cyan/80">
          {timingDetails.maha && (
            <span className="rounded-full border border-neon-cyan/40 px-3 py-1">
              {t('career.mahadasha')} {formatLabel(timingDetails.maha)}
            </span>
          )}
          {timingDetails.antar && (
            <span className="rounded-full border border-neon-cyan/40 px-3 py-1">
              {t('career.antardasha')} {formatLabel(timingDetails.antar)}
            </span>
          )}
        </div>
      )}
      {(timingDetails.periodStart || timingDetails.periodEnd) && (
        <div className="flex flex-wrap gap-4 text-xs uppercase tracking-[0.3em] text-neon-cyan/70">
          {timingDetails.periodStart && (
            <span className="rounded-full border border-neon-cyan/30 px-3 py-1">
              {t('career.from')} {timingDetails.periodStart}
            </span>
          )}
          {timingDetails.periodEnd && (
            <span className="rounded-full border border-neon-cyan/30 px-3 py-1">
              {t('career.until')} {timingDetails.periodEnd}
            </span>
          )}
        </div>
      )}
      {timingDetails.transitSupportEntries.length > 0 && (
        <div className="space-y-3">
          {timingDetails.transitSupportEntries.map((entry, index) => (
            <div
              key={`transit-${index}`}
              className="rounded-2xl border border-neon-cyan/20 bg-neo-dark/40 p-4"
            >
              <h3 className="text-xs uppercase tracking-[0.3em] text-neon-cyan/80">
                {entry.key}
              </h3>
              <p className="mt-2 text-sm text-slate-200">{entry.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  ) : (
    <p className="text-sm text-slate-400">
      {t('career.timingActivates')}
    </p>
  );

  const sections = [
    { title: t('career.summary'), content: summaryContent },
    { title: t('career.planetaryInfluences'), content: planetaryContent },
    { title: t('career.divisionalValidation'), content: divisionalContent },
    { title: t('career.karakasInsight'), content: karakaContent },
    { title: t('career.dashaAndTiming'), content: timingContent },
  ];

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-neon-cyan">
        {t('career.loading')}
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
              <Image src="/logo/logo.png" alt="Career mandala" fill className="object-cover" priority />
            </div>
            <div className="space-y-3">
              <h1 className="font-orbitron text-3xl font-semibold text-neon-cyan sm:text-4xl">
                {t('career.title')}
              </h1>
              <p className="mx-auto max-w-2xl text-base text-slate-200">
                {t('career.subtitle')}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-neon-cyan/80">
              <span className="rounded-full border border-neon-cyan/40 px-4 py-1 uppercase tracking-[0.4em]">
                {t('career.d10Analysis')}
              </span>
              <span className="rounded-full border border-neon-cyan/40 px-4 py-1 uppercase tracking-[0.4em]">
                {t('career.tenthHouse')}
              </span>
            </div>
            <div className="mt-2 flex flex-col items-center gap-3 text-sm text-slate-300 sm:flex-row">
              {summaryText && (
                <p className="text-sm leading-relaxed text-slate-200 max-w-2xl">{summaryText}</p>
              )}
            </div>
            {statusMessage && (
              <p
                className={`text-xs uppercase tracking-[0.3em] ${
                  statusVariant === 'error' ? 'text-rose-300' : 'text-neon-cyan/80'
                }`}
              >
                {statusMessage}
              </p>
            )}
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

        <div className="space-y-6">
          {sections.map((section) => {
            const sectionId = section.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            return (
              <section
                key={section.title}
                aria-labelledby={sectionId}
                className="rounded-3xl border border-neon-cyan/50 bg-gradient-to-br from-neo-dark via-[#0a1832] to-neo-dark p-8 shadow-2xl transition hover:border-neon-cyan"
              >
                <h2
                  id={sectionId}
                  className="text-xl font-semibold uppercase tracking-[0.2em] text-neon-cyan"
                >
                  {section.title}
                </h2>
                <div className="mt-4 space-y-4">{section.content}</div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
