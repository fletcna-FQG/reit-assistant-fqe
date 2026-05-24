import { colors } from '@/constants/theme';
import { Text, View } from 'react-native';

/** Pill badge with white text for navy/emerald headers (Cap Rate, Rule Engine, etc.). */
export function HeaderMetricPill({ label }: { label: string }) {
  return (
    <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: colors.emerald }}>
      <Text className="text-caption font-semibold text-white" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}
