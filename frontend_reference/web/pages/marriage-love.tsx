import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { API_BASE } from '@/lib/api';
import { useActiveProfile } from '@/lib/useActiveProfile';
import { useAuth } from '@/lib/useAuth';
import { handleUnauthorized } from '@/lib/handleUnauthorized';
import { useTranslation } from 'react-i18next';
import AiSummaryDisplay from '@/components/AiSummaryDisplay';
import { useAiSummary } from '@/hooks/useAiSummary';

type PartnerTrait = {
  planet: string;
  qualities: string[];
  cautions: string[];
};

type RiskBucket = {
  level: string;
  drivers?: string[];
};

type TimingWindow = {
  label?: string;
  start?: string;
  end?: string;
  note?: string;
};

type DoubleTransitWindow = {
  start?: string;
  end?: string;
  note?: string;
  activated_houses?: string[];
};

type TimingWindows = {
  periods: TimingWindow[];
  double_transit?: {
    available: boolean;
    note?: string;
    windows?: DoubleTransitWindow[];
  } | null;
  final_window?: {
    start?: string;
    end?: string;
    basis?: string;
  } | null;
};

type MarriageTypeInfo = {
  label?: string | null;
  reason?: string | null;
  remarriage?: {
    status?: string | null;
    reason?: string | null;
  } | null;
} | null;

type DoshaEntry = {
  name: string;
  details: string[];
};

type MarriageDoshaSummary = {
  critical?: DoshaEntry[];
  all?: DoshaEntry[];
} | null;

type MarriageRiskProfile = {
  level?: string | null;
  score?: number;
  notes?: string[];
} | null;

type BhagyodayaInsight = {
  notes?: string[];
  activators?: string[];
} | null;

type ProgenyInsight = {
  notes?: string[];
  details?: Record<string, unknown>;
} | null;

type SpiritualInsight = {
  bond?: string | null;
  summary?: string | null;
  notes?: string[];
  sudarshana?: string[];
} | null;

type MarriageLoveResponse = {
  profile_id: number;
  summary: string;
  relationship_score: number;
  partner_traits: PartnerTrait[];
  risk_assessment: Record<string, RiskBucket>;
  remedies: string[];
  timing_windows: TimingWindows;
  updated_at?: string | null;
  marriage_summary?: string | null;
  marriage_type?: MarriageTypeInfo;
  spouse_traits?: string | null;
  marriage_doshas?: MarriageDoshaSummary;
  marriage_risk_profile?: MarriageRiskProfile;
  marriage_remedies?: string[] | null;
  bhagyodaya?: BhagyodayaInsight;
  progeny_outlook?: ProgenyInsight;
  spiritual_insight?: SpiritualInsight;
  marriage_updated_at?: string | null;
};

function formatDate(value?: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return value;
  }
  try {
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return value;
  }
}

function formatRange(t: any, start?: string | null, end?: string | null): string {
  const startText = formatDate(start);
  const endText = formatDate(end);
  if (startText && endText) return `${startText} → ${endText}`;
  if (startText) return `From ${startText}`;
  if (endText) return `Until ${endText}`;
  return t('marriage.timelineUpdateSoon');
}

function cleanList(value?: string[] | null): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (typeof entry === 'string') return entry.trim();
      if (typeof entry === 'number') return `${entry}`;
      return '';
    })
    .filter((entry) => entry.length > 0);
}

function titleCase(value: string): string {
  return value
    .split(' ')
    .map((part) => (part.length > 0 ? part[0].toUpperCase() + part.slice(1) : part))
    .join(' ');
}

