import type { JSX } from 'react';
import { Stack } from 'expo-router';

export default function HelpLayout(): JSX.Element {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#222734' },
        headerTintColor: '#ffffff',
        contentStyle: { backgroundColor: '#222734' },
      }}
    />
  );
}
