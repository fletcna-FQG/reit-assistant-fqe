import { colors } from '@/constants/theme';
import { lightHaptic } from '@/utils/lightHaptic';
import { ActivityIndicator, Pressable, Text, View, type PressableProps } from 'react-native';

type IconActionButtonProps = PressableProps & {
  icon: string;
  label: string;
  variant?: 'primary' | 'secondary' | 'emerald';
  loading?: boolean;
  compact?: boolean;
};

/**
 * Icon-first action control with accessible label and web hover title.
 */
export function IconActionButton({
  icon,
  label,
  variant = 'primary',
  loading = false,
  compact = false,
  disabled,
  onPress,
  ...props
}: IconActionButtonProps) {
  const bg =
    variant === 'primary'
      ? colors.navy
      : variant === 'emerald'
        ? colors.emerald
        : 'transparent';
  const fg = variant === 'secondary' ? colors.navy : colors.white;
  const border = variant === 'secondary' ? colors.navy : 'transparent';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled || loading}
      onPress={(event) => {
        lightHaptic();
        onPress?.(event);
      }}
      className={`items-center justify-center rounded-sm ${compact ? 'px-3 py-2' : 'px-md py-3'}`}
      style={{
        opacity: disabled || loading ? 0.5 : 1,
        backgroundColor: bg,
        borderWidth: variant === 'secondary' ? 2 : 0,
        borderColor: border,
        minHeight: compact ? 40 : 48,
        flexDirection: compact ? 'row' : 'column',
        gap: compact ? 8 : 4,
      }}
      // @ts-expect-error web hover title
      title={label}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          <Text style={{ fontSize: compact ? 18 : 22 }} accessibilityElementsHidden importantForAccessibility="no">
            {icon}
          </Text>
          <Text
            className={compact ? 'text-caption font-semibold' : 'text-micro font-semibold'}
            style={{ color: fg }}
            numberOfLines={1}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

/** Horizontal pair of icon actions (Back + Continue). */
export function WizardActionBar({
  onBack,
  onContinue,
  continueLabel = 'Continue',
  continueLoading = false,
  showBack = true,
  continueDisabled = false,
}: {
  onBack?: () => void;
  onContinue: () => void;
  continueLabel?: string;
  continueLoading?: boolean;
  showBack?: boolean;
  continueDisabled?: boolean;
}) {
  return (
    <View className="mt-lg flex-row gap-2">
      {showBack ? (
        <View className="flex-1">
          <IconActionButton icon="←" label="Back" variant="secondary" compact onPress={onBack} />
        </View>
      ) : null}
      <View className="flex-1">
        <IconActionButton
          icon="→"
          label={continueLabel}
          variant="primary"
          compact
          loading={continueLoading}
          disabled={continueDisabled}
          onPress={onContinue}
        />
      </View>
    </View>
  );
}
