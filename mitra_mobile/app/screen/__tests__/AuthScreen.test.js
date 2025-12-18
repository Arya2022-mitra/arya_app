"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = __importDefault(require("react"));
var react_native_1 = require("@testing-library/react-native");
var auth_1 = __importDefault(require("../../auth"));
// Mocking expo-router
jest.mock('expo-router', function () { return ({
    useRouter: function () { return ({
        replace: jest.fn(),
    }); },
}); });
// Mocking @react-native-firebase/auth
jest.mock('@react-native-firebase/auth', function () { return function () { return ({
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signInWithCredential: jest.fn(),
}); }; });
// Mocking @react-native-google-signin/google-signin
jest.mock('@react-native-google-signin/google-signin', function () { return ({
    GoogleSignin: {
        configure: jest.fn(),
        hasPlayServices: jest.fn(function () { return Promise.resolve(true); }),
        signIn: jest.fn(function () { return Promise.resolve({ idToken: 'mock-id-token' }); }),
    },
}); });
// Mocking react-i18next
jest.mock('react-i18next', function () { return ({
    useTranslation: function () { return ({
        t: function (key) { return key; },
    }); },
}); });
describe('AuthScreen', function () {
    it('renders the logo', function () {
        var getByTestId = (0, react_native_1.render)(<auth_1.default />).getByTestId;
        var logo = getByTestId('logo');
        expect(logo).toBeTruthy();
    });
    it('toggles between Sign In and Sign Up', function () {
        var getByTestId = (0, react_native_1.render)(<auth_1.default />).getByTestId;
        // Switch to Sign Up mode
        react_native_1.fireEvent.press(getByTestId('signUpToggle'));
        // Check if the button text changes to Sign Up
        var authButton = getByTestId('authButton');
        expect((0, react_native_1.within)(authButton).getByText('auth.signUp')).toBeTruthy();
    });
});
