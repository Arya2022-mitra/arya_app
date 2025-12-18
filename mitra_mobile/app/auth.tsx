import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts } from '../styles/theme';

export default function AuthScreen() {
  const { t } = useTranslation();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  return (
    <View style={styles.container}>
      <Text style={styles.logo} testID="logo">Mithra Veda</Text>
      <View style={styles.switchContainer}>
        <TouchableOpacity testID="signInToggle" onPress={() => setIsSignUp(false)}>
          <Text style={[styles.switchLabel, !isSignUp && styles.activeSwitch]}>{t('auth.signIn')}</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="signUpToggle" onPress={() => setIsSignUp(true)}>
          <Text style={[styles.switchLabel, isSignUp && styles.activeSwitch]}>{t('auth.signUp')}</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        style={styles.input}
        placeholder={t('auth.emailPlaceholder')}
        placeholderTextColor="#aaa"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder={t('auth.passwordPlaceholder')}
        placeholderTextColor="#aaa"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {isSignUp && (
        <TextInput
          style={styles.input}
          placeholder={t('auth.confirmPasswordPlaceholder')}
          placeholderTextColor="#aaa"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
      )}
      <TouchableOpacity style={styles.button} testID="authButton">
        <Text style={styles.buttonText}>{isSignUp ? t('auth.signUp') : t('auth.signIn')}</Text>
      </TouchableOpacity>
      <TouchableOpacity>
        <Text style={styles.forgotPassword}>{t('auth.forgotPassword')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors['neo-dark'],
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.primary,
    fontFamily: fonts.poppins,
    marginBottom: 48,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  switchLabel: {
    color: colors.text,
    fontSize: 18,
    fontFamily: fonts.poppins,
    marginHorizontal: 16,
  },
  activeSwitch: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    backgroundColor: colors['deep-blue'],
    color: '#fff',
    padding: 15,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: colors['accent-3'],
    fontFamily: fonts.poppins,
    marginBottom: 16,
  },
  button: {
    width: '100%',
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: colors['neo-dark'],
    fontWeight: 'bold',
    fontSize: 18,
    fontFamily: fonts.poppins,
  },
  forgotPassword: {
    color: colors.primary,
    marginTop: 16,
    fontFamily: fonts.poppins,
  },
});
