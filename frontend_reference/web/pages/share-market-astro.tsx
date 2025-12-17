import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import VerdictBanner from '@/components/VerdictBanner';
import GatingChecklist from '@/components/GatingChecklist';
import SectorPanel from '@/components/SectorPanel';
import EntryWindowsPanel from '@/components/EntryWindowsPanel';
import YogaAdviceList from '@/components/YogaAdviceList';
import AdvancedDiagnostics from '@/components/AdvancedDiagnostics';
import Card from '@/components/Card';
import { useActiveProfile } from '@/lib/useActiveProfile';
import { useAuth } from '@/lib/useAuth';
import type { ShareMarketData } from '@/types';
import { normalizeGoldenDates } from '@/lib/normalizeGoldenDates';
import { normalizeInauspiciousTimes } from '@/lib/normalizeInauspiciousTimes';
import { minutesToHHMM, normalizeWindow } from '@/utils/time';
import { useDailyPrediction } from '@/state/dailyPredictionStore';
import { useTranslation } from 'react-i18next';
import AiSummaryDisplay from '@/components/AiSummaryDisplay';
import { useAiSummary } from '@/hooks/useAiSummary';
import SecureAutoPlayVideo from '@/components/SecureAutoPlayVideo';

type Activity = 'Rule' | 'Eat' | 'Walk';
type State = 'Ruling' | 'Eating' | 'Walking' | 'Sleeping' | 'Dying';

type GoldenWindow = {
  date: string;
  start: string;
  end: string;
  state?: State;
  activity?: Activity;
  startMinutes?: number;
  endMinutes?: number;
};

type GoldenDate = {
  date: string;
  windows: unknown[];
};

type GoldenWindowWithMinutes = GoldenWindow & {
  startMinute: number;
  endMinute: number;
};

type ShareMarketWindowSubtype = 'intraday' | 'long';

type ShareMarketWindowContract = {
  start: string;
  end: string;
  subtype: ShareMarketWindowSubtype;
  label?: string;
};

type ShareMarketGoldenDateContract = {
  date: string;
  windows: ShareMarketWindowContract[];
};

type PakshiWindowState = 'Ruling' | 'Eating' | 'Walking';

type PakshiWindowContract = {
  start: string;
  end: string;
  state: PakshiWindowState;
};

type PakshiGoldenDateContract = {
  date: string;
  windows: PakshiWindowContract[];
};

type ShareMarketDisplayWindow = ShareMarketWindowContract & { date: string };
type PakshiDisplayWindow = PakshiWindowContract & { date: string };

const ENTRY_WINDOWS_SPLIT_DEFAULT_ENABLED =
  process.env.NEXT_PUBLIC_FEATURE_EW_SPLIT !== 'off';

const EW_DEBUG = (() => {
  const raw = process.env.NEXT_PUBLIC_EW_DEBUG;
  if (!raw) return false;
  return ['1', 'true', 'on', 'yes'].includes(raw.toLowerCase());
})();

function isEntryWindowDebugEnabled(): boolean {
  if (EW_DEBUG) {
    return true;
  }
  if (typeof globalThis === 'undefined') {
    return false;
  }
  const override = (globalThis as Record<string, unknown>).__MV_EW_DEBUG__;
  if (typeof override === 'boolean') {
    return override;
  }
  if (typeof override === 'string') {
    return ['1', 'true', 'on', 'yes'].includes(override.toLowerCase());
  }
  return false;
}

const ACTIVITY_STATE_MAP: Record<Activity, State> = {
  Rule: 'Ruling',
  Eat: 'Eating',
  Walk: 'Walking',
};

const MARKET_START_MIN = 9 * 60 + 15;
const MARKET_END_MIN = 15 * 60 + 30;
const SHOW_TRADING_TIMINGS = false;
const SHOW_SM_PANEL = false;
const SHOW_DONOTTRADE = false;
const SHOW_SM_VIDEO = true;
const SHOW_VERDICT_BANNER = false;

function formatMinutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const paddedHours = hours.toString().padStart(2, '0');
  const paddedMinutes = mins.toString().padStart(2, '0');
  return `${paddedHours}:${paddedMinutes}`;
}

function formatMinutesRange(start: number, end: number, crossMidnight = false) {
  const endWithinDay = end % (24 * 60);
  const suffix = crossMidnight ? ' (+1d)' : '';
  return `${minutesToHHMM(start)} – ${minutesToHHMM(endWithinDay)}${suffix}`;
}

