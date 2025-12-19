import React, { useMemo, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts } from '../constants/theme';

const mockDailyData = {
  summary: "Today is a good day for new beginnings. Focus on your personal growth and spiritual well-being. You may feel a surge of creative energy.",
};

export default function DailyAlertsPage() {
  const { t } = useTranslation();
  const [dailyData] = useState(mockDailyData);
  const [loadingData] = useState(false);
  const [error] = useState(null);

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
        <Text style={styles.title}>{t('dailyPrediction.title')}</Text>
        <Text style={styles.subtitle}>{t('dailyPrediction.subtitle')}</Text>
        <Text style={styles.dateLabel}>{todayLabel}</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={() => {}}>
          <Text style={styles.refreshButtonText}>Refresh Predictions</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.sectionTitle}>AI Companion</Text>
        {loadingData && <ActivityIndicator size="large" color={colors["neon-cyan"]} />}
        {error && <Text style={styles.errorText}>{error}</Text>}
        {!loadingData && !error && (
          <View style={styles.aiSummaryContainer}>
            <Text style={styles.aiSummaryText}>{dailyData.summary}</Text>
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
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors['neon-cyan'],
    fontFamily: fonts.orbitron,
    marginBottom: 16,
  },
  aiSummaryContainer: {
    backgroundColor: colors.input,
    borderRadius: 8,
    padding: 16,
  },
  aiSummaryText: {
    color: colors.text,
    fontSize: 16,
    fontFamily: fonts.poppins,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    margin: 16,
  },
});
