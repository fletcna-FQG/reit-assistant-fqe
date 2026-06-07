import { LegalDocumentScreen } from '@/components/sms/LegalDocumentScreen';
import { SMS_OPT_IN } from '@/constants/smsOptIn';

export default function PrivacyScreen() {
  return (
    <LegalDocumentScreen
      title="Privacy Policy"
      sections={[
        {
          title: 'Overview',
          body: `${SMS_OPT_IN.legalName} ("we", "us") operates the REIT Assistant platform and related communications. This policy describes how we collect and use information when you subscribe to SMS updates or use our services.`,
        },
        {
          title: 'Information we collect',
          body: 'When you opt in to SMS alerts, we collect your mobile phone number, optional email address, consent timestamp, and subscription source (website form, QR code, or keyword). We may also collect device and usage data when you use the REIT Assistant application.',
        },
        {
          title: 'How we use SMS data',
          body: `We use your phone number to send transactional SMS messages you requested, including REIT analysis report links from sender ID ${SMS_OPT_IN.senderId}. We do not sell your phone number to third parties. Message frequency varies. Message and data rates may apply.`,
        },
        {
          title: 'Your choices',
          body: 'You may unsubscribe from SMS at any time by replying STOP to any message. Reply HELP for support. You may contact us to request access to or deletion of your subscription data, subject to legal retention requirements.',
        },
        {
          title: 'Contact',
          body: `Questions about this policy: ${SMS_OPT_IN.domain} · reports@${SMS_OPT_IN.domain}`,
        },
      ]}
    />
  );
}
