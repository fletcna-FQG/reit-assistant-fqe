import { AnalyzeFlowChrome } from '@/components/analyzer/AnalyzeFlowChrome';
import { DealStateDropdown } from '@/components/deals/DealStateDropdown';
import { HeaderMetricPill } from '@/components/deals/HeaderMetricPill';
import { ScoreGauge } from '@/components/ScoreGauge';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Badge } from '@/components/ui/Badge';
import { colors, layout, shadows } from '@/constants/theme';
import {
  addAnalysisToPortfolio,
  findDealIdByAnalysisId,
  getAnalysisById,
  requestAnalysisInfo,
} from '@/services/api';
import { useDealState } from '@/hooks/useDealState';
import type { DealStatus } from '@/types/index';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const recColors = {
  BUY: colors.emerald,
  NEGOTIATE: colors.warningAmber,
  HOLD: colors.navy,
  PASS: colors.alertRed,
};

function parseAddressFromInput(addressLine: string) {
  const match = addressLine.match(/^(.+),\s*(.+),\s*(\w{2})\s+(\d{5}(?:-\d{4})?)$/);
  if (match) {
    return { address: match[1], city: match[2], state: match[3], zip: match[4] };
  }
  return { address: addressLine, city: '', state: '', zip: '' };
}

export default function AnalysisResultScreen() {
  const { id, propertyType: typeParam } = useLocalSearchParams<{ id: string; propertyType?: string }>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [expandedRule, setExpandedRule] = useState<string | null>(null);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [linkedDealId, setLinkedDealId] = useState<string | null>(null);
  const { setDealState } = useDealState();

  const { data: analysis, isLoading } = useQuery({
    queryKey: ['analysis', id],
    queryFn: () => getAnalysisById(id!),
    enabled: Boolean(id),
  });

  const propertyType = typeParam ?? analysis?.input.propertyType ?? 'Homes';
  const location = analysis ? parseAddressFromInput(analysis.input.address) : null;
  const dealId = linkedDealId ?? (id ? findDealIdByAnalysisId(id) : null);

  useEffect(() => {
    if (id) setLinkedDealId(findDealIdByAnalysisId(id));
  }, [id]);

  const handleAddToPortfolio = async () => {
    if (!analysis) return;
    setPortfolioLoading(true);
    setActionMessage(null);
    try {
      const deal = await addAnalysisToPortfolio(analysis, propertyType);
      setLinkedDealId(deal.id);
      setDealState(deal.status);
      await queryClient.invalidateQueries({ queryKey: ['deals'] });
      setActionMessage(`${deal.address} was added to your Deals pipeline.`);
    } catch {
      setActionMessage('Could not add to portfolio. Please try again.');
    } finally {
      setPortfolioLoading(false);
    }
  };

  const handleRequestInfo = async () => {
    if (!analysis) return;
    setRequestLoading(true);
    setActionMessage(null);
    try {
      const task = await requestAnalysisInfo(analysis);
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setActionMessage(`Request sent — task assigned to ${task.assignee}.`);
    } catch {
      setActionMessage('Could not send the information request.');
    } finally {
      setRequestLoading(false);
    }
  };

  if (isLoading || !analysis) {
    return (
      <View className="flex-1 items-center justify-center bg-light-gray">
        <ActivityIndicator color={colors.navy} size="large" />
      </View>
    );
  }

  const recColor = recColors[analysis.recommendation];

  return (
    <View className="flex-1 bg-light-gray">
      <AnalyzeFlowChrome
        title="Rule Engine Results"
        currentStep={6}
        context={
          location
            ? {
                address: location.address,
                city: location.city,
                state: location.state,
                zip: location.zip,
                propertyType,
              }
            : undefined
        }
      />

      <View className="flex-row flex-wrap items-center gap-2 bg-navy px-md py-2">
        <HeaderMetricPill
          label={`Rule Engine: ${analysis.recommendation} (${analysis.score})`}
        />
        <DealStateDropdown
          variant="header"
          dealId={dealId}
          onUpdated={(status: DealStatus) => setDealState(status)}
        />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="p-md pt-md"
        style={{ flex: 1 }}
      >
        <View className="mb-lg items-center rounded-md p-lg" style={{ backgroundColor: recColor }}>
          <Text className="text-h2 font-bold text-white">
            RECOMMENDATION: {analysis.recommendation}
          </Text>
          <Text className="mt-2 text-center text-body-small text-white">{analysis.reasoning}</Text>
        </View>

        <View className="mb-lg items-center rounded-md bg-white p-lg shadow-sm">
          <ScoreGauge score={analysis.score} />
        </View>

        <Text className="mb-md text-h4 text-navy">Triggered Rules</Text>
        {analysis.triggeredRules.map((rule) => (
          <Pressable
            key={rule.id}
            className="mb-sm rounded-md bg-white p-md shadow-sm"
            onPress={() => setExpandedRule(expandedRule === rule.id ? null : rule.id)}
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-body-small font-bold text-text-primary">{rule.name}</Text>
              <Badge label={`+${rule.impact}`} variant="emerald" />
            </View>
            {expandedRule === rule.id ? (
              <Text className="mt-2 text-body-small text-text-secondary">{rule.detail}</Text>
            ) : null}
          </Pressable>
        ))}

        {analysis.risks.length > 0 ? (
          <>
            <Text className="mb-md mt-lg text-h4 text-alert-red">Risk Factors</Text>
            {analysis.risks.map((r) => (
              <View
                key={r.id}
                className="mb-sm rounded-md border-l-4 border-alert-red bg-white p-md"
                style={shadows.sm}
              >
                <Text className="text-body-small font-bold text-alert-red">{r.title}</Text>
                <Text className="mt-1 text-body-small text-text-secondary">{r.description}</Text>
              </View>
            ))}
          </>
        ) : null}

        {analysis.opportunities.length > 0 ? (
          <>
            <Text className="mb-md mt-lg text-h4 text-emerald">Opportunities</Text>
            {analysis.opportunities.map((o) => (
              <View
                key={o.id}
                className="mb-sm rounded-md border-l-4 border-emerald bg-white p-md"
                style={shadows.sm}
              >
                <Text className="text-body-small font-bold text-emerald">{o.title}</Text>
                <Text className="mt-1 text-body-small text-text-secondary">{o.description}</Text>
              </View>
            ))}
          </>
        ) : null}

        <View className="mt-xl rounded-md bg-white p-md shadow-sm">
          <Text className="mb-sm text-h4 text-navy">Next actions</Text>
          <Text className="mb-md text-caption text-text-secondary">
            Add this property to your portfolio or request more information from your analyst team.
          </Text>
          {actionMessage ? (
            <View className="mb-md rounded-sm bg-light-gray p-md">
              <Text className="text-body-small text-navy">{actionMessage}</Text>
              {actionMessage.includes('Deals pipeline') ? (
                <Pressable className="mt-2" onPress={() => router.push('/(app)/(tabs)/deals')}>
                  <Text className="text-body-small font-semibold text-emerald">View Deals →</Text>
                </Pressable>
              ) : null}
              {actionMessage.includes('task assigned') ? (
                <Text className="mt-2 text-body-small text-text-secondary">
                  Your analyst team has been notified.
                </Text>
              ) : null}
            </View>
          ) : null}
          <PrimaryButton
            title="Add to Portfolio"
            onPress={() => void handleAddToPortfolio()}
            loading={portfolioLoading}
            disabled={requestLoading}
          />
          <PrimaryButton
            title="Request Info"
            variant="secondary"
            onPress={() => void handleRequestInfo()}
            loading={requestLoading}
            disabled={portfolioLoading}
          />
        </View>

        <View style={{ height: insets.bottom + layout.bottomNavHeight + 16 }} />
      </ScrollView>
    </View>
  );
}
