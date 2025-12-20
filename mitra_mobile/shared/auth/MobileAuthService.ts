/**
 * MobileAuthService
 * 
 * Native mobile implementation of AuthService using:
 * - Firebase Auth (native SDK)
 * - @react-native-google-signin/google-signin
 * - expo-secure-store for token persistence
 */

import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { 
  GoogleAuthProvider, 
  signInWithCredential, 
  signInWithEmailAndPassword as firebaseSignInWithEmail,
  createUserWithEmailAndPassword,
  onIdTokenChanged,
  User
} from 'firebase/auth';
import * as SecureStore from 'expo-secure-store';
import { authInstance } from '../../firebaseConfig';
import { GOOGLE_WEB_CLIENT_ID } from '@env';
import { AuthService, AuthTokens } from './AuthService';

// Secure storage keys - exported for use by other modules
export const TOKEN_KEY = 'user_auth_token';
export const REFRESH_KEY = 'user_refresh_token';

export class MobileAuthService implements AuthService {
  private initialized = false;

  /**
   * Initialize Google Sign-In configuration
   */
  async init(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      GoogleSignin.configure({
        webClientId: GOOGLE_WEB_CLIENT_ID,
        offlineAccess: true, // Request refresh token
      });
      this.initialized = true;
      console.log('[MobileAuthService] Initialized successfully');
    } catch (error) {
      console.error('[MobileAuthService] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Sign in with Google OAuth
   * 
   * Flow:
   * 1. Trigger Google Sign-In UI
   * 2. Get idToken from result (not user.idToken)
   * 3. Exchange for Firebase credential
   * 4. Sign in to Firebase
   * 5. Get Firebase ID token and refresh token
   * 6. Persist tokens
   */
  async signInWithGoogle(): Promise<AuthTokens> {
    try {
      // Check Play Services availability
      await GoogleSignin.hasPlayServices();

      // Perform Google Sign-In
      const result = await GoogleSignin.signIn();
      
      // CRITICAL: Read idToken from result object, not user.idToken
      const googleIdToken = result.data?.idToken;
      
      if (!googleIdToken) {
        throw new Error('Google Sign-In failed: idToken not found in result');
      }

      console.log('[MobileAuthService] Google sign-in successful, exchanging for Firebase credential');

      // Create Firebase credential with Google ID token
      const googleCredential = GoogleAuthProvider.credential(googleIdToken);
      
      // Sign in to Firebase with the credential
      const userCredential = await signInWithCredential(authInstance, googleCredential);
      
      // Get Firebase ID token
      const firebaseIdToken = await userCredential.user.getIdToken();
      
      // Try to get refresh token (may not always be available from Firebase SDK)
      const refreshToken = userCredential.user.refreshToken || undefined;

      // Persist tokens to secure storage
      await this.persistTokens(firebaseIdToken, refreshToken);

      console.log('[MobileAuthService] Google sign-in complete, tokens persisted');

      return {
        idToken: firebaseIdToken,
        refreshToken,
      };
    } catch (error: any) {
      // Handle specific Google Sign-In errors
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        throw new Error('Google Sign-In cancelled by user');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        throw new Error('Google Sign-In already in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Google Play Services not available or outdated');
      }
      
      console.error('[MobileAuthService] Google sign-in error:', error);
      throw error;
    }
  }

  /**
   * Sign in with email and password
   */
  async signInWithEmail(email: string, password: string): Promise<AuthTokens> {
    try {
      // Sign in to Firebase
      const userCredential = await firebaseSignInWithEmail(authInstance, email, password);
      
      // Get Firebase ID token
      const idToken = await userCredential.user.getIdToken();
      const refreshToken = userCredential.user.refreshToken || undefined;

      // Persist tokens
      await this.persistTokens(idToken, refreshToken);

      console.log('[MobileAuthService] Email sign-in successful');

      return {
        idToken,
        refreshToken,
      };
    } catch (error) {
      console.error('[MobileAuthService] Email sign-in error:', error);
      throw error;
    }
  }

  /**
   * Sign out from all providers and clear tokens
   */
  async signOut(): Promise<void> {
    try {
      // Sign out from Firebase
      await authInstance.signOut();

      // Sign out from Google
      try {
        const isSignedIn = await GoogleSignin.isSignedIn();
        if (isSignedIn) {
          await GoogleSignin.revokeAccess();
          await GoogleSignin.signOut();
        }
      } catch (googleError) {
        console.warn('[MobileAuthService] Google sign-out warning:', googleError);
        // Continue even if Google sign-out fails
      }

      // Clear tokens from secure storage
      await this.clearTokens();

      console.log('[MobileAuthService] Sign-out complete');
    } catch (error) {
      console.error('[MobileAuthService] Sign-out error:', error);
      throw error;
    }
  }

  /**
   * Get the current persisted ID token
   */
  async getToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (error) {
      console.error('[MobileAuthService] Failed to get token:', error);
      return null;
    }
  }

  /**
   * Get the current persisted refresh token
   */
  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(REFRESH_KEY);
    } catch (error) {
      console.error('[MobileAuthService] Failed to get refresh token:', error);
      return null;
    }
  }

  /**
   * Force refresh the ID token using Firebase
   */
  async forceRefresh(): Promise<string | null> {
    try {
      const currentUser = authInstance.currentUser;
      
      if (!currentUser) {
        console.warn('[MobileAuthService] No user logged in, cannot refresh token');
        return null;
      }

      // Force token refresh
      const newToken = await currentUser.getIdToken(true);

      // Persist new token
      await SecureStore.setItemAsync(TOKEN_KEY, newToken);

      console.log('[MobileAuthService] Token refreshed successfully');

      return newToken;
    } catch (error) {
      console.error('[MobileAuthService] Token refresh failed:', error);
      return null;
    }
  }

  /**
   * Subscribe to Firebase ID token changes
   * 
   * @param callback - Called with new token (or null on sign-out)
   * @returns Unsubscribe function
   */
  onTokenChange(callback: (token: string | null) => void): () => void {
    const unsubscribe = onIdTokenChanged(authInstance, async (user: User | null) => {
      if (user) {
        try {
          // User is signed in, get and persist token
          const token = await user.getIdToken();
          await SecureStore.setItemAsync(TOKEN_KEY, token);
          callback(token);
        } catch (error) {
          console.error('[MobileAuthService] Error in token change handler:', error);
          callback(null);
        }
      } else {
        // User is signed out, clear tokens
        await this.clearTokens();
        callback(null);
      }
    });

    return unsubscribe;
  }

  /**
   * Persist tokens to secure storage
   */
  private async persistTokens(idToken: string, refreshToken?: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, idToken);
      
      if (refreshToken) {
        await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
      }
    } catch (error) {
      console.error('[MobileAuthService] Failed to persist tokens:', error);
      throw error;
    }
  }

  /**
   * Clear all tokens from secure storage
   */
  private async clearTokens(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_KEY);
    } catch (error) {
      console.error('[MobileAuthService] Failed to clear tokens:', error);
      // Don't throw - clearing tokens should be best-effort
    }
  }
}

// Export singleton instance
export const mobileAuthService = new MobileAuthService();
