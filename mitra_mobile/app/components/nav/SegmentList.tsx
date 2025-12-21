import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { colors, fonts } from '../../../constants/theme';

export default function SegmentList() {
  const { t } = useTranslation();
  const router = useRouter();

  const navigateTo = (path: string) => {
    router.push(path);
  };

  const segments = [
    { name: t('nav.chat'), path: '/chat' },
    { name: t('nav.dailyPanchang'), path: '/daily-panchang' },
    { name: t('nav.personalPanchang'), path: '/personal-panchang' },
    { name: t('nav.guardian'), path: '/guardian' },
    { name: t('nav.dailyPrediction'), path: '/daily-prediction' },
    { name: t('nav.monthlyPrediction'), path: '/monthly-prediction' },
    { name: t('nav.tithis'), path: '/tithis' },
    { name: t('nav.numerology'), path: '/numerology' },
    { name: t('nav.shareMarket'), path: '/share-market' },
    { name: t('nav.pakshi'), path: '/pakshi' },
    { name: t('nav.dasha'), path: '/dasha' },
    { name: t('nav.business'), path: '/business' },
    { name: t('nav.career'), path: '/career' },
    { name: t('nav.wealth'), path: '/wealth' },
    { name: t('nav.health'), path: '/health' },
    { name: t('nav.education'), path: '/education' },
    { name: t('nav.spirituality'), path: '/spirituality' },
    { name: t('nav.marriageLove'), path: '/marriage-love' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('nav.segments')}</Text>
      {segments.map((segment) => (
        <TouchableOpacity
          key={segment.name}
          style={styles.segmentItem}
          onPress={() => navigateTo(segment.path)}
        >
          <Text style={styles.segmentName}>{segment.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    fontFamily: fonts.poppins,
  },
  segmentItem: {
    paddingVertical: 8,
  },
  segmentName: {
    fontSize: 16,
    color: colors.text,
    fontFamily: fonts.poppins,
  },
});
