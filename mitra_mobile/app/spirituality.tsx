import React, { useMemo, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts } from '../constants/theme';

interface SpiritualityData {
  summary: string;
  spiritual_path: string;
  deity_archetype: string;
  planetary_influences: { [key: string]: string };
  spiritual_yogas: string[];
  meditation_practices: string[];
  remedies: string[];
  mantra_recommendations: string[];
}

const mockSpiritualityData: SpiritualityData = {
  summary: 'This is a summary of your spiritual outlook.',
  spiritual_path: 'Your path is one of devotion and self-discovery. Follow your intuition.',
  deity_archetype: 'Your primary archetype is that of a scholar and a seeker of truth.',
  planetary_influences: {
    ketu: 'Strong Ketu influence suggests a natural inclination towards moksha and liberation.',
    jupiter: 'Jupiter provides wisdom and guidance on your spiritual journey.',
  },
  spiritual_yogas: ['Jnana Yoga', 'Bhakti Yoga'],
  meditation_practices: ['Focus on your breath', 'Contemplate the nature of the self'],
  remedies: ['Spend time in nature', 'Practice regular meditation'],
  mantra_recommendations: ['Om Namah Shivaya'],
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

export default function SpiritualityPage() {
  const { t } = useTranslation();
  const [spiritualityData, setSpiritualityData] = useState<SpiritualityData>(mockSpiritualityData);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const SECTION_CONFIG = useMemo(() => [
    {
      key: 'summary' as keyof SpiritualityData,
      title: t('spirituality.summaryTitle'),
      blurb: t('spirituality.summaryBlurb'),
    },
    {
      key: 'spiritual_path' as keyof SpiritualityData,
      title: t('spirituality.pathTitle'),
      blurb: t('spirituality.pathBlurb'),
    },
    {
      key: 'deity_archetype' as keyof SpiritualityData,
      title: t('spirituality.deityTitle'),
      blurb: t('spirituality.deityBlurb'),
    },
    {
      key: 'planetary_influences' as keyof SpiritualityData,
      title: t('spirituality.planetaryTitle'),
      blurb: t('spirituality.planetaryBlurb'),
    },
    {
      key: 'spiritual_yogas' as keyof SpiritualityData,
      title: t('spirituality.yogasTitle'),
      blurb: t('spirituality.yogasBlurb'),
    },
    {
      key: 'meditation_practices' as keyof SpiritualityData,
      title: t('spirituality.meditationTitle'),
      blurb: t('spirituality.meditationBlurb'),
    },
    {
      key: 'remedies' as keyof SpiritualityData,
      title: t('spirituality.remediesTitle'),
      blurb: t('spirituality.remediesBlurb'),
    },
    {
      key: 'mantra_recommendations' as keyof SpiritualityData,
      title: t('spirituality.mantraTitle'),
      blurb: t('spirituality.mantraBlurb'),
    },
  ], [t]);

  const renderValue = (value: string | string[] | { [key: string]: string }) => {
    if (typeof value === 'string') {
      return <Text style={styles.valueText}>{value}</Text>;
    }
    if (Array.isArray(value)) {
      return value.map((item, index) => <Text key={index} style={styles.valueText}>- {item}</Text>);
    }
    if (typeof value === 'object' && value !== null) {
      return Object.entries(value).map(([key, val]) => (
        <View key={key} style={styles.objectEntry}>
          <Text style={styles.objectKey}>{key}:</Text>
          <Text style={styles.objectValue}>{val}</Text>
        </View>
      ));
    }
    return null;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image source={require('../assets/images/logo.png')} style={styles.logo} />
        <Text style={styles.title}>Spirituality</Text>
        <Text style={styles.subtitle}>Explore your spiritual path and purpose.</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={() => {}}>
          <Text style={styles.refreshButtonText}>Refresh Insights</Text>
        </TouchableOpacity>
      </View>

      <AiSummaryDisplay summary="This is an AI summary of your spiritual journey." loading={false} error={null} />

      {loadingData && <ActivityIndicator size="large" color={colors["neon-cyan"]} />}

      {error && <Text style={styles.errorText}>{error}</Text>}

      {!loadingData && !error && (
        <View style={styles.sectionsContainer}>
          {SECTION_CONFIG.map((section) => (
            <View key={section.key} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionBlurb}>{section.blurb}</Text>
              <View style={styles.sectionContent}>
                {renderValue(spiritualityData[section.key])}
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
  sectionBlurb: {
    fontSize: 14,
    color: colors.text,
    fontFamily: fonts.poppins,
    marginBottom: 12,
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
