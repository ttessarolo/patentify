import type { JSX } from 'react';
import { useState } from 'react';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useOAuth, useSignIn } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
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

WebBrowser.maybeCompleteAuthSession();
const EMAIL_CODE_LENGTH = 6;

export default function SignInScreen(): JSX.Element {
  const router = useRouter();
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startOAuthFlow: startGoogleOAuthFlow } = useOAuth({
    strategy: 'oauth_google',
  });
  const { startOAuthFlow: startTiktokOAuthFlow } = useOAuth({
    strategy: 'oauth_tiktok',
  });
  const { startOAuthFlow: startTwitchOAuthFlow } = useOAuth({
    strategy: 'oauth_twitch',
  });

  const [emailAddress, setEmailAddress] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [secondFactorCode, setSecondFactorCode] = useState<string>('');
  const [pendingSecondFactor, setPendingSecondFactor] = useState<boolean>(false);
  const [secondFactorHint, setSecondFactorHint] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  function normalizeSecondFactorCode(value: string): string {
    return value.replace(/\s+/g, '');
  }

  function isValidSecondFactorCode(value: string): boolean {
    return new RegExp(`^\\d{${EMAIL_CODE_LENGTH}}$`).test(value);
  }

  async function completeSession(sessionId: string | null): Promise<void> {
    if (!sessionId || !setActive) {
      Alert.alert('Accesso non completato', 'Sessione non disponibile.');
      return;
    }

    await setActive({ session: sessionId });
    router.replace('/(app)');
  }

  async function handleSecondFactorVerification(codeOverride?: string): Promise<void> {
    if (!isLoaded || !signIn) {
      return;
    }

    const verificationCode = normalizeSecondFactorCode(
      codeOverride ?? secondFactorCode,
    );

    if (!verificationCode) {
      Alert.alert('Codice richiesto', 'Inserisci il codice ricevuto via email.');
      return;
    }

    setLoading(true);

    try {
      const secondFactorAttempt = await signIn.attemptSecondFactor({
        strategy: 'email_code',
        code: verificationCode,
      });

      if (secondFactorAttempt.status === 'complete') {
        await completeSession(secondFactorAttempt.createdSessionId);
        return;
      }

      Alert.alert(
        'Verifica non completata',
        'Codice non valido o passaggio aggiuntivo richiesto.',
      );
    } catch (error: unknown) {
      let message = 'Impossibile verificare il codice email.';

      if (typeof error === 'object' && error !== null && 'errors' in error) {
        const clerkErrors = (error as { errors?: Array<{ message?: string }> }).errors;
        const firstMessage = clerkErrors?.[0]?.message;

        if (firstMessage) {
          message = firstMessage;
        }
      }

      Alert.alert('Errore verifica', message);
    } finally {
      setLoading(false);
    }
  }

  function handleSecondFactorCodeChange(value: string): void {
    const normalizedCode = normalizeSecondFactorCode(value);
    setSecondFactorCode(normalizedCode);

    if (!loading && isValidSecondFactorCode(normalizedCode)) {
      void handleSecondFactorVerification(normalizedCode);
    }
  }

  async function prepareEmailSecondFactor(): Promise<void> {
    if (!signIn) {
      return;
    }

    await signIn.prepareSecondFactor({
      strategy: 'email_code',
    });
  }

  async function handleSignIn(): Promise<void> {
    if (!isLoaded || !signIn || !setActive) {
      return;
    }

    setLoading(true);

    try {
      const signInStart = await signIn.create({
        identifier: emailAddress.trim(),
      });

      if (signInStart.status === 'complete') {
        await completeSession(signInStart.createdSessionId);
        return;
      }

      const passwordFactor = signInStart.supportedFirstFactors?.find(
        (factor): boolean => factor.strategy === 'password',
      );

      if (!passwordFactor) {
        Alert.alert(
          'Accesso non supportato',
          'Questo account non supporta il login con password su questa schermata.',
        );
        return;
      }

      const firstFactorAttempt = await signIn.attemptFirstFactor({
        strategy: 'password',
        password,
      });

      if (firstFactorAttempt.status === 'complete') {
        await completeSession(firstFactorAttempt.createdSessionId);
        return;
      }

      if (firstFactorAttempt.status === 'needs_second_factor') {
        const secondFactorStrategies =
          firstFactorAttempt.supportedSecondFactors
            ?.map((factor): string => factor.strategy)
            .join(', ') ?? 'nessuna';

        if (
          firstFactorAttempt.supportedSecondFactors?.some(
            (factor): boolean => factor.strategy === 'email_code',
          )
        ) {
          await prepareEmailSecondFactor();
          setSecondFactorCode('');
          setSecondFactorHint("Ti abbiamo inviato un codice via email. Inseriscilo per completare l'accesso.");
          setPendingSecondFactor(true);
          return;
        }

        Alert.alert('Secondo fattore richiesto', `Second factors: ${secondFactorStrategies}`);
        return;
      }

      Alert.alert(
        'Accesso non completato',
        'Il provider ha richiesto un passaggio aggiuntivo non gestito da questa schermata.',
      );
    } catch (error: unknown) {
      let message = 'Credenziali non valide o servizio non disponibile.';

      if (typeof error === 'object' && error !== null && 'errors' in error) {
        const clerkErrors = (error as { errors?: Array<{ message?: string }> }).errors;
        const firstMessage = clerkErrors?.[0]?.message;

        if (firstMessage) {
          message = firstMessage;
        }
      }

      Alert.alert('Errore di accesso', message);
    } finally {
      setLoading(false);
    }
  }

  async function handleOAuthSignIn(
    startOAuthFlow: ReturnType<typeof useOAuth>['startOAuthFlow'],
  ): Promise<void> {
    setLoading(true);

    try {
      const redirectUrl = Linking.createURL('/(app)', { scheme: 'patentify' });
      const { createdSessionId, setActive: setOAuthActive, signIn } =
        await startOAuthFlow({
          redirectUrl,
        });

      if (createdSessionId && setOAuthActive) {
        await setOAuthActive({ session: createdSessionId });
        router.replace('/(app)');
        return;
      }

      if (signIn?.status !== 'complete') {
        Alert.alert('OAuth incompleto', 'Riprova il login Google.');
      }
    } catch {
      Alert.alert('Errore OAuth', 'Impossibile completare il login Google.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn(): Promise<void> {
    await handleOAuthSignIn(startGoogleOAuthFlow);
  }

  async function handleTiktokSignIn(): Promise<void> {
    await handleOAuthSignIn(startTiktokOAuthFlow);
  }

  async function handleTwitchSignIn(): Promise<void> {
    await handleOAuthSignIn(startTwitchOAuthFlow);
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
              <Text style={styles.title}>Accedi</Text>
              <Text style={styles.subtitle}>
                {pendingSecondFactor ? secondFactorHint : 'Bentornato su Patentify'}
              </Text>
            </View>

            {pendingSecondFactor ? (
              <>
                <TextInput
                  value={secondFactorCode}
                  onChangeText={handleSecondFactorCodeChange}
                  placeholder="Codice email"
                  placeholderTextColor="#6b7280"
                  keyboardType="number-pad"
                  textContentType="oneTimeCode"
                  autoComplete="one-time-code"
                  style={styles.input}
                />

                <Pressable
                  style={[styles.primaryButton, loading && styles.buttonDisabled]}
                  onPress={handleSecondFactorVerification}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#111827" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Verifica codice</Text>
                  )}
                </Pressable>

                <Pressable
                  style={[styles.secondaryButton, loading && styles.buttonDisabled]}
                  onPress={prepareEmailSecondFactor}
                  disabled={loading}
                >
                  <Text style={styles.secondaryButtonText}>Invia di nuovo il codice</Text>
                </Pressable>
              </>
            ) : (
              <>
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
                  onPress={handleSignIn}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#111827" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Accedi</Text>
                  )}
                </Pressable>

                <Pressable
                  style={[styles.secondaryButton, loading && styles.buttonDisabled]}
                  onPress={handleGoogleSignIn}
                  disabled={loading}
                >
                  <View style={styles.socialButtonContent}>
                    <Ionicons name="logo-google" size={18} color="#e5e7eb" />
                    <Text style={styles.secondaryButtonText}>Continua con Google</Text>
                  </View>
                </Pressable>

                <Pressable
                  style={[styles.secondaryButton, loading && styles.buttonDisabled]}
                  onPress={handleTiktokSignIn}
                  disabled={loading}
                >
                  <View style={styles.socialButtonContent}>
                    <Ionicons name="logo-tiktok" size={18} color="#e5e7eb" />
                    <Text style={styles.secondaryButtonText}>Continua con TikTok</Text>
                  </View>
                </Pressable>

                <Pressable
                  style={[styles.secondaryButton, loading && styles.buttonDisabled]}
                  onPress={handleTwitchSignIn}
                  disabled={loading}
                >
                  <View style={styles.socialButtonContent}>
                    <Ionicons name="logo-twitch" size={18} color="#e5e7eb" />
                    <Text style={styles.secondaryButtonText}>Continua con Twitch</Text>
                  </View>
                </Pressable>
              </>
            )}

            <Pressable onPress={(): void => router.push('/(auth)/sign-up')}>
              <Text style={styles.linkText}>Non hai un account? Registrati</Text>
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
  secondaryButton: {
    backgroundColor: '#171b23',
    borderRadius: 10,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  secondaryButtonText: {
    color: '#e5e7eb',
    fontWeight: '600',
    fontSize: 15,
  },
  socialButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
