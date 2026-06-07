import '../global.css';

import { OfflineBanner } from '@/components/layout/OfflineBanner';
import { AuthProvider } from '@/hooks/useAuth';
import { LeftHandedProvider } from '@/hooks/useLeftHanded';
import { SidebarCollapsedProvider } from '@/hooks/useSidebarCollapsed';
import { ThemeModeProvider } from '@/hooks/useThemeMode';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ThemeModeProvider>
              <LeftHandedProvider>
                <SidebarCollapsedProvider>
                <View style={{ flex: 1 }}>
                  <OfflineBanner />
                  <StatusBar style="dark" />
                  <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="index" />
                    <Stack.Screen name="login" />
                    <Stack.Screen name="(app)" />
                  </Stack>
                </View>
                </SidebarCollapsedProvider>
              </LeftHandedProvider>
            </ThemeModeProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
