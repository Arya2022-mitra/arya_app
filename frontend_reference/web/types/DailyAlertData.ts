import type { Gating } from './Gating';

export interface TithiEntry {
  tithi: string;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  paksha?: string;
  is_pournami?: boolean;
  is_amavasya?: boolean;
  is_ekadashi?: boolean;
  is_ashtami?: boolean;
  is_navami?: boolean;
  tithi_good_bad?: 'good' | 'bad';
}

/**
 * Mapping of ``year -> month -> [TithiEntry]``. Months are zero padded
 * two-digit strings ("01".."12").
 */
export type TithiSummaryByMonth = Record<string, Record<string, TithiEntry[]>>;

/** Legacy structure mapping "Month YYYY" to tithi type arrays */
export type TithiSummaryByLabel = Record<string, Record<string, string[]>>;

export interface PakshiMuhurtaWindow {
  date?: string;
  start?: string;
  end?: string;
}

/** Segment entry returned by the `/api/pakshi-muhurta` endpoint */
export interface PakshiSegment {
  /** ISO date for the segment */
  date?: string;
  /** ISO or formatted start time */
  start?: string;
  /** ISO or formatted end time */
  end?: string;
  /** Normalised state label */
  state?: 'Ruling' | 'Eating' | 'Walking' | 'Sleeping' | 'Dying';
  /** Legacy activity label (Rule/Eat/Walk) */
  activity?: string;
  /** @deprecated Unused by UI; kept for backward compatibility */
  half?: string;
}

/** Lightweight start/end window pair */
export interface TimeWindow {
  start: string;
  end: string;
}

export type GDWindow = {
  start: string;
  end: string;
  state?: 'Ruling' | 'Eating' | 'Walking' | 'Sleeping' | 'Dying';
  /** Legacy activity label */
  activity?: string;
  /** Minutes from midnight for the clamped start time */
  startMinutes?: number;
  /** Minutes from midnight for the clamped end time */
  endMinutes?: number;
};

export interface GoldenDate {
  date: string;
  windows: GDWindow[];
}

export interface Inauspicious {
  start: string;
  end: string;
  type?: string;
}

export interface PakshiMuhurta {
  /** ISO date for this entry */
  date?: string;
  /** Recommended time windows for the day */
  pakshi_windows_best?: PakshiSegment[];
  /** Complete list of calculated windows */
  pakshi_windows_all?: PakshiSegment[];
  /** Metadata describing how the windows were filtered */
  filters?: { policy?: string; tara_no?: number; is_chandrashtama?: boolean };
  /** Fallback source for Tara number */
  star?: { tara_no?: number };
  /** Fallback source for Chandrashtama flag */
  chandrashtama?: { is_chandrashtama?: boolean };
  /** Legacy structure grouping windows under `segments` */
  segments?: PakshiSegment[];
  /** Legacy fields retained for backward compatibility */
  auspicious?: PakshiMuhurtaWindow[];
  inauspicious?: PakshiMuhurtaWindow[];
  [key: string]: any;
}

/** Daily entry used by monthly Pakshi data */
export interface PakshiMonthDay {
  /** ISO date string for this day */
  date: string;
  /** Metadata describing the filtering policy */
  filters?: { tara_no?: number; is_chandrashtama?: boolean; policy?: string };
  /** Fallback source for Tara number */
  star?: { tara_no?: number };
  /** Fallback source for Chandrashtama flag */
  chandrashtama?: { is_chandrashtama?: boolean };
  /** Recommended time windows for the day */
  pakshi_windows_best?: PakshiSegment[];
  /** Complete list of calculated windows */
  pakshi_windows_all?: PakshiSegment[];
  /** Legacy structure grouping windows under `segments` */
  segments?: PakshiSegment[];
}

/** Monthly Pakshi muhurta data */
export interface PakshiMonth {
  /** Month number (1-12) */
  month: number;
  /** Four-digit year */
  year: number;
  /** Data for each day of the month */
  pakshi_muhurta: PakshiMonthDay[];
}

