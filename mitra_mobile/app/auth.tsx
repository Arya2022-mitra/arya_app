
import { GOOGLE_WEB_CLIENT_ID } from '@env';
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Picker, PickerProps } from '@react-native-picker/picker';
import React, {
  useState
} from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import theme from '../theme';

// You need to configure Google Sign-in first.
// Follow the instructions here: https://github.com/react-native-google-signin/google-signin
if (Platform.OS !== 'web') {
  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
  });
}

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
];

// Wrapper for the Picker component to resolve TypeScript issues
const MyPicker: React.FC<PickerProps<string>> = (props) => {
  const PickerComponent = Picker as any;
  return <PickerComponent {...props} />;
};

const AuthScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [language, setLanguage] = useState('en');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleEmailSubmit = async () => {
    setError(null);
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      if (isLoginMode) {
        await auth().signInWithEmailAndPassword(email, password);
      } else {
        await auth().createUserWithEmailAndPassword(email, password);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const onGoogleButtonPress = async () => {
    try {
      setLoading(true);
      // Check if your device supports Google Play
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      // Get the users ID token
      const userInfo: any = await GoogleSignin.signIn();
      if (!userInfo.idToken) {
        throw new Error('Google Sign-In failed to return an ID token.');
      }

      // Create a Google credential with the token
      const googleCredential = auth.GoogleAuthProvider.credential(userInfo.idToken);

      // Sign-in the user with the credential
      return auth().signInWithCredential(googleCredential);
    } catch (error: any) {
      setError(error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: 'https://placehold.co/120x120/0b0f1a/00ffff?text=MitraVeda' }}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.header}>MitraVeda</Text>
      <Text style={styles.tagline}>Begin Your Divine Journey</Text>

      <View style={styles.toggleContainer}>
        <TouchableOpacity onPress={() => setIsLoginMode(true)}>
          <Text style={[styles.toggleText, isLoginMode && styles.activeToggle]}>
            Sign In
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setIsLoginMode(false)}>
          <Text style={[styles.toggleText, !isLoginMode && styles.activeToggle]}>
            Sign Up
          </Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={theme.colors.muted}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={theme.colors.muted}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <View style={styles.pickerContainer}>
        <Text style={styles.label}>Preferred Language</Text>
        <MyPicker
          selectedValue={language}
          style={Platform.OS === 'ios' ? styles.pickerIOS : styles.pickerAndroid}
          itemStyle={styles.pickerItem}
          onValueChange={(itemValue: string) => setLanguage(itemValue)}
        >
          {LANGUAGES.map((lang) => (
            <Picker.Item key={lang.code} label={lang.name} value={lang.code} />
          ))}
        </MyPicker>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <TouchableOpacity
        style={styles.button}
        onPress={handleEmailSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={theme.colors.background} />
        ) : (
          <Text style={styles.buttonText}>
            {isLoginMode ? 'Sign In' : 'Sign Up'}
          </Text>
        )}
      </TouchableOpacity>

      <Text style={styles.orText}>OR</Text>

      <TouchableOpacity
        style={[styles.button, styles.googleButton]}
        onPress={onGoogleButtonPress}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={theme.colors.background} />
        ) : (
          <Text style={[styles.buttonText, styles.googleButtonText]}>
            Continue with Google
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 10,
  },
  header: {
    color: theme.colors.cyan,
    fontSize: 28,
    fontWeight: '600',
    letterSpacing: 2,
    fontFamily: theme.fonts.orbitron,
    marginBottom: 10,
  },
  tagline: {
    fontSize: 18,
    fontFamily: theme.fonts.rajdhani,
    color: theme.colors.text,
    marginBottom: 30,
  },
  toggleContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.cyan,
    borderRadius: 8,
    overflow: 'hidden',
  },
  toggleText: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    color: theme.colors.cyan,
    fontSize: 16,
    fontFamily: theme.fonts.rajdhani,
  },
  activeToggle: {
    backgroundColor: theme.colors.cyan,
    color: theme.colors.background,
  },
  input: {
    width: '100%',
    padding: 15,
    marginVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.cyan,
    backgroundColor: theme.colors.panel,
    color: theme.colors.text,
    fontSize: 16,
    fontFamily: theme.fonts.rajdhani,
  },
  pickerContainer: {
    width: '100%',
    marginVertical: 10,
  },
  label: {
    color: theme.colors.cyan,
    marginBottom: 10,
    fontSize: 16,
    fontFamily: theme.fonts.rajdhani,
  },
  pickerAndroid: {
    backgroundColor: theme.colors.panel,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.cyan,
    borderRadius: 8,
  },
  pickerIOS: {
    // iOS picker has a different appearance
  },
  pickerItem: {
    color: Platform.OS === 'ios' ? theme.colors.text : undefined,
    backgroundColor: theme.colors.panel,
  },
  errorText: {
    color: theme.colors.error,
    textAlign: 'center',
    marginVertical: 10,
  },
  button: {
    backgroundColor: theme.colors.cyan,
    padding: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonText: {
    color: theme.colors.background,
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: theme.fonts.orbitron,
  },
  orText: {
    color: theme.colors.cyan,
    marginVertical: 15,
    fontSize: 16,
  },
  googleButton: {
    backgroundColor: 'white',
  },
  googleButtonText: {
    color: 'black',
  },
});

export default AuthScreen;
