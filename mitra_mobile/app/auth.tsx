import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Button, Image, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useTranslation } from 'react-i18next';
import { colors, fonts } from '../constants/theme';

// Add a list of languages
const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ar', name: 'Arabic' },
];

export default function Auth() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [language, setLanguage] = useState('en');
  const [isLoginMode, setIsLoginMode] = useState(true);

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/logo.png')}
        style={styles.logo}
      />
      <Text style={styles.title}>MitraVeda</Text>
      <Text style={styles.subtitle}>Begin Your Divine Journey</Text>

      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, isLoginMode && styles.activeToggleButton]}
          onPress={() => setIsLoginMode(true)}
        >
          <Text style={styles.toggleText}>Sign In</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, !isLoginMode && styles.activeToggleButton]}
          onPress={() => setIsLoginMode(false)}
        >
          <Text style={styles.toggleText}>Sign Up</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Picker
        selectedValue={language}
        style={styles.picker}
        onValueChange={(itemValue) => setLanguage(itemValue)}
      >
        {LANGUAGES.map((lang: { code: string; name: string }) => (
          <Picker.Item key={lang.code} label={lang.name} value={lang.code} />
        ))}
      </Picker>

      <Button
        title={isLoginMode ? "Sign In" : "Sign Up"}
        onPress={() => {}}
      />

      <Text style={styles.orText}>OR</Text>

      <Button
        title="Continue with Google"
        onPress={() => {}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: colors['neo-dark'],
  },
  logo: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    fontFamily: fonts.sanskrit,
  },
  subtitle: {
    fontSize: 18,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: fonts.orbitron,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  toggleButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: colors['neon-cyan'],
  },
  activeToggleButton: {
    backgroundColor: colors['neon-cyan'],
  },
  toggleText: {
    color: colors.text,
  },
  input: {
    backgroundColor: colors.input,
    color: colors.text,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    fontFamily: fonts.poppins,
  },
  picker: {
    backgroundColor: colors.input,
    color: colors.text,
    borderRadius: 8,
    marginBottom: 16,
  },
  orText: {
    color: colors.text,
    textAlign: 'center',
    marginVertical: 16,
  },
});
