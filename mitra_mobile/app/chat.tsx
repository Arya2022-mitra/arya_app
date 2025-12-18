import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Button, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts } from '../constants/theme';

interface ChatMessage {
  from: 'user' | 'assistant';
  message: string;
  timestamp: string;
}

interface ChatBubbleProps {
  from: 'user' | 'assistant';
  message: string;
  timestamp: string;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ from, message, timestamp }) => (
  <View style={[styles.bubble, from === 'user' ? styles.userBubble : styles.assistantBubble]}>
    <Text style={styles.messageText}>{message}</Text>
    <Text style={styles.timestamp}>{timestamp}</Text>
  </View>
);

export default function Chat() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { from: 'assistant', message: 'Hello! How can I help you today?', timestamp: new Date().toLocaleTimeString() },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const sendMessage = () => {
    if (input.trim() === '') return;

    const timestamp = new Date().toLocaleTimeString();
    const newUserMessage: ChatMessage = { from: 'user', message: input, timestamp };
    setMessages(prev => [...prev, newUserMessage]);
    setInput('');
    setSending(true);

    // Simulate assistant response
    setTimeout(() => {
      const assistantResponse: ChatMessage = { from: 'assistant', message: `I received your message: "${input}"`, timestamp: new Date().toLocaleTimeString() };
      setMessages(prev => [...prev, assistantResponse]);
      setSending(false);
    }, 1000);
  };

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <Text style={styles.header}>🔮 MitraVeda Chat – Divine Guidance</Text>
      <ScrollView 
        style={styles.messagesContainer}
        ref={scrollViewRef}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((msg, idx) => (
          <ChatBubble key={idx} from={msg.from} message={msg.message} timestamp={msg.timestamp} />
        ))}
        {sending && <Text style={styles.processingText}>{t('chat.processing')}</Text>}
      </ScrollView>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder={t('chat.inputPlaceholder')}
        />
        <Button title={t('chat.send')} onPress={sendMessage} disabled={sending} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors['neo-dark'],
  },
  header: {
    padding: 24,
    textAlign: 'center',
    fontFamily: 'orbitron',
    fontSize: 18,
    color: colors['neon-cyan'],
    borderBottomWidth: 1,
    borderBottomColor: colors.accent,
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  bubble: {
    padding: 12,
    borderRadius: 20,
    marginBottom: 12,
    maxWidth: '80%',
  },
  userBubble: {
    backgroundColor: colors['neon-cyan'],
    alignSelf: 'flex-end',
  },
  assistantBubble: {
    backgroundColor: colors.input,
    alignSelf: 'flex-start',
  },
  messageText: {
    color: colors.text,
  },
  timestamp: {
    color: colors.text,
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  processingText: {
    textAlign: 'center',
    fontStyle: 'italic',
    color: colors['neon-cyan'],
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.accent,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: colors.input,
    color: colors.text,
    padding: 12,
    borderRadius: 20,
    marginRight: 16,
  },
});
