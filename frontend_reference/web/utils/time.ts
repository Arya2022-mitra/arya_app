import { GLOBAL_START, GLOBAL_END } from '@/types';
import type { TimeWindow, MarketWindow } from '@/types';

export function parseTimeToMinutes(time: string): number {
  const trimmed = time.trim();
  let match = trimmed.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (match) {
    let [_, hStr, mStr, period] = match;
    let hours = parseInt(hStr, 10);
    const minutes = parseInt(mStr, 10);
    if (period.toUpperCase() === 'PM' && hours !== 12) hours += 12;
    if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }
  match = trimmed.match(/(\d{1,2}):(\d{2})/);
  if (match) {
    const [_, hStr, mStr] = match;
    const hours = parseInt(hStr, 10);
    const minutes = parseInt(mStr, 10);
    return hours * 60 + minutes;
  }
  match = trimmed.match(/(\d{1,2})\s*(AM|PM)/i);
  if (match) {
    let [, hStr, period] = match;
    let hours = parseInt(hStr, 10);
    if (period.toUpperCase() === 'PM' && hours !== 12) hours += 12;
    if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;
    return hours * 60;
  }
  return 0;
}

export const GLOBAL_START_MINUTE = parseTimeToMinutes(GLOBAL_START);
export const GLOBAL_END_MINUTE = parseTimeToMinutes(GLOBAL_END);

export function minutesToHHMM(mins: number): string {
  const hours = Math.floor(mins / 60) % 24;
  const minutes = mins % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

export function normalizeWindow(
  start: string,
  end: string
): MarketWindow {
  const s = parseTimeToMinutes(start);
  let e = parseTimeToMinutes(end);
  const crossMidnight = e < s;
  if (crossMidnight) {
    e += 24 * 60;
  }
  return { start: s, end: e, crossMidnight };
}

export function intersectWindow(
  win: TimeWindow,
  market: MarketWindow | null
): TimeWindow | null {
  if (!market) return null;
  const start = Math.max(win.start, market.start);
  const end = Math.min(win.end, market.end);
  if (start >= end) return null;
  return { start, end };
}

export function clampToGlobalWindow(win: TimeWindow): TimeWindow | null {
  const start = Math.max(win.start, GLOBAL_START_MINUTE);
  const end = Math.min(win.end, GLOBAL_END_MINUTE);
  if (start >= end) return null;
  return { start, end };
}
