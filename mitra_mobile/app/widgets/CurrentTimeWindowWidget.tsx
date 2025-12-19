
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { colors, fonts } from '../../constants/theme';

// --- TYPE DEFINITIONS ---
interface TimeWindow {
  title: string;
  time: string;
}

interface GoldenDate {
  date: string;
  start_time?: string;
  end_time?: string;
}

interface ChandrashtamaPeriod {
  date?: string;
  start_time?: string;
  end_time?: string;
}

interface CurrentTimeWindowWidgetProps {
  window: TimeWindow | null;
}

// --- HELPER FUNCTIONS ---
const findNextEvent = <T extends { date?: string; start_time?: string }> (events: T[]): T | null => {
    const now = new Date();
    let upcomingEvent: T | null = null;
    let minDiff = Infinity;

    if (!events) return null;

    for (const event of events) {
        // The start_time for chandrashtama can be a full ISO string, 
        // while for golden_dates it might just be HH:MM:SS. We need to handle both.
        let eventStartDate: Date;
        try {
            if (event.start_time && event.start_time.includes('T')) {
                eventStartDate = new Date(event.start_time);
            } else if (event.date && event.start_time) {
                eventStartDate = new Date(`${event.date}T${event.start_time}`);
            } else if (event.date) {
                eventStartDate = new Date(event.date);
            } else {
                continue; // Skip if no valid date/time info
            }

            if (eventStartDate > now) {
                const diff = eventStartDate.getTime() - now.getTime();
                if (diff < minDiff) {
                    minDiff = diff;
                    upcomingEvent = event;
                }
            }
        } catch (e) {
            console.error("Error parsing event date:", event, e);
            continue;
        }
    }
    return upcomingEvent;
};

const formatEventTime = (event: GoldenDate | ChandrashtamaPeriod | null) => {
    if (!event) return "No upcoming event";
    
    const startTime = event.start_time ? new Date(event.start_time) : (event.date ? new Date(event.date) : null);
    if (!startTime || isNaN(startTime.getTime())) return "Invalid date";

    const datePart = startTime.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const timePart = startTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true });

    if (event.start_time) {
        return `${datePart}, ${timePart}`;
    }
    return datePart; // For all-day events
}

// --- WIDGET COMPONENT ---
const CurrentTimeWindowWidget: React.FC<CurrentTimeWindowWidgetProps> = ({ window }) => {
  const [nextGoldenDate, setNextGoldenDate] = useState<GoldenDate | null>(null);
  const [nextChandrashtama, setNextChandrashtama] = useState<ChandrashtamaPeriod | null>(null);

  useEffect(() => {
    const loadSpecialDates = async () => {
      try {
        const goldenDatesJson = await SecureStore.getItemAsync('goldenDates');
        const chandrashtamaPeriodsJson = await SecureStore.getItemAsync('chandrashtamaPeriods');

        if (goldenDatesJson) {
          const dates: GoldenDate[] = JSON.parse(goldenDatesJson);
          setNextGoldenDate(findNextEvent(dates));
        }

        if (chandrashtamaPeriodsJson) {
          const periods: ChandrashtamaPeriod[] = JSON.parse(chandrashtamaPeriodsJson);
          setNextChandrashtama(findNextEvent(periods));
        }
      } catch (e) {
        console.error("Failed to load special dates from secure store", e);
      }
    };

    loadSpecialDates();
  }, []);

  return (
    <View style={styles.container}>
      {/* Current Time Window */}
      <View style={styles.sectionContainer}>
        <Text style={styles.title}>Current Time Window</Text>
        {window ? (
            <>
                <Text style={styles.windowTitle}>{window.title}</Text>
                <Text style={styles.windowTime}>{window.time}</Text>
            </>
        ) : (
            <Text style={styles.noDataText}>Not in an active window</Text>
        )}
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Special Dates */}
      <View style={styles.specialDatesContainer}>
          {/* Next Golden Date */}
          <View style={styles.specialDateItem}>
              <Text style={styles.specialDateTitle}>Next Golden Date</Text>
              <Text style={[styles.specialDateValue, { color: colors.warning }]}>
                  {formatEventTime(nextGoldenDate)}
              </Text>
          </View>
          {/* Next Chandrashtama */}
          <View style={styles.specialDateItem}>
              <Text style={styles.specialDateTitle}>Next Chandrashtama</Text>
              <Text style={[styles.specialDateValue, { color: colors.danger }]}>
                  {formatEventTime(nextChandrashtama)}
              </Text>
          </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: colors.input,
    borderRadius: 12,
  },
  sectionContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors['neon-cyan'],
    fontFamily: fonts.orbitron,
    marginBottom: 8,
  },
  windowTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    fontFamily: fonts.poppins,
    textAlign: 'center',
  },
  windowTime: {
    fontSize: 14,
    color: colors.text,
    fontFamily: fonts.poppins,
    marginTop: 4,
  },
  noDataText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontFamily: fonts.poppins,
  },
  divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 12,
  },
  specialDatesContainer: {
      width: '100%',
  },
  specialDateItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 6,
  },
  specialDateTitle: {
      fontSize: 15,
      color: colors.textSecondary,
      fontFamily: fonts.poppins,
  },
  specialDateValue: {
      fontSize: 15,
      fontFamily: fonts.poppins,
      fontWeight: '600',
  }
});

export default CurrentTimeWindowWidget;
