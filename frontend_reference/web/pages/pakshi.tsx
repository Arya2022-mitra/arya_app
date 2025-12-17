import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';

import Card from '@/components/Card';
import { API_BASE } from '@/lib/api';
import { handleUnauthorized } from '@/lib/handleUnauthorized';
import { useActiveProfile } from '@/lib/useActiveProfile';
import { useAuth } from '@/lib/useAuth';
import { useTranslation } from 'react-i18next';
import SecureAutoPlayVideo from '@/components/SecureAutoPlayVideo';

type PakshiApiSlot = {
  start?: string;
  end?: string;
  start_pretty?: string;
  end_pretty?: string;
  duration_text?: string;
  duration_mins?: number;
  state?: string;
  activity?: string;
  verdict?: string;
  quality?: string;
  relation?: string;
  relationship?: string;
  activity_detail?: {
    relation?: string;
  } | null;
};

type PakshiApiResponse = {
  profile_id: number;
  status?: string;
  message?: string;
  chart_date?: string;
  chart_date_source?: string | null;
  janma_pakshi?: string;
  birth_paksha?: string;
  daily_paksha?: string;
  day_ruling_pakshi?: string;
  night_ruling_pakshi?: string;
  apahara_map?: Record<string, unknown> | null;
  activity_chart?: PakshiApiSlot[] | null;
  segment_message?: string;
  reason?: unknown;
  tz_str?: string | null;
  verdict_summary?: Record<string, number> | null;
  raw?: Record<string, unknown> | null;
};

type PakshiSlot = {
  start?: string;
  end?: string;
  start_pretty?: string;
  end_pretty?: string;
  duration_text?: string;
  duration_mins?: number;
  state?: string;
  quality?: string;
  relation?: string;
};

function formatISOTime(iso?: string, tz?: string): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  try {
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: tz,
    });
  } catch {
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }
}

function toTimeRange(slot?: PakshiSlot | null, tz?: string) {
  const format = (val?: string, pretty?: string) => {
    if (pretty) return pretty;
    if (!val) return undefined;
    return /^\d{4}-\d{2}-\d{2}T/.test(val) ? formatISOTime(val, tz) : val;
  };
  const start = format(slot?.start, slot?.start_pretty);
  const end = format(slot?.end, slot?.end_pretty);
  if (!start && !end) return '—';
  if (!start) return `— to ${end}`;
  if (!end) return `${start} to —`;
  return `${start} to ${end}`;
}

function durationText(slot: PakshiSlot) {
  if (slot?.duration_text) return slot.duration_text;
  if (typeof slot?.duration_mins === 'number') {
    const m = Math.max(0, Math.round(slot.duration_mins));
    const h = Math.floor(m / 60);
    const mm = m % 60;
    if (h && mm) return `${h} Hours ${mm} Mins`;
    if (h) return `${h} Hours`;
    return `${mm} Mins`;
  }
  return '—';
}

function parseTimeToMinutes(t?: string, tz?: string): number | null {
  if (!t) return null;
  const isoPattern = /^\d{4}-\d{2}-\d{2}T/;
  if (isoPattern.test(t)) {
    const d = new Date(t);
    if (Number.isNaN(d.getTime())) return null;
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: tz,
      }).formatToParts(d);
      const h = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);
      const m = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);
      return h * 60 + m;
    } catch {
      return d.getHours() * 60 + d.getMinutes();
    }
  }
  const m = t.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const ampm = m[3].toUpperCase();
  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return h * 60 + min;
}

function formatHMS(totalSecs: number): string {
  const s = Math.max(0, Math.floor(totalSecs));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((v) => String(v).padStart(2, '0')).join(':');
}

function normalizeJanmaPakshi(source: PakshiApiResponse | null): string | null {
  if (!source) return null;
  const raw = source.raw ?? {};
  const candidates: Array<unknown> = [
    source.janma_pakshi,
    (raw as any)?.janma_pakshi,
    (raw as any)?.pakshi?.janma_pakshi,
    (raw as any)?.public?.pakshi,
    (raw as any)?.summary?.pakshi,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
    if (
      candidate &&
      typeof candidate === 'object' &&
      'janma_pakshi' in (candidate as Record<string, unknown>)
    ) {
      const nested = (candidate as Record<string, unknown>).janma_pakshi;
      if (typeof nested === 'string' && nested.trim()) {
        return nested.trim();
      }
    }
  }
  return null;
}

