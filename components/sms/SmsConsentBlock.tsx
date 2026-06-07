import { SMS_OPT_IN } from '@/constants/smsOptIn';
import { colors } from '@/constants/theme';
import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

type SmsConsentBlockProps = {
  checked: boolean;
  onToggle: () => void;
  error?: string;
};

export function SmsConsentBlock({ checked, onToggle, error }: SmsConsentBlockProps) {
  return (
    <View>
      <Pressable
        onPress={onToggle}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        className="flex-row gap-3 rounded-md px-3 py-3"
        style={{
          backgroundColor: '#f8fafc',
          borderWidth: 1,
          borderColor: error ? colors.alertRed : colors.mediumGray,
        }}
      >
        <View
          className="mt-0.5 h-5 w-5 items-center justify-center rounded-sm"
          style={{
            borderWidth: 2,
            borderColor: checked ? colors.navy : colors.mediumGray,
            backgroundColor: checked ? colors.navy : colors.white,
          }}
        >
          {checked ? <Text className="text-caption font-bold text-white">✓</Text> : null}
        </View>
        <View className="flex-1">
          <Text className="text-caption text-text-secondary" style={{ lineHeight: 20 }}>
            <Text className="font-semibold text-text-primary">I agree to receive SMS messages</Text> from{' '}
            {SMS_OPT_IN.legalName} (sender ID:{' '}
            <Text className="font-semibold text-text-primary">{SMS_OPT_IN.senderId}</Text>) about REIT
            property analysis reports and related investment notifications. Message frequency varies.
            Message and data rates may apply. Reply <Text className="font-semibold">STOP</Text> to
            unsubscribe or <Text className="font-semibold">HELP</Text> for help.
          </Text>
          <View className="mt-2 flex-row flex-wrap items-center gap-1">
            <Text className="text-caption text-text-secondary">View our </Text>
            <Link href={SMS_OPT_IN.paths.privacy as never} asChild>
              <Pressable>
                <Text className="text-caption font-semibold text-navy">Privacy Policy</Text>
              </Pressable>
            </Link>
            <Text className="text-caption text-text-secondary"> and </Text>
            <Link href={SMS_OPT_IN.paths.terms as never} asChild>
              <Pressable>
                <Text className="text-caption font-semibold text-navy">Terms of Service</Text>
              </Pressable>
            </Link>
            <Text className="text-caption text-text-secondary">.</Text>
          </View>
        </View>
      </Pressable>
      {error ? <Text className="mt-2 text-caption text-alert-red">{error}</Text> : null}
    </View>
  );
}
