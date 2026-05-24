import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="index"
      tabBar={() => null}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="rules" options={{ title: 'REIT Rules' }} />
      <Tabs.Screen name="analyze" options={{ title: 'Analyze' }} />
      <Tabs.Screen name="deals" options={{ title: 'Deals' }} />
      <Tabs.Screen name="tasks" options={{ title: 'Tasks' }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
}
