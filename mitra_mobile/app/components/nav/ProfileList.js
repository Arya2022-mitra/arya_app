"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ProfileList;
var react_1 = __importDefault(require("react"));
var react_native_1 = require("react-native");
var react_i18next_1 = require("react-i18next");
var theme_1 = require("../../../constants/theme");
// Mock data for profiles
var mockProfiles = [
    {
        id: '1',
        first_name: 'Astro',
        last_name: 'User',
    },
    {
        id: '2',
        first_name: 'Cosmic',
        last_name: 'Traveler',
    },
];
function ProfileList() {
    var t = (0, react_i18next_1.useTranslation)().t;
    var handleAddProfile = function () {
        // Navigate to a screen to add a new profile
        console.log('Navigate to Add Profile screen');
    };
    return (<react_native_1.View style={styles.container}>
      <react_native_1.Text style={styles.title}>{t('nav.profiles')}</react_native_1.Text>
      <react_native_1.TouchableOpacity style={styles.addButton} onPress={handleAddProfile}>
        <react_native_1.Text style={styles.addButtonText}>{t('nav.addProfile')}</react_native_1.Text>
      </react_native_1.TouchableOpacity>
      {mockProfiles.map(function (profile) { return (<react_native_1.TouchableOpacity key={profile.id} style={styles.profileItem}>
          <react_native_1.Text style={styles.profileName}>
            {profile.first_name} {profile.last_name}
          </react_native_1.Text>
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
    addButton: {
        backgroundColor: theme_1.colors.primary,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 16,
    },
    addButtonText: {
        color: theme_1.colors.text,
        fontSize: 16,
        fontWeight: 'bold',
    },
    profileItem: {
        paddingVertical: 8,
    },
    profileName: {
        fontSize: 16,
        color: theme_1.colors.text,
        fontFamily: theme_1.fonts.poppins,
    },
});
