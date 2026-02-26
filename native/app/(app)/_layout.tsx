import type { JSX } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

export default function AppLayout(): JSX.Element {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#222734',
        }}
      >
        <ActivityIndicator color="#6366f1" />
      </View>
    );
  }

  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#222734' },
        headerTintColor: '#ffffff',
        tabBarStyle: { backgroundColor: '#222734' },
        tabBarActiveTintColor: '#a5b4fc',
        tabBarInactiveTintColor: '#9ca3af',
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="esercitazione" options={{ title: 'Esercitazione' }} />
      <Tabs.Screen name="simulazione-quiz" options={{ title: 'Quiz' }} />
      <Tabs.Screen name="statistiche" options={{ title: 'Statistiche' }} />
      <Tabs.Screen name="classifiche" options={{ href: null }} />
      <Tabs.Screen name="errori-ricorrenti" options={{ href: null }} />
      <Tabs.Screen name="sfide" options={{ href: null }} />
      <Tabs.Screen name="consigli-e-trucchi" options={{ href: null }} />
      <Tabs.Screen name="help" options={{ href: null }} />
      <Tabs.Screen name="rivedi-quiz" options={{ href: null }} />
      <Tabs.Screen name="rivedi-sfida" options={{ href: null }} />
    </Tabs>
  );
}
