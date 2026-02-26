import type { JSX } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { Redirect, Stack } from 'expo-router';

export default function AuthLayout(): JSX.Element {
  const { isLoaded, isSignedIn } = useAuth();

  if (isLoaded && isSignedIn) {
    return <Redirect href="/(app)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
