import { colors, layout } from '@/constants/theme';
import { useResponsive } from '@/hooks/useResponsive';
import { Text, View, type ViewProps } from 'react-native';

type ScreenHeaderProps = ViewProps & {
  title: string;
  right?: React.ReactNode;
};

export function ScreenHeader({ title, right, style, ...props }: ScreenHeaderProps) {
  const { isDesktop, isTablet } = useResponsive();
  const height = isDesktop
    ? layout.headerHeight.desktop
    : isTablet
      ? layout.headerHeight.tablet
      : layout.headerHeight.mobile;

  return (
    <View
      className="flex-row items-center justify-between border-b border-medium-gray bg-white px-md"
      style={[{ height }, style]}
      {...props}
    >
      <Text className="text-h3 text-navy">{title}</Text>
      {right ? <View className="flex-row items-center gap-2">{right}</View> : null}
    </View>
  );
}
