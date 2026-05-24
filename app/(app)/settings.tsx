import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Badge } from '@/components/ui/Badge';
import {
  INTEGRATION_CATALOG,
  INTEGRATION_CATEGORY_LABELS,
  type IntegrationCategory,
} from '@/constants/integrations';
import { colors } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useLeftHanded } from '@/hooks/useLeftHanded';
import { useThemeMode } from '@/hooks/useThemeMode';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';

const ENABLED_KEY = 'reit_enabled_integrations';

export default function SettingsScreen() {
  const { session, signOut, isDemoMode } = useAuth();
  const { isLeftHanded, setLeftHanded } = useLeftHanded();
  const { isDark, setDarkMode } = useThemeMode();
  const [enabledIds, setEnabledIds] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(ENABLED_KEY).then((raw) => {
      if (raw) {
        try {
          setEnabledIds(JSON.parse(raw) as string[]);
        } catch {
          setEnabledIds([]);
        }
      }
    });
  }, []);

  const toggleIntegration = useCallback(async (id: string) => {
    setEnabledIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      void AsyncStorage.setItem(ENABLED_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const displayName = session?.user.fullName ?? 'Analyst';
  const email = session?.user.email ?? '';

  const handleLogout = async () => {
    await signOut();
    router.replace('/login');
  };

  const categories = [...new Set(INTEGRATION_CATALOG.map((i) => i.category))] as IntegrationCategory[];

  return (
    <View className="flex-1 bg-light-gray">
      <ScreenHeader
        title="Profile & Settings"
        right={
          <Pressable onPress={() => router.back()}>
            <Text className="font-semibold text-navy">Done</Text>
          </Pressable>
        }
      />
      <ScrollView className="flex-1" contentContainerClassName="p-md pb-xl">
        <View className="mb-md rounded-md bg-white p-md shadow-sm">
          <Text className="mb-1 text-h2 text-navy">{displayName}</Text>
          <Text className="mb-1 text-body-small text-text-secondary">{email}</Text>
          {isDemoMode ? (
            <Text className="text-caption text-warning-amber">Demo authentication active</Text>
          ) : null}
        </View>

        <Text className="mb-sm text-h4 text-navy">Navigation & display</Text>
        <View className="mb-md rounded-md bg-white p-md shadow-sm">
          <SettingRow
            title="Dark Mode"
            subtitle="Use dark design tokens"
            value={isDark}
            onValueChange={setDarkMode}
          />
          <SettingRow
            title="Navigation bar on the right"
            subtitle="For left-handed use — reverses tab order and aligns nav to the right (mobile). Desktop sidebar flips in ResponsiveLayout."
            value={isLeftHanded}
            onValueChange={(v) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setLeftHanded(v);
            }}
          />
        </View>

        <Text className="mb-sm text-h4 text-navy">Integrations</Text>
        <Text className="mb-md text-body-small text-text-secondary">
          Connect property data, email, calendar, and meeting tools. Beta stores enablement locally; production
          will use OAuth and secure credential storage.
        </Text>
        {categories.map((category) => (
          <View key={category} className="mb-md">
            <Text className="mb-sm text-body-small font-semibold text-navy">
              {INTEGRATION_CATEGORY_LABELS[category]}
            </Text>
            {INTEGRATION_CATALOG.filter((i) => i.category === category).map((integration) => {
              const enabled = enabledIds.includes(integration.id);
              return (
                <View key={integration.id} className="mb-sm rounded-md bg-white p-md shadow-sm">
                  <View className="mb-1 flex-row flex-wrap items-center gap-2">
                    <Text className="flex-1 text-body-small font-bold text-text-primary">{integration.name}</Text>
                    <Badge label={integration.tier} variant={integration.tier === 'free' ? 'emerald' : 'gray'} />
                  </View>
                  <Text className="mb-md text-caption text-text-secondary">{integration.description}</Text>
                  {integration.fields.length > 0 ? (
                    <Text className="mb-sm text-micro text-text-secondary">
                      Configure: {integration.fields.map((f) => f.label).join(', ')}
                    </Text>
                  ) : null}
                  <View className="flex-row items-center justify-between">
                    <Switch
                      value={enabled}
                      onValueChange={() => toggleIntegration(integration.id)}
                      trackColor={{ true: colors.emeraldLight, false: colors.mediumGray }}
                    />
                    <Text className="text-caption text-text-secondary">{enabled ? 'Enabled' : 'Off'}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        ))}

        <PrimaryButton title="Log Out" onPress={handleLogout} />
      </ScrollView>
    </View>
  );
}

function SettingRow({
  title,
  subtitle,
  value,
  onValueChange,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View className="mb-md flex-row items-center justify-between border-b border-light-gray pb-md last:mb-0 last:border-0 last:pb-0">
      <View className="mr-md flex-1">
        <Text className="text-h4 text-text-primary">{title}</Text>
        <Text className="mt-1 text-body-small text-text-secondary">{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.mediumGray, true: colors.emeraldLight }}
      />
    </View>
  );
}
