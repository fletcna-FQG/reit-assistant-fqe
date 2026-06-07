import { Modal } from '@/components/ui/Modal';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { TextField } from '@/components/ui/TextField';
import { colors, shadows } from '@/constants/theme';
import { getApiErrorMessage, shareProperty } from '@/services/api';
import {
  parseShareRecipients,
  validateShareEmails,
  validateSharePhones,
} from '@/utils/shareRecipients';
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

type ShareModalProps = {
  visible: boolean;
  propertyId: string;
  onClose: () => void;
};

type SharePanel = 'menu' | 'sms' | 'email';

function formatDeliveryFeedback(
  channel: 'Email' | 'SMS',
  sentCount: number,
  total: number,
  failedRecipients?: string[],
): string {
  if (!failedRecipients?.length) {
    return total === 1
      ? `${channel} sent successfully.`
      : `${channel} sent to ${sentCount} recipients.`;
  }

  if (sentCount === 0) {
    return `${channel} delivery failed.`;
  }

  return `${channel} sent to ${sentCount} of ${total}. Failed: ${failedRecipients.join(', ')}`;
}

function ShareRecipientTip({ channel }: { channel: 'email' | 'sms' }) {
  const detail =
    channel === 'email'
      ? 'Separate multiple email addresses with commas or new lines. Each recipient gets their own report email.'
      : 'Separate multiple phone numbers with commas or new lines. Each recipient gets their own text message.';

  return (
    <View
      className="mb-md rounded-md px-md py-3"
      style={{ backgroundColor: `${colors.navy}10`, borderWidth: 1, borderColor: `${colors.navy}22` }}
    >
      <Text className="text-body-small font-semibold text-navy">Tip</Text>
      <Text className="mt-1 text-caption text-text-secondary">{detail}</Text>
    </View>
  );
}

