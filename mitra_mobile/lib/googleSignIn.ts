
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { authInstance } from '../firebaseConfig';
import { GOOGLE_WEB_CLIENT_ID } from '@env';

GoogleSignin.configure({
  webClientId: GOOGLE_WEB_CLIENT_ID,
});

export const signInWithGoogle = async () => {
  try {
    await GoogleSignin.hasPlayServices();
    const { user } = await GoogleSignin.signIn();
    if (user.idToken) {
      const googleCredential = GoogleAuthProvider.credential(user.idToken);
      const userCredential = await signInWithCredential(authInstance, googleCredential);
      const firebaseIdToken = await userCredential.user.getIdToken();
      return firebaseIdToken;
    }
    throw new Error('Google Sign-In failed: idToken not found.');
  } catch (error: any) {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      // user cancelled the login flow
    } else if (error.code === statusCodes.IN_PROGRESS) {
      // operation (e.g. sign in) is in progress already
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      // play services not available or outdated
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
