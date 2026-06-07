import { LegalDocumentScreen } from '@/components/sms/LegalDocumentScreen';
import { SMS_OPT_IN } from '@/constants/smsOptIn';

export default function TermsScreen() {
  return (
    <LegalDocumentScreen
      title="Terms of Service"
      sections={[
        {
          title: 'Acceptance',
          body: `By using the REIT Assistant platform or subscribing to SMS alerts from ${SMS_OPT_IN.legalName}, you agree to these Terms of Service and our Privacy Policy.`,
        },
        {
          title: 'Service description',
          body: 'REIT Assistant provides property analysis tools, deal workflow features, and optional SMS/email notifications related to investment property evaluation. Analysis outputs are informational and do not constitute financial, legal, or tax advice.',
        },
        {
          title: 'SMS program terms',
          body: `By opting in, you authorize us to send SMS messages from sender ${SMS_OPT_IN.senderId} regarding REIT analysis reports and related notifications. Consent is not a condition of purchasing property or using other services. Reply STOP to cancel. Reply HELP for help.`,
        },
        {
          title: 'Acceptable use',
          body: 'You agree to provide accurate contact information, use the service lawfully, and not attempt to disrupt platform operations or access data belonging to other users.',
        },
        {
          title: 'Limitation of liability',
          body: `${SMS_OPT_IN.legalName} provides the platform "as is" to the extent permitted by law. We are not liable for investment decisions made based on analysis outputs or delays in message delivery caused by carriers or third-party providers.`,
        },
      ]}
    />
  );
}
