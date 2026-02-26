import * as SecureStore from 'expo-secure-store';

interface NativeTokenCache {
  getToken: (key: string) => Promise<string | null>;
  saveToken: (key: string, value: string) => Promise<void>;
}

function sanitizeTokenKey(key: string): string {
  return key.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export const tokenCache: NativeTokenCache = {
  async getToken(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(sanitizeTokenKey(key));
    } catch {
      return null;
    }
  },
  async saveToken(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(sanitizeTokenKey(key), value);
    } catch {
      // Alcuni simulatori possono non avere keychain configurato.
    }
  },
};
