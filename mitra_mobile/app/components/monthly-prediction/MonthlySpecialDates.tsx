
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../../../constants/theme';

// --- TYPE DEFINITIONS ---
interface GoldenDate {
  date: string;
  start_time?: string;
  end_time?: string;
  score?: number;
}

interface ChandrashtamaPeriod {
  date?: string;
  start_time?: string;
  end_time?: string;
  current_nakshatra?: string;
}

interface DashaSummary {
    current?: {
        mahadasha?: string;
        antardasha?: string;
        pratyantardasha?: string;
    };
}

interface MonthlySpecialDatesProps {
  goldenDates: GoldenDate[];
  chandrashtamaPeriods: ChandrashtamaPeriod[];
  dasha?: DashaSummary | null;
}

const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '--';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
        return dateString;
    }
}

const formatTime = (timeString: string | undefined) => {
    if (!timeString) return '';
    try {
        const date = new Date(timeString);
        return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
        return timeString.substring(11, 16);
    }
}

export default function MonthlySpecialDates({ goldenDates, chandrashtamaPeriods, dasha }: MonthlySpecialDatesProps) {

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>Special Dates & Dasha</Text>

            {/* Golden Dates */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Golden Dates</Text>
                {goldenDates && goldenDates.length > 0 ? (
                    goldenDates.map((gd, index) => (
                        <View key={`gd-${index}`} style={styles.dateItem}>
                            <Text style={styles.goldenDateText}>{formatDate(gd.date)}</Text>
                            <Text style={styles.timeText}>{formatTime(gd.start_time)} - {formatTime(gd.end_time)}</Text>
                            {gd.score && <Text style={styles.scoreText}>{Math.round(gd.score)}%</Text>}
                        </View>
                    ))
                ) : (
                    <Text style={styles.noDataText}>No golden dates found for this month.</Text>
                )}
            </View>

            {/* Chandrashtama Periods */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Chandrashtama</Text>
                {chandrashtamaPeriods && chandrashtamaPeriods.length > 0 ? (
                    chandrashtamaPeriods.map((cp, index) => (
                        <View key={`cp-${index}`} style={styles.dateItem}>
                            <View>
                                <Text style={styles.chandrashtamaDateText}>{formatDate(cp.date)}</Text>
                                {cp.current_nakshatra && <Text style={styles.nakshatraText}>{cp.current_nakshatra}</Text>}
                            </View>
                            <Text style={styles.timeText}>{formatTime(cp.start_time)} - {formatTime(cp.end_time)}</Text>
                        </View>
                    ))
                ) : (
                    <Text style={styles.noDataText}>No Chandrashtama data for this month.</Text>
                )}
            </View>

            {/* Dasha Summary */}
            {dasha && (
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Current Dasha</Text>
                    <View style={styles.dashaItem}>
                        <Text style={styles.dashaLabel}>Mahadasha:</Text>
                        <Text style={styles.dashaValue}>{dasha.current?.mahadasha || '--'}</Text>
                    </View>
                    <View style={styles.dashaItem}>
                        <Text style={styles.dashaLabel}>Antardasha:</Text>
                        <Text style={styles.dashaValue}>{dasha.current?.antardasha || '--'}</Text>
                    </View>
                    <View style={styles.dashaItem}>
                        <Text style={styles.dashaLabel}>Pratyantardasha:</Text>
                        <Text style={styles.dashaValue}>{dasha.current?.pratyantardasha || '--'}</Text>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors['neon-cyan'],
        fontFamily: fonts.orbitron,
        marginBottom: 16,
        textAlign: 'center',
    },
    card: {
        backgroundColor: colors.input,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
        fontFamily: fonts.poppins,
        marginBottom: 12,
    },
    noDataText: {
        color: colors.textSecondary,
        fontFamily: fonts.poppins,
        textAlign: 'center',
    },
    dateItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    goldenDateText: {
        fontSize: 16,
        color: colors.warning, // Golden color
        fontFamily: fonts.poppins,
        fontWeight: 'bold',
    },
    chandrashtamaDateText: {
        fontSize: 16,
        color: colors.danger, // Reddish color
        fontFamily: fonts.poppins,
        fontWeight: 'bold',
    },
    nakshatraText: {
        fontSize: 12,
        color: colors.textSecondary,
        fontFamily: fonts.poppins,
    },
    timeText: {
        fontSize: 14,
        color: colors.text,
        fontFamily: fonts.poppins,
    },
    scoreText: {
        fontSize: 14,
        color: colors.success,
        fontWeight: 'bold',
    },
    dashaItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    dashaLabel: {
        fontSize: 15,
        color: colors.textSecondary,
        fontFamily: fonts.poppins,
    },
    dashaValue: {
        fontSize: 15,
        color: colors.text,
        fontFamily: fonts.poppins,
        fontWeight: '600',
    },
});