function toMinutes(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value < 0 ? null : value;
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if ('time' in obj) return toMinutes(obj.time);
    if ('start' in obj) return toMinutes(obj.start);
    if ('end' in obj) return toMinutes(obj.end);
  }
  const str = String(value).trim();
  if (!str) return null;

  const warn = (message: string) => {
    console.warn(message, value);
  };

  if (/^\d{4}-\d{2}-\d{2}T/.test(str)) {
    const iso = new Date(str);
    if (Number.isNaN(iso.getTime())) {
      warn('share-market-astro: Unable to parse ISO time string');
      return null;
    }
    return iso.getHours() * 60 + iso.getMinutes();
  }

  const normalized = str.replace(/(\d)\.(\d{2})(?!\d)/g, '$1:$2');

  const meridiemMatch = normalized.match(/(\d{1,2})(?::(\d{2})(?::(\d{2}))?)?\s*(AM|PM)/i);
  if (meridiemMatch) {
    let hours = Number.parseInt(meridiemMatch[1], 10);
    const minutes = meridiemMatch[2]
      ? Number.parseInt(meridiemMatch[2], 10)
      : 0;
    const suffix = meridiemMatch[4]?.toUpperCase();
    if (
      Number.isNaN(hours) ||
      Number.isNaN(minutes) ||
      minutes < 0 ||
      minutes >= 60 ||
      !suffix
    ) {
      warn('share-market-astro: Unable to parse meridiem time string');
      return null;
    }
    const secondsComponent = meridiemMatch[3];
    if (secondsComponent) {
      const seconds = Number.parseInt(secondsComponent, 10);
      if (Number.isNaN(seconds) || seconds < 0 || seconds >= 60) {
        warn('share-market-astro: Invalid seconds in meridiem time string');
        return null;
      }
    }
    if (suffix === 'PM' && hours < 12) {
      hours += 12;
    }
    if (suffix === 'AM' && hours === 12) {
      hours = 0;
    }
    if (hours < 0 || hours >= 24) {
      warn('share-market-astro: Meridiem hours out of range');
      return null;
    }
    return hours * 60 + minutes;
  }

  const twentyFourMatch = normalized.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (twentyFourMatch) {
    const hours = Number.parseInt(twentyFourMatch[1], 10);
    const minutes = Number.parseInt(twentyFourMatch[2], 10);
    if (
      Number.isNaN(hours) ||
      Number.isNaN(minutes) ||
      hours < 0 ||
      hours >= 24 ||
      minutes < 0 ||
      minutes >= 60
    ) {
      warn('share-market-astro: Unable to parse 24-hour time string');
      return null;
    }
    const secondsComponent = twentyFourMatch[3];
    if (secondsComponent) {
      const seconds = Number.parseInt(secondsComponent, 10);
      if (Number.isNaN(seconds) || seconds < 0 || seconds >= 60) {
        warn('share-market-astro: Invalid seconds in 24-hour time string');
        return null;
      }
    }
    return hours * 60 + minutes;
  }

  warn('share-market-astro: Unable to parse time string');
  return null;
}

function compareWindowsByDateAndStart(
  a: GoldenWindowWithMinutes,
  b: GoldenWindowWithMinutes,
): number {
  const dateA = Date.parse(a.date);
  const dateB = Date.parse(b.date);
  if (!Number.isNaN(dateA) && !Number.isNaN(dateB) && dateA !== dateB) {
    return dateA - dateB;
  }
  if (a.date !== b.date) {
    return a.date < b.date ? -1 : 1;
  }
  return a.startMinute - b.startMinute;
}

function sortWindowsByDateAndStart<T extends { date: string; start: string }>(
  windows: T[],
): T[] {
  return windows.slice().sort((a, b) => {
    const dateA = Date.parse(a.date);
    const dateB = Date.parse(b.date);
    if (!Number.isNaN(dateA) && !Number.isNaN(dateB) && dateA !== dateB) {
      return dateA - dateB;
    }
    if (a.date !== b.date) {
      return a.date < b.date ? -1 : 1;
    }
    const startA = toMinutes(a.start);
    const startB = toMinutes(b.start);
    if (
      typeof startA === 'number' &&
      typeof startB === 'number' &&
      startA !== startB
    ) {
      return startA - startB;
    }
    if (startA !== null && startB === null) return -1;
    if (startA === null && startB !== null) return 1;
    return 0;
  });
}

