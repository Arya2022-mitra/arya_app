import React, { useMemo, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts } from '../constants/theme';

interface PlanetaryInfluencer {
    planet: string;
    role: string;
    summary: string;
}

interface DivisionalVerification {
    d10: {
        strong_planets: string[];
        weak_planets: string[];
    };
}

interface KarakaSummary {
    atmakaraka: string;
    amatyaKaraka: string;
}

interface Timing {
    career_trend: string;
    current_mahadasha: string;
    current_antardasha: string;
}

interface CareerData {
    summary: string;
    planetary_influencers: PlanetaryInfluencer[];
    divisional_verification: DivisionalVerification;
    karaka_summary: KarakaSummary;
    timing: Timing;
}

const mockCareerData: CareerData = {
  summary: 'This is a summary of your career outlook.',
  planetary_influencers: [
    { planet: 'Sun', role: 'King', summary: 'Your leadership qualities will shine.' },
    { planet: 'Saturn', role: 'Teacher', summary: 'Hard work and discipline will be rewarded.' },
  ],
  divisional_verification: {
    d10: { strong_planets: ['Sun', 'Mars'], weak_planets: ['Venus'] },
  },
  karaka_summary: {
    atmakaraka: 'Sun',
    amatyaKaraka: 'Mercury',
  },
  timing: {
    career_trend: 'Upward',
    current_mahadasha: 'Sun',
    current_antardasha: 'Jupiter',
  },
};

interface AiSummaryDisplayProps {
    summary: string;
    loading: boolean;
    error: string | null;
}

const AiSummaryDisplay: React.FC<AiSummaryDisplayProps> = ({ summary, loading, error }) => {
  if (loading) {
    return <ActivityIndicator size="large" color={colors["neon-cyan"]} />;
  }

  if (error) {
    return <Text style={styles.errorText}>{error}</Text>;
  }

  return (
    <View style={styles.aiSummaryContainer}>
      <Text style={styles.aiSummaryText}>{summary}</Text>
    </View>
  );
};

export default function CareerPage() {
  const { t } = useTranslation();
  const [careerData, setCareerData] = useState<CareerData>(mockCareerData);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sections = useMemo(() => [
    { title: t('career.summary'), content: careerData.summary },
    { title: t('career.planetaryInfluences'), content: careerData.planetary_influencers },
    { title: t('career.divisionalValidation'), content: careerData.divisional_verification },
    { title: t('career.karakasInsight'), content: careerData.karaka_summary },
    { title: t('career.dashaAndTiming'), content: careerData.timing },
  ], [t, careerData]);

  const renderValue = (value: string | PlanetaryInfluencer[] | DivisionalVerification | KarakaSummary | Timing) => {
    if (typeof value === 'string') {
      return <Text style={styles.valueText}>{value}</Text>;
    }
    if (Array.isArray(value)) {
      return value.map((item, index) => <Text key={index} style={styles.valueText}>- {item.planet}: {item.summary}</Text>);
    }
    if (typeof value === 'object' && value !== null) {
        return Object.entries(value).map(([key, val]) => (
            <View key={key} style={styles.objectEntry}>
              <Text style={styles.objectKey}>{key}:</Text>
              <Text style={styles.objectValue}>{typeof val === 'object' ? JSON.stringify(val) : val.toString()}</Text>
            </View>
          ));
    }
    return null;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image source={require('../assets/images/logo.png')} style={styles.logo} />
        <Text style={styles.title}>{t('career.title')}</Text>
        <Text style={styles.subtitle}>{t('career.subtitle')}</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={() => {}}>
          <Text style={styles.refreshButtonText}>Refresh Insights</Text>
        </TouchableOpacity>
      </View>

      <AiSummaryDisplay summary="This is an AI summary of your career prospects." loading={false} error={null} />

      {loadingData && <ActivityIndicator size="large" color={colors["neon-cyan"]} />}

      {error && <Text style={styles.errorText}>{error}</Text>}

      {!loadingData && !error && (
        <View style={styles.sectionsContainer}>
          {sections.map((section, index) => (
            <View key={index} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.sectionContent}>
                {renderValue(section.content)}
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors['neo-dark'],
    },
    header: {
      alignItems: 'center',
      padding: 24,
      borderBottomWidth: 1,
      borderBottomColor: colors['neon-cyan'],
    },
    logo: {
      width: 100,
      height: 100,
      marginBottom: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      fontFamily: fonts.orbitron,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 16,
      color: colors.text,
      textAlign: 'center',
      marginTop: 8,
      fontFamily: fonts.poppins,
    },
    refreshButton: {
      marginTop: 16,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: colors['neon-cyan'],
      borderRadius: 20,
    },
    refreshButtonText: {
      color: colors['neon-cyan'],
    },
    aiSummaryContainer: {
      padding: 16,
      margin: 16,
      backgroundColor: colors.input,
      borderRadius: 8,
    },
    aiSummaryText: {
      color: colors.text,
      fontSize: 16,
      fontFamily: fonts.poppins,
    },
    sectionsContainer: {
      padding: 16,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors['neon-cyan'],
      fontFamily: fonts.orbitron,
      marginBottom: 8,
    },
    sectionContent: {
      paddingLeft: 16,
    },
    valueText: {
      color: colors.text,
      fontSize: 16,
      fontFamily: fonts.poppins,
      marginBottom: 4,
    },
    objectEntry: {
      flexDirection: 'row',
      marginBottom: 4,
    },
    objectKey: {
      color: colors.text,
      fontWeight: 'bold',
      marginRight: 8,
    },
    objectValue: {
      color: colors.text,
    },
    errorText: {
      color: 'red',
      textAlign: 'center',
      margin: 16,
    },
  });
