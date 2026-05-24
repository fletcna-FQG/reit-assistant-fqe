import { colors, layout, shadows } from '@/constants/theme';
import { useLeftHanded } from '@/hooks/useLeftHanded';
import { useResponsive } from '@/hooks/useResponsive';
import { lightHaptic } from '@/utils/lightHaptic';
import { Pressable, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type FloatingActionButtonProps = {
  onPress?: () => void;
};

/**
 * FAB — 02_Component_Library.md
 * Default: bottom-right · Left-handed override: bottom-left
 */
export function FloatingActionButton({ onPress }: FloatingActionButtonProps) {
  const { isLeftHanded } = useLeftHanded();
  const { isDesktop } = useResponsive();
  const insets = useSafeAreaInsets();

  const bottomOffset = isDesktop
    ? insets.bottom + 24
    : insets.bottom + layout.bottomNavHeight + 16;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Analyze property"
      // @ts-expect-error web hover title
      title="Analyze property"
      onPress={() => {
        lightHaptic();
        onPress?.();
      }}
      className="absolute items-center justify-center rounded-full bg-emerald"
      style={{
        width: 56,
        height: 56,
        bottom: bottomOffset,
        right: isLeftHanded ? undefined : 24,
        left: isLeftHanded ? 24 : undefined,
        ...shadows.lg,
      }}
    >
      <Text className="text-2xl font-bold text-white">+</Text>
    </Pressable>
  );
}
