
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'user_auth_token';
const REFRESH_TOKEN_KEY = 'user_refresh_token';
const ACTIVE_PROFILE_ID_KEY = 'active_profile_id';

// --- Auth Token --- 
export async function saveToken(token: string | null): Promise<void> {
  try {
    if (token) {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  } catch (error) {
    console.error('Failed to save token to secure store', error);
  }
}

export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('Failed to get token from secure store', error);
    return null;
  }
}

export async function clearToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(ACTIVE_PROFILE_ID_KEY); // Also clear active profile
  } catch (error) {
    console.error('Failed to clear token from secure store', error);
  }
}

// --- Refresh Token --- 
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

export async function getRefreshToken(): Promise<string | null> {
    try {
        return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } catch (error) {
        console.error('Failed to retrieve refresh token', error);
        return null;
    }
}

// --- Active Profile ID --- 
export async function saveActiveProfileId(profileId: string | null): Promise<void> {
    try {
        if (profileId) {
            await SecureStore.setItemAsync(ACTIVE_PROFILE_ID_KEY, profileId);
        } else {
            await SecureStore.deleteItemAsync(ACTIVE_PROFILE_ID_KEY);
        }
    } catch (error) {
        console.error('Failed to save active profile ID', error);
    }
}

export async function getActiveProfileId(): Promise<string | null> {
    try {
        return await SecureStore.getItemAsync(ACTIVE_PROFILE_ID_KEY);
    } catch (error) {
        console.error('Failed to retrieve active profile ID', error);
        return null;
    }
}