export interface MoonCycleDataType {
  /** Tithi name, e.g. "Ekadashi" */
  tithi?: string | object;
  /** Ordinal tithi number */
  tithi_number?: number;
  /** ISO timestamp when the tithi starts */
  tithi_start?: string;
  /** ISO timestamp when the tithi ends */
  tithi_end?: string;
  /** Verdict for the current tithi */
  tithi_good_bad?: 'good' | 'bad';
  /** Explanation for the tithi verdict */
  tithi_verdict_reason?: string;
  /**
   * Daily tithi summary with `tithi`, `start` and `end` fields.
   * Monthly data uses `tithi_summary_monthly` instead.
   */
  tithi_summary?: TithiSummaryByMonth | TithiSummaryByLabel;
  /** List of tithi entries for the current month */
  tithi_summary_monthly?: TithiEntry[];
  /** Rahukaalam range */
  rahukaalam?: { start?: string; end?: string };
  /** Yamagandam range */
  yamagandam?: { start?: string; end?: string };
  gulika?: string | { start?: string; end?: string } | { start?: string; end?: string }[];
  gulika_kaalam?: string | { start?: string; end?: string } | { start?: string; end?: string }[];
  /** Abhijit muhurta range */
  abhijit_muhurta?:
    | string
    | string[]
    | { start?: string; end?: string }
    | { start?: string; end?: string }[];
  /** Durmuhurta ranges */
  durmuhurta?:
    | { start?: string; end?: string }
    | { start?: string; end?: string }[];
  brahma_muhurta?: string | string[] | { start?: string; end?: string } | { start?: string; end?: string }[];
  pratah_sandhya?: string | string[] | { start?: string; end?: string } | { start?: string; end?: string }[];
  vijaya_muhurta?: string | string[] | { start?: string; end?: string } | { start?: string; end?: string }[];
  godhuli_muhurta?: string | string[] | { start?: string; end?: string } | { start?: string; end?: string }[];
  sayahna_sandhya?: string | string[] | { start?: string; end?: string } | { start?: string; end?: string }[];
  nishita_muhurta?: string | string[] | { start?: string; end?: string } | { start?: string; end?: string }[];
  amrit_kalam?: string | string[] | { start?: string; end?: string } | { start?: string; end?: string }[];
  varjyam?: string | string[] | { start?: string; end?: string } | { start?: string; end?: string }[];
  bhadra?: string | { start?: string; end?: string } | { start?: string; end?: string }[];
  aadala_yoga?: string | { start?: string; end?: string } | { start?: string; end?: string }[];
  vidala_yoga?: string | { start?: string; end?: string } | { start?: string; end?: string }[];
  baana?: string | { start?: string; end?: string } | { start?: string; end?: string }[];
  choghadiya?: {
    day?: { name?: string; start?: string; end?: string }[];
    night?: { name?: string; start?: string; end?: string }[];
  };
  is_ekadashi?: boolean;
  /** Returns true when the twelfth tithi (Dwadashi) spans the day */
  is_dwadashi?: boolean;
  is_ashtami?: boolean;
  is_navami?: boolean;
  is_pournami?: boolean;
  is_amavasya?: boolean;
  /** Islamic New Year indicator */
  is_muharram?: boolean;
  /** Travel is auspicious on this date */
  is_good_for_travel?: boolean;
  /** Good day to get married */
  is_good_for_marriage?: boolean;
  /** Launching a business is favoured */
  is_good_for_business_start?: boolean;
  /** Suitable for housewarming ceremonies */
  is_good_for_housewarming?: boolean;
  /** Moon sign for the day */
  moon_sign?: string;
  /**
   * Additional flags may be returned depending on backend
   * calculations. These include markers such as `is_dwadashi`,
   * `is_muharram` or the various `is_good_for_*` fields.
   */
  [key: string]: any;
}

export interface PanchangDataType {
  sunrise?: string;
  sunset?: string;
  /** Tithi name as provided by the Panchang engine */
  tithi_name?: string;
  /** Ordinal tithi number */
  tithi_number?: number;
  /** Current tithi text */
  tithi?: string;
  /** Nakshatra name */
  nakshatra_name?: string;
  /** Nakshatra lord */
  nakshatra_lord?: string;
  /** Alternate nakshatra text if returned */
  nakshatra?: string;
  /** Moon sign for the day */
  moon_sign?: string;
  /** Janma rasi (same as moon sign) */
  janma_rasi?: string;
  /** Index of janma rasi */
  janma_rasi_index?: number;
  /** Sun sign */
  sun_sign?: string;
  shaka_samvat?: string;
  vikram_samvat?: string;
  lunar_month?: string;
  rahukaalam?: { start?: string; end?: string };
  yamagandam?: { start?: string; end?: string };
  abhijit_muhurta?:
    | { start?: string; end?: string }
    | { start?: string; end?: string }[]
    | string
    | string[];
  durmuhurta?:
    | { start?: string; end?: string }
    | { start?: string; end?: string }[];
  /** Additional keys from the backend are allowed */
  [key: string]: any;
}