function videoForPakshi(name?: string | null): string | null {
  if (!name) return null;
  const n = name.toLowerCase().replace(/[^a-z]/g, '');
  if (['mayura', 'mayur', 'peacock', 'mayurapeacock'].includes(n)) return '/videos/pakshi/peacock.mp4';
  if (['uluka', 'owl'].includes(n)) return '/videos/pakshi/owl.mp4';
  if (['kaka', 'kaaka', 'crow'].includes(n)) return '/videos/pakshi/crow.mp4';
  if (['kukkuta', 'cock', 'rooster', 'hen'].includes(n)) return '/videos/pakshi/rooster.mp4';
  if (['griddha', 'gridha', 'giddha', 'vulture', 'garuda'].includes(n)) return '/videos/pakshi/vulture.mp4';
  return null;
}

function pickTodaySlots(source: PakshiApiResponse | null): PakshiSlot[] {
  if (!source) return [];
  const qualityMap: Record<string, string> = {
    good: 'Very Good',
    neutral: 'Average',
    avoid: 'Avoid',
  };

  const mapSlot = (entry: PakshiApiSlot): PakshiSlot => {
    let durationMins: number | undefined = entry.duration_mins;
    if (typeof durationMins !== 'number' && entry.start && entry.end) {
      const startDate = new Date(entry.start);
      const endDate = new Date(entry.end);
      if (!Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime())) {
        durationMins = (endDate.getTime() - startDate.getTime()) / 60000;
      }
    }

    let quality = entry.quality ?? entry.verdict;
    if (typeof quality === 'string') {
      quality = qualityMap[quality.toLowerCase()] || quality;
    }

    return {
      start: entry.start,
      end: entry.end,
      start_pretty: entry.start_pretty,
      end_pretty: entry.end_pretty,
      duration_text: entry.duration_text,
      duration_mins: durationMins,
      state: entry.state ?? entry.activity,
      quality,
      relation:
        entry.relation ??
        entry.relationship ??
        entry.activity_detail?.relation ??
        undefined,
    };
  };

  const candidateSets: unknown[] = [];
  if (Array.isArray(source.activity_chart)) {
    candidateSets.push(source.activity_chart);
  }
  const raw = source.raw as Record<string, unknown> | null | undefined;
  if (raw) {
    const rawChart = raw.activity_chart as unknown;
    if (Array.isArray(rawChart)) {
      candidateSets.push(rawChart);
    }
    const today = raw.today as Record<string, unknown> | null | undefined;
    if (today && Array.isArray(today.slots)) {
      candidateSets.push(today.slots);
    }
    const legacy = raw.pakshi_engine as Record<string, unknown> | null | undefined;
    if (legacy && Array.isArray((legacy as any).today?.slots)) {
      candidateSets.push((legacy as any).today.slots);
    }
  }

  for (const candidate of candidateSets) {
    if (Array.isArray(candidate) && candidate.length > 0) {
      const mapped = candidate.map((item) => mapSlot(item as PakshiApiSlot));
      const hasRequired = mapped.every(
        (slot) => (slot.start || slot.start_pretty) && (slot.end || slot.end_pretty) && slot.state,
      );
      if (hasRequired) return mapped;
    }
  }

  return [];
}

