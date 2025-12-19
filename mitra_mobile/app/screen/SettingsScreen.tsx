import React from 'react';
import { Text, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../constants/theme';
import PlanCard from '../components/PlanCard';

export default function SettingsScreen() {
  const { t } = useTranslation();

  const plans = [
    {
      name: t('settings.freeTier.name'),
      price: t('settings.freeTier.price'),
      features: t('settings.freeTier.features', { returnObjects: true }) as string[],
    },
    {
      name: t('settings.premiumTier.name'),
      price: t('settings.premiumTier.price'),
      features: t('settings.premiumTier.features', { returnObjects: true }) as string[],
    },
    {
      name: t('settings.enterpriseTier.name'),
      price: t('settings.enterpriseTier.price'),
      features: t('settings.enterpriseTier.features', { returnObjects: true }) as string[],
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{t('settings.title')}</Text>
      <Text style={styles.subtitle}>{t('settings.subtitle')}</Text>
      {plans.map((plan, index) => (
        <PlanCard key={index} {...plan} t={t} />
      ))}
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
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 32,
  },
});
