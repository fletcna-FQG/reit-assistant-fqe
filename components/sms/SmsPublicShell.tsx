import { SMS_OPT_IN } from '@/constants/smsOptIn';
import { colors } from '@/constants/theme';
import { Link } from 'expo-router';
import type { PropsWithChildren } from 'react';
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type SmsPublicShellProps = PropsWithChildren<{
  tagline?: string;
  footerNote?: string;
}>;

export function SmsPublicShell({ children, tagline, footerNote }: SmsPublicShellProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width - 32, 920);

  return (
    <View className="flex-1 bg-light-gray" style={{ paddingTop: insets.top }}>
      <View style={{ backgroundColor: colors.navy, paddingHorizontal: 24, paddingVertical: 16 }}>
        <View style={{ maxWidth: contentWidth, width: '100%', alignSelf: 'center' }}>
          <View className="flex-row items-center gap-3">
            <View
              className="h-10 w-10 items-center justify-center rounded-md"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
            >
              <Text className="text-body-small font-bold text-white">FQ</Text>
            </View>
            <View className="flex-1">
              <Text className="text-body font-bold text-white">{SMS_OPT_IN.company}</Text>
              {tagline ? (
                <Text className="text-caption text-white" style={{ opacity: 0.85 }}>
                  {tagline}
                </Text>
              ) : null}
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ maxWidth: contentWidth, width: '100%', alignSelf: 'center', paddingHorizontal: 16 }}>
          {children}
        </View>
      </ScrollView>

      <View style={{ backgroundColor: colors.navy, paddingHorizontal: 16, paddingVertical: 12 }}>
        <Text
          className="text-center text-caption text-white"
          style={{ opacity: 0.85, lineHeight: 18 }}
        >
          {footerNote ??
            `© ${new Date().getFullYear()} ${SMS_OPT_IN.legalName} · ${SMS_OPT_IN.domain}`}
        </Text>
        <View className="mt-2 flex-row flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <FooterLink href={SMS_OPT_IN.paths.privacy} label="Privacy" />
          <Text className="text-caption text-white" style={{ opacity: 0.5 }}>
            ·
          </Text>
          <FooterLink href={SMS_OPT_IN.paths.terms} label="Terms" />
          <Text className="text-caption text-white" style={{ opacity: 0.5 }}>
            ·
          </Text>
          <FooterLink href={SMS_OPT_IN.paths.smsPolicy} label="SMS Policy" />
        </View>
      </View>
    </View>
  );
}

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href as never}>
      <Text className="text-caption font-semibold text-white" style={{ opacity: 0.9 }}>
        {label}
      </Text>
    </Link>
  );
}
