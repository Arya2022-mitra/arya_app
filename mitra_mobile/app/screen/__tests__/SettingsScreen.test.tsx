import React from 'react';
import { render } from '@testing-library/react-native';
import SettingsScreen from '../SettingsScreen';

// Mock react-i18next to provide the expected translations, including arrays
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: { [key: string]: any } = {
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
  }),
}));

describe('SettingsScreen', () => {
  it('renders the title and subtitle', () => {
    const { getByText } = render(<SettingsScreen />);
    expect(getByText('Choose Your Plan')).toBeTruthy();
    expect(getByText('Select the plan that best fits your needs.')).toBeTruthy();
  });

  it('renders the plan cards', () => {
    const { getByText } = render(<SettingsScreen />);
    expect(getByText('Free')).toBeTruthy();
    expect(getByText('Premium')).toBeTruthy();
    expect(getByText('Enterprise')).toBeTruthy();
  });
});
