import { colors } from '@/constants/theme';
import { lightHaptic } from '@/utils/lightHaptic';
import {
  ActivityIndicator,
  Pressable,
  Text,
  type PressableProps,
} from 'react-native';

type PrimaryButtonProps = PressableProps & {
  title: string;
  variant?: 'primary' | 'secondary' | 'social';
  loading?: boolean;
};

export function PrimaryButton({
  title,
  variant = 'primary',
  loading = false,
  disabled,
  onPress,
  ...props
}: PrimaryButtonProps) {
  const isPrimary = variant === 'primary';
  const isSocial = variant === 'social';

  return (
    <Pressable
      disabled={disabled || loading}
      onPress={(event) => {
        lightHaptic();
        onPress?.(event);
      }}
      className="mb-sm items-center justify-center rounded-sm"
      style={[
        {
          height: 48,
          opacity: disabled || loading ? 0.5 : 1,
          backgroundColor: isPrimary
            ? colors.navy
            : isSocial
              ? colors.white
              : 'transparent',
          borderWidth: isPrimary ? 0 : 2,
          borderColor: isSocial ? colors.mediumGray : colors.navy,
        },
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.white : colors.navy} />
      ) : (
        <Text
          className="text-body font-semibold"
          style={{
            color: isPrimary ? colors.white : isSocial ? colors.textPrimary : colors.navy,
          }}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}
