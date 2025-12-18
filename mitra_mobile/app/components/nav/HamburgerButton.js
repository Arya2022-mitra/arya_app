"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = HamburgerButton;
var react_1 = __importDefault(require("react"));
var react_native_1 = require("react-native");
var react_i18next_1 = require("react-i18next");
var theme_1 = require("../../../constants/theme");
function HamburgerButton(_a) {
    var onPress = _a.onPress;
    var t = (0, react_i18next_1.useTranslation)().t;
    return (<react_native_1.TouchableOpacity accessibilityLabel={t('nav.openMenu')} onPress={onPress} style={styles.button}>
      <react_native_1.View style={styles.line}/>
      <react_native_1.View style={styles.line}/>
      <react_native_1.View style={styles.line}/>
    </react_native_1.TouchableOpacity>);
}
var styles = react_native_1.StyleSheet.create({
    button: {
        padding: 8,
    },
    line: {
        width: 24,
        height: 2,
        backgroundColor: theme_1.colors.text,
        marginBottom: 5,
    },
});
