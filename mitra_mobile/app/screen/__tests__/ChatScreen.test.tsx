import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ChatScreen from '../ChatScreen';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('ChatScreen', () => {
  it('renders the header and input field', () => {
    const { getByPlaceholderText } = render(<ChatScreen />);
    expect(getByPlaceholderText('chat.typeMessage')).toBeTruthy();
  });

  it('allows typing in the input field', () => {
    const { getByPlaceholderText } = render(<ChatScreen />);
    const input = getByPlaceholderText('chat.typeMessage');
    fireEvent.changeText(input, 'Hello, world!');
    expect(input.props.value).toBe('Hello, world!');
  });

  it('sends a message when the send button is pressed', () => {
    const { getByPlaceholderText, getByText, queryByText } = render(<ChatScreen />);
    const input = getByPlaceholderText('chat.typeMessage');
    fireEvent.changeText(input, 'Test message');
    fireEvent.press(getByText('chat.send'));
    expect(queryByText('Test message')).toBeTruthy();
    expect(input.props.value).toBe('');
  });
});
