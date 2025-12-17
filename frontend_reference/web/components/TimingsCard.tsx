import Card from './Card';
import type { GoldenDate, GDWindow } from '@/types';
import { normalizeWindow, minutesToHHMM } from '@/utils/time';

interface Props {
  timings?: { start: string; end: string } | null;
  buyWindows?: Array<{ start?: string; end?: string }>;
  goldenDates?: GoldenDate[];
}

interface NormalizedWindow {
  window: GDWindow;
  startMinutes: number;
  endMinutes: number;
  crossMidnight: boolean;
}

function normalizeGoldenWindow(win: GDWindow): NormalizedWindow | null {
  if (!win.start || !win.end) return null;
  const normalized = normalizeWindow(win.start, win.end);
  return {
    window: win,
    startMinutes: normalized.start,
    endMinutes: normalized.end,
    crossMidnight: normalized.crossMidnight,
  };
}

function formatMinutesRange(start: number, end: number, crossMidnight = false) {
  const endWithinDay = end % (24 * 60);
  const suffix = crossMidnight ? ' (+1d)' : '';
  return `${minutesToHHMM(start)} – ${minutesToHHMM(endWithinDay)}${suffix}`;
}

export default function TimingsCard({ timings, buyWindows = [], goldenDates = [] }: Props) {
  const market =
    timings && timings.start && timings.end
      ? normalizeWindow(timings.start, timings.end)
      : null;
  const marketText = market
    ? formatMinutesRange(market.start, market.end, market.crossMidnight)
    : '—';

  const buyWindowCount = buyWindows.length;
  const buyWindowText =
    buyWindowCount > 0
      ? `${buyWindowCount} window${buyWindowCount > 1 ? 's' : ''}`
      : 'None';

  const dateValue = (date: string) => {
    const parsed = Date.parse(date);
    return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed;
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const goldenSummaries = goldenDates
    .slice()
    .sort((a, b) => dateValue(a.date) - dateValue(b.date))
    .map((gd) => {
      const normalized = (gd.windows || [])
        .map((w) => normalizeGoldenWindow(w))
        .filter((w): w is NormalizedWindow => Boolean(w))
        .sort((a, b) => a.startMinutes - b.startMinutes);
      return normalized.length > 0
        ? {
            date: gd.date,
            value: dateValue(gd.date),
            window: normalized[0],
          }
        : null;
    })
    .filter((entry): entry is { date: string; value: number; window: NormalizedWindow } => Boolean(entry));

  const nextGolden =
    goldenSummaries.find((entry) => entry.value >= today.getTime()) ?? goldenSummaries[0] ?? null;

  const goldenText = nextGolden
    ? `${nextGolden.date} · ${formatMinutesRange(
        nextGolden.window.startMinutes,
        nextGolden.window.endMinutes,
        nextGolden.window.crossMidnight,
      )}`
    : 'None';

  return (
    <Card data-testid="timings-card">
      <h3 className="text-lg font-semibold">Trading Timings</h3>
      <div className="mt-3 space-y-2 text-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="font-medium text-gray-600 dark:text-gray-300">Market Window</span>
          <span className="font-semibold text-gray-900 dark:text-white">{marketText}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="font-medium text-gray-600 dark:text-gray-300">Buy Windows</span>
          <span className="font-semibold text-gray-900 dark:text-white">{buyWindowText}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="font-medium text-gray-600 dark:text-gray-300">Next Golden Date</span>
          <span className="font-semibold text-gray-900 dark:text-white">{goldenText}</span>
        </div>
      </div>
    </Card>
  );
}

