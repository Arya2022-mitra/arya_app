export interface TimeWindow {
  start: number;
  end: number;
}

export interface MarketWindow extends TimeWindow {
  crossMidnight: boolean;
}

export const GLOBAL_START = '09:15';
export const GLOBAL_END = '15:30';

