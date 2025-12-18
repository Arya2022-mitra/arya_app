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
exports.default = DailyPanchangPage;
var react_1 = __importStar(require("react"));
var react_native_1 = require("react-native");
var react_i18next_1 = require("react-i18next");
var theme_1 = require("../constants/theme");
var mockPanchangData = {
    tithi: 'Shukla Paksha, Pratipada',
    nakshatra: 'Ashwini',
    yoga: 'Vishkambha',
    karana: 'Kimstughna',
    sunrise: '06:00 AM',
    sunset: '06:30 PM',
    moonrise: '06:30 AM',
    moonset: '07:00 PM',
};
function DailyPanchangPage() {
    var t = (0, react_i18next_1.useTranslation)().t;
    var _a = (0, react_1.useState)(mockPanchangData), panchangData = _a[0], setPanchangData = _a[1];
    var _b = (0, react_1.useState)(false), loading = _b[0], setLoading = _b[1];
    var _c = (0, react_1.useState)(null), error = _c[0], setError = _c[1];
    if (loading) {
        return <react_native_1.ActivityIndicator size="large" color={theme_1.colors["neon-cyan"]}/>;
    }
    if (error) {
        return <react_native_1.Text style={styles.errorText}>{error}</react_native_1.Text>;
    }
    return (<react_native_1.ScrollView style={styles.container}>
      <react_native_1.Text style={styles.title}>Daily Panchang</react_native_1.Text>
      <react_native_1.View style={styles.panchangContainer}>
        {Object.entries(panchangData).map(function (_a) {
            var key = _a[0], value = _a[1];
            return (<react_native_1.View key={key} style={styles.panchangItem}>
            <react_native_1.Text style={styles.panchangKey}>{t("panchang.".concat(key))}</react_native_1.Text>
            <react_native_1.Text style={styles.panchangValue}>{value}</react_native_1.Text>
          </react_native_1.View>);
        })}
      </react_native_1.View>
    </react_native_1.ScrollView>);
}
var styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme_1.colors['neo-dark'],
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme_1.colors.text,
        fontFamily: theme_1.fonts.orbitron,
        textAlign: 'center',
        marginBottom: 24,
    },
    panchangContainer: {
        backgroundColor: theme_1.colors.input,
        borderRadius: 8,
        padding: 16,
    },
    panchangItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: theme_1.colors.accent,
    },
    panchangKey: {
        fontSize: 16,
        color: theme_1.colors.text,
        fontFamily: theme_1.fonts.poppins,
        fontWeight: 'bold',
    },
    panchangValue: {
        fontSize: 16,
        color: theme_1.colors.text,
        fontFamily: theme_1.fonts.poppins,
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
        margin: 16,
    },
});
