import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { KPICard } from '@/components/KPICard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors, layout, shadows } from '@/constants/theme';
import {
  getAttomMonthlySpend,
  getPortfolioHoldings,
  importPortfolioRows,
  removeDealFromPortfolio,
} from '@/services/api';
import { PORTFOLIO_CSV_TEMPLATE, parsePortfolioCsv } from '@/utils/portfolioCsv';
import type { PortfolioHolding } from '@/types/portfolio';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

function HoldingCard({
  holding,
  onRemove,
}: {
  holding: PortfolioHolding;
  onRemove: (dealId: string) => void;
}) {
  return (
    <Pressable
      onPress={() => router.push(`/(app)/deal/${holding.dealId}`)}
      className="mb-md rounded-md bg-white p-md"
      style={[shadows.sm, { borderLeftWidth: 4, borderLeftColor: colors.emerald }]}
    >
      <Text className="text-h4 text-text-primary">
        {holding.address}, {holding.city}, {holding.state}
      </Text>
      <Text className="mt-1 text-body font-bold text-navy">
        ${(holding.value / 1_000_000).toFixed(2)}M · {holding.capRate.toFixed(1)}% cap
      </Text>
      <Text className="mt-1 text-caption text-text-secondary">
        NOI ${(holding.noi / 1000).toFixed(0)}K
        {holding.recommendation ? ` · ${holding.recommendation} ${holding.score ?? ''}` : ''}
      </Text>
      <Pressable
        onPress={() => onRemove(holding.dealId)}
        className="mt-2 self-start"
        accessibilityLabel="Remove from portfolio"
      >
        <Text className="text-caption font-semibold text-alert-red">Remove from portfolio</Text>
      </Pressable>
    </Pressable>
  );
}

export default function PortfolioScreen() {
  const queryClient = useQueryClient();
  const [csvText, setCsvText] = useState('');
  const [showImport, setShowImport] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['portfolio', 'holdings'],
    queryFn: getPortfolioHoldings,
  });

  const { data: attomSpend } = useQuery({
    queryKey: ['attom', 'monthly-spend'],
    queryFn: getAttomMonthlySpend,
    retry: false,
  });

  const removeMutation = useMutation({
    mutationFn: removeDealFromPortfolio,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      void queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });

  const importMutation = useMutation({
    mutationFn: importPortfolioRows,
    onSuccess: (result) => {
      setCsvText('');
      setShowImport(false);
      void queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      Alert.alert('Import complete', result.message);
    },
    onError: (error: Error) => {
      Alert.alert('Import failed', error.message);
    },
  });

  const handleImport = () => {
    try {
      const rows = parsePortfolioCsv(csvText.trim() || PORTFOLIO_CSV_TEMPLATE);
      importMutation.mutate(rows);
    } catch (error) {
      Alert.alert('Invalid CSV', error instanceof Error ? error.message : 'Could not parse CSV');
    }
  };

  const summary = data?.summary;
  const holdings = data?.holdings ?? [];

  return (
    <View className="flex-1 bg-light-gray">
      <ScreenHeader title="Portfolio" />
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-md"
        style={{ paddingBottom: layout.bottomNavHeight + 24 }}
      >
        <Text className="mb-1 text-body-small text-text-secondary">
          Approved and closed holdings in one place. Add deals from Deal Detail or import CSV.
        </Text>

        {attomSpend ? (
          <View className="mb-md rounded-md bg-white p-md shadow-sm">
            <Text className="text-h4 text-navy">ATTOM API usage (this month)</Text>
            <Text className="mt-1 text-body-small text-text-secondary">
              {attomSpend.callCount} live calls · ${attomSpend.estimatedCost.toFixed(2)} estimated ·{' '}
              {attomSpend.percentUsed.toFixed(0)}% of ${attomSpend.budget} budget
            </Text>
            <View className="mt-2 h-2 overflow-hidden rounded-full bg-light-gray">
              <View
                className="h-full rounded-full bg-navy"
                style={{ width: `${Math.min(100, attomSpend.percentUsed)}%` }}
              />
            </View>
            <Text className="mt-1 text-caption text-text-secondary">
              ${attomSpend.budgetRemaining.toFixed(2)} remaining
            </Text>
          </View>
        ) : null}

        {isLoading ? (
          <ActivityIndicator color={colors.navy} className="my-lg" />
        ) : isError ? (
          <View className="mb-lg rounded-md bg-white p-md">
            <Text className="text-center text-body-small text-text-secondary">
              Could not load portfolio. Run the latest Supabase migration and confirm the backend is running.
            </Text>
            <Text
              className="mt-2 text-center text-body-small font-semibold text-navy"
              onPress={() => void refetch()}
            >
              Retry
            </Text>
          </View>
        ) : summary ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-lg">
            <KPICard label="Holdings" value={String(summary.count)} />
            <KPICard label="Total AUM" value={`$${(summary.totalAum / 1_000_000).toFixed(1)}M`} />
            <KPICard label="Total NOI" value={`$${(summary.totalNoi / 1000).toFixed(0)}K`} />
            <KPICard label="Avg Cap Rate" value={`${summary.avgCapRate.toFixed(1)}%`} />
          </ScrollView>
        ) : null}

        <View className="mb-md flex-row gap-2">
          <View className="flex-1">
            <PrimaryButton
              title={showImport ? 'Hide import' : 'Import CSV'}
              variant="secondary"
              onPress={() => setShowImport((value) => !value)}
            />
          </View>
        </View>

        {showImport ? (
          <View className="mb-lg rounded-md bg-white p-md shadow-sm">
            <Text className="mb-2 text-body-small font-semibold text-navy">Paste CSV rows</Text>
            <Text className="mb-2 text-caption text-text-secondary">
              Header row optional. Required: address, city, state, zip, income, expenses, cap_rate.
            </Text>
            <TextInput
              className="min-h-[120px] rounded-sm border border-medium-gray bg-white p-3 text-body-small font-mono"
              multiline
              value={csvText}
              onChangeText={setCsvText}
              placeholder={PORTFOLIO_CSV_TEMPLATE}
              placeholderTextColor={colors.darkGray}
            />
            <View className="mt-3">
              <PrimaryButton
                title={importMutation.isPending ? 'Importing…' : 'Import holdings'}
                onPress={handleImport}
                disabled={importMutation.isPending}
              />
            </View>
          </View>
        ) : null}

        <Text className="mb-md text-h4 text-navy">My Portfolio</Text>
        {holdings.length === 0 ? (
          <View className="rounded-md bg-white p-lg">
            <Text className="text-center text-body-small text-text-secondary">
              No holdings yet. Approve a deal and tap Add to Portfolio on Deal Detail, or import CSV above.
            </Text>
          </View>
        ) : (
          holdings.map((item) => (
            <HoldingCard
              key={item.dealId}
              holding={item}
              onRemove={(dealId) => removeMutation.mutate(dealId)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}
