import { useState } from 'react';
import Card from './Card';
import { normalizeWindow, intersectWindow, minutesToHHMM } from '@/utils/time';
import type { TimeWindow, GDWindow, GoldenDate, Inauspicious } from '@/types';

interface Props {
  goldenDates?: GoldenDate[];
  inauspiciousTimes?: Inauspicious[];
  marketTimings?: { start: string; end: string };
  finalVerdict: 'BUY_WINDOW' | 'CAUTION' | 'DO_NOT_TRADE';
  chandrashtamaDays?: string[];
}

const stateCta: Record<NonNullable<GDWindow['state']>, string[]> = {
  Ruling: ['Intraday', 'Positional'],
  Eating: ['Intraday'],
  Walking: ['Long-term'],
  Sleeping: [],
  Dying: [],
};

export default function GoldenDatesCalendar({ goldenDates = [], inauspiciousTimes = [], marketTimings, finalVerdict, chandrashtamaDays = [] }: Props) {
  const [selected, setSelected] = useState<GoldenDate | null>(null);
  const market = marketTimings ? normalizeWindow(marketTimings.start, marketTimings.end) : null;

  const renderCTA = (state: GDWindow['state'] | undefined, disabled: boolean) => {
    if (!state) return null;
    const ctas = [...stateCta[state]];
    if (finalVerdict === 'DO_NOT_TRADE') disabled = true;
    if (finalVerdict === 'CAUTION') {
      ctas.splice(1); // keep only first (Intraday if exists)
    }
    return (
      <div className="flex gap-2 mt-1">
        {ctas.map((c) => (
          <button
            key={c}
            disabled={disabled}
            className={`px-2 py-1 rounded border ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {c}
          </button>
        ))}
      </div>
    );
  };

  const isChandrashtama = (date: string) => chandrashtamaDays.includes(date);

  const checkInauspicious = (win: TimeWindow) => {
    return inauspiciousTimes.some((i) => {
      const n = normalizeWindow(i.start, i.end);
      return intersectWindow(win, n) !== null;
    });
  };

  return (
    <Card>
      <h3 className="text-lg font-semibold">Golden Dates</h3>
      <div className="grid grid-cols-3 gap-2 mt-2" aria-label="golden-dates-month">
        {goldenDates.map((gd) => (
          <button
            key={gd.date}
            onClick={() => setSelected(gd)}
            className="border rounded p-2 text-left"
          >
            <div className="flex justify-between items-center">
              <span>{gd.date}</span>
              <span className="bg-gray-200 rounded px-1 text-xs">{gd.windows.length}</span>
            </div>
            {isChandrashtama(gd.date) && (
              <div className="text-red-600 text-xs">Chandrashtama</div>
            )}
          </button>
        ))}
      </div>
      {selected && (
        <div className="mt-4 border-t pt-2" aria-label="golden-date-detail">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold">{selected.date}</h4>
            <button onClick={() => setSelected(null)} className="text-sm underline">
              close
            </button>
          </div>
          {isChandrashtama(selected.date) && (
            <p className="text-red-600 text-sm">Chandrashtama day - trading discouraged</p>
          )}
          <ul className="mt-2 space-y-2">
            {selected.windows
              .map((w) => ({ ...w, ...normalizeWindow(w.start, w.end) }))
              .sort((a, b) => a.start - b.start)
              .map((w, idx) => {
                const inauspicious = checkInauspicious(w);
                const disabled =
                  isChandrashtama(selected.date) ||
                  inauspicious ||
                  w.state === 'Sleeping' ||
                  w.state === 'Dying' ||
                  Boolean(market && !intersectWindow({ start: w.start, end: w.end }, market));
                return (
                  <li key={idx} className={inauspicious ? 'line-through' : ''}>
                    <div>
                      {minutesToHHMM(w.start)} - {minutesToHHMM(w.end % (24 * 60))} {w.state || ''}
                    </div>
                    {renderCTA(w.state, disabled)}
                  </li>
                );
              })}
          </ul>
        </div>
      )}
    </Card>
  );
}
