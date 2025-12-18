import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../styles/theme';

interface ChatBubbleProps {
  from: 'user' | 'assistant';
  message: React.ReactNode;
  timestamp: string;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ from, message, timestamp }) => {
  const isUser = from === 'user';

  return (
    <View style={[styles.container, isUser ? styles.userBubble : styles.assistantBubble]}>
      <Text style={styles.messageText}>{message}</Text>
      <Text style={styles.timestampText}>{timestamp}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
    maxWidth: '80%',
  },
  userBubble: {
    backgroundColor: colors.primary,
    alignSelf: 'flex-end',
  },
  assistantBubble: {
    backgroundColor: colors['deep-blue'],
    alignSelf: 'flex-start',
  },
  messageText: {
    color: colors.text,
    fontSize: 16,
    fontFamily: fonts.poppins,
  },
  timestampText: {
    color: colors.text,
    fontSize: 10,
    fontFamily: fonts.poppins,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
});

export default ChatBubble;