function normalizeShareMarketWindows(
  source: unknown,
): ShareMarketGoldenDateContract[] {
  let payload: unknown = source;
  if (
    payload &&
    typeof payload === 'object' &&
    !Array.isArray(payload) &&
    Array.isArray((payload as any).golden_dates)
  ) {
    payload = (payload as any).golden_dates;
  }
  if (!Array.isArray(payload)) {
    return [];
  }
  const normalized: ShareMarketGoldenDateContract[] = [];
  (payload as unknown[]).forEach((entry) => {
    if (!entry || typeof entry !== 'object') {
      return;
    }
    const { date, windows } = entry as {
      date?: unknown;
      windows?: unknown;
    };
    if (typeof date !== 'string' || !date) {
      return;
    }
    const rawWindows: unknown[] = Array.isArray(windows)
      ? (windows as unknown[])
      : typeof (entry as any).start === 'string' &&
        typeof (entry as any).end === 'string'
      ? [entry]
      : [];
    const normalizedWindows: ShareMarketWindowContract[] = rawWindows
      .map((win) => {
        if (!win || typeof win !== 'object') {
          return null;
        }
        const { start, end, label, subtype } = win as {
          start?: unknown;
          end?: unknown;
          label?: unknown;
          subtype?: unknown;
        };
        const startStr = typeof start === 'string' ? start : null;
        const endStr = typeof end === 'string' ? end : null;
        const subtypeRaw =
          typeof subtype === 'string' ? subtype.toLowerCase() : null;
        const subtypeValue =
          subtypeRaw === 'intraday' || subtypeRaw === 'long'
            ? (subtypeRaw as ShareMarketWindowSubtype)
            : null;
        const labelStr =
          typeof label === 'string' && label.trim() ? label : undefined;
        if (!startStr || !endStr || !subtypeValue) {
          return null;
        }
        const windowContract: ShareMarketWindowContract = {
          start: startStr,
          end: endStr,
          subtype: subtypeValue,
        };
        if (labelStr) {
          windowContract.label = labelStr;
        }
        return windowContract;
      })
      .filter((win): win is ShareMarketWindowContract => Boolean(win));
    if (normalizedWindows.length > 0) {
      normalized.push({ date, windows: normalizedWindows });
    }
  });
  return normalized;
}

function normalizePakshiWindows(source: unknown): PakshiGoldenDateContract[] {
  let payload: unknown = source;
  if (
    payload &&
    typeof payload === 'object' &&
    !Array.isArray(payload) &&
    Array.isArray((payload as any).golden_dates)
  ) {
    payload = (payload as any).golden_dates;
  }
  if (!Array.isArray(payload)) {
    return [];
  }
  const normalized: PakshiGoldenDateContract[] = [];
  (payload as unknown[]).forEach((entry) => {
    if (!entry || typeof entry !== 'object') {
      return;
    }
    const { date, windows } = entry as {
      date?: unknown;
      windows?: unknown;
    };
    if (typeof date !== 'string' || !date) {
      return;
    }
    const rawWindows: unknown[] = Array.isArray(windows)
      ? (windows as unknown[])
      : typeof (entry as any).start === 'string' &&
        typeof (entry as any).end === 'string'
      ? [entry]
      : [];
    const normalizedWindows: PakshiWindowContract[] = rawWindows
      .map((win) => {
        if (!win || typeof win !== 'object') {
          return null;
        }
        const { start, end, state } = win as {
          start?: unknown;
          end?: unknown;
          state?: unknown;
        };
        const startStr = typeof start === 'string' ? start : null;
        const endStr = typeof end === 'string' ? end : null;
        const stateStr =
          state === 'Ruling' || state === 'Eating' || state === 'Walking'
            ? (state as PakshiWindowState)
            : null;
        if (!startStr || !endStr || !stateStr) {
          return null;
        }
        return { start: startStr, end: endStr, state: stateStr };
      })
      .filter((win): win is PakshiWindowContract => Boolean(win));
    if (normalizedWindows.length > 0) {
      normalized.push({ date, windows: normalizedWindows });
    }
  });
  return normalized;
}

