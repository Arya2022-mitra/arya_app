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
exports.default = DailyAlertsPage;
var react_1 = __importStar(require("react"));
var react_native_1 = require("react-native");
var react_i18next_1 = require("react-i18next");
var theme_1 = require("../constants/theme");
var mockDailyData = {
    summary: "Today is a good day for new beginnings. Focus on your personal growth and spiritual well-being. You may feel a surge of creative energy.",
};
function DailyAlertsPage() {
    var t = (0, react_i18next_1.useTranslation)().t;
    var _a = (0, react_1.useState)(mockDailyData), dailyData = _a[0], setDailyData = _a[1];
    var _b = (0, react_1.useState)(false), loadingData = _b[0], setLoadingData = _b[1];
    var _c = (0, react_1.useState)(null), error = _c[0], setError = _c[1];
    var todayLabel = (0, react_1.useMemo)(function () {
        try {
            return new Intl.DateTimeFormat(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            }).format(new Date());
        }
        catch (_a) {
            return new Date().toDateString();
        }
    }, []);
    return (<react_native_1.ScrollView style={styles.container}>
      <react_native_1.View style={styles.header}>
        <react_native_1.Image source={require('../assets/images/logo.png')} style={styles.logo}/>
        <react_native_1.Text style={styles.title}>{t('dailyPrediction.title')}</react_native_1.Text>
        <react_native_1.Text style={styles.subtitle}>{t('dailyPrediction.subtitle')}</react_native_1.Text>
        <react_native_1.Text style={styles.dateLabel}>{todayLabel}</react_native_1.Text>
        <react_native_1.TouchableOpacity style={styles.refreshButton} onPress={function () { }}>
          <react_native_1.Text style={styles.refreshButtonText}>Refresh Predictions</react_native_1.Text>
        </react_native_1.TouchableOpacity>
      </react_native_1.View>

      <react_native_1.View style={styles.contentContainer}>
        <react_native_1.Text style={styles.sectionTitle}>AI Companion</react_native_1.Text>
        {loadingData && <react_native_1.ActivityIndicator size="large" color={theme_1.colors["neon-cyan"]}/>}
        {error && <react_native_1.Text style={styles.errorText}>{error}</react_native_1.Text>}
        {!loadingData && !error && (<react_native_1.View style={styles.aiSummaryContainer}>
            <react_native_1.Text style={styles.aiSummaryText}>{dailyData.summary}</react_native_1.Text>
          </react_native_1.View>)}
      </react_native_1.View>
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
    dateLabel: {
        fontSize: 14,
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
    contentContainer: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme_1.colors['neon-cyan'],
        fontFamily: theme_1.fonts.orbitron,
        marginBottom: 16,
    },
    aiSummaryContainer: {
        backgroundColor: theme_1.colors.input,
        borderRadius: 8,
        padding: 16,
    },
    aiSummaryText: {
        color: theme_1.colors.text,
        fontSize: 16,
        fontFamily: theme_1.fonts.poppins,
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
        margin: 16,
    },
});
