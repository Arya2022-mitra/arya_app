"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = IndexScreen;
var react_1 = __importStar(require("react"));
var react_native_1 = require("react-native");
var expo_router_1 = require("expo-router");
var react_i18next_1 = require("react-i18next");
var theme_1 = require("../constants/theme");
// Mock data for features
var timingFeatures = [
    {
        title: 'Golden Time',
        description: 'Receive a dependable window of days or weeks for building momentum...',
    },
    {
        title: 'Super-Golden Time',
        description: 'Pinpoint the razor-sharp hour or short span for high-impact decisions...',
    },
    {
        title: 'Daily & Monthly Panchangam',
        description: 'Navigate ritual-ready calendars for ceremonies, travel, and family events...',
    },
    {
        title: 'Share-Market Timing Windows',
        description: 'Act within probability-based windows shaped by planetary rhythms...',
    },
];
var trustFeatures = [
    {
        title: 'No Drama, No Guesswork',
        description: 'Missing birth details are called out plainly, and speculation is never presented as fact.',
    },
    {
        title: 'Every Statement Has a Chart Anchor',
        description: 'Planets, aspects, and house emphasis sit beside each interpretation.',
    },
    {
        title: 'Confidence Notes & Clear Next Steps',
        description: 'Every reading shares a confidence note with practical, prioritized actions.',
    },
    {
        title: 'Honest Limits',
        description: 'Matters touching health, legal, or major finance receive clear disclaimers.',
    },
];
var FeatureCard = function (_a) {
    var title = _a.title, description = _a.description;
    return (<react_native_1.View style={styles.mvCard}>
    <react_native_1.Text style={styles.featureTitle}>{title}</react_native_1.Text>
    <react_native_1.Text style={styles.featureDescription}>{description}</react_native_1.Text>
  </react_native_1.View>);
};
var SectionDivider = function () { return <react_native_1.View style={styles.sectionDivider}/>; };
function IndexScreen() {
    var t = (0, react_i18next_1.useTranslation)().t;
    var router = (0, expo_router_1.useRouter)();
    var height = (0, react_native_1.useWindowDimensions)().height;
    var fadeAnim = (0, react_1.useState)(new react_native_1.Animated.Value(0))[0];
    (0, react_1.useEffect)(function () {
        react_native_1.Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
        }).start();
    }, [fadeAnim]);
    return (<react_native_1.ScrollView style={styles.container}>
      {/* Hero Section */}
      <react_native_1.Animated.View style={[styles.heroSection, { minHeight: height, opacity: fadeAnim }]}>
        <react_native_1.View style={styles.heroContent}>
          <react_native_1.Text style={styles.heroSubtitle}>{t('index.heroSubtitle')}</react_native_1.Text>
          <react_native_1.Text style={styles.heroTitle}>{t('index.heroTitle')}</react_native_1.Text>
          <react_native_1.Text style={styles.heroDescription}>
            {t('index.heroDescription')}
          </react_native_1.Text>
          <react_native_1.View style={styles.buttonContainer}>
            <react_native_1.TouchableOpacity style={styles.primaryButton} onPress={function () { return router.push('/auth'); }}>
              <react_native_1.Text style={styles.primaryButtonText}>{t('index.beginJourney')}</react_native_1.Text>
            </react_native_1.TouchableOpacity>
            <react_native_1.TouchableOpacity style={styles.secondaryButton} onPress={function () { }}>
              <react_native_1.Text style={styles.secondaryButtonText}>{t('index.howItWorks')}</react_native_1.Text>
            </react_native_1.TouchableOpacity>
          </react_native_1.View>
        </react_native_1.View>
      </react_native_1.Animated.View>

      <SectionDivider />

      {/* Timing Section */}
      <react_native_1.View style={styles.section}>
        <react_native_1.Text style={styles.sectionTitle}>{t('index.timingSectionTitle')}</react_native_1.Text>
        <react_native_1.Text style={styles.sectionDescription}>
          {t('index.timingSectionDescription')}
        </react_native_1.Text>
        <react_native_1.View style={styles.grid}>
          {timingFeatures.map(function (feature, index) { return (<FeatureCard key={index} {...feature}/>); })}
        </react_native_1.View>
      </react_native_1.View>

      <SectionDivider />

      {/* Trust Section */}
      <react_native_1.View style={styles.section}>
        <react_native_1.Text style={styles.sectionTitle}>{t('index.trustSectionTitle')}</react_native_1.Text>
        <react_native_1.Text style={styles.sectionDescription}>
          {t('index.trustSectionDescription')}
        </react_native_1.Text>
        <react_native_1.View style={styles.grid}>
          {trustFeatures.map(function (feature, index) { return (<FeatureCard key={index} {...feature}/>); })}
        </react_native_1.View>
      </react_native_1.View>

       <SectionDivider />

      {/* Final CTA */}
      <react_native_1.View style={styles.finalCta}>
        <react_native_1.Text style={styles.finalCtaSubtitle}>{t('index.finalCtaSubtitle')}</react_native_1.Text>
        <react_native_1.Text style={styles.finalCtaTitle}>{t('index.finalCtaTitle')}</react_native_1.Text>
        <react_native_1.View style={styles.buttonContainer}>
          <react_native_1.TouchableOpacity style={styles.primaryButton} onPress={function () { return router.push('/auth'); }}>
            <react_native_1.Text style={styles.primaryButtonText}>{t('index.beginJourney')}</react_native_1.Text>
          </react_native_1.TouchableOpacity>
          <react_native_1.TouchableOpacity style={styles.secondaryButton} onPress={function () { return router.push('/settings'); }}>
            <react_native_1.Text style={styles.secondaryButtonText}>{t('index.viewPlans')}</react_native_1.Text>
          </react_native_1.TouchableOpacity>
        </react_native_1.View>
      </react_native_1.View>
    </react_native_1.ScrollView>);
}
var styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme_1.colors['neo-dark'],
    },
    heroSection: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    heroContent: {
        maxWidth: 600,
        alignItems: 'center',
    },
    heroSubtitle: {
        fontSize: 12,
        color: theme_1.colors.subtitle,
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: 16,
    },
    heroTitle: {
        fontSize: 36,
        fontWeight: 'bold',
        color: theme_1.colors.primary,
        textAlign: 'center',
        marginBottom: 16,
    },
    heroDescription: {
        fontSize: 18,
        color: theme_1.colors.text,
        textAlign: 'center',
        lineHeight: 26,
    },
    buttonContainer: {
        marginTop: 32,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    primaryButton: {
        backgroundColor: theme_1.colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 999,
        margin: 8,
    },
    primaryButtonText: {
        color: theme_1.colors['neo-dark'],
        fontWeight: 'bold',
        fontSize: 16,
    },
    secondaryButton: {
        borderColor: theme_1.colors.primary,
        borderWidth: 1,
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 999,
        margin: 8,
    },
    secondaryButtonText: {
        color: theme_1.colors.primary,
        fontWeight: 'bold',
        fontSize: 16,
    },
    sectionDivider: {
        height: 1,
        backgroundColor: theme_1.colors['accent-3'],
        marginVertical: 48,
        width: '80%',
        alignSelf: 'center',
    },
    section: {
        padding: 16,
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 28,
        fontWeight: 'semibold',
        color: theme_1.colors.primary,
        textAlign: 'center',
        marginBottom: 16,
    },
    sectionDescription: {
        fontSize: 16,
        color: theme_1.colors.text,
        textAlign: 'center',
        lineHeight: 24,
        maxWidth: 600,
    },
    grid: {
        marginTop: 32,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    mvCard: {
        borderRadius: 24,
        borderWidth: 1,
        borderColor: theme_1.colors['accent-3'],
        backgroundColor: theme_1.colors['card-dark'],
        padding: 24,
        margin: 8,
        width: '90%',
        maxWidth: 400,
    },
    featureTitle: {
        fontSize: 20,
        fontWeight: 'semibold',
        color: theme_1.colors.primary,
    },
    featureDescription: {
        marginTop: 8,
        fontSize: 14,
        lineHeight: 20,
        color: theme_1.colors.text,
    },
    finalCta: {
        padding: 32,
        margin: 16,
        borderRadius: 32,
        borderWidth: 1,
        borderColor: theme_1.colors['accent-3'],
        backgroundColor: theme_1.colors['deep-blue'],
        alignItems: 'center',
    },
    finalCtaSubtitle: {
        fontSize: 12,
        color: theme_1.colors.subtitle,
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: 16,
    },
    finalCtaTitle: {
        fontSize: 24,
        fontWeight: 'semibold',
        color: theme_1.colors.primary,
        textAlign: 'center',
    }
});
