"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SettingsScreen;
var react_1 = __importDefault(require("react"));
var react_native_1 = require("react-native");
var react_i18next_1 = require("react-i18next");
var theme_1 = require("../../constants/theme");
var PlanCard = function (_a) {
    var name = _a.name, price = _a.price, features = _a.features, t = _a.t;
    return (<react_native_1.View style={styles.planCard}>
    <react_native_1.Text style={styles.planName}>{name}</react_native_1.Text>
    <react_native_1.Text style={styles.planPrice}>{price}</react_native_1.Text>
    <react_native_1.View style={styles.featuresList}>
      {features.map(function (feature, index) { return (<react_native_1.Text key={index} style={styles.featureText}>• {feature}</react_native_1.Text>); })}
    </react_native_1.View>
    <react_native_1.TouchableOpacity style={styles.selectButton}>
      <react_native_1.Text style={styles.selectButtonText}>{t('settings.selectPlan')}</react_native_1.Text>
    </react_native_1.TouchableOpacity>
  </react_native_1.View>);
};
function SettingsScreen() {
    var t = (0, react_i18next_1.useTranslation)().t;
    var plans = [
        {
            name: t('settings.freeTier.name'),
            price: t('settings.freeTier.price'),
            features: t('settings.freeTier.features', { returnObjects: true }),
        },
        {
            name: t('settings.premiumTier.name'),
            price: t('settings.premiumTier.price'),
            features: t('settings.premiumTier.features', { returnObjects: true }),
        },
        {
            name: t('settings.enterpriseTier.name'),
            price: t('settings.enterpriseTier.price'),
            features: t('settings.enterpriseTier.features', { returnObjects: true }),
        },
    ];
    return (<react_native_1.ScrollView style={styles.container}>
      <react_native_1.Text style={styles.title}>{t('settings.title')}</react_native_1.Text>
      <react_native_1.Text style={styles.subtitle}>{t('settings.subtitle')}</react_native_1.Text>
      {plans.map(function (plan, index) { return (<PlanCard key={index} {...plan} t={t}/>); })}
    </react_native_1.ScrollView>);
}
var styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme_1.colors['neo-dark'],
        padding: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: theme_1.colors.primary,
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: theme_1.colors.text,
        textAlign: 'center',
        marginBottom: 32,
    },
    planCard: {
        backgroundColor: theme_1.colors['card-dark'],
        borderRadius: 24,
        borderWidth: 1,
        borderColor: theme_1.colors['accent-3'],
        padding: 24,
        marginBottom: 24,
    },
    planName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: theme_1.colors.primary,
        marginBottom: 8,
    },
    planPrice: {
        fontSize: 18,
        color: theme_1.colors.text,
        marginBottom: 16,
    },
    featuresList: {
        marginBottom: 24,
    },
    featureText: {
        fontSize: 16,
        color: theme_1.colors.text,
        marginBottom: 8,
        fontFamily: theme_1.fonts.poppins,
    },
    selectButton: {
        backgroundColor: theme_1.colors.primary,
        paddingVertical: 12,
        borderRadius: 999,
        alignItems: 'center',
    },
    selectButtonText: {
        color: theme_1.colors['neo-dark'],
        fontWeight: 'bold',
        fontSize: 16,
    },
});
