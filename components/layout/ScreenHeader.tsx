import { colors, layout } from '@/constants/theme';
import { useResponsive } from '@/hooks/useResponsive';
import { isPrimaryTabRoute } from '@/utils/navigationRoute';
import { router, usePathname } from 'expo-router';
import { Pressable, Text, View, type ViewProps } from 'react-native';

type ScreenHeaderProps = ViewProps & {
  title: string;
  right?: React.ReactNode;
  /** Defaults to false on primary tab screens (Dashboard, Deals, …). */
  showBack?: boolean;
  onBack?: () => void;
};

export function ScreenHeader({
  title,
  right,
  showBack,
  onBack,
  style,
  ...props
}: ScreenHeaderProps) {
  const pathname = usePathname();
  const { isDesktop, isTablet } = useResponsive();
  const height = isDesktop
    ? layout.headerHeight.desktop
    : isTablet
      ? layout.headerHeight.tablet
      : layout.headerHeight.mobile;

  const resolvedShowBack = showBack ?? !isPrimaryTabRoute(pathname);

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(app)/(tabs)');
  };

  return (
    <View
      className="flex-row items-center justify-between border-b border-medium-gray bg-white px-md"
      style={[{ height }, style]}
      {...props}
    >
      <View className="min-w-0 flex-1 flex-row items-center gap-2">
        {resolvedShowBack ? (
          <Pressable
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="Back"
            // @ts-expect-error web hover title
            title="Back"
            className="mr-1 h-9 w-9 items-center justify-center rounded-sm"
            style={{ backgroundColor: `${colors.navy}10` }}
          >
            <Text className="text-lg font-bold text-navy">←</Text>
          </Pressable>
        ) : null}
        <Text className="flex-1 text-h3 text-navy" numberOfLines={1}>
          {title}
        </Text>
      </View>
      {right ? <View className="flex-row items-center gap-2">{right}</View> : null}
    </View>
  );
}
