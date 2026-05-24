import { LineChart } from '@/components/charts/LineChart';
import { DealDocumentsPanel } from '@/components/deals/DealDocumentsPanel';
import { DealStateDropdown } from '@/components/deals/DealStateDropdown';
import { HeaderMetricPill } from '@/components/deals/HeaderMetricPill';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { DEAL_STATUS_LABELS } from '@/constants/deals';
import { colors, layout, shadows } from '@/constants/theme';
import { useDealState } from '@/hooks/useDealState';
import { getDeal, updateDealStatus } from '@/services/api';
import type { DealStatus } from '@/types/index';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TABS = ['Overview', 'Financials', 'Documents', 'Analysis'] as const;

function ruleEngineLabel(recommendation?: string, score?: number): string {
  if (recommendation && score != null) {
    return `Rule Engine: ${recommendation} (${score})`;
  }
  if (recommendation) return `Rule Engine: ${recommendation}`;
  return 'Rule Engine: Pending';
}

export default function DealDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('Overview');
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { setDealState } = useDealState();

  const { data: deal, isLoading } = useQuery({
    queryKey: ['deal', id],
    queryFn: () => getDeal(id!),
    enabled: Boolean(id),
  });

  const statusMutation = useMutation({
    mutationFn: (status: DealStatus) => updateDealStatus(id!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal', id] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });

  useEffect(() => {
    if (deal?.status) setDealState(deal.status);
  }, [deal?.status, setDealState]);

  if (isLoading || !deal) {
    return (
      <View className="flex-1 items-center justify-center bg-light-gray">
        <ActivityIndicator color={colors.navy} size="large" />
      </View>
    );
  }


  return (
    <View className="flex-1 bg-light-gray">
      <ScreenHeader title="Deal Detail" />

      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-xl"
        style={{ paddingBottom: insets.bottom + layout.bottomNavHeight + 80 }}
      >
        <View className="bg-navy p-md">
          <Text className="text-h2 text-white">
            {deal.address}, {deal.city}, {deal.state} {deal.zip}
          </Text>
          <Text className="mt-1 text-caption text-white opacity-80">
            {deal.propertyType} · {DEAL_STATUS_LABELS[deal.status]}
          </Text>
          <View className="mt-3 flex-row flex-wrap items-center gap-2">
            <HeaderMetricPill label={`${deal.capRate.toFixed(1)}% Cap Rate`} />
            <Pressable
              onPress={() => {
                if (deal.analysisId) {
                  router.push({
                    pathname: '/(app)/analysis/[id]',
                    params: { id: deal.analysisId, propertyType: deal.propertyType },
                  });
                }
              }}
              disabled={!deal.analysisId}
            >
              <HeaderMetricPill label={ruleEngineLabel(deal.recommendation, deal.score)} />
            </Pressable>
            <DealStateDropdown
              variant="header"
              dealId={deal.id}
              onUpdated={(status) => statusMutation.mutate(status)}
            />
          </View>
          {deal.analysisId ? (
            <Pressable className="mt-2" onPress={() => router.push(`/(app)/analysis/${deal.analysisId}`)}>
              <Text className="text-caption font-semibold text-emerald">View Rule Engine Results →</Text>
            </Pressable>
          ) : null}
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
                numberOfLines={1}
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
                <MetricBox label="Net Operating Income (NOI)" value={`$${(deal.noi / 1000).toFixed(0)}K`} />
                <MetricBox label="Occupancy" value={`${deal.occupancy}%`} />
                <MetricBox label="Debt Service Coverage (DSCR)" value={deal.dscr.toFixed(2)} />
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
              <Text className="mb-md text-h4 text-navy">Net Operating Income (NOI) trend</Text>
              <LineChart
                data={deal.financials.map((f) => ({ label: f.month, value: f.noi / 1000 }))}
              />
            </View>
          ) : null}

          {activeTab === 'Documents' ? <DealDocumentsPanel dealId={deal.id} documents={deal.documents} /> : null}

          {activeTab === 'Analysis' && deal.recommendation ? (
            <View className="rounded-md bg-emerald p-md">
              <Text className="text-h3 font-bold text-white">Rule Engine: {deal.recommendation}</Text>
              <Text className="mt-1 text-body-small text-white">Score: {deal.score}</Text>
              {deal.analysisId ? (
                <View className="mt-md">
                  <PrimaryButton
                    title="View Rule Engine Results"
                    variant="secondary"
                    onPress={() => router.push(`/(app)/analysis/${deal.analysisId}`)}
                  />
                </View>
              ) : null}
            </View>
          ) : null}
        </View>

        <View className="mx-md flex-row gap-2">
          <View className="flex-1">
            <PrimaryButton title="Approve" onPress={() => statusMutation.mutate('approved')} />
          </View>
          <View className="flex-1">
            <PrimaryButton title="Reject" variant="secondary" onPress={() => statusMutation.mutate('closed')} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-w-[45%] flex-1 rounded-sm bg-white p-3" style={shadows.sm}>
      <Text className="text-micro uppercase text-text-secondary">{label}</Text>
      <Text className="text-h4 text-navy">{value}</Text>
    </View>
  );
}
