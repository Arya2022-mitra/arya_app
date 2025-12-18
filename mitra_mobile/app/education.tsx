import React, { useMemo, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts } from '../constants/theme';

interface EducationData {
  summary: string;
  planetary_influences: { [key: string]: string };
  subject_recommendations: string[];
  yogas_detected: string[];
  siddhamsa_summary: string;
  exam_timeline: string;
  remedies: string[];
  spiritual_message: string;
}

const mockEducationData: EducationData = {
  summary: 'This is a summary of your educational outlook.',
  planetary_influences: {
    mercury: 'Strong influence, indicating good analytical skills.',
    jupiter: 'Favorable for higher education and philosophy.',
  },
  subject_recommendations: ['Mathematics', 'Computer Science', 'Philosophy'],
  yogas_detected: ['Saraswati Yoga', 'Bhuddi-Madhurya Yoga'],
  siddhamsa_summary: 'The D24 chart shows a strong focus on knowledge and learning.',
  exam_timeline: 'Favorable period for exams in the next 6 months.',
  remedies: ['Chant the Saraswati Mantra', 'Wear a green gemstone'],
  spiritual_message: 'Embrace the journey of learning with an open mind.',
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

export default function EducationPage() {
  const { t } = useTranslation();
  const [educationData, setEducationData] = useState<EducationData>(mockEducationData);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const SECTION_CONFIG = useMemo(() => [
    {
      key: 'summary' as keyof EducationData,
      title: t('education.summaryTitle'),
      blurb: t('education.summaryBlurb'),
    },
    {
      key: 'planetary_influences' as keyof EducationData,
      title: t('education.planetaryTitle'),
      blurb: t('education.planetaryBlurb'),
    },
    {
      key: 'subject_recommendations' as keyof EducationData,
      title: t('education.subjectTitle'),
      blurb: t('education.subjectBlurb'),
    },
    {
      key: 'yogas_detected' as keyof EducationData,
      title: t('education.yogasTitle'),
      blurb: t('education.yogasBlurb'),
    },
    {
      key: 'siddhamsa_summary' as keyof EducationData,
      title: t('education.siddhamsaTitle'),
      blurb: t('education.siddhamsaBlurb'),
    },
    {
      key: 'exam_timeline' as keyof EducationData,
      title: t('education.examTitle'),
      blurb: t('education.examBlurb'),
    },
    {
      key: 'remedies' as keyof EducationData,
      title: t('education.remediesTitle'),
      blurb: t('education.remediesBlurb'),
    },
    {
      key: 'spiritual_message' as keyof EducationData,
      title: t('education.spiritualTitle'),
      blurb: t('education.spiritualBlurb'),
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
        <Text style={styles.title}>Education Intelligence</Text>
        <Text style={styles.subtitle}>Decode the karmic syllabus guiding your learning journey.</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={() => {}}>
          <Text style={styles.refreshButtonText}>Refresh Insights</Text>
        </TouchableOpacity>
      </View>

      <AiSummaryDisplay summary="This is an AI summary of your education prospects." loading={false} error={null} />

      {loadingData && <ActivityIndicator size="large" color={colors["neon-cyan"]} />}

      {error && <Text style={styles.errorText}>{error}</Text>}

      {!loadingData && !error && (
        <View style={styles.sectionsContainer}>
          {SECTION_CONFIG.map((section) => (
            <View key={section.key} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionBlurb}>{section.blurb}</Text>
              <View style={styles.sectionContent}>
                {renderValue(educationData[section.key])}
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
