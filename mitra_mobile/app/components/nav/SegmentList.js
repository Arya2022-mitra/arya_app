"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SegmentList;
var react_1 = __importDefault(require("react"));
var react_native_1 = require("react-native");
var react_i18next_1 = require("react-i18next");
var expo_router_1 = require("expo-router");
var theme_1 = require("../../../constants/theme");
function SegmentList() {
    var t = (0, react_i18next_1.useTranslation)().t;
    var router = (0, expo_router_1.useRouter)();
    var navigateTo = function (path) {
        router.push(path);
    };
    var segments = [
        { name: t('nav.chat'), path: '/chat' },
        { name: t('nav.dailyPanchang'), path: '/daily-panchang' },
        { name: t('nav.personalPanchang'), path: '/personal-panchang' },
        { name: t('nav.guardian'), path: '/guardian' },
        { name: t('nav.dailyPrediction'), path: '/daily-prediction' },
        { name: t('nav.dailyAlerts'), path: '/daily-alerts' },
        { name: t('nav.monthlyPrediction'), path: '/monthly-prediction' },
        { name: t('nav.tithis'), path: '/tithis' },
        { name: t('nav.numerology'), path: '/numerology' },
        { name: t('nav.shareMarket'), path: '/share-market' },
        { name: t('nav.pakshi'), path: '/pakshi' },
        { name: t('nav.dasha'), path: '/dasha' },
        { name: t('nav.business'), path: '/business' },
        { name: t('nav.career'), path: '/career' },
        { name: t('nav.wealth'), path: '/wealth' },
        { name: t('nav.health'), path: '/health' },
        { name: t('nav.education'), path: '/education' },
        { name: t('nav.spirituality'), path: '/spirituality' },
        { name: t('nav.marriageLove'), path: '/marriage-love' },
    ];
    return (<react_native_1.View style={styles.container}>
      <react_native_1.Text style={styles.title}>{t('nav.segments')}</react_native_1.Text>
      {segments.map(function (segment) { return (<react_native_1.TouchableOpacity key={segment.name} style={styles.segmentItem} onPress={function () { return navigateTo(segment.path); }}>
          <react_native_1.Text style={styles.segmentName}>{segment.name}</react_native_1.Text>
        </react_native_1.TouchableOpacity>); })}
    </react_native_1.View>);
}
var styles = react_native_1.StyleSheet.create({
    container: {
        padding: 16,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme_1.colors.text,
        marginBottom: 8,
        fontFamily: theme_1.fonts.poppins,
    },
    segmentItem: {
        paddingVertical: 8,
    },
    segmentName: {
        fontSize: 16,
        color: theme_1.colors.text,
        fontFamily: theme_1.fonts.poppins,
    },
});
