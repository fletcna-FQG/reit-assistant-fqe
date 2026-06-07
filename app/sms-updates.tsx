import { SmsConsentBlock } from '@/components/sms/SmsConsentBlock';
import { SmsPublicShell } from '@/components/sms/SmsPublicShell';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { TextField } from '@/components/ui/TextField';
import { SMS_OPT_IN } from '@/constants/smsOptIn';
import { colors } from '@/constants/theme';
import { getApiErrorMessage, subscribeSmsUpdates } from '@/services/api';
import { validateSharePhones } from '@/utils/shareRecipients';
import { isValidEmail } from '@/utils/validation';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

export default function SmsUpdatesScreen() {
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState('');

  const validate = (): boolean => {
    setPhoneError('');
    setEmailError('');
    setConsentError('');
    setFormError('');

    const phones = phone.trim() ? [phone.trim()] : [];
    if (!phones.length) {
      setPhoneError('Enter your mobile phone number.');
      return false;
    }

    const phoneValidation = validateSharePhones(phones);
    if (phoneValidation) {
      setPhoneError(phoneValidation);
      return false;
    }

    if (email.trim() && !isValidEmail(email.trim())) {
      setEmailError('Enter a valid email address.');
      return false;
    }

    if (!consent) {
      setConsentError('You must agree to receive SMS messages to subscribe.');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    setFormError('');
    try {
      await subscribeSmsUpdates({
        phone: phone.trim(),
        email: email.trim() || undefined,
      });
      setSubmitted(true);
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Could not complete subscription. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SmsPublicShell tagline="REIT Assistant — Property Analysis Alerts">
      <View className="mt-8 items-center">
        <Text className="text-center text-h2 text-navy">Get REIT analysis alerts by text</Text>
        <Text
          className="mt-2 max-w-md text-center text-body-small text-text-secondary"
          style={{ lineHeight: 22 }}
        >
          Sign up to receive SMS notifications when property analysis reports are shared with you
          from the REIT Assistant platform.
        </Text>
      </View>

      <View
        className="mx-auto mt-6 w-full max-w-md rounded-md bg-white p-md"
        style={{ borderWidth: 1, borderColor: colors.mediumGray }}
      >
        {submitted ? (
          <View className="items-center py-4">
            <Text className="text-h4 text-emerald">You&apos;re subscribed!</Text>
            <Text className="mt-3 text-center text-body-small text-text-secondary" style={{ lineHeight: 22 }}>
              We&apos;ll send REIT analysis report links to {phone.trim()} from sender{' '}
              {SMS_OPT_IN.senderId}. Reply STOP to unsubscribe at any time.
            </Text>
            <Link href="/join-sms" asChild>
              <Text className="mt-4 text-body-small font-semibold text-navy">
                View keyword &amp; QR opt-in →
              </Text>
            </Link>
          </View>
        ) : (
          <>
            <Text className="text-h4 text-navy">SMS subscription form</Text>
            <Text className="mb-4 mt-1 text-caption text-text-secondary">
              Enter your mobile number and agree to receive messages.
            </Text>

            {formError ? (
              <View className="mb-md rounded-md bg-alert-red/10 px-md py-3">
                <Text className="text-body-small text-alert-red">{formError}</Text>
              </View>
            ) : null}

            <TextField
              label="Mobile phone number"
              required
              value={phone}
              onChangeText={setPhone}
              placeholder="+1 (555) 123-4567"
              keyboardType="phone-pad"
              autoComplete="tel"
              error={phoneError}
            />

            <TextField
              label="Email address (optional)"
              value={email}
              onChangeText={setEmail}
              placeholder="analyst@fletcherquillestates.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={emailError}
            />

            <View className="mb-md">
              <SmsConsentBlock
                checked={consent}
                onToggle={() => {
                  setConsent((value) => !value);
                  setConsentError('');
                }}
                error={consentError}
              />
            </View>

            <PrimaryButton
              title={submitting ? 'Subscribing…' : 'Subscribe to SMS alerts'}
              loading={submitting}
              onPress={() => void handleSubmit()}
            />

            <Text
              className="mt-4 text-center text-caption text-text-secondary"
              style={{ lineHeight: 18 }}
            >
              By subscribing, you confirm you are the owner of this phone number and authorize{' '}
              {SMS_OPT_IN.legalName} to send transactional SMS with REIT analysis report links.
            </Text>
          </>
        )}
      </View>
    </SmsPublicShell>
  );
}
