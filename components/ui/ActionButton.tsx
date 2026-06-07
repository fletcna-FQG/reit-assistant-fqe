import { colors } from '@/constants/theme';
import { lightHaptic } from '@/utils/lightHaptic';
import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native';

type ActionButtonProps = PressableProps & {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline';
  loading?: boolean;
};

export function ActionButton({
  title,
  variant = 'secondary',
  loading = false,
  disabled,
  onPress,
  style,
  ...props
}: ActionButtonProps) {
  const isPrimary = variant === 'primary';
  const isOutline = variant === 'outline';
  const isSecondary = variant === 'secondary';

  const backgroundColor = isPrimary ? colors.navy : colors.white;
  const borderWidth = isPrimary ? 0 : 2;
  const textColor = isPrimary ? colors.white : colors.navy;

  return (
    <Pressable
      disabled={disabled || loading}
      onPress={(event) => {
        lightHaptic();
        onPress?.(event);
      }}
      accessibilityRole="button"
      accessibilityLabel={title}
      className="items-center justify-center rounded-sm"
      style={[
        {
          minHeight: 48,
          paddingHorizontal: 16,
          opacity: disabled || loading ? 0.55 : 1,
          backgroundColor: isSecondary && !isOutline ? colors.lightGray : backgroundColor,
          borderWidth,
          borderColor: colors.navy,
        },
        style as object | undefined,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text className="text-body font-semibold" style={{ color: textColor }}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}