export default function PakshiPage() {
  const router = useRouter();
  const { profile, loading: profileLoading } = useActiveProfile();
  const { token, sessionRestored, logout, refreshToken } = useAuth();
  const loadingAuth = !sessionRestored;
  const { t, i18n } = useTranslation();
  const profileId = profile?.id ? Number(profile.id) : null;

  const [pakshiData, setPakshiData] = useState<PakshiApiResponse | null>(null);
  const [pakshiError, setPakshiError] = useState<string | null>(null);
  const [pakshiLoading, setPakshiLoading] = useState<boolean>(false);
  const [videoError, setVideoError] = useState(false);

  const fetchPakshi = useCallback(
    async (force = false) => {
      if (!profileId || !sessionRestored) return;
      setPakshiLoading(true);
      try {
        let authToken = token;
        if ((!authToken || force) && refreshToken) {
          authToken = await refreshToken(true);
        }
        if (!authToken) {
          await handleUnauthorized(router, { logout, refreshToken });
          setPakshiData(null);
          setPakshiError(t('pakshi.unauthorized'));
          return;
        }

        const params = new URLSearchParams();
        params.set('profile_id', String(profileId));
        params.set('date', new Date().toISOString().slice(0, 10));
        params.set('locale', i18n.language || 'en');
        const url = `${API_BASE}/api/pakshi/current?${params.toString()}`;
        const requestInit: RequestInit = {
          credentials: 'include',
          headers: { Authorization: `Bearer ${authToken}` },
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
            setPakshiData(null);
            setPakshiError(t('pakshi.unauthorized'));
            return;
          }
          response = retryResponse;
        }

        if (response.status === 404) {
          setPakshiData(null);
          setPakshiError(t('pakshi.error404'));
          return;
        }

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const payload = (await response.json()) as PakshiApiResponse;
        setPakshiData(payload);
        setPakshiError(null);
      } catch (err) {
        console.error('[Pakshi] fetch failed', err);
        setPakshiData(null);
        setPakshiError(t('pakshi.failed'));
      } finally {
        setPakshiLoading(false);
      }
    },
    [profileId, sessionRestored, token, refreshToken, logout, router, t, i18n.language],
  );

  useEffect(() => {
    if (!sessionRestored || profileLoading) return;
    if (!profileId) return;
    void fetchPakshi();
  }, [sessionRestored, profileLoading, profileId, fetchPakshi]);

  const janmaPakshi = useMemo(() => normalizeJanmaPakshi(pakshiData), [pakshiData]);
  const videoSrc = useMemo(() => videoForPakshi(janmaPakshi), [janmaPakshi]);
  const slots = useMemo(() => pickTodaySlots(pakshiData), [pakshiData]);

  const tz = useMemo(() => {
    return (
      pakshiData?.tz_str ||
      profile?.current_location?.tz_str ||
      profile?.tz_str ||
      undefined
    );
  }, [pakshiData?.tz_str, profile?.current_location?.tz_str, profile?.tz_str]);

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const referenceDate = useMemo(
    () => (pakshiData?.chart_date ? new Date(pakshiData.chart_date) : new Date()),
    [pakshiData?.chart_date],
  );

  const processedSlots = useMemo(() => {
    return slots
      .map((s) => {
        const startMins = parseTimeToMinutes(s.start || s.start_pretty, tz);
        const endRaw = parseTimeToMinutes(s.end || s.end_pretty, tz);
        if (startMins === null || endRaw === null) return null;
        const endMins = endRaw < startMins ? endRaw + 24 * 60 : endRaw;
        return { ...s, startMins, endMins };
      })
      .filter(Boolean) as (PakshiSlot & { startMins: number; endMins: number })[];
  }, [slots, tz]);

  const nowMins = useMemo(() => {
    const ref = new Date(referenceDate);
    ref.setHours(now.getHours(), now.getMinutes(), 0, 0);
    return ref.getHours() * 60 + ref.getMinutes();
  }, [now, referenceDate]);
  const nowSecs = nowMins * 60 + now.getSeconds();

  const currentSlot = useMemo(
    () => processedSlots.find((s) => s.startMins <= nowMins && nowMins < s.endMins) || null,
    [processedSlots, nowMins],
  );

  const nextSlot = useMemo(() => {
    if (currentSlot) return null;
    return processedSlots.find((s) => s.startMins > nowMins) || null;
  }, [processedSlots, currentSlot, nowMins]);

  const countdownSecs = currentSlot
    ? currentSlot.endMins * 60 - nowSecs
    : nextSlot
    ? nextSlot.startMins * 60 - nowSecs
    : null;

  const location = useMemo(() => {
    const cur = profile?.current_location;
    if (
      cur &&
      typeof cur.lat === 'number' &&
      !Number.isNaN(cur.lat) &&
      typeof cur.lon === 'number' &&
      !Number.isNaN(cur.lon)
    ) {
      const coords = `${cur.lat.toFixed(4)}, ${cur.lon.toFixed(4)}`;
      return cur.tz_str ? `${coords} (${cur.tz_str})` : coords;
    }
    if (!profile) return null;
    const parts = [profile.city, profile.state, profile.country].filter(Boolean);
    return parts.length ? parts.join(', ') : null;
  }, [profile]);

  const rulers = useMemo(() => {
    if (!pakshiData) return null;
    const parts: string[] = [];
    if (pakshiData.daily_paksha) parts.push(`Paksha: ${pakshiData.daily_paksha}`);
    if (pakshiData.day_ruling_pakshi) parts.push(`Day Ruler: ${pakshiData.day_ruling_pakshi}`);
    if (pakshiData.night_ruling_pakshi) parts.push(`Night Ruler: ${pakshiData.night_ruling_pakshi}`);
    return parts.length ? parts.join(' • ') : null;
  }, [pakshiData]);

  if (loadingAuth || profileLoading || (pakshiLoading && !pakshiData)) {
    return <div className="flex justify-center items-center h-screen text-blue-400">{t('common.loading')}</div>;
  }

  if (pakshiError && !pakshiData) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="bg-red-900 text-red-200 p-4 rounded">{pakshiError}</div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-lg mx-auto p-3 text-white">
      <Card className="breathing-border space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-accent">🪶 Pakshi</h2>
            <button
              type="button"
              className="rounded border border-accent px-3 py-1 text-xs font-semibold text-accent transition hover:bg-accent/10"
              onClick={() => {
                void fetchPakshi(true);
              }}
              disabled={pakshiLoading}
            >
              {pakshiLoading ? t('pakshi.refreshing') : t('pakshi.refresh')}
            </button>
          </div>
          {janmaPakshi ? (
            <div className="opacity-80 text-sm">
              Janma Pakshi: <span className="font-semibold">{janmaPakshi}</span>
            </div>
          ) : null}
        </div>

        {pakshiData?.message ? (
          <p className="text-center text-sm text-accent/80">{pakshiData.message}</p>
        ) : null}
        {pakshiData?.segment_message ? (
          <p className="text-center text-xs text-accent/80">{pakshiData.segment_message}</p>
        ) : null}
        {rulers ? (
          <p className="text-center text-xs opacity-70">{rulers}</p>
        ) : null}

        {videoSrc ? (
          <div className="flex justify-center">
            {videoError ? (
              <div className="rounded-2xl shadow-lg w-64 h-64 flex items-center justify-center bg-black/30 text-sm text-center">
                {t('pakshi.videoUnavailable', { defaultValue: 'Pakshi animation unavailable.' })}
              </div>
            ) : (
              <SecureAutoPlayVideo
                sources={[{ src: videoSrc, type: 'video/mp4' }]}
                className="rounded-2xl shadow-lg w-64 h-64 object-cover"
                onError={() => setVideoError(true)}
                description="Pakshi animation"
              />
            )}
          </div>
        ) : null}

        {location && <div className="text-center text-xs opacity-70">{location}</div>}

        {processedSlots.length > 0 && (currentSlot || nextSlot) ? (
          <div className="text-center space-y-1 bg-black/20 p-4 rounded">
            <h3 className="text-xl font-semibold">Current Pakshi Activity</h3>
            <div className="font-bold">
              {(currentSlot ?? nextSlot)?.state ?? '—'} – {(currentSlot ?? nextSlot)?.quality ?? '—'}
            </div>
            <div>{toTimeRange(currentSlot ?? nextSlot, tz)}</div>
            {countdownSecs !== null ? (
              <div>{currentSlot ? 'Ends in' : 'Starts in'} {formatHMS(countdownSecs)} ⏳</div>
            ) : null}
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="min-w-full border border-accent text-sm">
            <thead>
              <tr>
                <th className="border border-accent px-3 py-2 text-left">Time</th>
                <th className="border border-accent px-3 py-2 text-left">Duration</th>
                <th className="border border-accent px-3 py-2 text-left">State</th>
                <th className="border border-accent px-3 py-2 text-left">Quality</th>
                <th className="border border-accent px-3 py-2 text-left">Relation</th>
              </tr>
            </thead>
            <tbody>
              {slots.length > 0
                ? slots.map((s, i) => (
                    <tr key={i}>
                      <td className="border border-accent px-3 py-2">{toTimeRange(s, tz)}</td>
                      <td className="border border-accent px-3 py-2">{durationText(s)}</td>
                      <td className="border border-accent px-3 py-2 font-semibold">{s.state ?? '—'}</td>
                      <td className="border border-accent px-3 py-2">{s.quality ?? '—'}</td>
                      <td className="border border-accent px-3 py-2">{s.relation ?? '—'}</td>
                    </tr>
                  ))
                : (
                    <tr>
                      <td className="border border-accent px-3 py-6 text-center" colSpan={5}>
                        No pakshi slots available for today.
                      </td>
                    </tr>
                  )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
