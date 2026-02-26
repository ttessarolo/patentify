import type { JSX } from 'react';
import Constants from 'expo-constants';
import { useAuth } from '@clerk/clerk-expo';
import { Link, Redirect, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function IndexScreen(): JSX.Element {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const appVersion = Constants.expoConfig?.version ?? 'dev';

  if (!isLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#ffffff" />
      </View>
    );
  }

  if (isSignedIn) {
    return <Redirect href="/(app)" />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>
          <View style={styles.heroBlock}>
            <Image
              source={{ uri: 'https://patentify.netlify.app/hero_patentify.png' }}
              style={styles.heroImage}
              resizeMode="contain"
            />
            <Text style={styles.versionText}>v{appVersion}</Text>
          </View>

          <Pressable
            style={styles.accessButton}
            onPress={(): void => router.push('/(auth)/sign-in')}
          >
            <Text style={styles.accessButtonText}>Accedi</Text>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Link href="/privacy-policy" asChild>
            <Pressable>
              <Text style={styles.footerLink}>Privacy Policy</Text>
            </Pressable>
          </Link>
          <Text style={styles.footerDot}>•</Text>
          <Link href="/terms-of-service" asChild>
            <Pressable>
              <Text style={styles.footerLink}>Termini di Servizio</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#222734',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#222734',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 28,
  },
  heroBlock: {
    alignItems: 'center',
    gap: 8,
  },
  heroImage: {
    width: 300,
    height: 180,
    maxWidth: '100%',
  },
  versionText: {
    color: '#6b7280',
    fontSize: 12,
  },
  accessButton: {
    minWidth: 160,
    minHeight: 50,
    paddingHorizontal: 22,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  accessButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  footerLink: {
    color: '#9ca3af',
    fontSize: 13,
  },
  footerDot: {
    color: '#6b7280',
    fontSize: 13,
  },
});
