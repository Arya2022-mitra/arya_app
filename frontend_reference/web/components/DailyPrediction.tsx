import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { PluggableList } from 'unified';
import type { DailyAlertData, PakshiMonth } from '@/types/DailyAlertData';
import { formatTimeRange, formatTimeString } from '@/lib/timeFormat';
import { makeProtectionPublicReader } from '@/utils/protection';

const markdownPlugins: PluggableList = [remarkGfm as any];

function formatPakshi(pakshi: any): string {
  if (!pakshi) return '';
  if (typeof pakshi === 'string') return pakshi;
  if (typeof pakshi === 'object') {
    if (typeof pakshi.text === 'string') return pakshi.text;
    if (typeof pakshi.pakshi === 'string') return pakshi.pakshi;
  }
  return '';
}


interface Prediction extends Omit<DailyAlertData, 'pakshi'> {
  pakshi?:
    | string
    | {
        text?: string;
        pakshi?: string;
        mood?: string;
        activity?: string;
      };
  lagna?: string;
  energy_disturbance?: {
    disturbance_score?: number;
    reasons?: string[];
    [key: string]: any;
  };
}

interface Props {
  prediction: Prediction | null;
}

export default function DailyPrediction({ prediction: rawPrediction }: Props) {
  const SHOW_PAKSHI_MUHURTA = false;
  const prediction = (rawPrediction as any)?.data ?? rawPrediction ?? null;
  const protection =
    (prediction as any)?.protection ?? (prediction as any)?.protection_engine ?? null;
  const {
    numerology,
    gochar_calculator,
    hora_calculator,
    kundali_strength_calculator,
    master_calculator,
    mind_personality_calculator,
    negative_affliction_calculator,
    score_calculator,
    time_karma_calculator,
    yoga_calculator,
    yoga,
    yoga_dasha,
    yoga_gochar,
    yoga_master,
    yoga_navamsa,
  } = prediction || {};
  const [showAllWindows, setShowAllWindows] = useState<boolean>(false);
  const [pakshiMonthSrc, setPakshiMonthSrc] = useState<PakshiMonth | null>(null);
  const [pakshiMonthView, setPakshiMonthView] = useState<{
    date: string;
    start?: string;
    end?: string;
  }[]>([]);

  const domain = prediction?.domain_predictions ?? {};

  const bm = prediction?.black_magic?.data ?? prediction?.black_magic;
  const bmVerdict = (bm as any)?.decision?.verdict ?? (bm as any)?.verdict;
  let bmScoreRaw =
    typeof (bm as any)?.decision?.score === 'number'
      ? (bm as any).decision.score
      : typeof (bm as any)?.risk_score === 'number'
      ? (bm as any).risk_score
      : typeof (bm as any)?.tamasic_vulnerability_score === 'number'
      ? (bm as any).tamasic_vulnerability_score
      : typeof (bm as any)?.vulnerability_score === 'number'
      ? (bm as any).vulnerability_score
      : undefined;
  let bmScore: number | undefined = bmScoreRaw;
  if (typeof bmScore === 'number') {
    bmScore = bmScore <= 1 ? bmScore * 10 : bmScore;
    bmScore = Math.min(10, Math.max(0, Math.round(bmScore)));
  }
  const bmProofChain: (string | Record<string, any>)[] = Array.isArray(
    (bm as any)?.proof_chain,
  )
    ? ((bm as any).proof_chain as (string | Record<string, any>)[])
    : [];
  const bmTriad = (bm as any)?.triad || {};
  const bmBadhakesh = bmTriad.badhakesh6;
  const bmAl = bmTriad.al_confirmed ?? bmTriad.al;
  const bmD30 = bmTriad.d30_confirmed;
  const getBmTriadIcon = (val: any) =>
    val === true ? '✅' : val === false ? '❌' : '—';

  const rawPakshi = prediction?.pakshi;
  const safePakshiText = formatPakshi(
    rawPakshi && typeof rawPakshi === "object" && "pakshi" in rawPakshi
      ? rawPakshi.pakshi
      : rawPakshi
  );
  const prot =
    (protection?.data && (protection.data as any)?.data)
      ? (protection.data as any).data
      : ((protection?.data ?? protection) || {});
  const readPublicField = makeProtectionPublicReader(prot);

  const protectionLevel = readPublicField('protection_level');
  const ishtaDevata = readPublicField('ishta');
  const dharmaDevata = readPublicField('dharma');
  const foundationDisplay = readPublicField('foundation');
  const mahavidyaDeity = readPublicField('mv_deity');

  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const monthlyTithis =
    (prediction?.moon_cycle_data?.tithi_summary_monthly as any)?.[year]?.[month] ?? [];
  const specialTithis = Array.isArray(monthlyTithis)
    ? monthlyTithis
        .filter((entry: any) =>
          ['Pournami', 'Amavasya', 'Ekadashi'].includes(entry.tithi)
        )
        .sort((a: any, b: any) =>
          (a.start_date || '').localeCompare(b.start_date || '')
        )
    : [];
  const emojiMap: Record<string, string> = {
    Pournami: '🌕',
    Amavasya: '🌑',
    Ekadashi: '🪔',
  };

  useEffect(() => {
    if (!prediction || pakshiMonthSrc) return;
    const pakshiRaw = (prediction as any)?.pakshi_muhurta_month;
    if (Array.isArray(pakshiRaw)) {
      const refDate = pakshiRaw[0]?.date
        ? new Date(pakshiRaw[0].date)
        : prediction.date
        ? new Date(prediction.date)
        : new Date();
      setPakshiMonthSrc({
        month: refDate.getMonth() + 1,
        year: refDate.getFullYear(),
        pakshi_muhurta: pakshiRaw,
      });
    } else if (pakshiRaw && Array.isArray(pakshiRaw.pakshi_muhurta)) {
      setPakshiMonthSrc(pakshiRaw as PakshiMonth);
    }
  }, [prediction, pakshiMonthSrc]);

  useEffect(() => {
    if (!pakshiMonthSrc) {
      setPakshiMonthView([]);
      return;
    }
    const friendTara = new Set([2, 4, 6, 8, 9]);
    const rows: { date: string; start?: string; end?: string }[] = [];
    pakshiMonthSrc.pakshi_muhurta.forEach((day) => {
      let tara = day.filters?.tara_no;
      if (tara == null) tara = day.star?.tara_no;
      const isChandra =
        day.filters?.is_chandrashtama ??
        day.chandrashtama?.is_chandrashtama ?? false;
      if (isChandra) return;
      if (tara == null) {
        console.warn('Pakshi month: missing tara_no for', day.date);
      } else if (!friendTara.has(tara)) {
        return;
      }
      const windows = showAllWindows
        ? day.pakshi_windows_all ?? day.pakshi_windows_best ?? day.segments
        : day.pakshi_windows_best ?? day.pakshi_windows_all ?? day.segments;
      if (!windows || windows.length === 0) return;
      windows.forEach((seg) => {
        rows.push({
          date: day.date || seg.start?.split('T')[0] || '',
          start: seg.start,
          end: seg.end,
        });
      });
    });
    rows.sort((a, b) => {
      if ((a.date || '') === (b.date || '')) {
        return (a.start || '').localeCompare(b.start || '');
      }
      return (a.date || '').localeCompare(b.date || '');
    });
    setPakshiMonthView(rows);
  }, [pakshiMonthSrc, showAllWindows]);

  if (!prediction) {
    return (
      <div className="w-full md:max-w-[90%] lg:max-w-[80%] px-4 mx-auto sm:px-6 lg:px-8">
        <p className="text-lg font-semibold text-center text-white">Welcome to MitraVeda</p>
      </div>
    );
  }

  return (
    <div className="w-full md:max-w-[90%] lg:max-w-[80%] px-4 mx-auto sm:px-6 lg:px-8">
      <div className="text-sm space-y-2 text-white break-words">
          <h2 className="text-2xl font-bold text-center text-accent">🌞 Today’s Divine Forecast</h2>
        <p className="text-center text-sm text-gray-700 italic">
          Date:{' '}
          {prediction.date
            ? new Date(prediction.date).toLocaleDateString('en-IN', {
                weekday: 'long',
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })
            : 'Unknown Date'}
        </p>
        <div className="flex flex-wrap gap-2 justify-center items-center mt-2">
          {specialTithis.map((entry: any, idx: number) => (
            <div
              key={idx}
              className="px-3 py-1 rounded text-white text-xs shadow"
            >
              {emojiMap[entry.tithi]} {entry.tithi} {entry.start_date}{' '}
              {entry.start_time} - {entry.end_date} {entry.end_time}
            </div>
          ))}
        </div>
        <ul>
          {prediction.moon_cycle_data?.is_ekadashi && <li>Ekadashi</li>}
          {prediction.moon_cycle_data?.is_ashtami && <li>Ashtami</li>}
          {prediction.moon_cycle_data?.is_navami && <li>Navami</li>}
          {prediction.moon_cycle_data?.is_pournami && (
            <li>Pournami (Full Moon)</li>
          )}
          {prediction.moon_cycle_data?.is_amavasya && (
            <li>Amavasya (New Moon)</li>
          )}
        </ul>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
          <p>
            <strong>🌙 Transit Moon Sign:</strong>{' '}
            {prediction.moon_cycle_data?.moon_sign || 'Unknown'}
          </p>
          {prediction.panchang?.moon_sign && (
            <p>
              <strong>🌙 Birth Moon Sign:</strong> {prediction.panchang.moon_sign}
            </p>
          )}
          <p>
            <strong>♈ Lagna:</strong>{' '}
            {prediction.panchang?.lagna || prediction.lagna || 'Unknown'}
          </p>
          <p>
            <strong>✨ Birth Star:</strong>{' '}
            {prediction.panchang?.nakshatra ||
              prediction.panchang?.nakshatra_name ||
              prediction.nakshatra ||
              'Unknown'}
          </p>
          <p>
            <strong>🔮 Dasha:</strong>{' '}
            {prediction.dasha_summary?.current?.mahadasha || '—'} –{' '}
            {prediction.dasha_summary?.current?.antardasha || '—'}
          </p>
          <p>
            <strong>🌅 Sunrise:</strong>{' '}
            {prediction.panchang?.sunrise ||
              prediction.panchang?.sunrise_time ||
              prediction.sunrise_time ||
              'Unknown'}
          </p>
          <p>
            <strong>⚠️ Mandi Time:</strong> {prediction.mandi_time || 'Unknown'}
          </p>
          <p>
            <strong>⚠️ Gulika Time:</strong> {formatTimeRange(prediction.gulika_time, 'Unknown')}
          </p>
          <p>
            <strong>🎯 Lucky Number:</strong> {prediction.lucky_number || '—'}
          </p>
          <p>
            <strong>⏰ Lucky Hora:</strong> {formatTimeRange(prediction.good_time)}
          </p>
          <div className="sm:col-span-2 rounded shadow p-2">
            <p className="font-semibold text-accent dark:text-neon-cyan mb-1">🛡️ Spiritual Protection</p>
            <div>
              <p>
                <strong>Protection Level:</strong> {protectionLevel}
              </p>
              <p>
                <strong>Ishta Devata:</strong> {ishtaDevata}
              </p>
              <p>
                <strong>Dharma Devata:</strong> {dharmaDevata}
              </p>
              <p>
                <strong>Foundation Display:</strong> {foundationDisplay}
              </p>
              <p>
              </p>
              <p>
                <strong>Mahavidya Deity:</strong> {mahavidyaDeity}
              </p>
            </div>
          </div>
          <div className="sm:col-span-2 rounded shadow p-2">
            <p className="font-semibold text-accent dark:text-neon-cyan mb-1">🐦 Pakshi Insight</p>
            {prediction.pakshi ? (
              <ReactMarkdown remarkPlugins={markdownPlugins}>
                {safePakshiText || '—'}
              </ReactMarkdown>
            ) : (
              '—'
            )}
          </div>
          <p>
            <strong>🏠 Focus Bhava:</strong> {prediction.focus_bhava || '—'}
          </p>

          {/* === Astrological Calculations Section === */}
          <div className="sm:col-span-2 rounded shadow p-2">
            <p className="font-semibold text-accent dark:text-neon-cyan mb-1">📊 Astrological Calculations</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              <p>
                <strong>Energy Disturbance:</strong>{' '}
                {typeof prediction.energy_disturbance === 'object'
                  ? prediction.energy_disturbance?.disturbance_score ?? '—'
                  : prediction.energy_disturbance ?? '—'}
              </p>
              {Array.isArray(prediction.energy_disturbance?.reasons) && (
                <ul className="list-disc list-inside text-sm sm:col-span-2">
                  {prediction.energy_disturbance?.reasons.map(
                    (reason: string, i: number) => (
                      <li key={i}>{reason}</li>
                    )
                  )}
                </ul>
              )}
              {bm && (
                <>
                  <p className="sm:col-span-2">
                    <strong>Black Magic:</strong>{' '}
                    {bmVerdict ?? '—'}
                    {bm.summary ? ` - ${bm.summary}` : ''}
                  </p>
                  {(bmScore != null || Array.isArray(bm.afflictions)) && (
                    <p className="sm:col-span-2 text-sm">
                      {bmScore != null && <>Score: {bmScore} </>}
                      {Array.isArray(bm.afflictions) && (
                        <>Afflictions: {bm.afflictions.length}</>
                      )}
                    </p>
                  )}
                  {bmProofChain.length > 0 ? (
                    <ul className="list-disc list-inside text-sm sm:col-span-2 mt-1">
                      {bmProofChain.map((p, i) => (
                        <li key={i}>{typeof p === 'string' ? p : (p as any)?.check}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="sm:col-span-2 text-sm mt-1">Proof: None</p>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:col-span-2 mt-1">
                    {[
                      { label: 'Bādhakeśa–6th Link', value: bmBadhakesh },
                      { label: 'Arudha Lagna Confirmation', value: bmAl },
                      { label: 'D-30 Adversity', value: bmD30 },
                    ].map(({ label, value }, i) => (
                      <div
                        key={i}
                        className="rounded border p-1 flex flex-col items-center text-xs"
                      >
                        <span className="mb-1 text-center">{label}</span>
                        <span className="text-lg">{getBmTriadIcon(value)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
              <p>
                <strong>Negative Yoga:</strong> {prediction.negative_yoga ?? '—'}
              </p>
              <p>
                <strong>Positive Yoga:</strong> {prediction.positive_yoga ?? '—'}
              </p>
              <p>
                <strong>Karma:</strong> {prediction.karma ?? '—'}
              </p>
              <p>
                <strong>Over All:</strong>{' '}
                {prediction.over_all ?? prediction.over_all_score ?? '—'}
              </p>
            </div>
          </div>

          {/* === Timing & Luck Section === */}
          <div className="sm:col-span-2 rounded shadow p-2">
            <p className="font-semibold text-accent dark:text-neon-cyan mb-1">⏰ Timing &amp; Luck</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              <p>
                <strong>Pakshi:</strong> {safePakshiText || '—'}
              </p>
              <p>
                <strong>Good Time:</strong> {formatTimeRange(prediction.good_time)}
              </p>
              {prediction.gulika_good_time && (
                <p>
                  <strong>Gulika Good Time:</strong>{' '}
                  {formatTimeRange(prediction.gulika_good_time)}
                </p>
              )}
              <p>
                <strong>Bad Time:</strong> {formatTimeRange(prediction.bad_time)}
              </p>
              <p>
                <strong>Gulika Time:</strong> {formatTimeRange(prediction.gulika_time)}
              </p>
              <p>
                <strong>Lucky Number:</strong> {prediction.lucky_number || '—'}
              </p>
              {prediction.lucky_colour && (
                <p>
                  <strong>Lucky Colour:</strong> {prediction.lucky_colour}
                </p>
              )}
              {prediction.good_hora_timing && (
                <p>
                  <strong>Good Hora Timing:</strong> {prediction.good_hora_timing}
                </p>
              )}
              {prediction.bad_hora_timing && (
                <p>
                  <strong>Bad Hora Timing:</strong> {prediction.bad_hora_timing}
                </p>
              )}
            </div>
          </div>

          {/* === Numerology Section === */}
          {numerology && (
            <div className="sm:col-span-2 rounded shadow p-2">
              <p className="font-semibold text-accent dark:text-neon-cyan mb-1">🔢 Numerology</p>
              <ul className="list-disc list-inside text-sm">
                {Object.entries(numerology).map(([key, value]) => {
                  const num = (value as any)?.number ?? (value as any)?.value ?? value;
                  const explanation =
                    (value as any)?.explanation ??
                    (value as any)?.meaning ??
                    (value as any)?.description ??
                    '';
                  return (
                    <li key={key}>
                      <strong>{key}:</strong>{' '}
                      {typeof num === 'object'
                        ? Array.isArray(num)
                          ? num.length > 0
                            ? num.join(', ')
                            : '—'
                          : Object.keys(num).length > 0
                            ? JSON.stringify(num)
                            : '—'
                        : String(num)}
                      {explanation
                        ? ` - ${
                            typeof explanation === 'object'
                              ? Array.isArray(explanation)
                                ? explanation.join(', ')
                                : Object.keys(explanation).length > 0
                                  ? JSON.stringify(explanation)
                                  : ''
                              : String(explanation)
                          }`
                        : ''}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {SHOW_PAKSHI_MUHURTA && (
            <>
              {/* === Pakshi Muhurta Section === */}
              <div className="sm:col-span-2 rounded shadow p-2">
                <p className="font-semibold text-accent dark:text-neon-cyan mb-1">🐦 Pakshi Muhurta</p>
                <div className="flex items-center mb-2">
                  <input
                    id="show-all-pakshi"
                    type="checkbox"
                    checked={showAllWindows}
                    onChange={(e) => setShowAllWindows(e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="show-all-pakshi" className="text-xs">
                    Show all windows
                  </label>
                </div>
                {pakshiMonthView.length > 0 ? (
                  <table className="w-full border-collapse text-sm table-fixed">
                    <colgroup>
                      <col className="w-1/3" />
                      <col className="w-1/3" />
                      <col className="w-1/3" />
                    </colgroup>
                    <thead>
                      <tr>
                        <th className="text-left">Date</th>
                        <th className="text-left">Start</th>
                        <th className="text-left">End</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pakshiMonthView.map((seg, idx) => {
                        const date = seg.date
                          ? new Date(seg.date).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '';
                        return (
                          <tr key={idx}>
                            <td className="pr-2 align-top">{date}</td>
                            <td className="pr-2 align-top">{formatTimeString(seg.start)}</td>
                            <td className="pr-2 align-top">{formatTimeString(seg.end)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-center">No favorable Pakshi windows this month.</p>
                )}
              </div>
            </>
          )}
          {/* === Calculator Results Section === */}
          <div className="sm:col-span-2 rounded shadow p-2">
            <p className="font-semibold text-accent dark:text-neon-cyan mb-1">🧮 Calculator Results</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {Object.entries({
                gochar: gochar_calculator,
                hora: hora_calculator,
                kundali_strength: kundali_strength_calculator,
                master: master_calculator,
                mind_personality: mind_personality_calculator,
                negative_affliction: negative_affliction_calculator,
                score: score_calculator,
                time_karma: time_karma_calculator,
                yoga: yoga_calculator,
              }).map(([key, value]) => (
                <p key={key}>
                  <strong>{key.replace(/_/g, ' ')}:</strong>{' '}
                  {typeof value === 'object'
                    ? (value as any)?.score ?? (value as any)?.value ?? (value as any)?.result ?? '—'
                    : value ?? '—'}
                </p>
              ))}
            </div>
          </div>

          {/* === Yoga Results Section === */}
          {(yoga || yoga_dasha || yoga_gochar || yoga_master || yoga_navamsa) && (
            <div className="sm:col-span-2 rounded shadow p-2">
              <p className="font-semibold text-accent dark:text-neon-cyan mb-1">🧘 Yoga Results</p>
              {Object.entries({
                yoga,
                yoga_dasha,
                yoga_gochar,
                yoga_master,
                yoga_navamsa,
              }).map(([key, value]) => {
                const list = Array.isArray(value)
                  ? value
                  : value
                  ? [value]
                  : [];
                if (list.length === 0) return null;
                return (
                  <div key={key} className="mb-2">
                    <p className="font-medium capitalize">
                      {key.replace(/_/g, ' ')}
                    </p>
                    <ul className="list-disc list-inside text-sm">
                      {list.map((item: any, idx: number) => (
                        <li key={idx}>
                          {item.name || item.yoga_name || item.type || item.yoga || `Item ${idx + 1}`}
                          {item.type && (item.name || item.yoga_name)
                            ? ` (${item.type})`
                            : ''}
                          {item.description ? ` - ${item.description}` : ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}

          {/* === Today’s Predictions === */}
          <div className="sm:col-span-2 rounded shadow p-2">
            <p className="font-semibold text-accent dark:text-neon-cyan mb-1">📅 Today’s Predictions</p>
            <div className="space-y-1">
              <p>
                <strong>Travels:</strong> {prediction.travels ?? '—'}
              </p>
              <p>
                <strong>Business:</strong> {prediction.business ?? '—'}
              </p>
              <p>
                <strong>Career:</strong> {prediction.career ?? '—'}
              </p>
              <p>
                <strong>Finance:</strong> {prediction.finance ?? '—'}
              </p>
              <p>
                <strong>Legal:</strong> {prediction.legal ?? '—'}
              </p>
              <p>
                <strong>Education:</strong> {prediction.education ?? '—'}
              </p>
              <p>
                <strong>Love:</strong> {prediction.love ?? '—'}
              </p>
              <p>
                <strong>Ghost/Drishti/Negative Energy:</strong>{' '}
                {prediction.ghost ?? prediction.drishti ?? prediction.negative_energy ?? '—'}
              </p>
            </div>
          </div>
          <p>
            <strong>☠️ Chandrashtama Today:</strong> {prediction.chandrashtama_today ? 'Yes' : 'No'}
          </p>
          <p className="sm:col-span-2">
            <strong>📅 Next Chandrashtama Dates:</strong>
          </p>
          <ul className="list-disc list-inside text-sm text-red-300">
            {prediction.chandrashtama_dates &&
            prediction.chandrashtama_dates.length > 0 ? (
              prediction.chandrashtama_dates.map((date: string, i: number) => (
                <li key={i}>{date}</li>
              ))
            ) : (
              <li>None</li>
            )}
          </ul>
          <p>
            <strong>⚠️ Doshas:</strong> {Array.isArray(prediction.dosha_list) ? prediction.dosha_list.join(', ') : 'None'}
          </p>
          <p>
            <strong>🕉️ Remedies:</strong> {Array.isArray(prediction.remedy_list) ? prediction.remedy_list.join(', ') : 'No remedy'}
          </p>
          <p className="text-xl font-bold text-center text-accent mt-6 sm:col-span-2">
            🌼 MitraVeda Advice
          </p>
          <p className="text-sm italic text-center sm:col-span-2">
            {prediction.mitraveda_advice?.title}
          </p>
          <p className="text-base text-center text-white sm:col-span-2">
            {prediction.mitraveda_advice?.message}
          </p>
          <p className="mt-4 text-center text-blue-300 italic sm:col-span-2">
            {prediction.divine_message?.message}
          </p>
          {prediction.alerts && prediction.alerts.length > 0 && (
            <div className="sm:col-span-2">
              <p className="font-semibold">Alerts:</p>
              <ul className="list-disc list-inside text-sm">
                {prediction.alerts.map((alert: string, i: number) => (
                  <li key={i}>{alert}</li>
                ))}
              </ul>
            </div>
          )}
          {Object.keys(domain).map((key) => {
            const info = domain[key] || {};
            const trigger =
              typeof info.trigger === 'object'
                ? info.trigger?.reason || info.trigger?.message
                : info.trigger;
            return (
              <p key={key} className="sm:col-span-2">
                <strong>{key.toUpperCase()}:</strong> {info.status || '—'} {trigger ? `– ${trigger}` : ''}
              </p>
            );
          })}
        </div>
      </div>
    </div>
  );
}
