
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { ScrollView, View, Text, StyleSheet, Image, TouchableOpacity, RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as SecureStore from 'expo-secure-store';
import { useSession } from '../shared/context/SessionContext';
import { fetchApi } from '../lib/fetchApi';
import { colors, fonts } from '../constants/theme';
import AiSummary from './components/daily-prediction/AiSummary';
import QuickDecisions from './components/daily-prediction/QuickDecisions';
import TimeWindowCard from './components/daily-prediction/TimeWindowCard';
import SpecialMuhurtas from './components/daily-prediction/SpecialMuhurtas';
import CurrentTimeWindow from './components/daily-prediction/CurrentTimeWindow';

// Define the types for our data
interface TimeWindow {
  title: string;
  time: string; // e.g., "08:00 AM - 10:00 AM"
  category: string;
  score: number;
  interpretation: string;
  practical: string;
  pakshi: string;
  tara: string;
}

interface QuickDecision {
    answer: 'YES' | 'NO' | 'MAYBE';
    reason: string;
}

interface DailyPredictionResponse {
  summary: string;
  quickDecisions: {
    takeNewInitiative: QuickDecision;
    giveAskMoney: QuickDecision;
    talkWithStrangers: QuickDecision;
  };
  timeWindows: TimeWindow[];
  specialMuhurtas: {
    label: string;
    time: string;
    impact: string;
  }[];
}

// Function to find the current time window
const findCurrentTimeWindow = (windows: TimeWindow[]): TimeWindow | null => {
    const now = new Date();
    for (const window of windows) {
        const [startTime, endTime] = window.time.split(' - ').map(t => {
            const [time, modifier] = t.split(' ');
            let [hours, minutes] = time.split(':').map(Number);
            if (modifier === 'PM' && hours < 12) hours += 12;
            if (modifier === 'AM' && hours === 12) hours = 0;
            const date = new Date();
            date.setHours(hours, minutes, 0, 0);
            return date;
        });

        if (now >= startTime && now <= endTime) {
            return window;
        }
    }
    return null;
};

export default function DailyPredictionPage() {
  const { t } = useTranslation();
  const { profile, token } = useSession();
  const [dailyData, setDailyData] = useState<DailyPredictionResponse | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadPredictions = useCallback(async () => {
    if (!profile || !token) {
      setError("You must be logged in to view predictions.");
      setLoadingData(false);
      return;
    }

    setLoadingData(true);
    setError(null);

    const { ok, data, error: apiError } = await fetchApi<DailyPredictionResponse>(
      `/api/daily-prediction/${profile.id}`
    );

    if (ok && data) {
      setDailyData(data);
    } else {
      setError(apiError || 'Failed to load predictions.');
    }
    setLoadingData(false);
  }, [profile, token]);

  useEffect(() => {
    loadPredictions();
  }, [loadPredictions]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPredictions();
    setRefreshing(false);
  }, [loadPredictions]);

  const currentTimeWindow = useMemo(() => {
      if (!dailyData) return null;
      return findCurrentTimeWindow(dailyData.timeWindows);
  }, [dailyData]);

  useEffect(() => {
    if (currentTimeWindow) {
      SecureStore.setItemAsync('currentTimeWindow', JSON.stringify(currentTimeWindow));
    }
  }, [currentTimeWindow]);

  const todayLabel = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(new Date());
    } catch {
      return new Date().toDateString();
    }
  }, []);

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Image source={require('../assets/images/logo.png')} style={styles.logo} />
        <Text style={styles.title}>{t('dailyPrediction.hero.title', { name: profile?.first_name || 'User' })}</Text>
        <Text style={styles.subtitle}>{t('dailyPrediction.hero.subtitle')}</Text>
        <Text style={styles.dateLabel}>{todayLabel}</Text>
      </View>

      <View style={styles.contentContainer}>
        {dailyData && <CurrentTimeWindow window={currentTimeWindow} />}
        <AiSummary summary={dailyData?.summary || ''} loading={loadingData} error={error} />
        {dailyData && <QuickDecisions decisions={dailyData.quickDecisions} />}

        <View style={styles.noteContainer}>
          <Text style={styles.noteTitle}>{t('dailyPrediction.note.title')}</Text>
          <Text style={styles.noteMessage}>{t('dailyPrediction.note.message')}</Text>
        </View>

        {dailyData && <SpecialMuhurtas muhurtas={dailyData.specialMuhurtas} />}

        {dailyData && (
            <View style={styles.timeWindowsContainer}>
                <Text style={styles.sectionTitle}>Time Windows</Text>
                {dailyData.timeWindows.map((window, index) => (
                    <TimeWindowCard key={index} window={window} />
                ))}
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
    borderBottomWidth: 1,
    borderBottomColor: colors['neon-cyan'],
  },
  logo: {
    width: 100,
    height: 100,
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
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
    marginTop: 8,
    fontFamily: fonts.poppins,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  noteContainer: {
    backgroundColor: colors.input,
    borderRadius: 8,
    padding: 16,
    marginVertical: 16,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    fontFamily: fonts.poppins,
    textAlign: 'center',
    marginBottom: 8,
  },
  noteMessage: {
    fontSize: 14,
    color: colors.text,
    fontFamily: fonts.poppins,
    textAlign: 'center',
  },
  timeWindowsContainer: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors['neon-cyan'],
    fontFamily: fonts.orbitron,
    marginBottom: 16,
  },
});
