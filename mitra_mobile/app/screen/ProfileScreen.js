"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = __importDefault(require("react"));
var react_native_1 = require("react-native");
var expo_router_1 = require("expo-router");
var react_i18next_1 = require("react-i18next");
var ProfileCard_1 = __importDefault(require("../components/ProfileCard"));
var theme_1 = require("../../constants/theme");
// Mock data for profiles
var mockProfiles = [
    {
        id: '1',
        first_name: 'Astro',
        last_name: 'User',
        dob: '1990-01-01',
        tob: '12:00',
        moonSign: 'Aries',
        lagna: 'Leo',
        nakshatra: 'Ashwini',
    },
    {
        id: '2',
        first_name: 'Cosmic',
        last_name: 'Traveler',
        dob: '1985-05-15',
        tob: '06:30',
        moonSign: 'Taurus',
        lagna: 'Virgo',
        nakshatra: 'Rohini',
    },
];
var ProfileScreen = function () {
    var t = (0, react_i18next_1.useTranslation)().t;
    var router = (0, expo_router_1.useRouter)();
    var beginJourney = function (profile) {
        // Navigate to the Chat screen with the selected profile
        // In a real app, you would set the active profile in your state management
        router.push({ pathname: '/chat', params: { profileId: profile.id } });
    };
    var handleAddProfile = function () {
        // Navigate to a screen to add a new profile
        // router.push('/add-profile');
        console.log('Navigate to Add Profile screen');
    };
    var handleEditProfile = function (profile) {
        // Navigate to a screen to edit the selected profile
        // router.push(`/edit-profile/${profile.id}`);
        console.log('Navigate to Edit Profile screen', profile.id);
    };
    var handleDeleteProfile = function (profile) {
        // Handle profile deletion logic
        console.log('Delete profile', profile.id);
    };
    return (<react_native_1.View style={styles.container}>
      <react_native_1.Text style={styles.title}>{t('profile.title')}</react_native_1.Text>
      <react_native_1.TouchableOpacity style={styles.addButton} onPress={handleAddProfile}>
        <react_native_1.Text style={styles.addButtonText}>{t('profile.add')}</react_native_1.Text>
      </react_native_1.TouchableOpacity>
      <react_native_1.FlatList data={mockProfiles} renderItem={function (_a) {
            var item = _a.item;
            return (<ProfileCard_1.default profile={item} onPress={function () { return beginJourney(item); }} onEdit={function () { return handleEditProfile(item); }} onDelete={function () { return handleDeleteProfile(item); }}/>);
        }} keyExtractor={function (item) { return item.id; }} contentContainerStyle={styles.listContainer}/>
    </react_native_1.View>);
};
var styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme_1.colors.background,
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme_1.colors.text,
        textAlign: 'center',
        marginVertical: 16,
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
    listContainer: {
        paddingBottom: 16,
    },
});
exports.default = ProfileScreen;
