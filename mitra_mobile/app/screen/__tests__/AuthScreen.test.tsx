import React from 'react';
import { render, fireEvent, within } from '@testing-library/react-native';
import AuthScreen from '../AuthScreen';
import i18n from '../../i18n';

// Mocking expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: jest.fn(),
  }),
}));

// Mocking @react-native-firebase/auth
jest.mock('@react-native-firebase/auth', () => () => ({
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signInWithCredential: jest.fn(),
}));

// Mocking @react-native-google-signin/google-signin
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(() => Promise.resolve(true)),
    signIn: jest.fn(() => Promise.resolve({ idToken: 'mock-id-token' })),
  },
}));

// Mocking react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('AuthScreen', () => {
  it('renders the logo', () => {
    const { getByTestId } = render(<AuthScreen />);
    const logo = getByTestId('logo');
    expect(logo).toBeTruthy();
  });

  it('toggles between Sign In and Sign Up', () => {
    const { getByTestId } = render(<AuthScreen />);

    // Switch to Sign Up mode
    fireEvent.press(getByTestId('signUpToggle'));

    // Check if the button text changes to Sign Up
    const authButton = getByTestId('authButton');
    expect(within(authButton).getByText('auth.signUp')).toBeTruthy();
  });
});
