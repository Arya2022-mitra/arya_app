
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share } from 'react-native';
import { colors, fonts } from '../../../constants/theme';

interface TimeWindow {
  title: string;
  time: string;
  category: string;
  score: number;
  interpretation: string;
  practical: string;
  pakshi: string;
  tara: string;
}

interface TimeWindowCardProps {
  window: TimeWindow;
}

const TimeWindowCard: React.FC<TimeWindowCardProps> = ({ window }) => {

  const onShare = async () => {
    try {
      await Share.share({
        message: `${window.title} (${window.time}): ${window.interpretation}`,
      });
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
      } else {
        console.error('An unknown error occurred during sharing.');
      }
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{window.title}</Text>
      <Text style={styles.time}>{window.time}</Text>
      <View style={styles.categoryContainer}>
        <Text style={styles.category}>{window.category}</Text>
        <Text style={styles.score}>(Score: {window.score})</Text>
      </View>
      <Text style={styles.interpretation}>{window.interpretation}</Text>
      <Text style={styles.practical}>💡 {window.practical}</Text>

      <View style={styles.detailsContainer}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Pakshi:</Text>
          <Text style={styles.detailValue}>{window.pakshi}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Tara:</Text>
          <Text style={styles.detailValue}>{window.tara}</Text>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={onShare}>
          <Text style={styles.actionButtonText}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => { /* Add to Calendar functionality */ }}>
          <Text style={styles.actionButtonText}>Add to Calendar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.input,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    fontFamily: fonts.orbitron,
  },
  time: {
    fontSize: 14,
    color: colors.text,
    fontFamily: fonts.poppins,
    marginTop: 4,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  category: {
    fontSize: 14,
    color: colors.text,
    fontFamily: fonts.poppins,
    fontWeight: 'bold',
  },
  score: {
    fontSize: 14,
    color: colors.text,
    fontFamily: fonts.poppins,
    marginLeft: 8,
  },
  interpretation: {
    fontSize: 14,
    color: colors.text,
    fontFamily: fonts.poppins,
    marginTop: 8,
    lineHeight: 20,
  },
  practical: {
    fontSize: 14,
    color: colors.text,
    fontFamily: fonts.poppins,
    marginTop: 8,
    lineHeight: 20,
  },
  detailsContainer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.text,
    fontFamily: fonts.poppins,
    fontWeight: 'bold',
    marginRight: 8,
  },
  detailValue: {
    fontSize: 14,
    color: colors.text,
    fontFamily: fonts.poppins,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  actionButton: {
    marginLeft: 16,
  },
  actionButtonText: {
    fontSize: 14,
    color: colors['neon-cyan'],
    fontFamily: fonts.poppins,
    fontWeight: 'bold',
  },
});

export default TimeWindowCard;
