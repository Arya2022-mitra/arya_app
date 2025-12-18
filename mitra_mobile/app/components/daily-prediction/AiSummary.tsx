
import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, fonts } from '../../../constants/theme.js';

interface AiSummaryProps {
  summary: string;
  loading: boolean;
  error: string | null;
}

const AiSummary: React.FC<AiSummaryProps> = ({ summary, loading, error }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>AI Summary</Text>
      {loading && <ActivityIndicator size="large" color={colors['neon-cyan']} />}
      {error && <Text style={styles.errorText}>{error}</Text>}
      {!loading && !error && (
        <View style={styles.aiSummaryContainer}>
          <Text style={styles.aiSummaryText}>{summary}</Text>
        </View>
      )}
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
  aiSummaryContainer: {
    backgroundColor: colors.input,
    borderRadius: 8,
    padding: 16,
  },
  aiSummaryText: {
    color: colors.text,
    fontSize: 16,
    fontFamily: fonts.poppins,
    lineHeight: 24,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    margin: 16,
    fontFamily: fonts.poppins,
  },
});

export default AiSummary;
