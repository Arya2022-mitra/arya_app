import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import { colors, fonts } from '../styles/theme';

interface PlanCardProps {
  name: string;
  price: string;
  features: string[];
  t: TFunction;
}

const PlanCard: React.FC<PlanCardProps> = ({ name, price, features, t }) => (
  <View style={styles.planCard}>
    <Text style={styles.planName}>{name}</Text>
    <Text style={styles.planPrice}>{price}</Text>
    <View style={styles.featuresList}>
      {features.map((feature: string, index: number) => (
        <Text key={index} style={styles.featureText}>• {feature}</Text>
      ))}
    </View>
    <TouchableOpacity style={styles.selectButton}>
      <Text style={styles.selectButtonText}>{t('settings.selectPlan')}</Text>
    </TouchableOpacity>
  </View>
);

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
  planCard: {
    backgroundColor: colors['card-dark'],
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors['accent-3'],
    padding: 24,
    marginBottom: 24,
  },
  planName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 18,
    color: colors.text,
    marginBottom: 16,
  },
  featuresList: {
    marginBottom: 24,
  },
  featureText: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 8,
    fontFamily: fonts.poppins,
  },
  selectButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
  },
  selectButtonText: {
    color: colors['neo-dark'],
    fontWeight: 'bold',
    fontSize: 16,
  },
});