export default function MarriageLovePage() {
  const router = useRouter();
  const { profile, loading: profileLoading } = useActiveProfile();
  const { token, sessionRestored, logout, refreshToken } = useAuth();
  const { t, i18n } = useTranslation();

  const profileId = useMemo(() => profile?.id || profile?.profile_id, [profile]);
  const loadingAuth = !sessionRestored;

  const [guidance, setGuidance] = useState<MarriageLoveResponse | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numProfileId = profileId ? Number(profileId) : null;
  const aiSummary = useAiSummary('marriage', numProfileId);

  const fetchGuidance = useCallback(
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
        const url = `${API_BASE}/api/marriage_love?${params.toString()}`;
        const requestInit: RequestInit = {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          credentials: 'include',
        };
        let response = await fetch(url, requestInit);
        if (response.status === 401) {
          const retryResponse = await handleUnauthorized(router, {
            logout,
            refreshToken,
            retry: async (freshToken) =>
              fetch(url, {
                headers: freshToken ? { Authorization: `Bearer ${freshToken}` } : {},
                credentials: 'include',
              }),
          });
          if (!retryResponse) return;
          response = retryResponse;
        }
        if (response.status === 404) {
          setGuidance(null);
          setError(t('marriage.error404'));
          return;
        }
        if (!response.ok) {
          setGuidance(null);
          setError(t('marriage.failed'));
          return;
        }
        const payload = (await response.json()) as MarriageLoveResponse;
        setGuidance(payload);
      } catch (err) {
        console.error('[MarriageLove] fetch failed', err);
        setGuidance(null);
        setError(t('marriage.failed'));
      } finally {
        setLoadingData(false);
      }
    },
    [profileId, token, refreshToken, logout, router, t, i18n.language]
  );

  useEffect(() => {
    if (profileLoading || loadingAuth) return;
    if (!profileId) return;
    fetchGuidance();
  }, [profileLoading, loadingAuth, profileId, fetchGuidance]);

  if (profileLoading || loadingAuth) {
    return (
      <div className="flex h-screen items-center justify-center text-accent">
        {t('marriage.loading')}
      </div>
    );
  }

  const score = guidance?.relationship_score ?? 0;
  const timing = guidance?.timing_windows;
  const marriageType = guidance?.marriage_type ?? null;
  const marriageDoshas = guidance?.marriage_doshas ?? null;
  const marriageRisk = guidance?.marriage_risk_profile ?? null;
  const marriageRemedies = cleanList(guidance?.marriage_remedies ?? null);
  const bhagyodaya = guidance?.bhagyodaya ?? null;
  const progeny = guidance?.progeny_outlook ?? null;
  const spiritual = guidance?.spiritual_insight ?? null;
  const remarriageInfo = marriageType?.remarriage ?? null;
  const showRemarriage = Boolean(
    remarriageInfo && (remarriageInfo.status || remarriageInfo.reason)
  );
  const criticalDoshas = marriageDoshas?.critical ?? [];
  const allDoshas = marriageDoshas?.all ?? [];
  const hasDoshas = criticalDoshas.length > 0 || allDoshas.length > 0;
  const marriageRiskNotes = cleanList(marriageRisk?.notes ?? null);
  const bhagyodayaNotes = cleanList(bhagyodaya?.notes ?? null);
  const bhagyodayaActivators = cleanList(bhagyodaya?.activators ?? null);
  const progenyNotes = cleanList(progeny?.notes ?? null);
  const spiritualNotes = cleanList(spiritual?.notes ?? null);
  const spiritualSudarshana = cleanList(spiritual?.sudarshana ?? null);

  return (
    <div className="scroll-smooth bg-neo-dark/95">
      <div className="mx-auto flex min-h-screen max-w-screen-xl flex-col gap-8 px-4 py-10 text-white sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-neon-cyan/50 bg-gradient-to-br from-neo-dark via-[#0b1b36] to-neo-dark p-8 shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,255,255,0.12),_transparent_55%)]" />
          <div className="relative z-10 flex flex-col items-center gap-6 text-center">
            <div className="space-y-3">
              <h1 className="font-orbitron text-3xl font-semibold text-neon-cyan sm:text-4xl">
                Marriage &amp; Love Guidance
              </h1>
              <p className="mx-auto max-w-2xl text-base text-slate-200">
                Romantic Karma, Compatibility, and Emotional Evolution
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-neon-cyan/80">
              <span className="rounded-full border border-neon-cyan/40 px-4 py-1 uppercase tracking-[0.4em]">
                Venus Analysis
              </span>
              <span className="rounded-full border border-neon-cyan/40 px-4 py-1 uppercase tracking-[0.4em]">
                7th House
              </span>
            </div>
            <div className="mt-2 flex flex-col items-center gap-3 text-sm text-slate-300 sm:flex-row">
              {guidance?.updated_at && (
                <span className="rounded-full border border-neon-cyan/30 bg-neo-dark/60 px-4 py-2 text-slate-200">
                  Last updated {formatDate(guidance.updated_at)}
                </span>
              )}
              {guidance?.marriage_updated_at && (
                <span className="rounded-full border border-neon-cyan/30 bg-neo-dark/60 px-4 py-2 text-slate-200">
                  Marriage insights updated {formatDate(guidance.marriage_updated_at)}
                </span>
              )}
              <button
                type="button"
                onClick={() => fetchGuidance(true)}
                className="rounded-full border border-neon-cyan px-5 py-2 text-sm font-semibold text-neon-cyan transition hover:bg-neon-cyan hover:text-neo-dark"
              >
                Refresh Guidance
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
            Synchronising MitraVeda layers...
          </div>
        )}

        {error && !loadingData && (
          <div className="rounded-3xl border border-rose-500/40 bg-rose-900/30 p-6 text-rose-100 shadow-lg">
            {error}
          </div>
        )}

        {!error && !loadingData && guidance && (
          <div className="space-y-10">
          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-700/60 bg-slate-900/60 p-6 shadow-xl">
              <h2 className="text-xl font-semibold text-accent">Divine Summary</h2>
              <p className="mt-2 text-slate-200 leading-relaxed">{guidance.summary}</p>
            </section>

            <section className="rounded-3xl border border-slate-700/60 bg-slate-900/60 p-6 shadow-xl">
              <h2 className="text-xl font-semibold text-accent">Relationship Energy</h2>
              <div className="mt-4">
                <div className="h-4 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-accent transition-all"
                    style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-sm text-slate-300">
                  <span>0</span>
                  <span className="font-semibold text-accent">{score}</span>
                  <span>100</span>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-700/60 bg-slate-900/60 p-6 shadow-xl">
              <h2 className="text-xl font-semibold text-accent">Partner Traits</h2>
              {guidance.partner_traits.length ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {guidance.partner_traits.map((trait) => (
                    <div
                      key={trait.planet}
                      className="rounded-2xl border border-slate-700/60 bg-slate-950/60 p-4"
                    >
                      <h3 className="text-lg font-semibold text-accent">{trait.planet}</h3>
                      <div className="mt-2 text-sm text-slate-200">
                        <p className="font-medium text-emerald-300">Qualities</p>
                        <ul className="mt-1 list-disc space-y-1 pl-5">
                          {trait.qualities.map((quality) => (
                            <li key={quality}>{quality}</li>
                          ))}
                        </ul>
                      </div>
                      {trait.cautions.length > 0 && (
                        <div className="mt-3 text-sm text-rose-200">
                          <p className="font-medium text-rose-300">Cautions</p>
                          <ul className="mt-1 list-disc space-y-1 pl-5">
                            {trait.cautions.map((caution) => (
                              <li key={caution}>{caution}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-slate-300">Partner traits will appear once the MitraVeda engine identifies seventh-house influences.</p>
              )}
            </section>

            <section className="grid gap-6 md:grid-cols-2">
              <div className="rounded-3xl border border-rose-600/40 bg-rose-900/20 p-6 shadow-xl">
                <h2 className="text-xl font-semibold text-rose-200">Risks</h2>
                {Object.entries(guidance.risk_assessment).map(([key, bucket]) => (
                  <div key={key} className="mt-4 rounded-2xl border border-rose-700/40 bg-rose-900/30 p-4">
                    <div className="flex items-baseline justify-between">
                      <span className="text-lg font-semibold capitalize text-rose-200">
                        {key.replace(/_/g, ' ')}
                      </span>
                      <span className="text-sm uppercase tracking-wide text-rose-300">{bucket.level}</span>
                    </div>
                    {bucket.drivers && bucket.drivers.length > 0 ? (
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-rose-100">
                        {bucket.drivers.map((driver) => (
                          <li key={driver}>{driver}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-sm text-rose-100">No significant triggers detected.</p>
                    )}
                  </div>
                ))}
              </div>
              <div className="rounded-3xl border border-emerald-500/40 bg-emerald-900/20 p-6 shadow-xl">
                <h2 className="text-xl font-semibold text-emerald-200">Remedies</h2>
                {guidance.remedies.length ? (
                  <ul className="mt-4 space-y-3 text-sm text-emerald-100">
                    {guidance.remedies.map((remedy, index) => (
                      <li
                        key={`${index}-${remedy.slice(0, 10)}`}
                        className="rounded-2xl border border-emerald-600/40 bg-emerald-900/40 p-4"
                      >
                        {remedy}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-emerald-100">No remedies required at this time—keep nurturing consistent devotion.</p>
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-700/60 bg-slate-900/60 p-6 shadow-xl">
              <h2 className="text-xl font-semibold text-accent">Love Timeline</h2>
              {timing?.final_window ? (
                <div className="mt-3 rounded-2xl border border-accent/50 bg-accent/10 p-4 text-accent">
                  <div className="text-sm uppercase tracking-wide text-accent">Primary Window</div>
                  <div className="mt-1 text-lg font-semibold text-accent">
                    {formatRange(t, timing.final_window.start, timing.final_window.end)}
                  </div>
                  {timing.final_window.basis && (
                    <p className="mt-1 text-sm text-accent">Basis: {timing.final_window.basis}</p>
                  )}
                </div>
              ) : (
                <p className="mt-3 text-slate-300">
                  Timing windows will surface as soon as Dasha or transit triggers become precise.
                </p>
              )}

              {timing?.double_transit && (
                <div className="mt-4 rounded-2xl border border-slate-700/60 bg-slate-950/60 p-4">
                  <div className="text-sm font-semibold text-slate-200">Double Transit Intel</div>
                  <p className="mt-1 text-sm text-slate-300">
                    {timing.double_transit.available
                      ? timing.double_transit.note || 'Jupiter & Saturn jointly light up key partnership houses.'
                      : 'Awaiting dual transit synchronisation.'}
                  </p>
                  {timing.double_transit.windows && timing.double_transit.windows.length > 0 && (
                    <ul className="mt-3 space-y-2 text-sm text-slate-200">
                      {timing.double_transit.windows.map((window, index) => (
                        <li
                          key={`${index}-${window.start}-${window.end}`}
                          className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-3"
                        >
                          <div className="font-medium text-accent">{formatRange(t, window.start, window.end)}</div>
                          {window.note && <p className="mt-1 text-xs text-slate-300">{window.note}</p>}
                          {window.activated_houses && window.activated_houses.length > 0 && (
                            <p className="mt-1 text-xs text-slate-400">
                              Houses: {window.activated_houses.join(', ')}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {timing?.periods && timing.periods.length > 0 && (
                <div className="mt-6 space-y-3">
                  <div className="text-sm font-semibold text-slate-200">Dasha Catalysts</div>
                  {timing.periods.map((period, index) => (
                    <div
                      key={`${index}-${period.label}-${period.start}`}
                      className="rounded-2xl border border-slate-700/60 bg-slate-950/60 p-4"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="text-lg font-semibold text-accent">{period.label || 'Window'}</span>
                        <span className="text-sm text-slate-300">{formatRange(t, period.start, period.end)}</span>
                      </div>
                      {period.note && <p className="mt-2 text-sm text-slate-300">{period.note}</p>}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="border-t border-accent/30" />

          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-accent">Marriage Insights</h2>
              <p className="text-slate-400">Commitment, prosperity, and karmic blessings</p>
            </div>

            <section className="rounded-3xl border border-slate-700/60 bg-slate-900/60 p-6 shadow-xl">
              <h3 className="text-xl font-semibold text-accent">Marriage Summary</h3>
              {guidance.marriage_summary ? (
                <p className="mt-2 text-slate-200 leading-relaxed">{guidance.marriage_summary}</p>
              ) : (
                <p className="mt-2 text-slate-400">Data not available.</p>
              )}
            </section>

            <section className="rounded-3xl border border-slate-700/60 bg-slate-900/60 p-6 shadow-xl">
              <h3 className="text-xl font-semibold text-accent">Marriage Type</h3>
              {marriageType ? (
                <div className="mt-3 space-y-3 text-slate-200">
                  {marriageType.label && (
                    <p>
                      <span className="font-semibold text-accent">Orientation:</span>{' '}
                      {titleCase(marriageType.label)}
                    </p>
                  )}
                  {marriageType.reason && (
                    <p className="text-slate-300">{marriageType.reason}</p>
                  )}
                  {showRemarriage && remarriageInfo && (
                    <div className="rounded-2xl border border-slate-700/60 bg-slate-950/60 p-4 text-sm text-slate-200">
                      <div className="font-semibold text-accent">Remarriage Outlook</div>
                      {remarriageInfo.status && (
                        <p className="mt-1">
                          Status:{' '}
                          <span className="font-medium text-accent">{titleCase(remarriageInfo.status)}</span>
                        </p>
                      )}
                      {remarriageInfo.reason && (
                        <p className="mt-2 text-slate-300">{remarriageInfo.reason}</p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p className="mt-2 text-slate-400">Data not available.</p>
              )}
            </section>

            <section className="rounded-3xl border border-slate-700/60 bg-slate-900/60 p-6 shadow-xl">
              <h3 className="text-xl font-semibold text-accent">Spouse Personality</h3>
              {guidance.spouse_traits ? (
                <p className="mt-2 text-slate-200 leading-relaxed">{guidance.spouse_traits}</p>
              ) : (
                <p className="mt-2 text-slate-400">Data not available.</p>
              )}
            </section>

            <section className="rounded-3xl border border-slate-700/60 bg-slate-900/60 p-6 shadow-xl">
              <h3 className="text-xl font-semibold text-accent">Marriage Doshas</h3>
              {hasDoshas ? (
                <div className="mt-3 space-y-4">
                  {criticalDoshas.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-rose-200">Critical Focus</p>
                      <div className="mt-2 space-y-3">
                        {criticalDoshas.map((entry) => (
                          <div
                            key={`critical-${entry.name}`}
                            className="rounded-2xl border border-rose-700/40 bg-rose-900/30 p-4"
                          >
                            <div className="text-lg font-semibold text-rose-200">{entry.name}</div>
                            {entry.details.length > 0 ? (
                              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-rose-100">
                                {entry.details.map((detail) => (
                                  <li key={detail}>{detail}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="mt-2 text-sm text-rose-100">Insights pending.</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {allDoshas.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-accent">Compatibility Scan</p>
                      <div className="mt-2 space-y-2">
                        {allDoshas.map((entry) => (
                          <div
                            key={`all-${entry.name}`}
                            className="rounded-2xl border border-slate-700/60 bg-slate-950/60 p-3"
                          >
                            <div className="font-semibold text-accent">{entry.name}</div>
                            {entry.details.length > 0 && (
                              <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-slate-300">
                                {entry.details.map((detail) => (
                                  <li key={detail}>{detail}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="mt-2 text-slate-400">Data not available.</p>
              )}
            </section>

            <section className="rounded-3xl border border-slate-700/60 bg-slate-900/60 p-6 shadow-xl">
              <h3 className="text-xl font-semibold text-accent">Risks &amp; Remedies</h3>
              {marriageRisk || marriageRemedies.length > 0 ? (
                <div className="mt-3 space-y-4">
                  {marriageRisk && (
                    <div className="rounded-2xl border border-rose-700/40 bg-rose-900/30 p-4 text-slate-100">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="text-lg font-semibold text-rose-200">Divorce Sensitivity</span>
                        {marriageRisk.level && (
                          <span className="text-sm uppercase tracking-wide text-rose-300">{marriageRisk.level}</span>
                        )}
                      </div>
                      {typeof marriageRisk.score === 'number' && (
                        <p className="mt-1 text-xs text-rose-200">Score: {marriageRisk.score}</p>
                      )}
                      {marriageRiskNotes.length > 0 ? (
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                          {marriageRiskNotes.map((note) => (
                            <li key={note}>{note}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-sm">Detailed notes will appear after the engine reviews seventh-house stressors.</p>
                      )}
                    </div>
                  )}
                  {marriageRemedies.length > 0 && (
                    <div className="rounded-2xl border border-emerald-600/40 bg-emerald-900/30 p-4 text-sm text-emerald-100">
                      <div className="text-lg font-semibold text-emerald-200">Suggested Remedies</div>
                      <ul className="mt-2 space-y-2 list-disc pl-5">
                        {marriageRemedies.map((remedy, index) => (
                          <li key={`marriage-remedy-${index}`}>{remedy}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="mt-2 text-slate-400">Data not available.</p>
              )}
            </section>

            <section className="rounded-3xl border border-slate-700/60 bg-slate-900/60 p-6 shadow-xl">
              <h3 className="text-xl font-semibold text-accent">Post-Marriage Fortune (Bhagyodaya)</h3>
              {bhagyodayaNotes.length > 0 || bhagyodayaActivators.length > 0 ? (
                <div className="mt-3 space-y-3 text-slate-200">
                  {bhagyodayaNotes.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-accent">Highlights</p>
                      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-200">
                        {bhagyodayaNotes.map((note) => (
                          <li key={note}>{note}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {bhagyodayaActivators.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-emerald-200">Activators</p>
                      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-emerald-100">
                        {bhagyodayaActivators.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="mt-2 text-slate-400">Data not available.</p>
              )}
            </section>

            <section className="rounded-3xl border border-slate-700/60 bg-slate-900/60 p-6 shadow-xl">
              <h3 className="text-xl font-semibold text-accent">Progeny Outlook</h3>
              {progenyNotes.length > 0 || progeny?.details ? (
                <div className="mt-3 space-y-3 text-slate-200">
                  {progenyNotes.length > 0 && (
                    <ul className="list-disc space-y-1 pl-5 text-sm text-slate-200">
                      {progenyNotes.map((note) => (
                        <li key={note}>{note}</li>
                      ))}
                    </ul>
                  )}
                  {progeny?.details && (
                    <div className="rounded-2xl border border-slate-700/60 bg-slate-950/60 p-4 text-sm">
                      <div className="font-semibold text-accent">Fifth House Indicators</div>
                      <ul className="mt-2 space-y-1">
                        {Object.entries(progeny.details)
                          .filter(([, value]) =>
                            typeof value === 'string' || typeof value === 'number' || Array.isArray(value)
                          )
                          .map(([key, value]) => (
                            <li key={key} className="flex flex-wrap gap-1 text-slate-300">
                              <span className="font-medium capitalize text-accent">{key.replace(/_/g, ' ')}:</span>
                              <span>
                                {Array.isArray(value)
                                  ? (value as unknown[])
                                      .map((entry) => (typeof entry === 'string' ? entry : String(entry)))
                                      .join(', ')
                                  : String(value)}
                              </span>
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="mt-2 text-slate-400">Data not available.</p>
              )}
            </section>

            <section className="rounded-3xl border border-slate-700/60 bg-slate-900/60 p-6 shadow-xl">
              <h3 className="text-xl font-semibold text-accent">Spiritual Insight</h3>
              {spiritual || spiritualNotes.length > 0 || spiritualSudarshana.length > 0 ? (
                <div className="mt-3 space-y-3 text-slate-200">
                  {spiritual?.bond && (
                    <p className="text-slate-200">{spiritual.bond}</p>
                  )}
                  {spiritual?.summary && (
                    <p className="text-sm text-accent">Navamsa Summary: {titleCase(spiritual.summary)}</p>
                  )}
                  {spiritualNotes.length > 0 && (
                    <ul className="list-disc space-y-1 pl-5 text-sm text-slate-200">
                      {spiritualNotes.map((note) => (
                        <li key={note}>{note}</li>
                      ))}
                    </ul>
                  )}
                  {spiritualSudarshana.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-accent">Sudarshana Highlights</p>
                      <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-slate-300">
                        {spiritualSudarshana.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="mt-2 text-slate-400">Data not available.</p>
              )}
            </section>
          </div>
        </div>
        )}

        {!loadingData && !error && !guidance && (
          <div className="rounded-3xl border border-neon-cyan/40 bg-neo-dark/70 p-6 text-slate-200">
            MitraVeda has not computed love guidance yet. Activate the engine from the admin console or return once the profile sync completes.
          </div>
        )}
      </div>
    </div>
  );
}
