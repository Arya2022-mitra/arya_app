import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts } from '../constants/theme';

export default function ChatScreen() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([
    { id: 1, text: t('chat.welcomeMessage'), sender: 'bot' },
  ]);
  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    if (inputText.trim() === '') return;
    const newMessages = [...messages, { id: messages.length + 1, text: inputText, sender: 'user' }];
    setMessages(newMessages);
    setInputText('');
    // TODO: Add logic to handle bot response
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <ScrollView style={styles.messagesContainer}>
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageBubble,
              message.sender === 'bot' ? styles.botBubble : styles.userBubble,
            ]}
          >
            <Text style={styles.messageText}>{message.text}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={t('chat.inputPlaceholder')}
          placeholderTextColor="#aaa"
          value={inputText}
          onChangeText={setInputText}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Text style={styles.sendButtonText}>{t('chat.send')}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors['neo-dark'],
    padding: 16,
  },
  messagesContainer: {
    flex: 1,
    marginBottom: 16,
  },
  messageBubble: {
    borderRadius: 20,
    padding: 15,
    marginBottom: 10,
    maxWidth: '80%',
  },
  botBubble: {
    backgroundColor: colors['card-dark'],
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 0,
  },
  userBubble: {
    backgroundColor: colors.primary,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 0,
  },
  messageText: {
    color: '#fff',
    fontFamily: fonts.poppins,
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: colors['deep-blue'],
    color: '#fff',
    padding: 15,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: colors['accent-3'],
    fontFamily: fonts.poppins,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 25,
  },
  sendButtonText: {
    color: colors['neo-dark'],
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: fonts.poppins,
  },
});
