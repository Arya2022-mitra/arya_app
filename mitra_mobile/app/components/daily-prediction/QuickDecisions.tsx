
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts } from '../../../constants/theme';

interface QuickDecisionsProps {
  decisions: {
    takeNewInitiative: { answer: string; reason: string };
    giveAskMoney: { answer: string; reason: string };
    talkWithStrangers: { answer: string; reason: string };
  };
}

const QuickDecisions: React.FC<QuickDecisionsProps> = ({ decisions }) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{t('dailyPrediction.quickDecisions.title')}</Text>
      <View style={styles.decisionsContainer}>
        {Object.entries(decisions).map(([key, value]) => (
          <View key={key} style={styles.decisionCard}>
            <Text style={styles.decisionTitle}>{t(`dailyPrediction.quickDecisions.${key}`)}</Text>
            <Text style={[styles.decisionAnswer, { color: value.answer === 'YES' ? colors.green : colors.red }]}>{value.answer}</Text>
            <Text style={styles.decisionReason}>{value.reason}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors['neon-cyan'],
    fontFamily: fonts.orbitron,
    marginBottom: 16,
  },
  decisionsContainer: {
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  decisionCard: {
    backgroundColor: colors.input,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  decisionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    fontFamily: fonts.poppins,
  },
  decisionAnswer: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: fonts.orbitron,
    marginTop: 8,
  },
  decisionReason: {
    fontSize: 14,
    color: colors.text,
    fontFamily: fonts.poppins,
    marginTop: 8,
    lineHeight: 20,
  },
});

export default QuickDecisions;