export function ShareModal({ visible, propertyId, onClose }: ShareModalProps) {
  const [panel, setPanel] = useState<SharePanel>('menu');
  const [phoneNumbers, setPhoneNumbers] = useState('');
  const [emails, setEmails] = useState('');
  const [copyingLink, setCopyingLink] = useState(false);
  const [sendingSms, setSendingSms] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<'success' | 'error'>('success');

  const resetState = () => {
    setPanel('menu');
    setPhoneNumbers('');
    setEmails('');
    setCopyingLink(false);
    setSendingSms(false);
    setSendingEmail(false);
    setFeedback(null);
    setFeedbackTone('success');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const showFeedback = (message: string, tone: 'success' | 'error' = 'success') => {
    setFeedback(message);
    setFeedbackTone(tone);
  };

  const handleCopyLink = async () => {
    setCopyingLink(true);
    setFeedback(null);
    try {
      const result = await shareProperty(propertyId, 'link');
      if (!result.url) {
        throw new Error('No share link returned from server.');
      }
      await Clipboard.setStringAsync(result.url);
      showFeedback('Copied!', 'success');
    } catch (error) {
      showFeedback(getApiErrorMessage(error, 'Could not copy share link.'), 'error');
    } finally {
      setCopyingLink(false);
    }
  };

  const handleSendSms = async () => {
    const recipients = parseShareRecipients(phoneNumbers);
    if (!recipients.length) {
      showFeedback('Enter at least one phone number.', 'error');
      return;
    }

    const validationError = validateSharePhones(recipients);
    if (validationError) {
      showFeedback(validationError, 'error');
      return;
    }

    setSendingSms(true);
    setFeedback(null);
    try {
      const result = await shareProperty(propertyId, 'sms', recipients);
      if (result.success === false) {
        throw new Error(result.error ?? 'SMS delivery failed.');
      }

      const sentCount = result.sentCount ?? recipients.length;
      const tone = result.failedRecipients?.length ? 'error' : 'success';
      showFeedback(formatDeliveryFeedback('SMS', sentCount, recipients.length, result.failedRecipients), tone);

      if (!result.failedRecipients?.length) {
        setPhoneNumbers('');
        setPanel('menu');
      }
    } catch (error) {
      showFeedback(getApiErrorMessage(error, 'Could not send SMS.'), 'error');
    } finally {
      setSendingSms(false);
    }
  };

  const handleSendEmail = async () => {
    const recipients = parseShareRecipients(emails);
    if (!recipients.length) {
      showFeedback('Enter at least one email address.', 'error');
      return;
    }

    const validationError = validateShareEmails(recipients);
    if (validationError) {
      showFeedback(validationError, 'error');
      return;
    }

    setSendingEmail(true);
    setFeedback(null);
    try {
      const result = await shareProperty(propertyId, 'email', recipients);
      if (result.success === false) {
        throw new Error(result.error ?? 'Email delivery failed.');
      }

      const sentCount = result.sentCount ?? recipients.length;
      const tone = result.failedRecipients?.length ? 'error' : 'success';
      showFeedback(formatDeliveryFeedback('Email', sentCount, recipients.length, result.failedRecipients), tone);

      if (!result.failedRecipients?.length) {
        setEmails('');
        setPanel('menu');
      }
    } catch (error) {
      showFeedback(getApiErrorMessage(error, 'Could not send email.'), 'error');
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <Modal visible={visible} title="Share Analysis Report" onClose={handleClose}>
      {feedback ? (
        <View
          className={`mb-md rounded-md px-md py-3 ${feedbackTone === 'success' ? 'bg-emerald/10' : 'bg-alert-red/10'}`}
        >
          <Text
            className={`text-body-small font-semibold ${feedbackTone === 'success' ? 'text-emerald' : 'text-alert-red'}`}
          >
            {feedback}
          </Text>
        </View>
      ) : null}

      {panel === 'menu' ? (
        <View className="gap-md">
          <ShareOptionCard
            emoji="📋"
            title="Copy Link"
            description="Generate a report link and copy it to your clipboard (may take up to a minute)."
            loading={copyingLink}
            onPress={() => void handleCopyLink()}
          />
          <ShareOptionCard
            emoji="📱"
            title="Send SMS"
            description="Text a summary and report link to one or more phone numbers."
            onPress={() => {
              setFeedback(null);
              setPanel('sms');
            }}
          />
          <ShareOptionCard
            emoji="📧"
            title="Send via Email"
            description="Email the analysis report to one or more recipients."
            onPress={() => {
              setFeedback(null);
              setPanel('email');
            }}
          />
        </View>
      ) : null}

      {panel === 'sms' ? (
        <View>
          <Pressable className="mb-md self-start" onPress={() => setPanel('menu')}>
            <Text className="text-body-small font-semibold text-navy">← Back</Text>
          </Pressable>
          <Text className="mb-sm text-body-small text-text-secondary">
            Enter one or more phone numbers. Include country code when needed.
          </Text>
          <ShareRecipientTip channel="sms" />
          <TextField
            label="Phone numbers"
            value={phoneNumbers}
            onChangeText={setPhoneNumbers}
            placeholder="+1 555 123 4567, +1 555 987 6543"
            keyboardType="phone-pad"
            autoComplete="tel"
            multiline
            textAlignVertical="top"
            style={{ minHeight: 96, height: 96, paddingTop: 12 }}
          />
          <PrimaryButton
            title={sendingSms ? 'Generating report & sending…' : 'Send SMS'}
            loading={sendingSms}
            onPress={() => void handleSendSms()}
          />
        </View>
      ) : null}

      {panel === 'email' ? (
        <View>
          <Pressable className="mb-md self-start" onPress={() => setPanel('menu')}>
            <Text className="text-body-small font-semibold text-navy">← Back</Text>
          </Pressable>
          <Text className="mb-sm text-body-small text-text-secondary">
            Enter one or more email addresses for the analysis report.
          </Text>
          <ShareRecipientTip channel="email" />
          <TextField
            label="Email addresses"
            value={emails}
            onChangeText={setEmails}
            placeholder="analyst@example.com, investor@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            multiline
            textAlignVertical="top"
            style={{ minHeight: 96, height: 96, paddingTop: 12 }}
          />
          <PrimaryButton
            title={sendingEmail ? 'Generating report & sending…' : 'Send Email'}
            loading={sendingEmail}
            onPress={() => void handleSendEmail()}
          />
        </View>
      ) : null}
    </Modal>
  );
}

function ShareOptionCard({
  emoji,
  title,
  description,
  loading = false,
  onPress,
}: {
  emoji: string;
  title: string;
  description: string;
  loading?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      className="rounded-md bg-white p-md"
      style={[shadows.md, { opacity: loading ? 0.7 : 1, borderWidth: 1, borderColor: colors.mediumGray }]}
    >
      <View className="flex-row items-center gap-md">
        <View
          className="h-12 w-12 items-center justify-center rounded-md"
          style={{ backgroundColor: colors.lightGray }}
        >
          {loading ? (
            <ActivityIndicator color={colors.navy} />
          ) : (
            <Text className="text-2xl">{emoji}</Text>
          )}
        </View>
        <View className="flex-1">
          <Text className="text-body font-semibold text-navy">{title}</Text>
          <Text className="mt-1 text-caption text-text-secondary">{description}</Text>
        </View>
      </View>
    </Pressable>
  );
}
