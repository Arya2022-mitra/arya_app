import type { GoldenDate, GDWindow } from '@/types';
import {
  GLOBAL_START_MINUTE,
  GLOBAL_END_MINUTE,
  minutesToHHMM,
  parseTimeToMinutes,
} from '@/utils/time';

const activityStateMap: Record<'Rule' | 'Eat' | 'Walk', 'Ruling' | 'Eating' | 'Walking'> = {
  Rule: 'Ruling',
  Eat: 'Eating',
  Walk: 'Walking',
};

function formatTime(t: unknown): string {
  if (t && typeof t === 'object') {
    const obj: any = t;
    if (obj.time !== undefined) return formatTime(obj.time);
    if (obj.start !== undefined) return formatTime(obj.start);
    if (obj.end !== undefined) return formatTime(obj.end);
  }
  const raw = typeof t === 'string' ? t : String(t ?? '');
  const str = raw.trim();
  if (!str) return '';
  const minuteMatch = str.match(/\b\d{1,2}[.:]\d{2}\s*(AM|PM)?\b/i);
  if (minuteMatch) {
    const normalized = minuteMatch[0]
      .replace(/(\d)\.(?=\d{2})/g, '$1:')
      .replace(/\s+(am|pm)$/i, (_, suffix) => ` ${suffix.toUpperCase()}`)
      .trim();
    return normalized;
  }
  const hourOnlyMatch = str.match(/\b(\d{1,2})\s*(AM|PM)\b/i);
  if (hourOnlyMatch) {
    const hour = hourOnlyMatch[1];
    const suffix = hourOnlyMatch[2]?.toUpperCase();
    if (suffix) {
      return `${hour} ${suffix}`.trim();
    }
  }
  console.warn('normalizeGoldenDates: unable to parse time value', t);
  return '';
}

function formatClampedMinutes(value: number, original: string): string {
  const hasMeridiem = /(AM|PM)/i.test(original);
  if (hasMeridiem) {
    const suffix = value >= 12 * 60 ? 'PM' : 'AM';
    let hours = Math.floor(value / 60);
    if (hours === 0) {
      hours = 12;
    } else if (hours > 12) {
      hours -= 12;
    }
    const minutes = (value % 60).toString().padStart(2, '0');
    return `${hours}:${minutes} ${suffix}`;
  }
  return minutesToHHMM(value);
}

function normalizeGDWindowEntry(rawWindow: any): GDWindow | null {
  if (!rawWindow || typeof rawWindow !== 'object') {
    return null;
  }
  const start = formatTime(rawWindow.start ?? rawWindow.Start);
  const end = formatTime(rawWindow.end ?? rawWindow.End);
  if (!start || !end) return null;
  const startMinutes = parseTimeToMinutes(start);
  const endMinutes = parseTimeToMinutes(end);
  const clampedStart = Math.max(startMinutes, GLOBAL_START_MINUTE);
  const clampedEnd = Math.min(endMinutes, GLOBAL_END_MINUTE);
  if (!Number.isFinite(clampedStart) || !Number.isFinite(clampedEnd)) {
    return null;
  }
  if (clampedStart >= clampedEnd) {
    return null;
  }
  const win: GDWindow = { start, end };
  win.start = clampedStart === startMinutes ? start : formatClampedMinutes(clampedStart, start);
  win.end = clampedEnd === endMinutes ? end : formatClampedMinutes(clampedEnd, end);
  win.startMinutes = clampedStart;
  win.endMinutes = clampedEnd;
  let state: GDWindow['state'] | undefined =
    rawWindow.state ??
    (rawWindow.start && typeof rawWindow.start === 'object'
      ? (rawWindow.start as any).state
      : undefined) ??
    (rawWindow.end && typeof rawWindow.end === 'object'
      ? (rawWindow.end as any).state
      : undefined);
  const activity = rawWindow.activity;
  if (!state && typeof activity === 'string') {
    const mapped = activityStateMap[activity as keyof typeof activityStateMap];
    if (mapped) {
      state = mapped;
    }
  }
  if (state) win.state = state;
  if (typeof activity === 'string') win.activity = activity;
  return win;
}

export function normalizeGoldenDates(input: unknown): GoldenDate[] {
  if (
    input &&
    typeof input === 'object' &&
    !Array.isArray(input) &&
    Array.isArray((input as any).golden_dates)
  ) {
    input = (input as any).golden_dates;
  }
  if (!Array.isArray(input)) return [];
  return (input as any[])
    .map((gd) => {
      const date = gd?.date;
      const windows = Array.isArray(gd?.windows)
        ? gd.windows
            .map((w: any) => normalizeGDWindowEntry(w))
            .filter((w: GDWindow | null): w is GDWindow => Boolean(w))
        : [];
      if (windows.length === 0) {
        const fallbackWindow = normalizeGDWindowEntry(gd);
        if (fallbackWindow) {
          windows.push(fallbackWindow);
        }
      }
      if (typeof date === 'string' && windows.length > 0) {
        return { date, windows } as GoldenDate;
      }
      return null;
    })
    .filter(Boolean) as GoldenDate[];
}

