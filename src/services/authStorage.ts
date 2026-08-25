import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'ayetasks_access_token';
const REFRESH_KEY = 'ayetasks_refresh_token';
const USER_KEY = 'ayetasks_user_profile';

const isWeb = Platform.OS === 'web';

export const authStorage = {
  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    if (isWeb) {
      await Promise.all([
        AsyncStorage.setItem(TOKEN_KEY, accessToken),
        AsyncStorage.setItem(REFRESH_KEY, refreshToken),
      ]);
    } else {
      await Promise.all([
        SecureStore.setItemAsync(TOKEN_KEY, accessToken, {
          keychainAccessible: SecureStore.WHEN_UNLOCKED,
        }),
        SecureStore.setItemAsync(REFRESH_KEY, refreshToken, {
          keychainAccessible: SecureStore.WHEN_UNLOCKED,
        }),
      ]);
    }
  },

  async getAccessToken(): Promise<string | null> {
    if (isWeb) {
      return AsyncStorage.getItem(TOKEN_KEY);
    }
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) return token;
      return AsyncStorage.getItem(TOKEN_KEY);
    } catch {
      return AsyncStorage.getItem(TOKEN_KEY);
    }
  },

  async getRefreshToken(): Promise<string | null> {
    if (isWeb) {
      return AsyncStorage.getItem(REFRESH_KEY);
    }
    try {
      const token = await SecureStore.getItemAsync(REFRESH_KEY);
      if (token) return token;
      return AsyncStorage.getItem(REFRESH_KEY);
    } catch {
      return AsyncStorage.getItem(REFRESH_KEY);
    }
  },

  async clearTokens(): Promise<void> {
    if (isWeb) {
      await Promise.all([
        AsyncStorage.removeItem(TOKEN_KEY),
        AsyncStorage.removeItem(REFRESH_KEY),
        AsyncStorage.removeItem(USER_KEY),
      ]);
    } else {
      await Promise.allSettled([
        SecureStore.deleteItemAsync(TOKEN_KEY),
        SecureStore.deleteItemAsync(REFRESH_KEY),
        SecureStore.deleteItemAsync(USER_KEY),
        AsyncStorage.removeItem(TOKEN_KEY),
        AsyncStorage.removeItem(REFRESH_KEY),
        AsyncStorage.removeItem(USER_KEY),
      ]);
    }
  },

  async setUser(user: any): Promise<void> {
    const json = JSON.stringify(user);
    if (isWeb) {
      await AsyncStorage.setItem(USER_KEY, json);
    } else {
      try {
        await SecureStore.setItemAsync(USER_KEY, json, {
          keychainAccessible: SecureStore.WHEN_UNLOCKED,
        });
      } catch {
        await AsyncStorage.setItem(USER_KEY, json);
      }
    }
  },

  async getUser(): Promise<any | null> {
    let data: string | null = null;
    if (isWeb) {
      data = await AsyncStorage.getItem(USER_KEY);
    } else {
      try {
        data = await SecureStore.getItemAsync(USER_KEY);
        if (!data) data = await AsyncStorage.getItem(USER_KEY);
      } catch {
        data = await AsyncStorage.getItem(USER_KEY);
      }
    }
    return data ? JSON.parse(data) : null;
  },
};
