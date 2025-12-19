import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { TFunction } from 'i18next';
import { colors, fonts } from '../../constants/theme';

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

const styles = StyleSheet.create({
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

export default PlanCard;
