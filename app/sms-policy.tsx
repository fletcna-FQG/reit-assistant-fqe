import { LegalDocumentScreen } from '@/components/sms/LegalDocumentScreen';
import { SMS_OPT_IN } from '@/constants/smsOptIn';

export default function SmsPolicyScreen() {
  return (
    <LegalDocumentScreen
      title="SMS Policy"
      sections={[
        {
          title: 'Program name',
          body: `${SMS_OPT_IN.company} REIT Analysis SMS Alerts`,
        },
        {
          title: 'How to opt in',
          body: `Visit ${SMS_OPT_IN.domain}${SMS_OPT_IN.paths.optIn} and submit the subscription form with your phone number and consent, scan the QR code on ${SMS_OPT_IN.paths.join}, or text ${SMS_OPT_IN.keyword} to ${SMS_OPT_IN.smsNumber}.`,
        },
        {
          title: 'Message types',
          body: 'Transactional and informational SMS including links to REIT property analysis reports shared from the platform, and related deal or portfolio notifications you request.',
        },
        {
          title: 'Frequency & charges',
          body: 'Message frequency varies based on activity. Message and data rates may apply depending on your mobile carrier plan.',
        },
        {
          title: 'Opt out & support',
          body: `Reply STOP to unsubscribe from future messages. Reply HELP for assistance. Sender ID: ${SMS_OPT_IN.senderId}. For additional support, contact reports@${SMS_OPT_IN.domain}.`,
        },
        {
          title: 'Carriers',
          body: 'Carriers are not liable for delayed or undelivered messages. Supported carriers depend on your region and our SMS provider (Brevo).',
        },
      ]}
    />
  );
}
