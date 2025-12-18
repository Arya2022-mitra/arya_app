import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts } from '../constants/theme';

const mockPanchangData = {
  tithi: 'Shukla Paksha, Pratipada',
  nakshatra: 'Ashwini',
  yoga: 'Vishkambha',
  karana: 'Kimstughna',
  sunrise: '06:00 AM',
  sunset: '06:30 PM',
  moonrise: '06:30 AM',
  moonset: '07:00 PM',
};

export default function DailyPanchangPage() {
  const { t } = useTranslation();
  const [panchangData, setPanchangData] = useState(mockPanchangData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (loading) {
    return <ActivityIndicator size="large" color={colors["neon-cyan"]} />;
  }

  if (error) {
    return <Text style={styles.errorText}>{error}</Text>;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Daily Panchang</Text>
      <View style={styles.panchangContainer}>
        {Object.entries(panchangData).map(([key, value]) => (
          <View key={key} style={styles.panchangItem}>
            <Text style={styles.panchangKey}>{t(`panchang.${key}`)}</Text>
            <Text style={styles.panchangValue}>{value}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors['neo-dark'],
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    fontFamily: fonts.orbitron,
    textAlign: 'center',
    marginBottom: 24,
  },
  panchangContainer: {
    backgroundColor: colors.input,
    borderRadius: 8,
    padding: 16,
  },
  panchangItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent,
  },
  panchangKey: {
    fontSize: 16,
    color: colors.text,
    fontFamily: fonts.poppins,
    fontWeight: 'bold',
  },
  panchangValue: {
    fontSize: 16,
    color: colors.text,
    fontFamily: fonts.poppins,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    margin: 16,
  },
});
