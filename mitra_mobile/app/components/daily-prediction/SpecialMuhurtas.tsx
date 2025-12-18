
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../../../constants/theme';

interface Muhurta {
  label: string;
  time: string;
  impact: string;
}

interface SpecialMuhurtasProps {
  muhurtas: Muhurta[];
}

const SpecialMuhurtas: React.FC<SpecialMuhurtasProps> = ({ muhurtas }) => {
  const getImpactStyle = (impact: string) => {
    if (impact.toLowerCase().includes('favorable') || impact.toLowerCase().includes('auspicious')) {
      return styles.favorable;
    }
    if (impact.toLowerCase().includes('avoid') || impact.toLowerCase().includes('inauspicious')) {
      return styles.avoid;
    }
    return styles.neutral;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Auspicious & Inauspicious Periods</Text>
      {muhurtas.map((muhurta, index) => (
        <View key={index} style={styles.muhurtaCard}>
          <View style={styles.muhurtaHeader}>
            <Text style={styles.muhurtaLabel}>{muhurta.label}</Text>
            <Text style={[styles.muhurtaImpact, getImpactStyle(muhurta.impact)]}>{muhurta.impact}</Text>
          </View>
          <Text style={styles.muhurtaTime}>{muhurta.time}</Text>
        </View>
      ))}
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
  muhurtaCard: {
    backgroundColor: colors.input,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  muhurtaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  muhurtaLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    fontFamily: fonts.poppins,
  },
  muhurtaImpact: {
    fontSize: 14,
    fontFamily: fonts.poppins,
    fontWeight: 'bold',
  },
  favorable: {
    color: colors.green,
  },
  avoid: {
    color: colors.red,
  },
  neutral: {
    color: colors.text,
  },
  muhurtaTime: {
    fontSize: 14,
    color: colors.text,
    fontFamily: fonts.poppins,
  },
});

export default SpecialMuhurtas;
