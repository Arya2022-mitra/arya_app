import { useMemo } from 'react';

interface GoldenDate {
  date: string;
  start_time?: string;
  end_time?: string;
  score?: number;
  reasons?: Record<string, boolean>;
  windows?: any[];
}

interface ChandrashtamaDate {
  date?: string;
  start_time?: string;
  end_time?: string;
  current_nakshatra?: string;
}

interface SpecialDatesData {
  golden_dates: GoldenDate[];
  chandrashtama_dates: ChandrashtamaDate[];
  chandrashtama_periods: ChandrashtamaDate[];
}

interface UseMonthlySpecialDatesOptions {
  monthlySummaryData: any; // The monthly summary data that's already fetched
}

// Helper to extract golden dates from monthly summary
function extractGoldenDates(data: any): GoldenDate[] {
  if (!data) return [];
  
  // Priority 1: Check top-level golden_dates_summary (monthly-summary API format)
  if (data.golden_dates_summary?.golden_dates && Array.isArray(data.golden_dates_summary.golden_dates)) {
    return data.golden_dates_summary.golden_dates;
  }

  // Priority 2: Check nested in predictions/safe_payload (legacy format)
  const predictions = data.predictions || data.fusion_json || data.safe_payload || data || {};
  const goldenSummary = predictions.golden_dates_summary || {};
  const pakshiData = predictions.pakshi_muhurta || {};
  
  if (Array.isArray(goldenSummary.golden_dates) && goldenSummary.golden_dates.length > 0) {
    return goldenSummary.golden_dates;
  }
  if (Array.isArray(pakshiData.golden_dates) && pakshiData.golden_dates.length > 0) {
    return pakshiData.golden_dates;
  }
  if (Array.isArray(pakshiData.golden_windows)) {
    return pakshiData.golden_windows;
  }
  return [];
}

// Helper to extract chandrashtama data from monthly summary
function extractChandrashtamaData(data: any): { dates: ChandrashtamaDate[], periods: ChandrashtamaDate[] } {
  if (!data) return { dates: [], periods: [] };

  // Priority 1: Check top-level chandrashtama fields (monthly-summary API format)
  const predictions = data.predictions || data.fusion_json || data.safe_payload || data || {};
  const days = data.chandrashtama_days ?? predictions.chandrashtama_days ?? [];
  const periods = data.chandrashtama_periods ?? predictions.chandrashtama_periods ?? [];

  return {
    dates: Array.isArray(days) ? days.map((d: string) => ({ date: d })) : [],
    periods: Array.isArray(periods) ? periods : [],
  };
}

/**
 * Extract special dates (golden dates and chandrashtama periods) from monthly summary data.
 * This hook does NOT make API calls - it extracts data from the monthly summary that's already fetched.
 */
export function useMonthlySpecialDates({
  monthlySummaryData,
}: UseMonthlySpecialDatesOptions) {
  const data = useMemo<SpecialDatesData | null>(() => {
    if (!monthlySummaryData) {
      return null;
    }

    try {
      // Extract special dates using helper functions
      const goldenDates = extractGoldenDates(monthlySummaryData);
      const { dates, periods } = extractChandrashtamaData(monthlySummaryData);

      return {
        golden_dates: goldenDates || [],
        chandrashtama_dates: dates || [],
        chandrashtama_periods: periods || [],
      };
    } catch (err) {
      console.error('Error extracting special dates from monthly summary:', err);
      return null;
    }
  }, [monthlySummaryData]);

  return {
    data,
    loading: false, // No loading state since we're not making API calls
    error: null,    // No error state since we're just extracting data
    refetch: () => {}, // No-op since we're not making API calls
  };
}
