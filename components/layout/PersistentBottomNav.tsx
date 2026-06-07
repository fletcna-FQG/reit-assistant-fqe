import { DealStateDropdown } from '@/components/deals/DealStateDropdown';
import { NavIcon } from '@/components/navigation/NavIcon';
import { NAV_ITEMS } from '@/constants/navigation';
import { colors, layout, shadows } from '@/constants/theme';
import { useLeftHanded } from '@/hooks/useLeftHanded';
import { Link, usePathname } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function isNavActive(pathname: string, routeName: string): boolean {
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
}

/** Bottom navigation + Deal State control after Analyze (Rule Engine flow). */
export function PersistentBottomNav() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { isLeftHanded } = useLeftHanded();
  const routes = isLeftHanded ? [...NAV_ITEMS].reverse() : NAV_ITEMS;

  const renderNavItem = (item: (typeof NAV_ITEMS)[number]) => {
    const active = isNavActive(pathname, item.name);
    return (
      <Link key={item.name} href={item.href} asChild>
        <Pressable
          accessibilityRole="tab"
          accessibilityState={active ? { selected: true } : {}}
          accessibilityLabel={item.title}
          className="flex-1 items-center justify-center"
          // @ts-expect-error web hover title
          title={item.title}
        >
          {active ? (
            <View className="absolute top-0 bg-navy" style={{ height: 3, width: '60%' }} />
          ) : null}
          <NavIcon name={item.icon} focused={active} size={22} />
          <Text
            className="mt-0.5 text-micro"
            style={{
              color: active ? colors.navy : colors.textSecondary,
              fontWeight: active ? '700' : '600',
              fontSize: 10,
            }}
            numberOfLines={1}
          >
            {item.title}
          </Text>
        </Pressable>
      </Link>
    );
  };

  const dealStateSlot = (
    <View key="deal-state" className="flex-1 items-center justify-center px-0.5">
      <DealStateDropdown variant="nav" />
    </View>
  );

  const navContent = routes.flatMap((item) => {
    const nodes = [renderNavItem(item)];
    if (item.name === 'analyze') nodes.push(dealStateSlot);
    return nodes;
  });

  return (
    <View
      className="border-t border-medium-gray bg-white"
      style={{
        paddingBottom: insets.bottom,
        ...shadows.navTop,
      }}
      accessibilityRole="tablist"
    >
      <View
        className="flex-row items-stretch"
        style={{
          height: layout.bottomNavHeight,
          flexDirection: isLeftHanded ? 'row-reverse' : 'row',
        }}
      >
        {navContent}
      </View>
    </View>
  );
}
