
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Button, Image, TouchableOpacity, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { authInstance as auth } from '../firebaseConfig';
import { useSession } from '../shared/context/SessionContext';
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
  const router = useRouter();
  const { login, isLoading } = useSession();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [language, setLanguage] = useState('en');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async () => {
    setError(null);
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    try {
      let userCredential;
      if (isLoginMode) {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      }

      const user = userCredential.user;
      if (user) {
        const idToken = await user.getIdToken();
        await login(idToken, user.refreshToken);
        router.replace('/'); // Redirect to home on successful login/signup
      }
    } catch (err: any) {
      setError(err.message);
      Alert.alert('Authentication Failed', err.message);
    }
  };

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
        placeholderTextColor={colors.text}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={colors.text}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Button
        title={isLoading ? "Loading..." : (isLoginMode ? "Sign In" : "Sign Up")}
        onPress={handleAuth}
        disabled={isLoading}
      />

      <Text style={styles.orText}>OR</Text>

      <Button
        title="Continue with Google"
        onPress={() => Alert.alert("Coming Soon!", "Google Sign-In is not yet implemented.")}
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
  orText: {
    color: colors.text,
    textAlign: 'center',
    marginVertical: 16,
  },
  errorText: {
    color: colors.danger,
    textAlign: 'center',
    marginBottom: 10,
  }
});