export interface ExtendedPrediction {
  moon_cycle_data?: MoonCycleDataType;
  tithi_summary?: TithiSummaryByMonth | TithiSummaryByLabel;
  /** Optional ISO date string for the prediction */
  date?: string;
  /** Formatted start–end time for the day's tithi */
  tithi_block?: string;
}

export interface ProtectionPublicData {
  protection_level: string;
  ishta_devata_name: string;
  dharma_devata_name: string;
  foundation_lagnesha_devata: string;
  foundation_rashi_lord_devata: string;
  foundation_display: string;
  mahavidya_deity: string;
  schema_version: string;
}

export interface ProtectionData {
  public?: ProtectionPublicData;
  summary?: { [key: string]: any };
  public_ready?: boolean;
  schema_version?: string;
  [key: string]: any;
}

export interface ProofChainEntry {
  check: string;
  [key: string]: any;
}

export interface BlackMagicData {
  available?: boolean;
  status?: string;
  summary?: string;
  verdict?: string;
  decision?: { verdict?: string; score?: number };
  risk_score?: number;
  tamasic_vulnerability_score?: number;
  vulnerability_score?: number;
  reasons?: string[];
  triad?: {
    badhakesh6?: boolean;
    al?: boolean;
    al_confirmed?: boolean;
    d30_confirmed?: boolean;
    [key: string]: any;
  };
  afflictions?: any[];
  proof_chain?: (string | Record<string, any>)[];
  attacker_profile?: Record<string, any>;
  policy?: string | string[] | null;
  generated_at?: string;
  confidence?: number;
  [key: string]: any;
}

export interface ShareMarketData {
  final_verdict?: 'BUY_WINDOW' | 'CAUTION' | 'DO_NOT_TRADE';
  /** Canonical guidance string from the engine. */
  advice_note?: string | null;
  gating?: Gating;
  reasons?: string[];
  blocked_by?: string[];
  sector_recommendation?: {
    recommended: string[];
    avoid: string[];
    reason_tags: Record<string, string[]>;
    scores?: Record<string, 0 | 1 | 2>;
  };
  buy_windows?: (TimeWindow & { ruler?: string; reasons?: string[] })[];
  timings?: TimeWindow;
  golden_dates?: GoldenDate[];
  golden_dates_count?: number;
  /**
   * Indicates the origin of `golden_dates`. When populated from
   * monthly summaries or Pakshi data the original ShareMarket
   * windows may be preserved under `share_market_golden_dates`.
   */
  golden_dates_source?: 'share_market' | 'golden_dates_summary' | 'pakshi_muhurta_month';
  /** Original golden-date windows from the share market payload */
  share_market_golden_dates?: GoldenDate[];
  /** Count of original share market golden dates */
  share_market_golden_dates_count?: number;
  monthly_summary?: Record<string, any>;
  auspicious_times?: PakshiMuhurtaWindow[];
  inauspicious_times?: Inauspicious[];
  yoga_advice?: { name: string; tags: string[]; sector_bias: string[]; caution_notes: string[] }[];
  diagnostics?: any;
  chandrashtama_days?: string[];
}

export interface PakshiDaySummary {
  slots?: any;
  [key: string]: any;
}

export interface PakshiPredictionSummary {
  text?: string;
  pakshi?: string;
  mood?: string;
  activity?: string;
  today?: PakshiDaySummary;
  [key: string]: any;
}

export interface PakshiEngineSummary {
  today?: PakshiDaySummary;
  activity_chart?: any;
  [key: string]: any;
}

export interface DailyAlertData {
  /**
   * Full prediction payload returned by the engine.
   * All non-metadata fields are nested under this object.
   */
  data?: Record<string, any>;

  /** Database identifier when the prediction is persisted */
  id?: number;

  /** Associated profile identifier */
  profile_id?: number;

  /** ISO date string for the prediction */
  date?: string;

