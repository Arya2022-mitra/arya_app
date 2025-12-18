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
exports.default = Auth;
var react_1 = __importStar(require("react"));
var react_native_1 = require("react-native");
var picker_1 = require("@react-native-picker/picker");
var react_i18next_1 = require("react-i18next");
var theme_1 = require("../constants/theme");
// Add a list of languages
var LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese' },
    { code: 'hi', name: 'Hindi' },
    { code: 'ar', name: 'Arabic' },
];
function Auth() {
    var t = (0, react_i18next_1.useTranslation)().t;
    var _a = (0, react_1.useState)(''), email = _a[0], setEmail = _a[1];
    var _b = (0, react_1.useState)(''), password = _b[0], setPassword = _b[1];
    var _c = (0, react_1.useState)('en'), language = _c[0], setLanguage = _c[1];
    var _d = (0, react_1.useState)(true), isLoginMode = _d[0], setIsLoginMode = _d[1];
    return (<react_native_1.View style={styles.container}>
      <react_native_1.Image source={require('../assets/images/logo.png')} style={styles.logo}/>
      <react_native_1.Text style={styles.title}>MitraVeda</react_native_1.Text>
      <react_native_1.Text style={styles.subtitle}>Begin Your Divine Journey</react_native_1.Text>

      <react_native_1.View style={styles.toggleContainer}>
        <react_native_1.TouchableOpacity style={[styles.toggleButton, isLoginMode && styles.activeToggleButton]} onPress={function () { return setIsLoginMode(true); }}>
          <react_native_1.Text style={styles.toggleText}>Sign In</react_native_1.Text>
        </react_native_1.TouchableOpacity>
        <react_native_1.TouchableOpacity style={[styles.toggleButton, !isLoginMode && styles.activeToggleButton]} onPress={function () { return setIsLoginMode(false); }}>
          <react_native_1.Text style={styles.toggleText}>Sign Up</react_native_1.Text>
        </react_native_1.TouchableOpacity>
      </react_native_1.View>

      <react_native_1.TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"/>
      <react_native_1.TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry/>

      <picker_1.Picker selectedValue={language} style={styles.picker} onValueChange={function (itemValue) { return setLanguage(itemValue); }}>
        {LANGUAGES.map(function (lang) { return (<picker_1.Picker.Item key={lang.code} label={lang.name} value={lang.code}/>); })}
      </picker_1.Picker>

      <react_native_1.Button title={isLoginMode ? "Sign In" : "Sign Up"} onPress={function () { }}/>

      <react_native_1.Text style={styles.orText}>OR</react_native_1.Text>

      <react_native_1.Button title="Continue with Google" onPress={function () { }}/>
    </react_native_1.View>);
}
var styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 16,
        backgroundColor: theme_1.colors['neo-dark'],
    },
    logo: {
        width: 120,
        height: 120,
        alignSelf: 'center',
        marginBottom: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme_1.colors.text,
        textAlign: 'center',
        fontFamily: theme_1.fonts.sanskrit,
    },
    subtitle: {
        fontSize: 18,
        color: theme_1.colors.text,
        textAlign: 'center',
        marginBottom: 24,
        fontFamily: theme_1.fonts.orbitron,
    },
    toggleContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 16,
    },
    toggleButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderWidth: 1,
        borderColor: theme_1.colors['neon-cyan'],
    },
    activeToggleButton: {
        backgroundColor: theme_1.colors['neon-cyan'],
    },
    toggleText: {
        color: theme_1.colors.text,
    },
    input: {
        backgroundColor: theme_1.colors.input,
        color: theme_1.colors.text,
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        fontFamily: theme_1.fonts.poppins,
    },
    picker: {
        backgroundColor: theme_1.colors.input,
        color: theme_1.colors.text,
        borderRadius: 8,
        marginBottom: 16,
    },
    orText: {
        color: theme_1.colors.text,
        textAlign: 'center',
        marginVertical: 16,
    },
});
