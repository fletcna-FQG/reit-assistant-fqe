import { NavIcon } from '@/components/navigation/NavIcon';
import { BRAND, NAV_ITEMS, SETTINGS_HREF } from '@/constants/navigation';
import { colors, layout, shadows } from '@/constants/theme';
import { useLeftHanded } from '@/hooks/useLeftHanded';
import { Link, usePathname } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

export function Sidebar() {
  const pathname = usePathname();
  const { isLeftHanded } = useLeftHanded();

  const isActive = (routeName: string) => {
    const segment = pathname.split('/').filter(Boolean).pop() ?? 'index';
    const inAnalyzeFlow = pathname.includes('/property/') || pathname.includes('/analysis/');

    if (routeName === 'index') {
      return segment === 'index' || pathname.endsWith('/(tabs)') || pathname === '/';
    }
    if (routeName === 'analyze') {
      return segment === 'analyze' || inAnalyzeFlow;
    }
    return segment === routeName;
  };

  return (
    <View
      className="h-full bg-white"
      style={{
        width: layout.sidebarWidth,
        borderRightWidth: isLeftHanded ? 0 : 1,
        borderLeftWidth: isLeftHanded ? 1 : 0,
        borderColor: colors.mediumGray,
        ...shadows.sm,
      }}
    >
      <View className="flex-row items-center gap-3 border-b border-medium-gray px-md py-lg">
        <View className="items-center justify-center rounded-xl bg-navy" style={{ width: 40, height: 40 }}>
          <Text className="text-lg font-bold text-white">FQ</Text>
        </View>
        <View className="flex-1">
          <Text className="text-h3 text-navy">{BRAND.name}</Text>
          <Text className="text-caption text-text-secondary">{BRAND.company}</Text>
        </View>
      </View>

      <View className="flex-1 gap-1 px-sm py-md">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.name);
          return (
            <Link key={item.name} href={item.href} asChild>
              <Pressable
                className="flex-row items-center gap-3 rounded-sm px-md py-3"
                style={{ backgroundColor: active ? `${colors.navy}14` : 'transparent' }}
              >
                <NavIcon name={item.icon} focused={active} />
                <Text className="text-body-small font-semibold" style={{ color: active ? colors.navy : colors.textPrimary }}>
                  {item.title}
                </Text>
              </Pressable>
            </Link>
          );
        })}
      </View>

      <View className="border-t border-medium-gray px-sm py-md">
        <Link href={SETTINGS_HREF} asChild>
          <Pressable className="flex-row items-center gap-3 rounded-sm px-md py-3">
            <NavIcon name="profile" />
            <Text className="text-body-small font-semibold text-text-primary">Profile & Settings</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}
