import React from 'react';
import Card from '@/components/Card';
import { formatLordship, ordinal } from '../utils/houseNames';
import { houseInfo } from '../utils/houseInfo';

interface Props {
  data: any;
}

export default function Numerology({ data }: Props) {
  const numerology = data;
  if (!numerology) {
    return (
      <Card className="breathing-border">
        <p className="text-center">No data available.</p>
      </Card>
    );
  }

  const {
    numbers = {},
    planets = {},
    combo_alignment = {},
    raw_debug = {},
    jyotish_context = {},
    flags = {},
    meta = {},
  } = numerology;

  const rawTotals = raw_debug.raw_totals || {};
  const modulationNotes = Array.isArray(raw_debug.modulation_notes)
    ? raw_debug.modulation_notes
    : undefined;
  const transliteratedName = raw_debug.transliterated_name ?? '—';
  const transliterationScheme = raw_debug.transliteration_scheme;
  const debtFlags = flags.karmic_debt_flags || {};
  const noDebts =
    Array.isArray(flags.karmic_debts) &&
    flags.karmic_debts.length === 0 &&
    debtFlags.day_raw_in === false &&
    debtFlags.dob_total_in === false &&
    debtFlags.name_raw_total_in === false;
  const needsTransliteration = !!flags.needs_transliteration;

  return (
    <div className="space-y-4">
      <Card className="breathing-border space-y-2 text-white">
        <h2 className="text-xl font-bold text-center text-accent">
          📘 Name & Calculation Summary
        </h2>
        <div className="space-y-1 text-sm">
          <p>Raw Name → {raw_debug.raw_name ?? '—'}</p>
          <p>Cleaned Name → {raw_debug.cleaned_name ?? '—'}</p>
          <p>Transliterated Name → {transliteratedName}</p>
          <p>Day Total → {rawTotals.day ?? '—'}</p>
          <p>Name Total → {rawTotals.name ?? '—'}</p>
          <p>DOB Total → {rawTotals.dob_total ?? '—'}</p>
          <p>Driver-Map-Vehicle → {raw_debug.driver_map_vehicle ?? '—'}</p>
          <div>
            <span>Modulation Notes → </span>
            {Array.isArray(modulationNotes) ? (
              modulationNotes.length > 0 ? (
                <ul className="list-disc pl-5">
                  {modulationNotes.map((note: any, idx: number) => (
                    <li key={idx}>{note ?? '—'}</li>
                  ))}
                </ul>
              ) : (
                <span>None</span>
              )
            ) : (
              <span>—</span>
            )}
          </div>
          {transliterationScheme && transliterationScheme !== '—' && (
            <p>Transliteration Scheme → {transliterationScheme}</p>
          )}
        </div>
      </Card>

      <Card className="breathing-border space-y-2 text-white">
        <h2 className="text-xl font-bold text-center text-accent">🔢 Core Numbers</h2>
        <div className="space-y-1 text-sm">
          <p>Name Number → {numbers.name ?? '—'}</p>
          <p>Destiny Number → {numbers.destiny ?? '—'}</p>
          <p>Psychic Number → {numbers.psychic ?? '—'}</p>
        </div>
      </Card>

      <Card className="breathing-border space-y-2 text-white">
        <h2 className="text-xl font-bold text-center text-accent">🪶 Planetary Associations</h2>
        <div className="space-y-1 text-sm">
          <p>Name → {planets.name ?? '—'}</p>
          <p>Destiny → {planets.destiny ?? '—'}</p>
          <p>Psychic → {planets.psychic ?? '—'}</p>
        </div>
      </Card>

      <Card className="breathing-border space-y-2 text-white">
        <h2 className="text-xl font-bold text-center text-accent">
          🕉️ Jyotish Context (Vedic cross-check)
        </h2>
        <div className="space-y-1 text-sm">
          {Object.keys(jyotish_context).length > 0 ? (
            Object.entries(jyotish_context).map(([planetName, info]: [string, any]) => {
              const lordships: number[] = Array.isArray(info?.lordships)
                ? info.lordships.map((n: any) => Number(n))
                : [];
              const hasLordships = lordships.length > 0;
              const headerLine = `${planetName} — status: ${info?.status ?? '—'}, dignity: ${info?.dignity ?? '—'}.`;

              if (!hasLordships) {
                return (
                  <div key={planetName} className="mb-4 last:mb-0">
                    <p>{headerLine}</p>
                  </div>
                );
              }

              const lordshipLabels = lordships.map((num) => {
                const house = houseInfo[num];
                return house ? formatLordship(num) : String(num);
              });

              return (
                <div key={planetName} className="mb-4 last:mb-0">
                  <p>{headerLine}</p>
                  <p>Lordships: {lordshipLabels.join('; ')}.</p>
                  {lordships.map((num, idx) => {
                    const house = houseInfo[num];
                    if (house && house.desc) {
                      return (
                        <p key={idx}>Themes ({ordinal(num)}): {house.desc}.</p>
                      );
                    }
                    return null;
                  })}
                  {info?.timing_flags?.mahadasha === true && (
                    <p>Mahadasha Active? → Yes</p>
                  )}
                  {info?.timing_flags?.antardasha === true && (
                    <p>Antardasha Active? → Yes</p>
                  )}
                </div>
              );
            })
          ) : (
            <p>—</p>
          )}
        </div>
      </Card>

      <Card className="breathing-border space-y-2 text-white">
        <h2 className="text-xl font-bold text-center text-accent">⚖️ Combo Alignment</h2>
        <div className="space-y-1 text-sm">
          <p>Verdict → {combo_alignment.verdict ?? '—'}</p>
          <p>Score (0–100) → {combo_alignment.score_0_100 ?? '—'}</p>
          <div>
            <p>Reasons (list) →</p>
            {Array.isArray(combo_alignment.reasons) && combo_alignment.reasons.length > 0 ? (
              <ul className="list-disc pl-5">
                {combo_alignment.reasons.map((reason: any, idx: number) => (
                  <li key={idx}>{reason ?? '—'}</li>
                ))}
              </ul>
            ) : (
              <p>—</p>
            )}
          </div>
        </div>
      </Card>

      <Card className="breathing-border space-y-2 text-white">
        <h2 className="text-xl font-bold text-center text-accent">✅ Status</h2>
        <div className="space-y-1 text-sm">
          <p>No karmic debts detected → {noDebts ? 'True' : 'False'}</p>
          <p>Needs transliteration → {needsTransliteration ? 'Yes' : 'No'}</p>
        </div>
        <div className="breathing-border mt-1 p-1 rounded-full">
          <p className="text-center text-accent font-semibold italic text-xs">
            💬 If you need more clarity or have questions, feel free to ask me (MitraVeda).
          </p>
        </div>
      </Card>
    </div>
  );
}

