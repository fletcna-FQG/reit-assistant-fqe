import { LineChart } from '@/components/charts/LineChart';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Badge } from '@/components/ui/Badge';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors, shadows } from '@/constants/theme';
import { getDeal } from '@/services/api';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TABS = ['Overview', 'Financials', 'Documents', 'Analysis', 'Tasks'] as const;

export default function DealDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('Overview');
  const insets = useSafeAreaInsets();

  const { data: deal, isLoading } = useQuery({
    queryKey: ['deal', id],
    queryFn: () => getDeal(id!),
    enabled: Boolean(id),
  });

  if (isLoading || !deal) {
    return (
      <View className="flex-1 items-center justify-center bg-light-gray">
        <ActivityIndicator color={colors.navy} size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-light-gray">
      <ScreenHeader
        title="Deal Detail"
        right={
          <Pressable onPress={() => router.back()}>
            <Text className="text-body font-semibold text-navy">Back</Text>
          </Pressable>
        }
      />
      <ScrollView className="flex-1" contentContainerClassName="pb-32">
        <View className="bg-navy p-md">
          <Text className="text-h2 text-white">
            {deal.address}, {deal.city}, {deal.state} {deal.zip}
          </Text>
          <View className="mt-2 flex-row gap-2">
            <Badge label={`${deal.capRate}% Cap`} variant="emerald" />
            <Badge label={deal.status} variant="navy" />
          </View>
        </View>

        <View className="flex-row border-b border-medium-gray bg-white">
          {TABS.map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              className="flex-1 items-center py-3"
              style={{
                borderBottomWidth: activeTab === tab ? 3 : 0,
                borderBottomColor: colors.navy,
              }}
            >
              <Text
                className="text-caption font-semibold"
                style={{ color: activeTab === tab ? colors.navy : colors.textSecondary }}
              >
                {tab}
              </Text>
            </Pressable>
          ))}
        </View>

        <View className="p-md">
          {activeTab === 'Overview' ? (
            <>
              <View className="mb-lg flex-row flex-wrap gap-2">
                <MetricBox label="Purchase" value={`$${(deal.purchasePrice / 1e6).toFixed(1)}M`} />
                <MetricBox label="NOI" value={`$${(deal.noi / 1000).toFixed(0)}K`} />
                <MetricBox label="Occupancy" value={`${deal.occupancy}%`} />
                <MetricBox label="DSCR" value={deal.dscr.toFixed(2)} />
              </View>
              <Text className="mb-md text-h4 text-navy">Timeline</Text>
              {deal.timeline.map((item, i) => (
                <View key={i} className="mb-md flex-row gap-3">
                  <View className="items-center">
                    <View
                      className="h-3 w-3 rounded-full"
                      style={{
                        backgroundColor:
                          item.status === 'completed'
                            ? colors.emerald
                            : item.status === 'active'
                              ? colors.navy
                              : colors.mediumGray,
                      }}
                    />
                    {i < deal.timeline.length - 1 ? (
                      <View className="mt-1 w-0.5 flex-1 bg-medium-gray" style={{ minHeight: 24 }} />
                    ) : null}
                  </View>
                  <View>
                    <Text className="text-body-small font-bold">{item.title}</Text>
                    <Text className="text-caption text-text-secondary">{item.date}</Text>
                  </View>
                </View>
              ))}
            </>
          ) : null}

          {activeTab === 'Financials' ? (
            <View className="rounded-md bg-white p-md shadow-sm">
              <Text className="mb-md text-h4 text-navy">NOI Trend</Text>
              <LineChart
                data={deal.financials.map((f) => ({ label: f.month, value: f.noi / 1000 }))}
              />
            </View>
          ) : null}

          {activeTab === 'Documents' ? (
            deal.documents.map((doc) => (
              <View
                key={doc.id}
                className="mb-sm flex-row items-center justify-between rounded-md bg-white p-md shadow-sm"
              >
                <Text className="text-body-small font-semibold text-text-primary">{doc.name}</Text>
                <Text className="text-caption text-text-secondary">{doc.size}</Text>
              </View>
            ))
          ) : null}

          {activeTab === 'Analysis' && deal.recommendation ? (
            <View className="rounded-md bg-emerald p-md">
              <Text className="text-h3 font-bold text-white">{deal.recommendation}</Text>
              <Text className="text-body-small text-white">Score: {deal.score}</Text>
            </View>
          ) : null}

          {activeTab === 'Tasks' ? (
            <Text className="text-body text-text-secondary">Deal tasks — linked in Phase 8</Text>
          ) : null}
        </View>
      </ScrollView>

      <View
        className="absolute bottom-0 left-0 right-0 flex-row gap-2 border-t border-medium-gray bg-white p-md"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <View className="flex-1">
          <PrimaryButton title="Approve" onPress={() => {}} />
        </View>
        <View className="flex-1">
          <PrimaryButton title="Reject" variant="secondary" onPress={() => {}} />
        </View>
      </View>
    </View>
  );
}

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-w-[45%] flex-1 rounded-sm bg-light-gray p-3">
      <Text className="text-micro uppercase text-text-secondary">{label}</Text>
      <Text className="text-h4 text-navy">{value}</Text>
    </View>
  );
}
