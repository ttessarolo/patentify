import type { JSX } from 'react';
import { ClerkLoaded, ClerkProvider } from '@clerk/clerk-expo';
import { QueryClientProvider } from '@tanstack/react-query';
import { Slot } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { tokenCache } from '../lib/clerk';
import { queryClient } from '../lib/query-client';

function getPublishableKey(): string {
  const key = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!key) {
    throw new Error('Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY');
  }

  return key;
}

export default function RootLayout(): JSX.Element {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ClerkProvider publishableKey={getPublishableKey()} tokenCache={tokenCache}>
        <ClerkLoaded>
          <QueryClientProvider client={queryClient}>
            <Slot />
          </QueryClientProvider>
        </ClerkLoaded>
      </ClerkProvider>
    </GestureHandlerRootView>
  );
}
