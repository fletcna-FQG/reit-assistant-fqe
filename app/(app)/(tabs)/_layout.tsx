import { CustomTabBar } from '@/components/layout/CustomTabBar';
import { useResponsive } from '@/hooks/useResponsive';
import { Tabs } from 'expo-router';

export default function TabsLayout() {
  const { isDesktop } = useResponsive();

  return (
    <Tabs
      tabBar={isDesktop ? () => null : (props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="deals" options={{ title: 'Deals' }} />
      <Tabs.Screen name="analyze" options={{ title: 'Analyze' }} />
      <Tabs.Screen name="tasks" options={{ title: 'Tasks' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
