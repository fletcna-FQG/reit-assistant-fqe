import { SocialLoginButton } from '@/components/auth/SocialLoginButton';
import { PasswordStrengthBar } from '@/components/ui/PasswordStrengthBar';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { TextField } from '@/components/ui/TextField';
import { BRAND, DASHBOARD_HREF } from '@/constants/navigation';
import { TEST_USER } from '@/constants/testUser';
import { AuthError, useAuth } from '@/hooks/useAuth';
import { authApi, getApiErrorMessage } from '@/services/api';
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
  const { signIn, signUp, signInWithOAuth, isAuthenticated, isLoading, isDemoMode, isBackendMode } =
    useAuth();

  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState(TEST_USER.email);
  const [password, setPassword] = useState(__DEV__ ? TEST_USER.password : '');
  const [fullName, setFullName] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');
  const [emailShake, setEmailShake] = useState(0);
  const [passwordShake, setPasswordShake] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  if (!isLoading && isAuthenticated) {
    return <Redirect href={DASHBOARD_HREF} />;
  }

  const validate = (): boolean => {
    let valid = true;
    setEmailError('');
    setPasswordError('');
    setFormError('');

    if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address.');
      setEmailShake((n) => n + 1);
      valid = false;
    }
    if (!isValidPassword(password)) {
      setPasswordError('Please enter a password with at least 6 characters.');
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
      router.replace(DASHBOARD_HREF);
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
      router.replace(DASHBOARD_HREF);
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
            {isBackendMode ? (
              <Text className="mt-2 text-center text-caption text-text-secondary">
                Backend auth — Fletcher Test account (can receive email)
              </Text>
            ) : isDemoMode ? (
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
              placeholder={TEST_USER.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              required
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
              showPasswordToggle
              autoComplete={mode === 'signIn' ? 'password' : 'new-password'}
              required
              error={passwordError}
              shakeTrigger={passwordShake}
            />

            <PasswordStrengthBar password={password} />

            {mode === 'signIn' && isBackendMode ? (
              <Pressable
                className="mb-md self-end"
                disabled={forgotLoading}
                onPress={async () => {
                  if (!isValidEmail(email)) {
                    setEmailError('Enter your email address first.');
                    setEmailShake((n) => n + 1);
                    return;
                  }
                  setForgotLoading(true);
                  setForgotSent(false);
                  setFormError('');
                  try {
                    await authApi.forgotPassword(email.trim().toLowerCase());
                    setForgotSent(true);
                  } catch (error) {
                    setFormError(getApiErrorMessage(error, 'Could not send reset email.'));
                  } finally {
                    setForgotLoading(false);
                  }
                }}
              >
                <Text className="text-body-small font-semibold text-navy">
                  {forgotLoading ? 'Sending…' : 'Forgot password?'}
                </Text>
              </Pressable>
            ) : null}

            {forgotSent ? (
              <Text className="mb-md text-body-small text-emerald">
                If an account exists for that email, a reset link has been sent.
              </Text>
            ) : null}

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
