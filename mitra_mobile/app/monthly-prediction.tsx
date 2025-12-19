
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { ScrollView, View, Text, StyleSheet, Image, RefreshControl, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as SecureStore from 'expo-secure-store';
import { useSession } from '../shared/context/SessionContext';
import { fetchApi } from '../lib/fetchApi';
import { colors, fonts } from '../constants/theme';
import AiSummary from './components/daily-prediction/AiSummary'; // Re-using this for now
import MonthlyDivineSummary from './components/monthly-prediction/MonthlyDivineSummary';
import MonthlySpecialDates from './components/monthly-prediction/MonthlySpecialDates';

// --- TYPE DEFINITIONS based on frontend_reference/web/hooks/useMonthlySummary.ts ---

interface GoldenDate {
  date: string;
  start_time?: string;
  end_time?: string;
  score?: number;
}

interface ChandrashtamaPeriod {
  date?: string;
  start_time?: string;
  end_time?: string;
  current_nakshatra?: string;
}

interface MonthlySummaryData {
  safe_payload: {
    month_key: string;
    month_name: string;
    overall_score: number;
    verdict: string;
    top_domains: Array<{
      name: string;
      display_name: string;
      score: number;
      outlook: string;
      reason_short: string;
    }>;
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

const getDefaultMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export default function MonthlyPredictionPage() {
  const { t } = useTranslation();
  const { profile, token } = useSession();
  const [monthlyData, setMonthlyData] = useState<MonthlySummaryData | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [month, setMonth] = useState<string>(getDefaultMonth);

  const loadMonthlyPredictions = useCallback(async (forceRefresh = false) => {
    if (!profile || !token) {
      setError("You must be logged in to view predictions.");
      setLoadingData(false);
      return;
    }

    setLoadingData(true);
    setError(null);

    const params = new URLSearchParams({
      profile_id: String(profile.id),
      locale: 'en', // TODO: use i18n language
      month: month,
    });
    if (forceRefresh) {
        params.set('refresh', '1');
    }

    const { ok, data, error: apiError } = await fetchApi<MonthlySummaryData>(
      `/api/monthly-summary?${params.toString()}`
    );

    if (ok && data) {
      setMonthlyData(data);
    } else {
      setError(apiError || 'Failed to load monthly predictions.');
    }
    setLoadingData(false);
  }, [profile, token, month]);

  useEffect(() => {
    loadMonthlyPredictions();
  }, [loadMonthlyPredictions]);
  
  // Logic to save data for the widget
  useEffect(() => {
    if (monthlyData) {
      if (monthlyData.golden_dates_summary?.golden_dates) {
          SecureStore.setItemAsync('goldenDates', JSON.stringify(monthlyData.golden_dates_summary.golden_dates));
      }
      if (monthlyData.chandrashtama_periods) {
          SecureStore.setItemAsync('chandrashtamaPeriods', JSON.stringify(monthlyData.chandrashtama_periods));
      }
    }
  }, [monthlyData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMonthlyPredictions(true);
    setRefreshing(false);
  }, [loadMonthlyPredictions]);

  const monthLabel = useMemo(() => {
      try {
          const [year, monthNum] = month.split('-');
          const date = new Date(parseInt(year), parseInt(monthNum) - 1);
          return new Intl.DateTimeFormat(undefined, {
              year: 'numeric',
              month: 'long',
          }).format(date);
      } catch {
          return month;
      }
  }, [month]);

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors['neon-cyan']} />}
    >
      <View style={styles.header}>
        <Image source={require('../assets/images/logo.png')} style={styles.logo} />
        <Text style={styles.title}>{t('monthlyPrediction.title', 'Monthly Quantum Guidance')}</Text>
        <Text style={styles.subtitle}>{t('monthlyPrediction.subtitle', 'Cosmic insights for your month ahead.')}</Text>
        {/* TODO: Add a month picker here */}
        <Text style={styles.dateLabel}>{monthLabel}</Text>
      </View>

      <View style={styles.contentContainer}>
        <AiSummary 
            summary={monthlyData?.one_line || ''} 
            loading={loadingData} 
            error={error} 
            narration={monthlyData?.narration}
        />

        {monthlyData && (
            <>
                <MonthlyDivineSummary summary={monthlyData} />
                <MonthlySpecialDates 
                    goldenDates={monthlyData.golden_dates_summary?.golden_dates || []}
                    chandrashtamaPeriods={monthlyData.chandrashtama_periods || []}
                    dasha={monthlyData.dasha_summary}
                />
            </>
        )}
        
        {loadingData && !monthlyData && (
            <Text style={styles.loadingText}>Gathering monthly layers...</Text>
        )}

        {error && (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        )}

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors['neo-dark'],
  },
  header: {
    alignItems: 'center',
    padding: 24,
    paddingTop: Platform.OS === 'android' ? 48 : 24,
    borderBottomWidth: 1,
    borderBottomColor: colors['neon-cyan'],
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    fontFamily: fonts.orbitron,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    marginTop: 8,
    fontFamily: fonts.poppins,
  },
  dateLabel: {
    fontSize: 18,
    color: colors['neon-cyan'],
    textAlign: 'center',
    marginTop: 16,
    fontFamily: fonts.orbitron,
  },
  contentContainer: {
    padding: 16,
  },
  loadingText: {
      color: colors.text,
      textAlign: 'center',
      marginTop: 20,
      fontFamily: fonts.poppins,
  },
  errorContainer: {
      backgroundColor: colors.input,
      borderRadius: 8,
      padding: 16,
      marginVertical: 16,
  },
  errorText: {
      color: colors.danger,
      fontFamily: fonts.poppins,
      textAlign: 'center',
  }
});
