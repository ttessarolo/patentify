import type { JSX } from 'react';
import { useState } from 'react';
import { useSignUp } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignUpScreen(): JSX.Element {
  const router = useRouter();
  const { isLoaded, signUp, setActive } = useSignUp();

  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [emailAddress, setEmailAddress] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [pendingVerification, setPendingVerification] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  async function handleSignUp(): Promise<void> {
    if (!isLoaded || !signUp) {
      return;
    }

    setLoading(true);

    try {
      await signUp.create({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: username.trim(),
        emailAddress: emailAddress.trim(),
        password,
      });

      await signUp.prepareEmailAddressVerification({
        strategy: 'email_code',
      });

      setPendingVerification(true);
    } catch {
      Alert.alert('Registrazione fallita', 'Verifica i dati inseriti e riprova.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerification(): Promise<void> {
    if (!isLoaded || !signUp || !setActive) {
      return;
    }

    setLoading(true);

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: code.trim(),
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.replace('/(app)');
        return;
      }

      Alert.alert('Codice non valido', 'Controlla il codice ricevuto via email.');
    } catch {
      Alert.alert('Verifica fallita', 'Impossibile completare la verifica email.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <View style={styles.header}>
              <Image
                source={require('../../../public/patentify_logotype.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.title}>Crea account</Text>
              <Text style={styles.subtitle}>
                {pendingVerification
                  ? 'Inserisci il codice ricevuto via email'
                  : 'Registrati per accedere all’app'}
              </Text>
            </View>

            {!pendingVerification ? (
              <>
                <TextInput
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Nome"
                  placeholderTextColor="#6b7280"
                  style={styles.input}
                />

                <TextInput
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Cognome"
                  placeholderTextColor="#6b7280"
                  style={styles.input}
                />

                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Nome Utente"
                  placeholderTextColor="#6b7280"
                  autoCapitalize="none"
                  style={styles.input}
                />

                <TextInput
                  value={emailAddress}
                  onChangeText={setEmailAddress}
                  placeholder="Email"
                  placeholderTextColor="#6b7280"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                />

                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password"
                  placeholderTextColor="#6b7280"
                  secureTextEntry
                  style={styles.input}
                />

                <Pressable
                  style={[styles.primaryButton, loading && styles.buttonDisabled]}
                  onPress={handleSignUp}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#111827" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Registrati</Text>
                  )}
                </Pressable>
              </>
            ) : (
              <>
                <TextInput
                  value={code}
                  onChangeText={setCode}
                  placeholder="Codice di verifica"
                  placeholderTextColor="#6b7280"
                  keyboardType="number-pad"
                  style={styles.input}
                />

                <Pressable
                  style={[styles.primaryButton, loading && styles.buttonDisabled]}
                  onPress={handleVerification}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#111827" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Conferma codice</Text>
                  )}
                </Pressable>
              </>
            )}

            <Pressable onPress={(): void => router.push('/(auth)/sign-in')}>
              <Text style={styles.linkText}>Hai già un account? Accedi</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#222734',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  card: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2f3542',
    backgroundColor: '#171b23',
    padding: 18,
    gap: 12,
  },
  header: {
    gap: 4,
    marginBottom: 6,
    alignItems: 'center',
  },
  logo: {
    width: 220,
    height: 70,
    maxWidth: '100%',
    marginBottom: 8,
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: '#a1a1aa',
    fontSize: 14,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#0f1115',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#343a46',
    color: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  primaryButton: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  linkText: {
    marginTop: 8,
    textAlign: 'center',
    color: '#93c5fd',
    fontSize: 14,
  },
});
