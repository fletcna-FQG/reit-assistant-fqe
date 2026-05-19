import { colors } from '@/constants/theme';
import { Text, View } from 'react-native';

type BadgeProps = {
  label: string;
  variant?: 'navy' | 'emerald' | 'amber' | 'red' | 'gray';
};

const variantStyles = {
  navy: { bg: `${colors.navy}14`, text: colors.navy },
  emerald: { bg: `${colors.emerald}14`, text: colors.emerald },
  amber: { bg: `${colors.warningAmber}22`, text: colors.textPrimary },
  red: { bg: `${colors.alertRed}14`, text: colors.alertRed },
  gray: { bg: colors.lightGray, text: colors.darkGray },
};

export function Badge({ label, variant = 'navy' }: BadgeProps) {
  const style = variantStyles[variant];
  return (
    <View
      className="rounded-full px-2.5 py-1"
      style={{ backgroundColor: style.bg }}
    >
      <Text className="text-caption" style={{ color: style.text }}>
        {label}
      </Text>
    </View>
  );
}
