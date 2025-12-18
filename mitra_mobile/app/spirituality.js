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
exports.default = SpiritualityPage;
var react_1 = __importStar(require("react"));
var react_native_1 = require("react-native");
var react_i18next_1 = require("react-i18next");
var theme_1 = require("../constants/theme");
var mockSpiritualityData = {
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
var AiSummaryDisplay = function (_a) {
    var summary = _a.summary, loading = _a.loading, error = _a.error;
    if (loading) {
        return <react_native_1.ActivityIndicator size="large" color={theme_1.colors["neon-cyan"]}/>;
    }
    if (error) {
        return <react_native_1.Text style={styles.errorText}>{error}</react_native_1.Text>;
    }
    return (<react_native_1.View style={styles.aiSummaryContainer}>
      <react_native_1.Text style={styles.aiSummaryText}>{summary}</react_native_1.Text>
    </react_native_1.View>);
};
function SpiritualityPage() {
    var t = (0, react_i18next_1.useTranslation)().t;
    var _a = (0, react_1.useState)(mockSpiritualityData), spiritualityData = _a[0], setSpiritualityData = _a[1];
    var _b = (0, react_1.useState)(false), loadingData = _b[0], setLoadingData = _b[1];
    var _c = (0, react_1.useState)(null), error = _c[0], setError = _c[1];
    var SECTION_CONFIG = (0, react_1.useMemo)(function () { return [
        {
            key: 'summary',
            title: t('spirituality.summaryTitle'),
            blurb: t('spirituality.summaryBlurb'),
        },
        {
            key: 'spiritual_path',
            title: t('spirituality.pathTitle'),
            blurb: t('spirituality.pathBlurb'),
        },
        {
            key: 'deity_archetype',
            title: t('spirituality.deityTitle'),
            blurb: t('spirituality.deityBlurb'),
        },
        {
            key: 'planetary_influences',
            title: t('spirituality.planetaryTitle'),
            blurb: t('spirituality.planetaryBlurb'),
        },
        {
            key: 'spiritual_yogas',
            title: t('spirituality.yogasTitle'),
            blurb: t('spirituality.yogasBlurb'),
        },
        {
            key: 'meditation_practices',
            title: t('spirituality.meditationTitle'),
            blurb: t('spirituality.meditationBlurb'),
        },
        {
            key: 'remedies',
            title: t('spirituality.remediesTitle'),
            blurb: t('spirituality.remediesBlurb'),
        },
        {
            key: 'mantra_recommendations',
            title: t('spirituality.mantraTitle'),
            blurb: t('spirituality.mantraBlurb'),
        },
    ]; }, [t]);
    var renderValue = function (value) {
        if (typeof value === 'string') {
            return <react_native_1.Text style={styles.valueText}>{value}</react_native_1.Text>;
        }
        if (Array.isArray(value)) {
            return value.map(function (item, index) { return <react_native_1.Text key={index} style={styles.valueText}>- {item}</react_native_1.Text>; });
        }
        if (typeof value === 'object' && value !== null) {
            return Object.entries(value).map(function (_a) {
                var key = _a[0], val = _a[1];
                return (<react_native_1.View key={key} style={styles.objectEntry}>
          <react_native_1.Text style={styles.objectKey}>{key}:</react_native_1.Text>
          <react_native_1.Text style={styles.objectValue}>{val}</react_native_1.Text>
        </react_native_1.View>);
            });
        }
        return null;
    };
    return (<react_native_1.ScrollView style={styles.container}>
      <react_native_1.View style={styles.header}>
        <react_native_1.Image source={require('../assets/images/logo.png')} style={styles.logo}/>
        <react_native_1.Text style={styles.title}>Spirituality</react_native_1.Text>
        <react_native_1.Text style={styles.subtitle}>Explore your spiritual path and purpose.</react_native_1.Text>
        <react_native_1.TouchableOpacity style={styles.refreshButton} onPress={function () { }}>
          <react_native_1.Text style={styles.refreshButtonText}>Refresh Insights</react_native_1.Text>
        </react_native_1.TouchableOpacity>
      </react_native_1.View>

      <AiSummaryDisplay summary="This is an AI summary of your spiritual journey." loading={false} error={null}/>

      {loadingData && <react_native_1.ActivityIndicator size="large" color={theme_1.colors["neon-cyan"]}/>}

      {error && <react_native_1.Text style={styles.errorText}>{error}</react_native_1.Text>}

      {!loadingData && !error && (<react_native_1.View style={styles.sectionsContainer}>
          {SECTION_CONFIG.map(function (section) { return (<react_native_1.View key={section.key} style={styles.section}>
              <react_native_1.Text style={styles.sectionTitle}>{section.title}</react_native_1.Text>
              <react_native_1.Text style={styles.sectionBlurb}>{section.blurb}</react_native_1.Text>
              <react_native_1.View style={styles.sectionContent}>
                {renderValue(spiritualityData[section.key])}
              </react_native_1.View>
            </react_native_1.View>); })}
        </react_native_1.View>)}
    </react_native_1.ScrollView>);
}
var styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme_1.colors['neo-dark'],
    },
    header: {
        alignItems: 'center',
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: theme_1.colors['neon-cyan'],
    },
    logo: {
        width: 100,
        height: 100,
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme_1.colors.text,
        fontFamily: theme_1.fonts.orbitron,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: theme_1.colors.text,
        textAlign: 'center',
        marginTop: 8,
        fontFamily: theme_1.fonts.poppins,
    },
    refreshButton: {
        marginTop: 16,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: theme_1.colors['neon-cyan'],
        borderRadius: 20,
    },
    refreshButtonText: {
        color: theme_1.colors['neon-cyan'],
    },
    aiSummaryContainer: {
        padding: 16,
        margin: 16,
        backgroundColor: theme_1.colors.input,
        borderRadius: 8,
    },
    aiSummaryText: {
        color: theme_1.colors.text,
        fontSize: 16,
        fontFamily: theme_1.fonts.poppins,
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
        color: theme_1.colors['neon-cyan'],
        fontFamily: theme_1.fonts.orbitron,
        marginBottom: 8,
    },
    sectionBlurb: {
        fontSize: 14,
        color: theme_1.colors.text,
        fontFamily: theme_1.fonts.poppins,
        marginBottom: 12,
    },
    sectionContent: {
        paddingLeft: 16,
    },
    valueText: {
        color: theme_1.colors.text,
        fontSize: 16,
        fontFamily: theme_1.fonts.poppins,
        marginBottom: 4,
    },
    objectEntry: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    objectKey: {
        color: theme_1.colors.text,
        fontWeight: 'bold',
        marginRight: 8,
    },
    objectValue: {
        color: theme_1.colors.text,
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
        margin: 16,
    },
});
