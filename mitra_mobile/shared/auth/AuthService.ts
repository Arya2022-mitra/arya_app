/**
 * AuthService Interface
 * 
 * Defines the contract for authentication services in the mobile app.
 * This interface ensures compatibility with the web auth/session method
 * without importing frontend_reference code.
 * 
 * All implementations must provide Firebase ID token management,
 * secure token persistence, and token lifecycle hooks.
 */

export interface AuthTokens {
  idToken: string;
  refreshToken?: string;
}

export interface AuthService {
  /**
   * Initialize the authentication service.
   * Must be called before any other methods.
   * 
   * This should configure provider-specific settings (e.g., GoogleSignin.configure).
   */
  init(): Promise<void>;

  /**
   * Sign in with Google OAuth.
   * 
   * @returns Promise resolving to Firebase ID token and optional refresh token
   * @throws Error if sign-in fails or user cancels
   * 
   * Implementation must:
   * - Perform platform-specific Google sign-in
   * - Exchange OAuth token for Firebase credential
   * - Obtain Firebase ID token
   * - Persist tokens to secure storage
   */
  signInWithGoogle(): Promise<AuthTokens>;

  /**
   * Sign in with email and password.
   * 
   * @param email - User email address
   * @param password - User password
   * @returns Promise resolving to Firebase ID token
   * @throws Error if authentication fails
   * 
   * Implementation must:
   * - Authenticate with Firebase Auth
   * - Obtain Firebase ID token
   * - Persist token to secure storage
   */
  signInWithEmail(email: string, password: string): Promise<AuthTokens>;

  /**
   * Sign out the current user.
   * 
   * Implementation must:
   * - Sign out from Firebase Auth
   * - Sign out from Google (if applicable)
   * - Clear all tokens from secure storage
   */
  signOut(): Promise<void>;

  /**
   * Get the current persisted ID token.
   * 
   * @returns Promise resolving to the current ID token or null if not authenticated
   */
  getToken(): Promise<string | null>;

  /**
   * Get the current persisted refresh token.
   * 
   * @returns Promise resolving to the refresh token or null if not available
   */
  getRefreshToken(): Promise<string | null>;

  /**
   * Force refresh the ID token.
   * 
   * @returns Promise resolving to the new ID token or null if refresh fails
   * 
   * Implementation must:
   * - Check if user is authenticated
   * - Call Firebase currentUser.getIdToken(true) to force refresh
   * - Persist the new token to secure storage
   * - Return the new token
   */
  forceRefresh(): Promise<string | null>;

  /**
   * Subscribe to ID token changes.
   * 
   * @param callback - Function to call when token changes (receives new token or null)
   * @returns Unsubscribe function to stop listening to changes
   * 
   * Implementation must:
   * - Subscribe to Firebase onIdTokenChanged or onAuthStateChanged
   * - When user is present, get ID token and persist it
   * - Call callback with new token
   * - When user is null, clear tokens and call callback with null
   */
  onTokenChange(callback: (token: string | null) => void): () => void;
}
