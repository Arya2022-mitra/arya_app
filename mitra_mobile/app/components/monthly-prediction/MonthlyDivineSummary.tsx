
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../../../constants/theme';

// --- TYPE DEFINITIONS ---
interface MonthlySummary {
    safe_payload: {
        month_name: string;
        overall_score: number;
        verdict: string;
        top_domains: Array<{
            name: string;
            display_name: string;
            score: number;
            outlook: string;
            reason_short: string;
        }>;
        weekly_summary: Record<string, {
            score: number;
            outlook: string;
            date_range: string;
        }>;
    };
}

interface MonthlyDivineSummaryProps {
  summary: MonthlySummary | null;
}

const getScoreColor = (score: number) => {
    if (score > 75) return colors.success;
    if (score > 50) return colors.warning;
    return colors.danger;
}

export default function MonthlyDivineSummary({ summary }: MonthlyDivineSummaryProps) {
    if (!summary) {
        return null;
    }

    const { 
        month_name,
        overall_score,
        verdict,
        top_domains,
        weekly_summary
    } = summary.safe_payload;

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>Divine Summary for {month_name}</Text>

            {/* Overall Score and Verdict */}
            <View style={styles.verdictContainer}>
                <Text style={[styles.score, { color: getScoreColor(overall_score) }]}>{overall_score}%</Text>
                <Text style={styles.verdictText}>{verdict}</Text>
            </View>

            {/* Top Domains */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Top Domains</Text>
                {top_domains.map(domain => (
                    <View key={domain.name} style={styles.domainItem}>
                        <Text style={styles.domainName}>{domain.display_name}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={[styles.domainScore, { color: getScoreColor(domain.score) }]}>{domain.score}%</Text>
                            <Text style={styles.domainOutlook}>({domain.outlook})</Text>
                        </View>
                    </View>
                ))}
            </View>

            {/* Weekly Summary */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Weekly Outlook</Text>
                {Object.entries(weekly_summary).map(([week, data]) => (
                    <View key={week} style={styles.weekItem}>
                        <Text style={styles.weekRange}>{data.date_range}</Text>
                        <View style={{flexDirection: 'row', alignItems: 'center'}}>
                            <Text style={[styles.weekScore, { color: getScoreColor(data.score) }]}>{data.score}%</Text>
                            <Text style={styles.weekOutlook}> - {data.outlook}</Text>
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors['neon-cyan'],
        fontFamily: fonts.orbitron,
        marginBottom: 16,
        textAlign: 'center',
    },
    verdictContainer: {
        backgroundColor: colors.input,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginBottom: 16,
    },
    score: {
        fontSize: 48,
        fontWeight: 'bold',
        fontFamily: fonts.orbitron,
    },
    verdictText: {
        fontSize: 16,
        color: colors.text,
        fontFamily: fonts.poppins,
        textAlign: 'center',
        marginTop: 8,
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
    domainItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    domainName: {
        fontSize: 16,
        color: colors.text,
        fontFamily: fonts.poppins,
    },
    domainScore: {
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: fonts.poppins,
    },
    domainOutlook: {
        fontSize: 14,
        color: colors.textSecondary,
        fontFamily: fonts.poppins,
        marginLeft: 8,
    },
    weekItem: {
        marginBottom: 10,
    },
    weekRange: {
        fontSize: 15,
        color: colors.text,
        fontFamily: fonts.poppins,
        fontWeight: 'bold',
    },
    weekScore: {
        fontSize: 15,
        fontWeight: 'bold',
        fontFamily: fonts.poppins,
    },
    weekOutlook: {
        fontSize: 14,
        color: colors.textSecondary,
        fontFamily: fonts.poppins,
        flex: 1,
    },
});
