
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../../../constants/theme';

interface TimeWindow {
  title: string;
  time: string;
  category: string;
  score: number;
  interpretation: string;
  practical: string;
}

interface CurrentTimeWindowProps {
  window: TimeWindow | null;
}

const formatCountdown = (totalSeconds: number): string => {
  if (totalSeconds <= 0) return '00:00:00';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((v) => String(v).padStart(2, '0')).join(':');
};

const CurrentTimeWindow: React.FC<CurrentTimeWindowProps> = ({ window }) => {
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);

  useEffect(() => {
    if (!window) {
      setCountdownSeconds(null);
      return;
    }

    // This is a placeholder for the actual end time of the window.
    // In a real application, you would parse the end time from the window data.
    const endTime = new Date();
    endTime.setHours(endTime.getHours() + 1);

    const interval = setInterval(() => {
      const remaining = Math.floor((endTime.getTime() - new Date().getTime()) / 1000);
      if (remaining > 0) {
        setCountdownSeconds(remaining);
      } else {
        setCountdownSeconds(0);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [window]);

  if (!window) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Current Time Window</Text>
      <Text style={styles.windowTitle}>{window.title}</Text>
      <Text style={styles.windowTime}>{window.time}</Text>
      {countdownSeconds !== null && (
        <View style={styles.countdownContainer}>
          <Text style={styles.countdownLabel}>Ends In:</Text>
          <Text style={styles.countdownText}>{formatCountdown(countdownSeconds)}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginVertical: 16,
    backgroundColor: colors.input,
    borderRadius: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors['neon-cyan'],
    fontFamily: fonts.orbitron,
    marginBottom: 16,
  },
  windowTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    fontFamily: fonts.poppins,
  },
  windowTime: {
    fontSize: 14,
    color: colors.text,
    fontFamily: fonts.poppins,
    marginBottom: 8,
  },
  countdownContainer: {
    marginTop: 8,
  },
  countdownLabel: {
    fontSize: 14,
    color: colors.text,
    fontFamily: fonts.poppins,
  },
  countdownText: {
    fontSize: 18,
    color: colors.text,
    fontFamily: fonts.orbitron,
    fontWeight: 'bold',
  },
});

export default CurrentTimeWindow;
