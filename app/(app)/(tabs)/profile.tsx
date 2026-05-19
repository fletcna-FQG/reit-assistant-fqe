import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { colors } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useLeftHanded } from '@/hooks/useLeftHanded';
import { useThemeMode } from '@/hooks/useThemeMode';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Pressable, Switch, Text, View } from 'react-native';

export default function ProfileScreen() {
  const { session, signOut, isDemoMode } = useAuth();
  const { isLeftHanded, setLeftHanded } = useLeftHanded();
  const { isDark, setDarkMode } = useThemeMode();

  const displayName = session?.user.fullName ?? 'Analyst';
  const email = session?.user.email ?? '';

  const handleToggle = (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLeftHanded(value);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      router.replace('/login');
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  return (
    <View className="flex-1 bg-light-gray">
      <ScreenHeader title="Profile & Settings" />
      <View className="m-md rounded-md bg-white p-md shadow-sm">
        <Text className="mb-1 text-h2 text-navy">{displayName}</Text>
        <Text className="mb-1 text-body-small text-text-secondary">{email}</Text>
        {isDemoMode ? (
          <Text className="mb-lg text-caption text-warning-amber">Demo authentication active</Text>
        ) : (
          <View className="mb-lg" />
        )}

        <View className="mb-md flex-row items-center justify-between border-t border-medium-gray pt-md">
          <View className="flex-1 pr-md">
            <Text className="text-h4 text-text-primary">Dark Mode</Text>
            <Text className="mt-1 text-body-small text-text-secondary">
              Maps to dark tokens from 01_Style_Guide.md
            </Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={setDarkMode}
            trackColor={{ false: colors.mediumGray, true: colors.navyLight }}
            thumbColor={isDark ? colors.navy : colors.white}
          />
        </View>

        <View className="flex-row items-center justify-between border-t border-medium-gray pt-md">
          <View className="flex-1 pr-md">
            <Text className="text-h4 text-text-primary">Left-Handed Mode</Text>
            <Text className="mt-1 text-body-small text-text-secondary">
              Flips sidebar and FAB to the left side
            </Text>
          </View>
          <Switch
            value={isLeftHanded}
            onValueChange={handleToggle}
            trackColor={{ false: colors.mediumGray, true: colors.emeraldLight }}
            thumbColor={isLeftHanded ? colors.emerald : colors.white}
          />
        </View>
      </View>

      <Pressable
        className="mx-md mt-md items-center rounded-sm bg-navy py-3.5"
        onPress={() => router.push('/(app)/rules')}
      >
        <Text className="text-body font-semibold text-white">Investment Rules</Text>
      </Pressable>

      <Pressable
        className="mx-md mt-sm items-center rounded-sm bg-alert-red py-3.5"
        onPress={handleLogout}
      >
        <Text className="text-body font-semibold text-white">Log Out</Text>
      </Pressable>
    </View>
  );
}
