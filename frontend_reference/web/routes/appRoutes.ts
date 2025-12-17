export const DAILY_PANCHANG_ROUTE = '/daily-panchang';
export const DAILY_ALERTS_ROUTE = '/daily-alerts';
export const DAILY_PREDICTION_ROUTE = '/daily-prediction';
export const TITHIS_ROUTE = '/tithis';
export const DASHA_ROUTE = '/dasha';
export const NUMEROLOGY_ROUTE = '/numerology';
export const TAMAS_ROUTE = '/tamas';
export const SHARE_MARKET_ASTRO_ROUTE = '/share-market-astro';
export const MONTHLY_PREDICTION_ROUTE = '/monthly-prediction';
export const BUSINESS_ROUTE = '/business';

export const SEGMENTS = [
  { key: 'daily-panchang', label: 'Daily Panchang', route: DAILY_PANCHANG_ROUTE },
  { key: 'daily-alerts', label: 'Daily Alerts', route: DAILY_ALERTS_ROUTE, disabled: true },
  { key: 'daily-prediction', label: 'Daily Guidance', route: DAILY_PREDICTION_ROUTE },
  { key: 'tithis', label: 'Tithis', route: TITHIS_ROUTE },
  { key: 'numerology', label: 'Numerology', route: NUMEROLOGY_ROUTE },
  {
    key: 'share-market',
    label: 'Share Market',
    route: SHARE_MARKET_ASTRO_ROUTE,
    analytics: 'nav_share_market',
  },
  {
    key: 'monthly-prediction',
    label: 'Monthly Guidance',
    route: MONTHLY_PREDICTION_ROUTE,
    analytics: 'nav_monthly_prediction',
  },
  { key: 'pakshi', label: 'Pakshi', disabled: true },
  { key: 'dasha', label: 'Dasha', route: DASHA_ROUTE },
  { key: 'business-job', label: 'Business/Job', route: BUSINESS_ROUTE },
  { key: 'education', label: 'Education', disabled: true },
  { key: 'marriage-love', label: 'Marriage/Love', disabled: true },
  { key: 'tamasic-alerts', label: 'Tamasic Alerts', route: TAMAS_ROUTE, disabled: true },
];
