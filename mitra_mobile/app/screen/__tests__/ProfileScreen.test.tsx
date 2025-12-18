import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ProfileScreen from '../ProfileScreen';
import { useRouter } from 'expo-router';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock expo-router
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('ProfileScreen', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('renders the title and add profile button', () => {
    const { getByText } = render(<ProfileScreen />);
    expect(getByText('profile.title')).toBeTruthy();
    expect(getByText('profile.add')).toBeTruthy();
  });

  it('renders the profile cards', () => {
    const { getByText } = render(<ProfileScreen />);
    expect(getByText('Astro User')).toBeTruthy();
    expect(getByText('Cosmic Traveler')).toBeTruthy();
  });

  it('navigates to the chat screen when a profile is pressed', () => {
    const { getByText } = render(<ProfileScreen />);
    fireEvent.press(getByText('Astro User'));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/chat', params: { profileId: '1' } });
  });
});
