import { BarChart } from '@/components/charts/BarChart';
import { FloatingActionButton } from '@/components/layout/FloatingActionButton';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { KPICard } from '@/components/KPICard';
import { SETTINGS_HREF } from '@/constants/navigation';
import { colors } from '@/constants/theme';
import {
  getCapRateDistribution,
  getPortfolioKPIs,
  getRecentActivity,
} from '@/services/api';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

const activityIcons = {
  deal: '📋',
  analysis: '📊',
  rule: '⚠️',
  task: '✓',
  closed: '✅',
};

export default function DashboardScreen() {
  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['portfolio', 'kpis'],
    queryFn: getPortfolioKPIs,
  });
  const { data: activity = [] } = useQuery({
    queryKey: ['portfolio', 'activity'],
    queryFn: getRecentActivity,
  });
  const { data: chartData = [] } = useQuery({
    queryKey: ['portfolio', 'cap-rate-chart'],
    queryFn: getCapRateDistribution,
  });

  return (
    <View className="flex-1 bg-light-gray">
      <ScreenHeader
        title="Dashboard"
        right={
          <Pressable onPress={() => router.push(SETTINGS_HREF)} accessibilityLabel="Profile and Settings">
            <Text className="text-body-small font-semibold text-navy">Settings</Text>
          </Pressable>
        }
      />
      <ScrollView className="flex-1" contentContainerClassName="pb-28 p-md">
        <Text className="mb-1 text-h3 text-navy">Good Evening, Nancy</Text>
        <Text className="mb-lg text-body-small text-text-secondary">
          Portfolio overview as of May 18, 2026
        </Text>

        {kpisLoading ? (
          <ActivityIndicator color={colors.navy} className="my-lg" />
        ) : kpis ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-lg">
            <KPICard
              label="Total AUM"
              value={`$${(kpis.totalAum / 1_000_000).toFixed(1)}M`}
              delta={kpis.aumChange}
            />
            <KPICard
              label="Avg Cap Rate"
              value={`${kpis.avgCapRate.toFixed(1)}%`}
              delta={kpis.capRateChange}
            />
            <KPICard
              label="Active Deals"
              value={String(kpis.activeDeals)}
              delta={kpis.dealsChange}
            />
            <KPICard
              label="Pending Tasks"
              value={String(kpis.pendingTasks)}
              delta={kpis.tasksChange}
            />
          </ScrollView>
        ) : null}

        <Text className="mb-md text-h4 text-navy">Recent Activity</Text>
        <View className="mb-lg rounded-md bg-white p-md shadow-sm">
          {activity.map((item) => (
            <View key={item.id} className="mb-3 flex-row items-start gap-3 border-b border-light-gray pb-3 last:mb-0 last:border-0">
              <Text className="text-lg">{activityIcons[item.icon]}</Text>
              <View className="flex-1">
                <Text className="text-body-small text-text-primary">{item.message}</Text>
                <Text className="mt-0.5 text-caption text-text-secondary">{item.timestamp}</Text>
              </View>
            </View>
          ))}
        </View>

        {chartData.length > 0 ? <BarChart data={chartData} /> : null}
      </ScrollView>
      <FloatingActionButton onPress={() => router.push('/(app)/(tabs)/analyze')} />
    </View>
  );
}
