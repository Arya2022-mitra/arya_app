
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
import { authInstance } from '../firebaseConfig';
import { GOOGLE_WEB_CLIENT_ID } from '@env';

GoogleSignin.configure({
  webClientId: GOOGLE_WEB_CLIENT_ID,
  offlineAccess: true, // Request refresh token
});

/**
 * Sign in with Google and return Firebase tokens
 * 
 * @returns Object with Firebase idToken and optional refreshToken
 * @throws Error if sign-in fails
 */
export const signInWithGoogle = async (): Promise<{ idToken: string; refreshToken?: string }> => {
  try {
    await GoogleSignin.hasPlayServices();
    const result = await GoogleSignin.signIn();
    
    const googleIdToken = result.idToken;
    
    if (!googleIdToken) {
      throw new Error('Google Sign-In failed: idToken not found in result');
    }
    
    const googleCredential = auth.GoogleAuthProvider.credential(googleIdToken);
    const userCredential = await authInstance.signInWithCredential(googleCredential);
    const firebaseIdToken = await userCredential.user.getIdToken();
    const refreshToken = userCredential.user.refreshToken || undefined;
    
    return {
      idToken: firebaseIdToken,
      refreshToken,
    };
  } catch (error: any) {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      throw new Error('Google Sign-In cancelled by user');
    } else if (error.code === statusCodes.IN_PROGRESS) {
      throw new Error('Google Sign-In already in progress');
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new Error('Google Play Services not available or outdated');
    } else {
      // some other error happened
    }
    throw error;
  }
};

export const signOutGoogle = async () => {
  try {
    await GoogleSignin.revokeAccess();
    await GoogleSignin.signOut();
  } catch (error) {
    console.error('Failed to sign out from Google:', error);
  }
};
