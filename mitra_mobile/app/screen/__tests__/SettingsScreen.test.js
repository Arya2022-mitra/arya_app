"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = __importDefault(require("react"));
var react_native_1 = require("@testing-library/react-native");
var SettingsScreen_1 = __importDefault(require("../SettingsScreen"));
// Mock react-i18next to provide the expected translations, including arrays
jest.mock('react-i18next', function () { return ({
    useTranslation: function () { return ({
        t: function (key) {
            var translations = {
                'settings.title': 'Choose Your Plan',
                'settings.subtitle': 'Select the plan that best fits your needs.',
                'settings.freeTier.name': 'Free',
                'settings.freeTier.features': [
                    'Basic feature 1',
                    'Basic feature 2',
                    'Basic feature 3',
                ],
                'settings.premiumTier.name': 'Premium',
                'settings.premiumTier.features': [
                    'All features from Free',
                    'Premium feature 1',
                    'Premium feature 2',
                ],
                'settings.enterpriseTier.name': 'Enterprise',
                'settings.enterpriseTier.features': [
                    'All features from Premium',
                    'Enterprise feature 1',
                    'Enterprise feature 2',
                ],
            };
            return translations[key] || key;
        },
    }); },
}); });
describe('SettingsScreen', function () {
    it('renders the title and subtitle', function () {
        var getByText = (0, react_native_1.render)(<SettingsScreen_1.default />).getByText;
        expect(getByText('Choose Your Plan')).toBeTruthy();
        expect(getByText('Select the plan that best fits your needs.')).toBeTruthy();
    });
    it('renders the plan cards', function () {
        var getByText = (0, react_native_1.render)(<SettingsScreen_1.default />).getByText;
        expect(getByText('Free')).toBeTruthy();
        expect(getByText('Premium')).toBeTruthy();
        expect(getByText('Enterprise')).toBeTruthy();
    });
});
