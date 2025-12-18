
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'user_auth_token';
const REFRESH_TOKEN_KEY = 'user_refresh_token';

/**
 * Saves the authentication token to secure storage.
 * @param token The authentication token to save.
 */
export async function saveToken(token: string | null): Promise<void> {
  try {
    if (token) {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  } catch (error) {
    console.error('Failed to save token to secure store', error);
    // Silently fail - not critical for app to crash if this fails
  }
}

/**
 * Retrieves the authentication token from secure storage.
 * @returns The authentication token, or null if it doesn't exist.
 */
export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('Failed to get token from secure store', error);
    return null;
  }
}

/**
 * Deletes the authentication token from secure storage.
 */
export async function clearToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY); // Also clear refresh token
  } catch (error) {
    console.error('Failed to clear token from secure store', error);
  }
}

/**
 * Saves the refresh token to secure storage.
 * @param refreshToken The refresh token to save.
 */
export async function saveRefreshToken(refreshToken: string | null): Promise<void> {
    try {
        if (refreshToken) {
            await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
        } else {
            await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
        }
    } catch (error) {
        console.error('Failed to save refresh token', error);
    }
}

/**
 * Retrieves the refresh token from secure storage.
 * @returns The refresh token, or null if not found.
 */
export async function getRefreshToken(): Promise<string | null> {
    try {
        return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } catch (error) {
        console.error('Failed to retrieve refresh token', error);
        return null;
    }
}

