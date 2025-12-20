export interface GoldenDate {
  date: string;
  start_time?: string;
  end_time?: string;
  score?: number;
}

export interface ChandrashtamaPeriod {
  date?: string;
  start_time?: string;
  end_time?: string;
  current_nakshatra?: string;
}

export interface MonthlySummaryData {
  safe_payload: {
    month_key: string;
    month_name: string;
    overall_score: number;
    verdict: string;
    top_domains: {
      name: string;
      display_name: string;
      score: number;
      outlook: string;
      reason_short: string;
    }[];
    weekly_summary: Record<string, {
      score: number;
      outlook: string;
      date_range: string;
    }>;
  };
  one_line: string;
  narration: string;
  golden_dates_summary?: {
    golden_dates: GoldenDate[];
  };
  chandrashtama_periods?: ChandrashtamaPeriod[];
  chandrashtama_days?: string[];
  dasha_summary?: {
    current?: {
      mahadasha?: string;
      antardasha?: string;
      pratyantardasha?: string;
    };
  };
}
