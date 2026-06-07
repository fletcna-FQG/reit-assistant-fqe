import { SmsOptInQrCode } from '@/components/sms/SmsOptInQrCode';
import { SmsPublicShell } from '@/components/sms/SmsPublicShell';
import { SMS_OPT_IN, getJoinSmsPageUrl, getSmsOptInPageUrl } from '@/constants/smsOptIn';
import { colors } from '@/constants/theme';
import { Link } from 'expo-router';
import { Text, View, useWindowDimensions } from 'react-native';

export default function JoinSmsScreen() {
  const { width } = useWindowDimensions();
  const stacked = width < 720;
  const optInUrl = getSmsOptInPageUrl();

  return (
    <SmsPublicShell
      tagline={`Text ${SMS_OPT_IN.keyword} to subscribe`}
      footerNote={`${SMS_OPT_IN.legalName} · SMS opt-in: ${SMS_OPT_IN.keyword} to ${SMS_OPT_IN.smsNumber} · HELP for support · STOP to unsubscribe`}
    >
      <View
        className={`mt-6 overflow-hidden rounded-md ${stacked ? '' : 'flex-row'}`}
        style={{ borderWidth: 1, borderColor: colors.mediumGray, backgroundColor: colors.white }}
      >
        <View
          className="flex-1 items-center px-md py-8"
          style={stacked ? undefined : { borderRightWidth: 1, borderRightColor: colors.mediumGray }}
        >
          <Text className="text-h3 text-navy">Scan to subscribe</Text>
          <Text
            className="mt-2 max-w-xs text-center text-body-small text-text-secondary"
            style={{ lineHeight: 22 }}
          >
            Scan this QR code with your phone camera to open our SMS opt-in page and agree to receive
            REIT analysis alerts.
          </Text>
          <View className="my-6">
            <SmsOptInQrCode value={optInUrl} />
          </View>
          <Text className="max-w-xs text-center text-caption text-text-secondary" style={{ lineHeight: 18 }}>
            QR links to {SMS_OPT_IN.domain}
            {SMS_OPT_IN.paths.optIn}. Consent checkbox required before subscription is confirmed.
          </Text>
          <Link href={SMS_OPT_IN.paths.optIn as never} asChild>
            <Text className="mt-4 text-body-small font-semibold text-navy">Open subscription form →</Text>
          </Link>
        </View>

        <View className="flex-1 items-center bg-light-gray px-md py-8">
          <Text className="text-h3 text-navy">Text a keyword</Text>
          <Text
            className="mt-2 max-w-xs text-center text-body-small text-text-secondary"
            style={{ lineHeight: 22 }}
          >
            Send the keyword below to our SMS number to opt in to REIT analysis alerts.
          </Text>
          <Text className="mt-6 text-body text-text-primary">
            Text to:{' '}
            <Text className="font-bold text-navy">{SMS_OPT_IN.smsNumber}</Text>
          </Text>
          <View
            className="my-4 rounded-md px-8 py-4"
            style={{ backgroundColor: colors.navy }}
          >
            <Text
              className="text-center font-bold text-white"
              style={{ fontSize: 28, letterSpacing: 4 }}
            >
              {SMS_OPT_IN.keyword}
            </Text>
          </View>
          <Text className="max-w-xs text-center text-caption text-text-secondary" style={{ lineHeight: 18 }}>
            Example: text &ldquo;{SMS_OPT_IN.keyword}&rdquo; to {SMS_OPT_IN.smsNumber} → auto-reply
            confirms opt-in and links to Terms &amp; Privacy. Reply STOP to cancel. Sender:{' '}
            {SMS_OPT_IN.senderId}.
          </Text>
        </View>
      </View>

      <Text className="mt-4 text-center text-caption text-text-secondary">
        Public page URL: {getJoinSmsPageUrl()}
      </Text>
    </SmsPublicShell>
  );
}
