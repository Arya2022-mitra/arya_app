import Image from 'next/image';
import Card from '@/components/Card';
import { useActiveProfile } from '@/lib/useActiveProfile';
import ChartTabs from '@/components/ChartTabs';
import sanitizeChart from '@/utils/sanitizeChart';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAstroTranslation } from '@/lib/useAstroTranslation';
import { useTTS } from '@/hooks/useTTS';
import type {
  DailyAlertData,
  TithiEntry,
  MoonCycleDataType,
} from '@/types/DailyAlertData';
import type { Profile } from '@/types/Profile';
import {
  safeRender,
  formatTimeBlock,
  formatTimeRange,
  formatDateTime,
} from '@/lib/timeFormat';

export default function PanchangView({
  prediction: rawPrediction,
}: {
  prediction: DailyAlertData | (DailyAlertData & Partial<Profile>) | null;
}) {
  const { t } = useTranslation();
  const { translateChoghadiya, translateNakshatra, translateTithi } = useAstroTranslation();
  const { speak: speakTTS, stop: stopTTS, status: ttsStatus, supported: ttsSupported } = useTTS();
  const prediction = (rawPrediction as any)?.data ?? rawPrediction ?? null;

  const data: DailyAlertData = prediction ?? ({} as DailyAlertData);
  const moon: MoonCycleDataType = useMemo(
    () => prediction?.moon_cycle_data || {},
    [prediction?.moon_cycle_data],
  );
  const { profile } = useActiveProfile();
  const profileId = profile?.id ?? null;
  const profileName = profile?.name ?? null;
  const now = new Date();
  const [showGoodTimes, setShowGoodTimes] = useState(true);
  const [showBadTimes, setShowBadTimes] = useState(true);
  const [showChoghadiyaDay, setShowChoghadiyaDay] = useState(false);
  const [showChoghadiyaNight, setShowChoghadiyaNight] = useState(false);
  const [showRashi, setShowRashi] = useState(false);
  const [showNavamsa, setShowNavamsa] = useState(false);
  const [narrationStatus, setNarrationStatus] = useState<'idle' | 'loading' | 'playing' | 'error'>('idle');

  const currentYear = String(now.getFullYear());
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
  const monthName = now.toLocaleString('default', { month: 'long' });
  const year = now.getFullYear();


  const rawSummary = prediction?.moon_cycle_data?.tithi_summary;
  // Clone so rendering logic can't accidentally mutate the original
  const summaryData =
    rawSummary && typeof rawSummary === 'object'
      ? JSON.parse(JSON.stringify(rawSummary))
      : rawSummary;
  const hasValidSummary =
    summaryData && typeof summaryData === 'object' && !Array.isArray(summaryData);
  const isSummaryByMonth =
    hasValidSummary &&
    Object.keys(summaryData as Record<string, unknown>).some((k) => /^(\d{4})$/.test(k));
  const tithiSummary = isSummaryByMonth
    ? (summaryData as Record<string, Record<string, any[]>>)
    : undefined;

  const todayStr = now.toISOString().split('T')[0];

  const tithiSummaryMonthly = moon.tithi_summary_monthly as
    | Record<string, Record<string, TithiEntry[]>>
    | undefined;

  const monthlySummary =
    Array.isArray(tithiSummaryMonthly?.[currentYear]?.[currentMonth])
      ? tithiSummaryMonthly[currentYear][currentMonth]
      : [];
  monthlySummary.sort((a, b) => {
    const aDate = a.start_date ?? '';
    const bDate = b.start_date ?? '';
    return aDate.localeCompare(bDate);
  });

  const specialLabels: string[] = [];
  if (moon.is_ekadashi) specialLabels.push('Ekadashi');
  if (moon.is_ashtami) specialLabels.push('Ashtami');
  if (moon.is_navami) specialLabels.push('Navami');
  if (moon.is_pournami) specialLabels.push('Pournami (Full Moon)');
  if (moon.is_amavasya) specialLabels.push('Amavasya (New Moon)');

  let todaySpecialEntry: TithiEntry | undefined;
  if (monthlySummary.length > 0) {
    const todayDate = new Date(todayStr);
    for (const entry of monthlySummary) {
      const start = new Date(entry.start_date ?? '');
      const end = new Date(entry.end_date ?? entry.start_date ?? '');
      if (todayDate >= start && todayDate <= end) {
        todaySpecialEntry = entry;
        break;
      }
    }
  }




  const sunriseTime = prediction?.sunrise_time ?? '';
  const sunsetTime = prediction?.sunset_time ?? '';
  const tithiName =
    todaySpecialEntry?.tithi || (typeof moon.tithi === 'string' ? moon.tithi : '');
  const nakshatraName = typeof moon.nakshatra === 'string' ? moon.nakshatra : '';
  const yogaName = typeof moon.yoga === 'string' ? moon.yoga : '';
  const labelKey = specialLabels.join('|');

  const summaryEnglish = useMemo(() => {
    const labelList = labelKey ? labelKey.split('|').filter(Boolean) : [];
    const segments: string[] = [];
    const profileName = profile?.name ? `for ${profile.name}` : '';
    const heading = `Daily Panchang summary ${profileName}.`.trim();
    if (heading) {
      segments.push(heading);
    }
    if (labelList.length > 0) {
      segments.push(`Special observances: ${labelList.join(', ')}.`);
    }
    if (tithiName) {
      segments.push(`Current tithi is ${tithiName}.`);
    }
    if (nakshatraName) {
      segments.push(`Nakshatra is ${nakshatraName}.`);
    }
    if (yogaName) {
      segments.push(`Yoga is ${yogaName}.`);
    }
    if (sunriseTime) {
      segments.push(`Sunrise at ${sunriseTime}.`);
    }
    if (sunsetTime) {
      segments.push(`Sunset at ${sunsetTime}.`);
    }
    return segments.join(' ');
  }, [profile?.name, labelKey, tithiName, nakshatraName, yogaName, sunriseTime, sunsetTime]);

  useEffect(() => {
    return () => {
      // Cleanup: stop TTS on unmount
      stopTTS();
    };
  }, [stopTTS]);

  useEffect(() => {
    // Update narration status based on TTS status
    if (ttsStatus === 'speaking') {
      setNarrationStatus('playing');
    } else if (ttsStatus === 'error') {
      setNarrationStatus('error');
    } else if (ttsStatus === 'idle') {
      setNarrationStatus('idle');
    } else if (ttsStatus === 'loading') {
      setNarrationStatus('loading');
    }
  }, [ttsStatus]);

  const summaryForPlayback = useMemo(() => {
    if (!summaryEnglish.trim()) {
      return '';
    }
    return summaryEnglish;
  }, [summaryEnglish]);

  const handleReadAloud = useCallback(() => {
    if (!summaryForPlayback.trim() || !ttsSupported) {
      return;
    }

    setNarrationStatus('loading');

    try {
      // Stop any currently playing TTS
      stopTTS();
      
      // Speak using browser TTS
      speakTTS(summaryForPlayback);
      
      setNarrationStatus('playing');
    } catch (error) {
      console.error('Failed to play Panchang narration:', error);
      setNarrationStatus('error');
    }
  }, [summaryForPlayback, ttsSupported, speakTTS, stopTTS]);

  const handleNarrationClick = useCallback(() => {
    if (narrationStatus === 'playing') {
      stopTTS();
      setNarrationStatus('idle');
      return;
    }
    void handleReadAloud();
  }, [handleReadAloud, narrationStatus, stopTTS]);

  const narrationButtonLabel =
    narrationStatus === 'loading'
      ? 'Preparing audio…'
      : narrationStatus === 'playing'
      ? '⏹ Stop audio'
      : '🔊 Read aloud';

  const summaryDisplay = summaryEnglish;

  if (!prediction || !prediction.moon_cycle_data) {
    return (
      <Card className="breathing-border">
        <p className="text-center">{t('panchang.noPanchangAvailable')}</p>
      </Card>
    );
  }

  if (!moon || Object.keys(moon).length === 0) {
    return (
      <Card className="breathing-border">
        <p className="text-center">{t('panchang.moonCycleUnavailable')}</p>
      </Card>
    );
  }

  const dateStr = data.date
    ? new Date(data.date).toLocaleDateString('en-IN', {
        weekday: 'long',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';

  return (
    <div className="max-w-screen-md mx-auto px-2">
      <Card className="breathing-border space-y-2 text-white">
        <div className="flex flex-col sm:flex-row items-center text-center sm:text-left mb-4">
          <Image
            src="/logo/logo.png"
            alt="MitraVeda Logo"
            width={128}
            height={128}
            className="h-20 sm:h-24 md:h-32 w-auto mx-auto sm:mx-0"
            priority
          />
          <div className="flex w-full flex-col items-center sm:items-start text-center sm:text-left gap-2 px-2">
            <h2 className="text-3xl font-bold text-accent">🕉️ {t('panchang.title')}</h2>
            <span className="flex items-center justify-start gap-1 italic text-xl font-semibold">
              📅 {dateStr}
            </span>
            <div className="flex justify-start gap-4 text-lg font-semibold">
            {prediction?.sunrise_time && (
              <span className="flex items-center justify-start gap-1">
                🌅 {prediction.sunrise_time}
              </span>
            )}
            {prediction?.sunset_time && (
              <span className="flex items-center justify-start gap-1">
                🌇 {prediction.sunset_time}
              </span>
            )}
          </div>
          {todaySpecialEntry?.tithi &&
            todaySpecialEntry?.start_date &&
            todaySpecialEntry?.start_time &&
            todaySpecialEntry?.end_date &&
            todaySpecialEntry?.end_time && (
              <span className="flex items-center justify-start gap-1 font-bold text-lg">
                🌑 {todaySpecialEntry.tithi} 📅 {todaySpecialEntry.start_date}{' '}
                {todaySpecialEntry.start_time} – {todaySpecialEntry.end_date}{' '}
                {todaySpecialEntry.end_time}
              </span>
            )}
        </div>
      </div>

      <div className="w-full text-white text-glow text-md leading-relaxed mb-4">
        🌞 {t('panchang.introText')}
      </div>

      {summaryDisplay && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
          <button
            type="button"
            onClick={handleNarrationClick}
            disabled={narrationStatus === 'loading'}
            className="inline-flex items-center gap-2 rounded-full border border-accent px-4 py-2 text-sm text-accent transition hover:bg-accent/10 disabled:opacity-60"
            aria-busy={narrationStatus === 'loading'}
          >
            {narrationButtonLabel}
          </button>
        </div>
      )}

      {summaryDisplay && (
        <div className="text-sm text-cyan-100/90 mb-6 whitespace-pre-line">
          {summaryDisplay}
        </div>
      )}

      <div className="flex flex-row flex-wrap justify-between gap-6 text-sm items-start w-full">
        {/* Good Times Table */}
        <div className="w-full md:w-1/2">
          <h3
            className="font-semibold text-accent mb-1 cursor-pointer"
            onClick={() => setShowGoodTimes((prev) => !prev)}
          >
            🟢 {t('panchang.auspiciousTimes')}
          </h3>
          {showGoodTimes && (
            <div className="transition-all duration-300 ease-in-out overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full border border-accent text-accent" role="table">
                  <tbody>
                    {moon.abhijit_muhurta && (
                      <tr>
                        <td className="border border-accent px-2 py-1 font-semibold">{t('panchang.abhijitMuhurta')}</td>
                        <td className="border border-accent px-2 py-1">{formatTimeBlock(moon.abhijit_muhurta)}</td>
                      </tr>
                    )}
                    {moon.brahma_muhurta && (
                      <tr>
                        <td className="border border-accent px-2 py-1 font-semibold">{t('panchang.brahmaMuhurta')}</td>
                        <td className="border border-accent px-2 py-1">{formatTimeBlock(moon.brahma_muhurta)}</td>
                      </tr>
                    )}
                    {moon.pratah_sandhya && (
                      <tr>
                        <td className="border border-accent px-2 py-1 font-semibold">{t('panchang.pratahSandhya')}</td>
                        <td className="border border-accent px-2 py-1">{formatTimeBlock(moon.pratah_sandhya)}</td>
                      </tr>
                    )}
                    {moon.godhuli_muhurta && (
                      <tr>
                        <td className="border border-accent px-2 py-1 font-semibold">{t('panchang.godhuliMuhurta')}</td>
                        <td className="border border-accent px-2 py-1">{formatTimeBlock(moon.godhuli_muhurta)}</td>
                      </tr>
                    )}
                    {moon.sayahna_sandhya && (
                      <tr>
                        <td className="border border-accent px-2 py-1 font-semibold">{t('panchang.sayahnaSandhya')}</td>
                        <td className="border border-accent px-2 py-1">{formatTimeBlock(moon.sayahna_sandhya)}</td>
                      </tr>
                    )}
                    {moon.amrit_kalam && (
                      <tr>
                        <td className="border border-accent px-2 py-1 font-semibold">{t('panchang.amritKalam')}</td>
                        <td className="border border-accent px-2 py-1">{formatTimeBlock(moon.amrit_kalam)}</td>
                      </tr>
                    )}
                    <tr>
                      <td className="border border-accent px-2 py-1 font-semibold">{t('panchang.tithi')}</td>
                      <td className="border border-accent px-2 py-1">
                        {(() => {
                          if (todaySpecialEntry?.tithi) {
                            return safeRender(translateTithi(todaySpecialEntry.tithi), '—');
                          }

                          const fallbackTithi =
                            prediction?.moon_cycle_data?.tithi ??
                            moon?.tithi ??
                            '—';
                          return safeRender(typeof fallbackTithi === 'string' ? translateTithi(fallbackTithi) : fallbackTithi, '—');
                        })()}
                      </td>
                    </tr>
                    {moon.tithi_good_bad && (
                      <tr>
                        <td className="border border-accent px-2 py-1 font-semibold">{t('panchang.tithiVerdict')}</td>
                        <td className="border border-accent px-2 py-1">
                          {moon.tithi_good_bad === 'good' ? `✅ ${t('panchang.good')}` : `⚠️ ${t('panchang.bad')}`}
                          {moon.tithi_verdict_reason ? ` – ${moon.tithi_verdict_reason}` : ''}
                        </td>
                      </tr>
                    )}
                    {specialLabels.includes('Ekadashi') && (
                      <tr>
                        <td className="border border-accent px-2 py-1 font-semibold">{t('panchang.ekadashi')}</td>
                        <td className="border border-accent px-2 py-1">Yes</td>
                      </tr>
                    )}
                    {specialLabels.includes('Ashtami') && (
                      <tr>
                        <td className="border border-accent px-2 py-1 font-semibold">{t('panchang.ashtami')}</td>
                        <td className="border border-accent px-2 py-1">Yes</td>
                      </tr>
                    )}
                    {specialLabels.includes('Navami') && (
                      <tr>
                        <td className="border border-accent px-2 py-1 font-semibold">{t('panchang.navami')}</td>
                        <td className="border border-accent px-2 py-1">Yes</td>
                      </tr>
                    )}
                    {specialLabels.includes('Pournami (Full Moon)') && (
                      <tr>
                        <td className="border border-accent px-2 py-1 font-semibold">{t('panchang.pournami')}</td>
                        <td className="border border-accent px-2 py-1">Yes</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Bad Times Table */}
        <div className="w-full md:w-1/2">
          <h3
            className="font-semibold text-accent mb-1 cursor-pointer"
            onClick={() => setShowBadTimes((prev) => !prev)}
          >
            🔴 {t('panchang.inauspiciousTimes')}
          </h3>
          {showBadTimes && (
            <div className="transition-all duration-300 ease-in-out overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full border border-accent text-accent" role="table">
                  <tbody>
                    {moon.rahukaalam && (
                      <tr>
                        <td className="border border-accent px-2 py-1 font-semibold">{t('panchang.rahuKalam')}</td>
                        <td className="border border-accent px-2 py-1">{formatTimeBlock(moon.rahukaalam)}</td>
                      </tr>
                    )}
                    {moon.yamagandam && (
                      <tr>
                        <td className="border border-accent px-2 py-1 font-semibold">{t('panchang.yamaganda')}</td>
                        <td className="border border-accent px-2 py-1">{formatTimeBlock(moon.yamagandam)}</td>
                      </tr>
                    )}
                    {moon.gulika && (
                      <tr>
                        <td className="border border-accent px-2 py-1 font-semibold">{t('panchang.gulikaKalam')}</td>
                        <td className="border border-accent px-2 py-1">{formatTimeBlock(moon.gulika)}</td>
                      </tr>
                    )}
                    {moon.durmuhurta && (
                      <tr>
                        <td className="border border-accent px-2 py-1 font-semibold">{t('panchang.durmuhurtam')}</td>
                        <td className="border border-accent px-2 py-1">{formatTimeBlock(moon.durmuhurta)}</td>
                      </tr>
                    )}
                    {moon.varjyam && (
                      <tr>
                        <td className="border border-accent px-2 py-1 font-semibold">{t('panchang.varjyam')}</td>
                        <td className="border border-accent px-2 py-1">{formatTimeBlock(moon.varjyam)}</td>
                      </tr>
                    )}
                    {moon.aadala_yoga && (
                      <tr>
                        <td className="border border-accent px-2 py-1 font-semibold">{t('panchang.aadalaYoga')}</td>
                        <td className="border border-accent px-2 py-1">{formatTimeBlock(moon.aadala_yoga)}</td>
                      </tr>
                    )}
                    {moon.vidala_yoga && (
                      <tr>
                        <td className="border border-accent px-2 py-1 font-semibold">{t('panchang.vidalaYoga')}</td>
                        <td className="border border-accent px-2 py-1">{formatTimeBlock(moon.vidala_yoga)}</td>
                      </tr>
                    )}
                    {moon.baana && (
                      <tr>
                        <td className="border border-accent px-2 py-1 font-semibold">{t('panchang.baana')}</td>
                        <td className="border border-accent px-2 py-1">{formatTimeBlock(moon.baana)}</td>
                      </tr>
                    )}
                    {moon.bhadra && (
                      <tr>
                        <td className="border border-accent px-2 py-1 font-semibold">{t('panchang.bhadra')}</td>
                        <td className="border border-accent px-2 py-1">{formatTimeBlock(moon.bhadra)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 space-y-2">
        <p>
          {t('panchang.welcomeText')}
        </p>
        <p>🌞 Welcome to MitraVeda – your astrological friend in life’s cosmic journey.</p>
        <p>
          {t('panchang.sunriseText')}
        </p>
      </div>

      {/* Choghadiya Tables */}
      {(() => {
        if (!prediction?.moon_cycle_data) return null;
        const daySlots = Array.isArray(moon.choghadiya?.day)
          ? moon.choghadiya?.day
          : [];
        const nightSlots = Array.isArray(moon.choghadiya?.night)
          ? moon.choghadiya?.night
          : [];
        if (!daySlots.length && !nightSlots.length) return null;
        return (
          <div className="flex flex-col md:flex-row justify-between gap-4 text-sm mt-4">
            {daySlots.length > 0 && (
              <div className="w-full md:w-1/2">
                <h3
                  className="font-semibold text-accent mb-1 text-center md:text-left cursor-pointer"
                  onClick={() => setShowChoghadiyaDay((prev) => !prev)}
                >
                  {t('panchang.choghadiyaDay')}
                </h3>
                {showChoghadiyaDay && (
                  <div className="transition-all duration-300 ease-in-out overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full border border-accent text-accent" role="table">
                        <thead>
                          <tr>
                            <th className="border border-accent px-2 py-1">{t('panchang.name')}</th>
                            <th className="border border-accent px-2 py-1">{t('panchang.startTime')}</th>
                            <th className="border border-accent px-2 py-1">{t('panchang.endTime')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {daySlots.map((slot: any, idx: number) => (
                            <tr key={idx}>
                              <td className="border border-accent px-2 py-1">{safeRender(translateChoghadiya(slot.name))}</td>
                              <td className="border border-accent px-2 py-1">{safeRender(slot.start)}</td>
                              <td className="border border-accent px-2 py-1">{safeRender(slot.end)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
            {nightSlots.length > 0 && (
              <div className="w-full md:w-1/2">
                <h3
                  className="font-semibold text-accent mb-1 text-center md:text-left cursor-pointer"
                  onClick={() => setShowChoghadiyaNight((prev) => !prev)}
                >
                  {t('panchang.choghadiyaNight')}
                </h3>
                {showChoghadiyaNight && (
                  <div className="transition-all duration-300 ease-in-out overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full border border-accent text-accent" role="table">
                        <thead>
                          <tr>
                            <th className="border border-accent px-2 py-1">{t('panchang.name')}</th>
                            <th className="border border-accent px-2 py-1">{t('panchang.startTime')}</th>
                            <th className="border border-accent px-2 py-1">{t('panchang.endTime')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {nightSlots.map((slot: any, idx: number) => (
                            <tr key={idx}>
                              <td className="border border-accent px-2 py-1">{safeRender(translateChoghadiya(slot.name))}</td>
                              <td className="border border-accent px-2 py-1">{safeRender(slot.start)}</td>
                              <td className="border border-accent px-2 py-1">{safeRender(slot.end)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}

      <div className="mt-6 space-y-2">
        <p>
          {t('panchang.wisdomText')}
        </p>
        <p>
          {t('panchang.clarityText')}
        </p>
        <p>
          {t('panchang.trustText')}
        </p>
      </div>

      {/* Daily spiritual message */}
      <div className="mt-6 text-accent">
        <h2
          className="text-lg font-bold text-accent mb-2 cursor-pointer"
          onClick={() => setShowRashi((prev) => !prev)}
        >
          🪔 Rashi Chart
        </h2>
        {showRashi && (
          <ChartTabs houses={sanitizeChart(profile?.rashi_chart ?? {})} />
        )}
      </div>

      <div className="mt-6 text-accent">
        <h2
          className="text-lg font-bold text-accent mb-2 cursor-pointer"
          onClick={() => setShowNavamsa((prev) => !prev)}
        >
          🌸 Navamsa Chart
        </h2>
        {showNavamsa && (
          <ChartTabs houses={sanitizeChart(profile?.navamsa_chart ?? {})} />
        )}
      </div>
      <p className="mt-6 text-center text-md text-white italic leading-relaxed max-w-3xl mx-auto text-glow">
        {t('panchang.footerText')}
      </p>
    </Card>
  </div>
  );
}
