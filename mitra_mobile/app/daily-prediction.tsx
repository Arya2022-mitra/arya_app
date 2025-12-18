
import React, { useMemo, useState, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts } from '../constants/theme';
import AiSummary from './components/daily-prediction/AiSummary';
import QuickDecisions from './components/daily-prediction/QuickDecisions';
import TimeWindowCard from './components/daily-prediction/TimeWindowCard';
import SpecialMuhurtas from './components/daily-prediction/SpecialMuhurtas';
import CurrentTimeWindow from './components/daily-prediction/CurrentTimeWindow';

// Define the types for our data
interface TimeWindow {
  title: string;
  time: string;
  category: string;
  score: number;
  interpretation: string;
  practical: string;
  pakshi: string;
  tara: string;
}

const mockDailyData = {
  summary: "Today's cosmic energies suggest a focus on introspection and personal growth. It's a favorable time for planning and strategizing, but less so for initiating new ventures. Pay attention to your intuition.",
  quickDecisions: {
    takeNewInitiative: { answer: 'NO', reason: 'The stars indicate a period of reflection, not action. New beginnings are best postponed.' },
    giveAskMoney: { answer: 'YES', reason: 'Financial matters are favored, but proceed with caution and clarity.' },
    talkWithStrangers: { answer: 'NO', reason: 'Communication may be fraught with misunderstandings today. Stick to familiar company.' },
  },
  timeWindows: [
    { title: 'Window of Opportunity', time: '08:00 AM - 10:00 AM', category: 'Productive', score: 85, interpretation: 'A highly favorable period for tackling difficult tasks and making progress on your goals.', practical: 'Use this time for focused work and important meetings.', pakshi: 'Ruling', tara: 'Sampat' },
    { title: 'Period of Caution', time: '02:30 PM - 04:00 PM', category: 'Challenging', score: 45, interpretation: 'You may encounter obstacles and communication breakdowns. Patience is key.', practical: 'Avoid making important decisions or having sensitive conversations.', pakshi: 'Eating', tara: 'Vipat' },
    { title: 'Neutral Zone', time: '06:00 PM - 07:30 PM', category: 'Neutral', score: 65, interpretation: 'A relatively stable period with no major positive or negative influences. Good for routine tasks.', practical: 'Use this time for errands, chores, or other everyday activities.', pakshi: 'Walking', tara: 'Kshema' },
  ],
  specialMuhurtas: [
    { label: 'Rahu Kalam', time: '10:30 AM - 12:00 PM', impact: 'Inauspicious' },
    { label: 'Yamagandam', time: '01:30 PM - 03:00 PM', impact: 'Avoid new beginnings' },
    { label: 'Abhijit Muhurtha', time: '12:00 PM - 12:45 PM', impact: 'Highly Favorable' },
  ],
};

export default function DailyPredictionPage() {
  const { t } = useTranslation();
  const [dailyData, setDailyData] = useState(mockDailyData);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTimeWindow, setCurrentTimeWindow] = useState<TimeWindow | null>(null);

  useEffect(() => {
    // In a real application, you would determine the current time window based on the current time.
    // For this example, we'll just select the first time window.
    if (dailyData.timeWindows.length > 0) {
      setCurrentTimeWindow(dailyData.timeWindows[0]);
    }
  }, [dailyData]);

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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image source={require('../assets/images/logo.png')} style={styles.logo} />
        <Text style={styles.title}>{t('dailyPrediction.hero.title', { name: 'User' })}</Text>
        <Text style={styles.subtitle}>{t('dailyPrediction.hero.subtitle')}</Text>
        <Text style={styles.dateLabel}>{todayLabel}</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={() => {}}>
          <Text style={styles.refreshButtonText}>Refresh Predictions</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.contentContainer}>
        <CurrentTimeWindow window={currentTimeWindow} />
        <AiSummary summary={dailyData.summary} loading={loadingData} error={error} />
        <QuickDecisions decisions={dailyData.quickDecisions} />

        <View style={styles.noteContainer}>
          <Text style={styles.noteTitle}>{t('dailyPrediction.note.title')}</Text>
          <Text style={styles.noteMessage}>{t('dailyPrediction.note.message')}</Text>
        </View>

        <SpecialMuhurtas muhurtas={dailyData.specialMuhurtas} />

        <View style={styles.timeWindowsContainer}>
          <Text style={styles.sectionTitle}>Time Windows</Text>
          {dailyData.timeWindows.map((window, index) => (
            <TimeWindowCard key={index} window={window} />
          ))}
        </View>
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
  refreshButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors['neon-cyan'],
    borderRadius: 20,
  },
  refreshButtonText: {
    color: colors['neon-cyan'],
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
