import { useMemo, useState } from 'react';
import { useActiveProfile } from '@/lib/useActiveProfile';
import { useAuth } from '@/lib/useAuth';
import Card from '@/components/Card';
import { useDailyPrediction } from '@/state/dailyPredictionStore';
import { useTranslation } from 'react-i18next';
import SecureAutoPlayVideo from '@/components/SecureAutoPlayVideo';

const SHOW_DASHA_VIDEO = true;

type DashaItem = {
  lord: string; // e.g., 'Ketu'
  start: string; // ISO or display string
  end: string; // ISO or display string
  antardashas?: {
    lord: string; // e.g., 'Venus'
    start: string;
    end: string;
  }[];
};

function toDisplayDate(s: string | undefined | null) {
  if (!s) return '—';
  if (/\d{2}-[A-Za-z]{3}, \d{4}/.test(s)) return s;
  const d = new Date(s);
  if (isNaN(d.getTime())) return String(s);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function normalizeDasha(src: any): DashaItem[] {
  if (!src) return [];

  if (Array.isArray(src.timeline)) {
    return src.timeline.map((m: any) => ({
      lord: m.lord ?? m.mahadasha ?? '',
      start: m.start ?? m.start_date ?? '',
      end: m.end ?? m.end_date ?? '',
      antardashas: Array.isArray(m.antardashas ?? m.antardasha)
        ? (m.antardashas ?? m.antardasha).map((a: any) => ({
            lord: a.lord ?? a.antardasha ?? '',
            start: a.start ?? a.start_date ?? '',
            end: a.end ?? a.end_date ?? '',
          }))
        : undefined,
    }));
  }

  if (Array.isArray(src)) {
    return src.map((m: any) => ({
      lord: m.lord ?? m.mahadasha ?? '',
      start: m.start ?? m.start_date ?? '',
      end: m.end ?? m.end_date ?? '',
      antardashas: Array.isArray(m.antardashas ?? m.antardasha)
        ? (m.antardashas ?? m.antardasha).map((a: any) => ({
            lord: a.lord ?? a.antardasha ?? '',
            start: a.start ?? a.start_date ?? '',
            end: a.end ?? a.end_date ?? '',
          }))
        : undefined,
    }));
  }

  if (src.mahadasha && Array.isArray(src.mahadasha)) {
    return src.mahadasha.map((m: any) => ({
      lord: m.lord ?? m.mahadasha ?? '',
      start: m.start ?? m.start_date ?? '',
      end: m.end ?? m.end_date ?? '',
      antardashas: Array.isArray(m.antardashas ?? m.antardasha)
        ? (m.antardashas ?? m.antardasha).map((a: any) => ({
            lord: a.lord ?? a.antardasha ?? '',
            start: a.start ?? a.start_date ?? '',
            end: a.end ?? a.end_date ?? '',
          }))
        : undefined,
    }));
  }

  if (Array.isArray(src.mahadashas)) {
    const ad = src.antardashas_by_mahadasha || {};
    return src.mahadashas.map((m: any) => ({
      lord: m.lord ?? m.mahadasha ?? '',
      start: m.start ?? m.start_date ?? '',
      end: m.end ?? m.end_date ?? '',
      antardashas: Array.isArray(ad[m.lord ?? m.mahadasha])
        ? ad[m.lord ?? m.mahadasha].map((a: any) => ({
            lord: a.lord ?? a.antardasha ?? '',
            start: a.start ?? a.start_date ?? '',
            end: a.end ?? a.end_date ?? '',
          }))
        : undefined,
    }));
  }

  return [];
}

function selectTimeline(pred: any): any[] | null {
  if (!pred || typeof pred !== 'object') {
    return null;
  }

  const candidate =
    pred?.dasha_engine?.timeline ??
    pred?.dasha?.timeline ??
    pred?.dasha_engine?.data?.timeline ??
    pred?.dasha?.data?.timeline ??
    pred?.dasha_summary?.timeline ??
    pred?.dasha_summary?.data?.timeline ??
    pred?.data?.dasha_engine?.timeline ??
    pred?.data?.dasha?.timeline ??
    pred?.data?.dasha_summary?.timeline ??
    null;

  return Array.isArray(candidate) ? candidate : null;
}

export default function DashaPage() {
  const { loading } = useActiveProfile();
  const { sessionRestored } = useAuth();
  const loadingAuth = !sessionRestored;
  const { t } = useTranslation();
  const { data: prediction, loading: predictionLoading, error: predictionError } = useDailyPrediction();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [dashaVideoError, setDashaVideoError] = useState(false);

  const timeline = useMemo(() => selectTimeline(prediction), [prediction]);
  const mahadashas = useMemo(() => {
    if (Array.isArray(timeline)) {
      return normalizeDasha({ timeline });
    }
    if (!prediction) {
      return [];
    }
    return normalizeDasha(prediction);
  }, [prediction, timeline]);

  const hasData = useMemo(
    () => Array.isArray(mahadashas) && mahadashas.length > 0,
    [mahadashas],
  );

  const resolvedError = useMemo(() => {
    if (predictionError) {
      return predictionError;
    }
    if (!predictionLoading && prediction && !hasData) {
      return 'Dasha timeline missing in payload';
    }
    if (!predictionLoading && !prediction) {
      return 'No dasha data available.';
    }
    return null;
  }, [hasData, prediction, predictionError, predictionLoading]);

  if (loadingAuth || loading || predictionLoading) {
    return (
      <div className="flex justify-center items-center h-screen text-blue-400">
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div className="max-w-screen-lg mx-auto p-3 text-white">
      <Card className="breathing-border space-y-2">
        {SHOW_DASHA_VIDEO && (
          <div className="space-y-2">
            <div className="flex justify-center">
              {dashaVideoError ? (
                <div className="rounded-2xl shadow-lg w-64 h-64 flex items-center justify-center bg-black/30 text-sm text-center">
                  {t('common.unavailable', { defaultValue: 'Dasha guide video unavailable.' })}
                </div>
              ) : (
                <SecureAutoPlayVideo
                  sources={[{ src: '/videos/Vimshottari_Dasha.mp4', type: 'video/mp4' }]}
                  className="rounded-2xl shadow-lg w-64 h-64 object-cover"
                  onError={() => setDashaVideoError(true)}
                  description="Vimshottari Dasha explainer"
                />
              )}
            </div>
            <div className="text-center text-sm opacity-75">
              Vimshottari Dasha Guide
            </div>
          </div>
        )}
        <h2 className="text-2xl font-bold text-accent">📜 Mahadasha</h2>
        {!hasData ? (
          <p className="text-center">{resolvedError ?? t('dasha.noData')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-accent text-sm">
              <thead>
                <tr>
                  <th className="border border-accent px-3 py-2 text-left">Mahadasha</th>
                  <th className="border border-accent px-3 py-2 text-left">Start</th>
                  <th className="border border-accent px-3 py-2 text-left">End</th>
                </tr>
              </thead>
              <tbody>
                {mahadashas.map((m, idx) => (
                  <tr key={idx}>
                    <td className="border border-accent px-3 py-2 font-semibold">{m.lord || '—'}</td>
                    <td className="border border-accent px-3 py-2">{toDisplayDate(m.start)}</td>
                    <td className="border border-accent px-3 py-2">{toDisplayDate(m.end)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {hasData && (
        <div className="mt-4 space-y-2">
          {mahadashas.map((m, idx) => {
            const open = openIndex === idx;
            return (
              <Card key={idx} className="breathing-border">
                <button
                  onClick={() => setOpenIndex(open ? null : idx)}
                  className="w-full flex items-center justify-between px-3 py-2 text-left"
                >
                  <span className="font-semibold">
                    Antardashas in {m.lord || '—'} Mahadasha
                  </span>
                  <span className="text-accent">{open ? '▾' : '▸'}</span>
                </button>
                {open && (
                  <div className="px-3 pb-3">
                    {Array.isArray(m.antardashas) && m.antardashas.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full border border-accent text-sm">
                          <thead>
                            <tr>
                              <th className="border border-accent px-3 py-2 text-left">Mahadasha</th>
                              <th className="border border-accent px-3 py-2 text-left">Antardasha</th>
                              <th className="border border-accent px-3 py-2 text-left">Start</th>
                              <th className="border border-accent px-3 py-2 text-left">End</th>
                            </tr>
                          </thead>
                          <tbody>
                            {m.antardashas.map((a, i) => (
                              <tr key={i}>
                                <td className="border border-accent px-3 py-2">{m.lord || '—'}</td>
                                <td className="border border-accent px-3 py-2 font-semibold">{a.lord || '—'}</td>
                                <td className="border border-accent px-3 py-2">{toDisplayDate(a.start)}</td>
                                <td className="border border-accent px-3 py-2">{toDisplayDate(a.end)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-center text-sm">No antardasha data.</p>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
