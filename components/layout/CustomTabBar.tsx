import { NavIcon } from '@/components/navigation/NavIcon';
import { NAV_ITEMS } from '@/constants/navigation';
import { colors, layout, shadows } from '@/constants/theme';
import { useLeftHanded } from '@/hooks/useLeftHanded';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { isLeftHanded } = useLeftHanded();

  const routes = isLeftHanded ? [...state.routes].reverse() : state.routes;
  const focusedRouteKey = state.routes[state.index]?.key;

  return (
    <View
      className="border-t border-medium-gray bg-white"
      style={{
        paddingBottom: insets.bottom,
        alignSelf: isLeftHanded ? 'flex-end' : 'stretch',
        width: isLeftHanded ? '100%' : '100%',
        ...shadows.navTop,
      }}
    >
      <View
        className="flex-row items-stretch"
        style={{
          height: layout.bottomNavHeight,
          flexDirection: isLeftHanded ? 'row-reverse' : 'row',
        }}
      >
        {routes.map((route) => {
          const { options } = descriptors[route.key];
          const navItem = NAV_ITEMS.find((item) => item.name === route.name);
          const label = navItem?.title ?? options.title ?? route.name;
          const isFocused = route.key === focusedRouteKey;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={onPress}
              className="flex-1 items-center justify-center"
            >
              {isFocused && (
                <View
                  className="absolute top-0 bg-navy"
                  style={{ height: 3, width: '60%' }}
                />
              )}
              <NavIcon name={navItem?.icon ?? 'home'} focused={isFocused} size={24} />
              <Text
                className="mt-1 text-micro"
                style={{
                  color: isFocused ? colors.navy : colors.textSecondary,
                  fontWeight: isFocused ? '700' : '600',
                }}
                numberOfLines={1}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
