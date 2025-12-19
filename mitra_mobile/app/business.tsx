import React, { useMemo, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts } from '../constants/theme';

// Mock data for demonstration purposes
const mockBusinessData: BusinessData = {
  summary: 'This is a summary of your business outlook.',
  core_indicators: {
    indicator1: 'Value 1',
    indicator2: 'Value 2',
  },
  sector_recommendations: ['Sector A', 'Sector B'],
  planetary_strength: {
    sun: 'Strong',
    moon: 'Moderate',
  },
  business_yogas: ['Yoga 1', 'Yoga 2'],
  timing_windows: 'Favorable timing between June and August.',
  risk_assessment: 'Low risk for the next quarter.',
  remedies: ['Remedy 1', 'Remedy 2'],
  spiritual_message: 'Focus on your long-term vision.',
};

interface BusinessData {
  summary: string;
  core_indicators: { [key: string]: string };
  sector_recommendations: string[];
  planetary_strength: { [key: string]: string };
  business_yogas: string[];
  timing_windows: string;
  risk_assessment: string;
  remedies: string[];
  spiritual_message: string;
}

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

export default function BusinessPage() {
  const { t } = useTranslation();
  const [businessData] = useState<BusinessData>(mockBusinessData);
  const [loadingData] = useState(false);
  const [error] = useState<string | null>(null);

  const SECTION_CONFIG = useMemo(() => [
    {
        key: 'summary' as keyof BusinessData,
        title: t('business.summaryTitle'),
        blurb: t('business.summaryBlurb'),
      },
      {
        key: 'core_indicators' as keyof BusinessData,
        title: t('business.coreIndicatorsTitle'),
        blurb: t('business.coreIndicatorsBlurb'),
      },
      {
        key: 'sector_recommendations' as keyof BusinessData,
        title: t('business.sectorTitle'),
        blurb: t('business.sectorBlurb'),
      },
      {
        key: 'planetary_strength' as keyof BusinessData,
        title: t('business.strengthTitle'),
        blurb: t('business.strengthBlurb'),
      },
      {
        key: 'business_yogas' as keyof BusinessData,
        title: t('business.yogasTitle'),
        blurb: t('business.yogasBlurb'),
      },
      {
        key: 'timing_windows' as keyof BusinessData,
        title: t('business.timingTitle'),
        blurb: t('business.timingBlurb'),
      },
      {
        key: 'risk_assessment' as keyof BusinessData,
        title: t('business.riskTitle'),
        blurb: t('business.riskBlurb'),
      },
      {
        key: 'remedies' as keyof BusinessData,
        title: t('business.remediesTitle'),
        blurb: t('business.remediesBlurb'),
      },
      {
        key: 'spiritual_message' as keyof BusinessData,
        title: t('business.spiritualTitle'),
        blurb: t('business.spiritualBlurb'),
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
        <Text style={styles.title}>{t('business.title')}</Text>
        <Text style={styles.subtitle}>{t('business.subtitle')}</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={() => {}}>
          <Text style={styles.refreshButtonText}>Refresh Insights</Text>
        </TouchableOpacity>
      </View>

      <AiSummaryDisplay summary="This is an AI summary of your business prospects." loading={false} error={null} />

      {loadingData && <ActivityIndicator size="large" color={colors["neon-cyan"]} />}

      {error && <Text style={styles.errorText}>{error}</Text>}

      {!loadingData && !error && (
        <View style={styles.sectionsContainer}>
          {SECTION_CONFIG.map((section) => (
            <View key={section.key} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionBlurb}>{section.blurb}</Text>
              <View style={styles.sectionContent}>
                {renderValue(businessData[section.key])}
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
