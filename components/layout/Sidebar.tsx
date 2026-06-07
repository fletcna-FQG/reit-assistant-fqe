import { NavIcon } from '@/components/navigation/NavIcon';
import { BRAND, NAV_ITEMS, SETTINGS_HREF } from '@/constants/navigation';
import { colors, layout, shadows } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useLeftHanded } from '@/hooks/useLeftHanded';
import { useSidebarCollapsed } from '@/hooks/useSidebarCollapsed';
import { getSidebarToggleIcon } from '@/utils/navigationRoute';
import { Ionicons } from '@expo/vector-icons';
import { Link, usePathname } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

export function Sidebar() {
  const pathname = usePathname();
  const { isLeftHanded } = useLeftHanded();
  const { isCollapsed, toggleCollapsed } = useSidebarCollapsed();
  const { session } = useAuth();

  const displayName =
    session?.user.fullName?.trim() ||
    session?.user.email?.split('@')[0] ||
    'Analyst';
  const profileLabel = `Profile & Settings — ${displayName}`;

  const isActive = (routeName: string) => {
    const segment = pathname.split('/').filter(Boolean).pop() ?? 'index';
    const inAnalysisFlow = pathname.includes('/analysis/');
    const inPropertyFlow = pathname.includes('/property/');

    if (routeName === 'index') {
      return segment === 'index' || pathname.endsWith('/(tabs)') || pathname === '/';
    }
    if (routeName === 'analyze') {
      return segment === 'analyze' || inAnalysisFlow;
    }
    if (routeName === 'properties') {
      return segment === 'properties' || inPropertyFlow;
    }
    return segment === routeName;
  };

  const isSettingsActive = pathname.includes('/settings');
  const sidebarWidth = isCollapsed ? layout.sidebarCollapsedWidth : layout.sidebarWidth;
  const sidebarOnRight = isLeftHanded;
  const collapseIcon = getSidebarToggleIcon(isCollapsed, sidebarOnRight);

  return (
    <View
      className="h-full bg-white"
      style={{
        width: sidebarWidth,
        borderRightWidth: isLeftHanded ? 0 : 1,
        borderLeftWidth: isLeftHanded ? 1 : 0,
        borderColor: colors.mediumGray,
        ...shadows.sm,
      }}
    >
      <View
        className="border-b border-medium-gray py-md"
        style={{
          alignItems: isCollapsed ? 'center' : 'stretch',
          paddingHorizontal: isCollapsed ? 8 : 16,
        }}
      >
        {isCollapsed ? (
          <View className="items-center gap-2">
            <View className="items-center justify-center rounded-xl bg-navy" style={{ width: 40, height: 40 }}>
              <Text className="text-lg font-bold text-white">FQ</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Expand navigation"
              onPress={toggleCollapsed}
              className="items-center justify-center rounded-sm"
              style={{ width: 32, height: 32 }}
              // @ts-expect-error web hover title
              title="Expand navigation"
            >
              <Ionicons name={collapseIcon} size={18} color={colors.navy} />
            </Pressable>
          </View>
        ) : (
          <View
            className="flex-row items-center gap-2"
            style={{ flexDirection: sidebarOnRight ? 'row-reverse' : 'row' }}
          >
            <View
              className="min-w-0 flex-1 flex-row items-center gap-3"
              style={{ flexDirection: sidebarOnRight ? 'row-reverse' : 'row' }}
            >
              <View
                className="items-center justify-center rounded-xl bg-navy"
                style={{ width: 40, height: 40 }}
              >
                <Text className="text-lg font-bold text-white">FQ</Text>
              </View>
              <View className="min-w-0 flex-1">
                <Text
                  className="text-h3 text-navy"
                  numberOfLines={1}
                  style={{ textAlign: sidebarOnRight ? 'right' : 'left' }}
                >
                  {BRAND.name}
                </Text>
                <Text
                  className="text-caption text-text-secondary"
                  numberOfLines={1}
                  style={{ textAlign: sidebarOnRight ? 'right' : 'left' }}
                >
                  {BRAND.company}
                </Text>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Collapse navigation"
              onPress={toggleCollapsed}
              className="items-center justify-center rounded-sm"
              style={{ width: 32, height: 32 }}
              // @ts-expect-error web hover title
              title="Collapse navigation"
            >
              <Ionicons name={collapseIcon} size={18} color={colors.navy} />
            </Pressable>
          </View>
        )}
      </View>

      <View className="flex-1 gap-1 px-sm py-md">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.name);
          return (
            <Link key={item.name} href={item.href} asChild>
              <Pressable
                accessibilityRole="tab"
                accessibilityState={active ? { selected: true } : {}}
                accessibilityLabel={item.title}
                className="flex-row items-center rounded-sm py-3"
                style={{
                  backgroundColor: active ? `${colors.navy}14` : 'transparent',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  paddingHorizontal: isCollapsed ? 0 : layout.sidebarCollapsedWidth / 4,
                  gap: isCollapsed ? 0 : 12,
                }}
                // @ts-expect-error web hover title
                title={item.title}
              >
                <NavIcon name={item.icon} focused={active} />
                {!isCollapsed ? (
                  <Text
                    className="flex-1 text-body-small font-semibold"
                    style={{ color: active ? colors.navy : colors.textPrimary }}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                ) : null}
              </Pressable>
            </Link>
          );
        })}
      </View>

      <View className="border-t border-medium-gray px-sm py-md">
        <Link href={SETTINGS_HREF} asChild>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={profileLabel}
            className="flex-row items-center rounded-sm py-3"
            style={{
              backgroundColor: isSettingsActive ? `${colors.navy}14` : 'transparent',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              paddingHorizontal: isCollapsed ? 0 : layout.sidebarCollapsedWidth / 4,
              gap: isCollapsed ? 0 : 12,
            }}
            // @ts-expect-error web hover title
            title={profileLabel}
          >
            <NavIcon name="profile" focused={isSettingsActive} />
            {!isCollapsed ? (
              <View className="min-w-0 flex-1">
                <Text className="text-body-small font-semibold text-text-primary" numberOfLines={1}>
                  Profile & Settings
                </Text>
                <Text className="text-caption text-text-secondary" numberOfLines={1}>
                  {displayName}
                </Text>
              </View>
            ) : null}
          </Pressable>
        </Link>
      </View>
    </View>
  );
}
