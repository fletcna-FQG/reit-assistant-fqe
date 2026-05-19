import { SocialLoginButton } from '@/components/auth/SocialLoginButton';
import { PasswordStrengthBar } from '@/components/ui/PasswordStrengthBar';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { TextField } from '@/components/ui/TextField';
import { BRAND } from '@/constants/navigation';
import { AuthError, useAuth } from '@/hooks/useAuth';
import { isValidEmail, isValidPassword } from '@/utils/validation';
import * as Haptics from 'expo-haptics';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { signIn, signUp, signInWithOAuth, isAuthenticated, isLoading, isDemoMode } = useAuth();

  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('analyst@fletcherquill.com');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');
  const [emailShake, setEmailShake] = useState(0);
  const [passwordShake, setPasswordShake] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null);

  if (!isLoading && isAuthenticated) {
    return <Redirect href="/(app)/(tabs)" />;
  }

  const validate = (): boolean => {
    let valid = true;
    setEmailError('');
    setPasswordError('');
    setFormError('');

    if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address');
      setEmailShake((n) => n + 1);
      valid = false;
    }
    if (!isValidPassword(password)) {
      setPasswordError('Password must be at least 6 characters');
      setPasswordShake((n) => n + 1);
      valid = false;
    }
    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'signIn') {
        await signIn(email, password);
      } else {
        await signUp(email, password, fullName || undefined);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(app)/(tabs)');
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (error instanceof AuthError) {
        if (error.code === 'invalid_email') {
          setEmailError(error.message);
          setEmailShake((n) => n + 1);
        } else if (error.code === 'weak_password' || error.code === 'invalid_credentials') {
          setPasswordError(error.message);
          setPasswordShake((n) => n + 1);
        } else {
          setFormError(error.message);
        }
      } else {
        setFormError('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'apple') => {
    setOauthLoading(provider);
    setFormError('');
    try {
      await signInWithOAuth(provider);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(app)/(tabs)');
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setFormError(
        error instanceof AuthError ? error.message : 'Social sign-in failed. Try again.',
      );
    } finally {
      setOauthLoading(null);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-light-gray"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <ScrollView
        contentContainerClassName="flex-grow justify-center px-lg py-xl"
        keyboardShouldPersistTaps="handled"
      >
        <View className="mx-auto w-full max-w-md">
          <View className="mb-xl items-center">
            <View
              className="mb-md items-center justify-center rounded-xl bg-navy"
              style={{ width: 56, height: 56 }}
            >
              <Text className="text-xl font-bold text-white">FQ</Text>
            </View>
            <Text className="text-h1 text-navy">
              {mode === 'signIn' ? 'Welcome Back' : 'Create Account'}
            </Text>
            <Text className="mt-1 text-center text-body text-text-secondary">
              {mode === 'signIn'
                ? 'Sign in to manage your REIT portfolio'
                : `Join ${BRAND.company}`}
            </Text>
            {isDemoMode ? (
              <Text className="mt-2 text-center text-caption text-warning-amber">
                Demo mode — any valid email + 6+ char password works
              </Text>
            ) : null}
          </View>

          <View className="rounded-md bg-white p-lg shadow-sm">
            {mode === 'signUp' ? (
              <TextField
                label="Full Name"
                value={fullName}
                onChangeText={setFullName}
                placeholder="Nancy Fletcher"
                autoCapitalize="words"
              />
            ) : null}

            <TextField
              label="Email Address"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setEmailError('');
              }}
              placeholder="analyst@fletcherquill.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={emailError}
              shakeTrigger={emailShake}
            />

            <TextField
              label="Password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setPasswordError('');
              }}
              placeholder="Enter your password"
              secureTextEntry
              autoComplete={mode === 'signIn' ? 'password' : 'new-password'}
              error={passwordError}
              shakeTrigger={passwordShake}
            />

            <PasswordStrengthBar password={password} />

            {formError ? (
              <Text className="mb-md text-center text-caption text-alert-red">{formError}</Text>
            ) : null}

            <PrimaryButton
              title={mode === 'signIn' ? 'Sign In' : 'Create Account'}
              onPress={handleSubmit}
              loading={submitting}
            />

            {mode === 'signIn' ? (
              <Pressable className="mb-md items-center py-2">
                <Text className="text-body-small font-semibold text-navy">Forgot Password?</Text>
              </Pressable>
            ) : null}

            <View className="my-md flex-row items-center">
              <View className="h-px flex-1 bg-medium-gray" />
              <Text className="mx-md text-caption text-text-secondary">or</Text>
              <View className="h-px flex-1 bg-medium-gray" />
            </View>

            <SocialLoginButton
              provider="google"
              onPress={() => handleOAuth('google')}
              loading={oauthLoading === 'google'}
            />
            <SocialLoginButton
              provider="apple"
              onPress={() => handleOAuth('apple')}
              loading={oauthLoading === 'apple'}
            />
          </View>

          <Pressable
            className="mt-lg items-center py-2"
            onPress={() => {
              setMode(mode === 'signIn' ? 'signUp' : 'signIn');
              setFormError('');
              setEmailError('');
              setPasswordError('');
            }}
          >
            <Text className="text-body text-text-secondary">
              {mode === 'signIn' ? "Don't have an account? " : 'Already have an account? '}
              <Text className="font-semibold text-navy">
                {mode === 'signIn' ? 'Create Account' : 'Sign In'}
              </Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