  auspiciousness_score?: number;
  sunrise_time?: string;
  sunset_time?: string;
  /** Moon sign for the day */
  moon_sign?: string;
  moon_cycle_data?: MoonCycleDataType;
  nakshatra?: string;
  tithi?: string;
  tithi_number?: number;
  paksha?: string;
  is_amavasya?: boolean;
  is_pournami?: boolean;
  is_ekadashi?: boolean;
  is_ashtami?: boolean;
  is_navami?: boolean;
  birth_star?: string;
  dasha_summary?: Record<string, any>;
  mandi_time?: string;
  gulika_time?: string;
  gulika_good_time?: string;
  bad_time?: string;
  focus_bhava?: string;
  mind_mode?: string;
  lagna?: string;
  pakshi?: string | PakshiPredictionSummary;
  pakshi_engine?: PakshiEngineSummary;
  /**
   * Pakshi muhurta windows expressed via `auspicious` and `inauspicious`
   * time ranges.
   */
  pakshi_muhurta?: PakshiMuhurta;
  /** Monthly Pakshi muhurta data */
  pakshi_muhurta_month?: PakshiMonth | PakshiMonthDay[];
  /** Recommended Pakshi windows for the day */
  pakshi_windows_best?: PakshiSegment[];
  /** Complete list of computed Pakshi windows */
  pakshi_windows_all?: PakshiSegment[];
  /** Metadata describing the filtering policy */
  filters?: { policy?: string; tara_no?: number; is_chandrashtama?: boolean };
  /** Fallback source for Tara number */
  star?: { tara_no?: number };
  /** Fallback source for Chandrashtama flag */
  chandrashtama?: { is_chandrashtama?: boolean };
  lucky_number?: string;
  lucky_colour?: string;
  good_time?: any;
  /** Overall career forecast verdict */
  career_verdict?: string;
  /** Reason for the given career verdict */
  career_reason?: string;
  /** Best hora of the day for career matters */
  career_best_hora?: string;
  good_hora_timing?: string;
  bad_hora_timing?: string;
  /** Formatted start–end time for the day's tithi */
  tithi_block?: string;
  /** @deprecated Use `data.blocks` instead */
  blocks?: Record<string, [string, string]>;
  /** @deprecated Use `data.good_pct` instead */
  good_pct?: number;
  /** @deprecated Use `data.final_score` instead */
  final_score?: number;
  chandrashtama_today?: boolean;
  chandrashtama_dates?: string[];
  dosha_list?: string[];
  remedy_list?: string[];
  black_magic?: BlackMagicData | null;
  tamasic_summary?: Record<string, any> | null;
  energy_disturbance?: {
    disturbance_score?: number;
    reasons?: string[];
    [key: string]: any;
  };
  gochar?: any;
  hora?: string;
  kundali_strength?: string | number;
  mental_strength?: string | number;
  negative_yoga?: string;
  positive_yoga?: string;
  gochar_calculator?: Record<string, any>;
  hora_calculator?: Record<string, any>;
  kundali_strength_calculator?: Record<string, any>;
  master_calculator?: Record<string, any>;
  mind_personality_calculator?: Record<string, any>;
  negative_affliction_calculator?: Record<string, any>;
  score_calculator?: Record<string, any>;
  time_karma_calculator?: Record<string, any>;
  yoga_calculator?: Record<string, any>;
  gendered_yoga?: object | object[] | string;
  yoga_dasha?: object | object[] | string;
  yoga?: object | object[] | string;
  yoga_gochar?: object | object[] | string;
  yoga_master?: object | object[] | string;
  yoga_navamsa?: object | object[] | string;
  karma?: string;
  over_all?: any;
  over_all_score?: any;
  travels?: string;
  business?: string;
  career?: string;
  finance?: string;
  legal?: string;
  education?: string;
  love?: string;
  ghost?: string;
  drishti?: string;
  negative_energy?: string;
  protection?: string | ProtectionData;
  protection_engine?: string | Record<string, any>;
  numerology?: Record<string, any>;
  share_market?: ShareMarketData;
  golden_dates?: GoldenDate[];
  golden_dates_count?: number;
  domain_predictions?: Record<string, any>;
  mitraveda_advice?: Record<string, any>;
  divine_message?: Record<string, any>;
  alerts?: string[];
  /**
   * Yoga and muhurta information is now provided exclusively under
   * `moon_cycle_data`.
   */
  /** Daily tithi summary (name and range) */
  tithi_summary?: string;
  tithi_summary_monthly?: TithiEntry[];
  panchang?: PanchangDataType;
}
