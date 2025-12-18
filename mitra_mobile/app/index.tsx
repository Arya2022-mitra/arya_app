import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors } from '../constants/theme';

// Mock data for features
const timingFeatures = [
  {
    title: 'Golden Time',
    description: 'Receive a dependable window of days or weeks for building momentum...',
  },
  {
    title: 'Super-Golden Time',
    description: 'Pinpoint the razor-sharp hour or short span for high-impact decisions...',
  },
  {
    title: 'Daily & Monthly Panchangam',
    description: 'Navigate ritual-ready calendars for ceremonies, travel, and family events...',
  },
  {
    title: 'Share-Market Timing Windows',
    description: 'Act within probability-based windows shaped by planetary rhythms...',
  },
];

const trustFeatures = [
  {
    title: 'No Drama, No Guesswork',
    description: 'Missing birth details are called out plainly, and speculation is never presented as fact.',
  },
  {
    title: 'Every Statement Has a Chart Anchor',
    description: 'Planets, aspects, and house emphasis sit beside each interpretation.',
  },
  {
    title: 'Confidence Notes & Clear Next Steps',
    description: 'Every reading shares a confidence note with practical, prioritized actions.',
  },
  {
    title: 'Honest Limits',
    description: 'Matters touching health, legal, or major finance receive clear disclaimers.',
  },
];

interface FeatureCardProps {
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description }) => (
  <View style={styles.mvCard}>
    <Text style={styles.featureTitle}>{title}</Text>
    <Text style={styles.featureDescription}>{description}</Text>
  </View>
);

const SectionDivider = () => <View style={styles.sectionDivider} />;

export default function IndexScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { height } = useWindowDimensions();
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <ScrollView style={styles.container}>
      {/* Hero Section */}
      <Animated.View style={[styles.heroSection, { minHeight: height, opacity: fadeAnim }]}>
        <View style={styles.heroContent}>
          <Text style={styles.heroSubtitle}>{t('index.heroSubtitle')}</Text>
          <Text style={styles.heroTitle}>{t('index.heroTitle')}</Text>
          <Text style={styles.heroDescription}>
            {t('index.heroDescription')}
          </Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/auth')}>
              <Text style={styles.primaryButtonText}>{t('index.beginJourney')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => { /* scroll to section */ }}>
              <Text style={styles.secondaryButtonText}>{t('index.howItWorks')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      <SectionDivider />

      {/* Timing Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('index.timingSectionTitle')}</Text>
        <Text style={styles.sectionDescription}>
          {t('index.timingSectionDescription')}
        </Text>
        <View style={styles.grid}>
          {timingFeatures.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </View>
      </View>

      <SectionDivider />

      {/* Trust Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('index.trustSectionTitle')}</Text>
        <Text style={styles.sectionDescription}>
          {t('index.trustSectionDescription')}
        </Text>
        <View style={styles.grid}>
          {trustFeatures.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </View>
      </View>

       <SectionDivider />

      {/* Final CTA */}
      <View style={styles.finalCta}>
        <Text style={styles.finalCtaSubtitle}>{t('index.finalCtaSubtitle')}</Text>
        <Text style={styles.finalCtaTitle}>{t('index.finalCtaTitle')}</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/auth')}>
            <Text style={styles.primaryButtonText}>{t('index.beginJourney')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/settings')}>
            <Text style={styles.secondaryButtonText}>{t('index.viewPlans')}</Text>
          </TouchableOpacity>
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
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  heroContent: {
    maxWidth: 600,
    alignItems: 'center',
  },
  heroSubtitle: {
    fontSize: 12,
    color: colors.subtitle,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 16,
  },
  heroDescription: {
    fontSize: 18,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 26,
  },
  buttonContainer: {
    marginTop: 32,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 999,
    margin: 8,
  },
  primaryButtonText: {
    color: colors['neo-dark'],
    fontWeight: 'bold',
    fontSize: 16,
  },
  secondaryButton: {
    borderColor: colors.primary,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 999,
    margin: 8,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: colors['accent-3'],
    marginVertical: 48,
    width: '80%',
    alignSelf: 'center',
  },
  section: {
    padding: 16,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 'semibold',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 16,
  },
  sectionDescription: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 600,
  },
  grid: {
    marginTop: 32,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  mvCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors['accent-3'],
    backgroundColor: colors['card-dark'],
    padding: 24,
    margin: 8,
    width: '90%',
    maxWidth: 400,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: 'semibold',
    color: colors.primary,
  },
  featureDescription: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  finalCta: {
    padding: 32,
    margin: 16,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: colors['accent-3'],
    backgroundColor: colors['deep-blue'],
    alignItems: 'center',
  },
  finalCtaSubtitle: {
    fontSize: 12,
    color: colors.subtitle,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 16,
  },
  finalCtaTitle: {
    fontSize: 24,
    fontWeight: 'semibold',
    color: colors.primary,
    textAlign: 'center',
  }
});