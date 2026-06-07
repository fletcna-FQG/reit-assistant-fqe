import { SmsPublicShell } from '@/components/sms/SmsPublicShell';
import { colors } from '@/constants/theme';
import { Text, View } from 'react-native';

type LegalSection = {
  title: string;
  body: string;
};

type LegalDocumentScreenProps = {
  title: string;
  sections: LegalSection[];
};

export function LegalDocumentScreen({ title, sections }: LegalDocumentScreenProps) {
  return (
    <SmsPublicShell tagline={title}>
      <View
        className="mt-6 rounded-md bg-white p-md"
        style={{ borderWidth: 1, borderColor: colors.mediumGray }}
      >
        <Text className="mb-4 text-h3 text-navy">{title}</Text>
        {sections.map((section) => (
          <View key={section.title} className="mb-4">
            <Text className="mb-2 text-body font-semibold text-navy">{section.title}</Text>
            <Text className="text-body-small text-text-secondary" style={{ lineHeight: 22 }}>
              {section.body}
            </Text>
          </View>
        ))}
      </View>
    </SmsPublicShell>
  );
}