export default function ShareMarketAstroPage() {
  const router = useRouter();
  const { profile, loading: loadingProfile } = useActiveProfile();
  const { sessionRestored } = useAuth();
  const { t } = useTranslation();
  const {
    data: prediction,
    loading: predictionLoading,
    error: predictionError,
  } = useDailyPrediction();
  const [tab, setTab] = useState<'overview' | 'advanced'>('overview');
  const [entryWindowsFlagOverride, setEntryWindowsFlagOverride] =
    useState<boolean | null>(null);
  const [guideVideoError, setGuideVideoError] = useState(false);

  const profileId = profile?.id ? Number(profile.id) : null;
  const aiSummary = useAiSummary('share_market', profileId);

  const dualEntryWindowsEnabled =
    entryWindowsFlagOverride ?? ENTRY_WINDOWS_SPLIT_DEFAULT_ENABLED;

  const shareDerived = useMemo(() => {
    if (!prediction) {
      return { shareMarket: null as ShareMarketData | null, smSource: [], pkSource: [] };
    }

    const raw: any = prediction;
    const shareRaw = raw.share_market ? ({ ...raw.share_market } as ShareMarketData) : null;
    let smSourceCandidate: unknown = null;
    const pkSourceCandidate: unknown = raw?.pakshi_muhurta_month?.golden_dates ?? null;

    if (shareRaw) {
      smSourceCandidate = shareRaw.share_market_golden_dates ?? shareRaw.golden_dates ?? null;
      shareRaw.advice_note = shareRaw.advice_note ?? null;
      let gdList: any = shareRaw.golden_dates;
      if (gdList && !Array.isArray(gdList) && Array.isArray(gdList.golden_dates)) {
        shareRaw.golden_dates_count =
          gdList.count ?? gdList.golden_dates_count ?? gdList.golden_dates.length;
        gdList = gdList.golden_dates;
      } else if (Array.isArray(gdList)) {
        shareRaw.golden_dates_count = gdList.length;
      } else {
        shareRaw.golden_dates_count = 0;
        gdList = [];
      }
      if (!gdList || gdList.length === 0) {
        const fallback =
          raw.golden_dates_summary?.golden_dates || raw.pakshi_muhurta_month?.golden_dates;
        if (Array.isArray(fallback) && fallback.length > 0) {
          gdList = fallback;
          shareRaw.golden_dates_count = fallback.length;
        }
      }
      shareRaw.golden_dates = normalizeGoldenDates(gdList);
      shareRaw.inauspicious_times = normalizeInauspiciousTimes(shareRaw.inauspicious_times);
    }

    if (
      (!smSourceCandidate ||
        (Array.isArray(smSourceCandidate) && smSourceCandidate.length === 0)) &&
      raw?.golden_dates_summary &&
      typeof raw.golden_dates_summary === 'object' &&
      Array.isArray(raw.golden_dates_summary.golden_dates)
    ) {
      smSourceCandidate = raw.golden_dates_summary.golden_dates;
    }

    return {
      shareMarket: shareRaw,
      smSource: smSourceCandidate ?? [],
      pkSource: pkSourceCandidate ?? [],
    };
  }, [prediction]);

  const data = shareDerived.shareMarket;
  const smEntrySource = shareDerived.smSource;
  const pkEntrySource = shareDerived.pkSource;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const ewParam = params.get('entryWindowsSplit');
    if (!ewParam) {
      setEntryWindowsFlagOverride(null);
    } else {
      const normalizedFlag = ewParam.toLowerCase();
      if (['1', 'true', 'on', 'yes'].includes(normalizedFlag)) {
        setEntryWindowsFlagOverride(true);
      } else if (['0', 'false', 'off', 'no'].includes(normalizedFlag)) {
        setEntryWindowsFlagOverride(false);
      } else {
        setEntryWindowsFlagOverride(null);
      }
    }
  }, [router.asPath]);

  const smGoldenDateList = useMemo(
    () => normalizeShareMarketWindows(smEntrySource),
    [smEntrySource],
  );

  const pkGoldenDateList = useMemo(
    () => normalizePakshiWindows(pkEntrySource),
    [pkEntrySource],
  );

  const smEntryWindows = useMemo(() => {
    const intraday: ShareMarketDisplayWindow[] = [];
    const swing: ShareMarketDisplayWindow[] = [];
    smGoldenDateList.forEach((day) => {
      day.windows.forEach((win) => {
        const mapped: ShareMarketDisplayWindow = { ...win, date: day.date };
        if (win.subtype === 'intraday') {
          intraday.push(mapped);
        } else if (win.subtype === 'long') {
          swing.push(mapped);
        }
      });
    });
    return {
      intraday: sortWindowsByDateAndStart(intraday),
      long: sortWindowsByDateAndStart(swing),
    };
  }, [smGoldenDateList]);

  const pkEntryWindows = useMemo(() => {
    const intraday: PakshiDisplayWindow[] = [];
    const swing: PakshiDisplayWindow[] = [];
    pkGoldenDateList.forEach((day) => {
      day.windows.forEach((win) => {
        const startMinute = toMinutes(win.start);
        const endMinute = toMinutes(win.end);
        if (
          typeof startMinute !== 'number' ||
          typeof endMinute !== 'number' ||
          Number.isNaN(startMinute) ||
          Number.isNaN(endMinute) ||
          endMinute <= startMinute
        ) {
          return;
        }

        if (endMinute <= MARKET_START_MIN || startMinute >= MARKET_END_MIN) {
          return;
        }

        const clampedStartMinute = Math.max(startMinute, MARKET_START_MIN);
        const clampedEndMinute = Math.min(endMinute, MARKET_END_MIN);

        if (clampedStartMinute >= clampedEndMinute) {
          return;
        }

        const clampedWindow: PakshiDisplayWindow = {
          date: day.date,
          start: formatMinutesToTime(clampedStartMinute),
          end: formatMinutesToTime(clampedEndMinute),
          state: win.state,
        };

        if (win.state === 'Eating') {
          intraday.push(clampedWindow);
        } else if (win.state === 'Ruling' || win.state === 'Walking') {
          swing.push(clampedWindow);
        }
      });
    });
    return {
      intraday: sortWindowsByDateAndStart(intraday),
      long: sortWindowsByDateAndStart(swing),
    };
  }, [pkGoldenDateList]);

  const smIntradayWindows = smEntryWindows.intraday;
  const smLongWindows = smEntryWindows.long;
  const pkIntradayWindows = pkEntryWindows.intraday;
  const pkLongWindows = pkEntryWindows.long;

  const legacyEntryWindows = useMemo(() => {
    const empty = {
      intraday: [] as Array<{
        date: string;
        start?: string;
        end?: string;
        state?: State;
        activity?: Activity;
      }>,
      long: [] as Array<{
        date: string;
        start?: string;
        end?: string;
        state?: State;
        activity?: Activity;
      }>,
    };
    if (dualEntryWindowsEnabled) {
      return empty;
    }
    const source: GoldenDate[] = Array.isArray(data?.golden_dates)
      ? (data!.golden_dates as GoldenDate[])
      : [];
    const flattened: Array<GoldenWindow | null | undefined> = source.flatMap(
      (gd: GoldenDate) => {
        const maybeGoldenDate: unknown = gd;
        if (!maybeGoldenDate || typeof maybeGoldenDate !== 'object') {
          return [null];
        }
        const { date: rawDate, windows: rawWindows } = maybeGoldenDate as {
          date?: unknown;
          windows?: unknown;
        };
        if (typeof rawDate !== 'string' || !rawDate) {
          return [null];
        }
        const windowsArray: unknown[] = Array.isArray(rawWindows)
          ? (rawWindows as unknown[])
          : [];
        const date = rawDate;
        return windowsArray.map((w): GoldenWindow | null => {
          if (!w || typeof w !== 'object') {
            return null;
          }
          const windowData = w as {
            activity?: unknown;
            state?: unknown;
            cross_midnight?: unknown;
            crossMidnight?: unknown;
            crossing?: unknown;
            start?: unknown;
            end?: unknown;
            startMinutes?: unknown;
            endMinutes?: unknown;
          };
          const flaggedCrossMidnight = Boolean(
            windowData.cross_midnight ||
              windowData.crossMidnight ||
              windowData.crossing,
          );
          if (flaggedCrossMidnight) {
            return null;
          }
          const { activity: rawActivity, state: rawState } = windowData;
          const activity: Activity | undefined =
            rawActivity === 'Rule' ||
            rawActivity === 'Eat' ||
            rawActivity === 'Walk'
              ? rawActivity
              : undefined;
          const state: State | undefined =
            rawState === 'Ruling' ||
            rawState === 'Eating' ||
            rawState === 'Walking'
              ? rawState
              : activity
              ? ACTIVITY_STATE_MAP[activity]
              : undefined;
          const start =
            typeof windowData.start === 'string' && windowData.start
              ? windowData.start
              : null;
          const end =
            typeof windowData.end === 'string' && windowData.end
              ? windowData.end
              : null;
          if (!start || !end) {
            return null;
          }
          const startMinutes =
            typeof windowData.startMinutes === 'number' &&
            Number.isFinite(windowData.startMinutes)
              ? windowData.startMinutes
              : undefined;
          const endMinutes =
            typeof windowData.endMinutes === 'number' &&
            Number.isFinite(windowData.endMinutes)
              ? windowData.endMinutes
              : undefined;
          return {
            date,
            start,
            end,
            state,
            activity,
            startMinutes,
            endMinutes,
          };
        });
      },
    );

    const withMinutes: GoldenWindowWithMinutes[] = flattened
      .filter((win): win is GoldenWindow => Boolean(win))
      .map((win) => {
        const startMinute =
          typeof win.startMinutes === 'number' &&
          Number.isFinite(win.startMinutes)
            ? win.startMinutes
            : toMinutes(win.start);
        const endMinute =
          typeof win.endMinutes === 'number' &&
          Number.isFinite(win.endMinutes)
            ? win.endMinutes
            : toMinutes(win.end);
        if (
          startMinute === null ||
          endMinute === null ||
          (typeof startMinute === 'number' && Number.isNaN(startMinute)) ||
          (typeof endMinute === 'number' && Number.isNaN(endMinute)) ||
          (typeof startMinute === 'number' &&
            typeof endMinute === 'number' &&
            endMinute <= startMinute)
        ) {
          return null;
        }
        return {
          ...win,
          startMinute: startMinute as number,
          endMinute: endMinute as number,
        };
      })
      .filter((win): win is GoldenWindowWithMinutes => Boolean(win));

    const intraday = withMinutes
      .filter((win) => win.state === 'Eating')
      .sort(compareWindowsByDateAndStart)
      .map((win) => ({
        date: win.date,
        start: win.start,
        end: win.end,
        state: win.state,
        activity: win.activity,
      }));

    const long = withMinutes
      .filter((win) => win.state === 'Ruling' || win.state === 'Walking')
      .sort(compareWindowsByDateAndStart)
      .map((win) => ({
        date: win.date,
        start: win.start,
        end: win.end,
        state: win.state,
        activity: win.activity,
      }));

    return { intraday, long };
  }, [dualEntryWindowsEnabled, data]);

  const legacyIntradayWindows = legacyEntryWindows.intraday;
  const legacyLongWindows = legacyEntryWindows.long;

  useEffect(() => {
    const debugEnabled = isEntryWindowDebugEnabled();
    if (!debugEnabled) {
      return () => {
        if (typeof window !== 'undefined') {
          delete (window as any)._mvEW_SM;
        }
      };
    }
    const totalWindows = smGoldenDateList.reduce(
      (sum, day) => sum + day.windows.length,
      0,
    );
    console.log('[EW:SM][RAW]', smEntrySource);
    console.log('[EW:SM][NORMALIZED]', smGoldenDateList);
    console.log('[EW:SM][COUNTS]', {
      totalDates: smGoldenDateList.length,
      totalWindows,
      intraday: smIntradayWindows.length,
      long: smLongWindows.length,
    });
    console.log('[EW:SM][FINAL]', {
      intraday: smIntradayWindows,
      long: smLongWindows,
    });
    if (typeof window !== 'undefined') {
      (window as any)._mvEW_SM = {
        smGoldenDateList,
        smRawSource: smEntrySource,
        intraday: smIntradayWindows,
        long: smLongWindows,
      };
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any)._mvEW_SM;
      }
    };
  }, [smEntrySource, smGoldenDateList, smIntradayWindows, smLongWindows]);

  useEffect(() => {
    const debugEnabled = isEntryWindowDebugEnabled();
    if (!debugEnabled) {
      return () => {
        if (typeof window !== 'undefined') {
          delete (window as any)._mvEW_PK;
        }
      };
    }
    const totalWindows = pkGoldenDateList.reduce(
      (sum, day) => sum + day.windows.length,
      0,
    );
    console.log('[EW:PK][RAW]', pkEntrySource);
    console.log('[EW:PK][NORMALIZED]', pkGoldenDateList);
    console.log('[EW:PK][COUNTS]', {
      totalDates: pkGoldenDateList.length,
      totalWindows,
      intraday: pkIntradayWindows.length,
      long: pkLongWindows.length,
    });
    console.log('[EW:PK][FINAL]', {
      intraday: pkIntradayWindows,
      long: pkLongWindows,
    });
    if (typeof window !== 'undefined') {
      (window as any)._mvEW_PK = {
        pkGoldenDateList,
        pkRawSource: pkEntrySource,
        intraday: pkIntradayWindows,
        long: pkLongWindows,
      };
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any)._mvEW_PK;
      }
    };
  }, [pkEntrySource, pkGoldenDateList, pkIntradayWindows, pkLongWindows]);

  const viewLoading = loadingProfile || !sessionRestored || predictionLoading;
  if (viewLoading) {
    return <div className="p-4">{t('common.loading')}</div>;
  }
  const derivedError = predictionError;
  if (derivedError) {
    return (
      <div className="p-4">
        Error loading data: {derivedError}
        <button onClick={() => location.reload()} className="underline ml-2">
          Retry
        </button>
      </div>
    );
  }
  if (!data) {
    return <div className="p-4">No data available.</div>;
  }

  const finalVerdict = data.final_verdict ?? 'CAUTION';
  if (!data.final_verdict) {
    console.warn('final_verdict missing in payload; defaulting to CAUTION');
  }
  const diagnostics = data.diagnostics;

  const normalizedMarketWindow =
    data.timings && data.timings.start && data.timings.end
      ? normalizeWindow(data.timings.start, data.timings.end)
      : null;
  const marketWindowText = normalizedMarketWindow
    ? formatMinutesRange(
        normalizedMarketWindow.start,
        normalizedMarketWindow.end,
        normalizedMarketWindow.crossMidnight,
      )
    : '—';

  const buyWindows = data.buy_windows ?? [];
  const buyWindowCount = buyWindows.length;
  const buyWindowText =
    buyWindowCount > 0
      ? `${buyWindowCount} window${buyWindowCount > 1 ? 's' : ''}`
      : 'None';

  return (
    <div className="p-4 space-y-4">
      {aiSummary.data && (
        <AiSummaryDisplay
          summary={aiSummary.data.summary}
          html={aiSummary.data.html}
          updatedAt={aiSummary.data.updated_at}
        />
      )}
      {aiSummary.loading && (
        <AiSummaryDisplay loading={true} />
      )}
      {aiSummary.error && !aiSummary.loading && (
        <AiSummaryDisplay error={aiSummary.error} />
      )}
      {SHOW_SM_VIDEO ? (
        <Card className="space-y-3">
          <div>
            <h3 className="text-lg font-semibold">Share Market Guide</h3>
            <p className="text-sm text-gray-700 dark:text-gray-200">
              A quick walkthrough of the Share Market experience.
            </p>
          </div>
          <div className="flex justify-center">
            {guideVideoError ? (
              <div className="rounded-2xl shadow-lg w-full max-w-3xl p-6 text-center bg-black/20">
                {t('common.unavailable', { defaultValue: 'Guide video unavailable.' })}
              </div>
            ) : (
              <SecureAutoPlayVideo
                sources={[{ src: '/videos/Share_Market.mp4', type: 'video/mp4' }]}
                className="rounded-2xl shadow-lg w-full max-w-3xl"
                onError={() => setGuideVideoError(true)}
                description="Share market guidance video"
              />
            )}
          </div>
        </Card>
      ) : null}
      {SHOW_VERDICT_BANNER && (
        <VerdictBanner
          finalVerdict={finalVerdict}
          adviceNote={data.advice_note}
          blockedBy={data.blocked_by}
        />
      )}
      {SHOW_DONOTTRADE && (
        <GatingChecklist
          gating={data.gating}
          reasons={data.reasons}
          natalContraindications={[]}
        />
      )}
      {SHOW_TRADING_TIMINGS && (
        <Card data-testid="timings-card">
          <h3 className="text-lg font-semibold">Trading Timings</h3>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="font-medium text-gray-600 dark:text-gray-300">
                Market Window
              </span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {marketWindowText}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="font-medium text-gray-600 dark:text-gray-300">
                Buy Windows
              </span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {buyWindowText}
              </span>
            </div>
          </div>
        </Card>
      )}
      {data.sector_recommendation && (
        <SectorPanel
          recommended={data.sector_recommendation.recommended ?? []}
          avoid={data.sector_recommendation.avoid ?? []}
          reasonTags={data.sector_recommendation.reason_tags ?? {}}
          scores={data.sector_recommendation.scores}
          finalVerdict={finalVerdict}
        />
      )}
      {dualEntryWindowsEnabled ? (
        <div className="space-y-4">
          {SHOW_SM_PANEL && (
            <Card>
              <h3 className="text-lg font-semibold">Market Entry Windows (SM)</h3>
              <div className="mt-3 space-y-4 text-sm">
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-200">
                    Intraday ({smIntradayWindows.length})
                  </p>
                  <div
                    data-testid="sm-entry-intraday"
                    className="mt-2 space-y-2"
                  >
                    {smIntradayWindows.length === 0 ? (
                      <span className="text-gray-500 dark:text-gray-400">
                        No intraday windows.
                      </span>
                    ) : (
                      smIntradayWindows.map((win, idx) => (
                        <div
                          key={`${win.date}-${win.start}-${idx}`}
                          className="rounded border border-accent dark:border-neon-cyan px-3 py-1 text-xs uppercase tracking-wide"
                        >
                          {`${win.date} — ${win.start} – ${win.end}${
                            win.label ? ` · ${win.label}` : ''
                          }`}
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-200">
                    Swing/Long ({smLongWindows.length})
                  </p>
                  <div data-testid="sm-entry-long" className="mt-2 space-y-2">
                    {smLongWindows.length === 0 ? (
                      <span className="text-gray-500 dark:text-gray-400">
                        No swing/long windows.
                      </span>
                    ) : (
                      smLongWindows.map((win, idx) => (
                        <div
                          key={`${win.date}-${win.start}-${idx}`}
                          className="rounded border border-accent dark:border-neon-cyan px-3 py-1 text-xs uppercase tracking-wide"
                        >
                          {`${win.date} — ${win.start} – ${win.end}${
                            win.label ? ` · ${win.label}` : ''
                          }`}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )}
          <Card>
            <h3 className="text-lg font-semibold">Market Entry Windows (SM)</h3>
            <div className="mt-3 space-y-4 text-sm">
              <div>
                <p className="font-medium text-gray-700 dark:text-gray-200">
                  Intraday ({pkIntradayWindows.length})
                </p>
                <div
                  data-testid="pk-entry-intraday"
                  className="mt-2 space-y-2"
                >
                  {pkIntradayWindows.length === 0 ? (
                    <span className="text-gray-500 dark:text-gray-400">
                      No intraday windows.
                    </span>
                  ) : (
                    pkIntradayWindows.map((win, idx) => (
                      <div
                        key={`${win.date}-${win.start}-${idx}`}
                        className="rounded border border-accent dark:border-neon-cyan px-3 py-1 text-xs uppercase tracking-wide"
                      >
                        {`${win.date} — ${win.start} – ${win.end}`}
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div>
                <p className="font-medium text-gray-700 dark:text-gray-200">
                  Swing/Long ({pkLongWindows.length})
                </p>
                <div data-testid="pk-entry-long" className="mt-2 space-y-2">
                  {pkLongWindows.length === 0 ? (
                    <span className="text-gray-500 dark:text-gray-400">
                      No swing/long windows.
                    </span>
                  ) : (
                    pkLongWindows.map((win, idx) => (
                      <div
                        key={`${win.date}-${win.start}-${idx}`}
                        className="rounded border border-accent dark:border-neon-cyan px-3 py-1 text-xs uppercase tracking-wide"
                      >
                        {`${win.date} — ${win.start} – ${win.end}`}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <EntryWindowsPanel
          intradayWindows={legacyIntradayWindows}
          longWindows={legacyLongWindows}
        />
      )}
      <YogaAdviceList items={data.yoga_advice} />
      {diagnostics && (
        <div>
          <div className="flex border-b border-accent/60 dark:border-neon-cyan/40" role="tablist">
            <button
              type="button"
              onClick={() => setTab('overview')}
              role="tab"
              aria-selected={tab === 'overview'}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors focus:outline-none ${
                tab === 'overview'
                  ? 'border-accent text-gray-900 dark:text-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => setTab('advanced')}
              role="tab"
              aria-selected={tab === 'advanced'}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors focus:outline-none ${
                tab === 'advanced'
                  ? 'border-accent text-gray-900 dark:text-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              Advanced
            </button>
          </div>
          {tab === 'advanced' && (
            <div role="tabpanel" className="mt-3">
              <AdvancedDiagnostics
                houses={diagnostics.houses ?? {}}
                psych={diagnostics.psych_karakas ?? { balance_index: 0, jupiter_rahu_balance: 0 }}
                lossPressure={diagnostics.loss_pressure ?? { flag: false, reasons: [] }}
                redFlags={diagnostics.red_flags ?? []}
                transit={diagnostics.transit}
                dasha={diagnostics.dasha}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
