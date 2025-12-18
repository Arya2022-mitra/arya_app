"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = __importDefault(require("react"));
var react_native_1 = require("@testing-library/react-native");
var ProfileScreen_1 = __importDefault(require("../ProfileScreen"));
// Mock react-i18next
jest.mock('react-i18next', function () { return ({
    useTranslation: function () { return ({
        t: function (key) { return key; },
    }); },
}); });
// Mock expo-router
var mockPush = jest.fn();
jest.mock('expo-router', function () { return ({
    useRouter: function () { return ({
        push: mockPush,
    }); },
}); });
describe('ProfileScreen', function () {
    beforeEach(function () {
        mockPush.mockClear();
    });
    it('renders the title and add profile button', function () {
        var getByText = (0, react_native_1.render)(<ProfileScreen_1.default />).getByText;
        expect(getByText('profile.title')).toBeTruthy();
        expect(getByText('profile.add')).toBeTruthy();
    });
    it('renders the profile cards', function () {
        var getByText = (0, react_native_1.render)(<ProfileScreen_1.default />).getByText;
        expect(getByText('Astro User')).toBeTruthy();
        expect(getByText('Cosmic Traveler')).toBeTruthy();
    });
    it('navigates to the chat screen when a profile is pressed', function () {
        var getByText = (0, react_native_1.render)(<ProfileScreen_1.default />).getByText;
        react_native_1.fireEvent.press(getByText('Astro User'));
        expect(mockPush).toHaveBeenCalledWith({ pathname: '/chat', params: { profileId: '1' } });
    });
});
