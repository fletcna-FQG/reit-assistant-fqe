import { colors, shadows } from '@/constants/theme';
import type { DealStatus } from '@/types/index';
import { Pressable, Text, View } from 'react-native';

type DealStateTileProps = {
  label: string;
  subtitle?: string;
  count: number;
  selected: boolean;
  onPress: () => void;
  dealStatus: DealStatus;
};

export function DealStateTile({
  label,
  subtitle,
  count,
  selected,
  onPress,
}: DealStateTileProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className="h-full min-h-[92px] w-full items-center justify-center rounded-md px-1 py-2.5"
      style={[
        shadows.sm,
        {
          backgroundColor: selected ? colors.navy : colors.white,
          borderWidth: 2,
          borderColor: selected ? colors.navy : colors.mediumGray,
        },
      ]}
    >
      <Text
        className="text-center text-body-small font-bold"
        style={{ color: selected ? colors.white : colors.navy }}
        numberOfLines={1}
      >
        {label}
      </Text>
      {subtitle ? (
        <Text
          className="mt-0.5 text-center text-micro"
          style={{ color: selected ? `${colors.white}CC` : colors.textSecondary }}
          numberOfLines={1}
        >
          {subtitle}
        </Text>
      ) : (
        <View className="mt-0.5 h-3" />
      )}
      <View
        className="mt-2 rounded-full px-2 py-0.5"
        style={{ backgroundColor: selected ? `${colors.white}22` : `${colors.navy}12` }}
      >
        <Text
          className="text-center text-micro font-bold"
          style={{ color: selected ? colors.white : colors.navy }}
        >
          {count}
        </Text>
      </View>
    </Pressable>
  );
}
