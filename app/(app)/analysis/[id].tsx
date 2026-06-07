import { AnalyzeFlowChrome } from '@/components/analyzer/AnalyzeFlowChrome';
import { DealStateDropdown } from '@/components/deals/DealStateDropdown';
import { HeaderMetricPill } from '@/components/deals/HeaderMetricPill';
import { ActionButton } from '@/components/ui/ActionButton';
import { Badge } from '@/components/ui/Badge';
import { colors, layout, shadows } from '@/constants/theme';
import {
  createAnalysisFollowUp,
  ensureDealForAnalysis,
  findDealIdByAnalysisId,
  findDealIdByAnalysisIdLive,
  findDealIdByPropertyIdLive,
  getAnalysisById,
  getApiErrorMessage,
} from '@/services/api';
import { useDealState } from '@/hooks/useDealState';
import type { DealStatus } from '@/types/index';
import type { AnalysisResult } from '@/types/analysis';
import { formatRuleEngineScoreLabel } from '@/utils/ruleEngineDisplay';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const WIDE_LAYOUT_MIN_WIDTH = 768;

const recColors = {
  BUY: colors.emerald,
  NEGOTIATE: colors.warningAmber,
  HOLD: colors.navy,
  PASS: colors.alertRed,
};

function scoreColorForValue(score: number): string {
  if (score >= 70) return colors.emerald;
  if (score >= 50) return colors.warningAmber;
  return colors.alertRed;
}

function scoreBadgeVariant(score: number): 'emerald' | 'amber' | 'red' {
  if (score >= 70) return 'emerald';
  if (score >= 50) return 'amber';
  return 'red';
}

function parseAddressFromInput(addressLine: string) {
  const match = addressLine.match(/^(.+),\s*(.+),\s*(\w{2})\s+(\d{5}(?:-\d{4})?)$/);
  if (match) {
    return { address: match[1], city: match[2], state: match[3], zip: match[4] };
  }
  return { address: addressLine, city: '', state: '', zip: '' };
}

function dealDisplayId(dealId: string) {
  return dealId.replace(/-/g, '').slice(0, 8).toUpperCase();
}

export default function AnalysisResultScreen() {
  const { id, propertyType: typeParam, propertyId: propertyIdParam } = useLocalSearchParams<{
    id: string;
    propertyType?: string;
    propertyId?: string;
  }>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWide = width >= WIDE_LAYOUT_MIN_WIDTH;
  const queryClient = useQueryClient();
  const [expandedRule, setExpandedRule] = useState<string | null>(null);
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [startDealLoading, setStartDealLoading] = useState(false);
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
    if (!id) return;
    const mockId = findDealIdByAnalysisId(id);
    if (mockId) {
      setLinkedDealId(mockId);
      return;
    }
    void (async () => {
      const byAnalysis = await findDealIdByAnalysisIdLive(id);
      if (byAnalysis) {
        setLinkedDealId(byAnalysis);
        return;
      }
      if (propertyIdParam) {
        const byProperty = await findDealIdByPropertyIdLive(propertyIdParam);
        if (byProperty) setLinkedDealId(byProperty);
      }
    })();
  }, [id, propertyIdParam]);

  const resolveDeal = async () => {
    if (!analysis) throw new Error('Analysis not loaded');
    return ensureDealForAnalysis({
      analysis,
      propertyId: propertyIdParam,
      propertyType,
      dealId: linkedDealId,
    });
  };

  const handleFollowUp = async () => {
    if (!analysis) return;
    setFollowUpLoading(true);
    setActionMessage(null);
    try {
      const { deal } = await createAnalysisFollowUp(analysis, {
        dealId: linkedDealId,
        propertyId: propertyIdParam,
        propertyType,
      });
      setLinkedDealId(deal.id);
      setDealState(deal.status);
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      await queryClient.invalidateQueries({ queryKey: ['deals'] });
      await queryClient.invalidateQueries({ queryKey: ['deal', deal.id] });
      const num = dealDisplayId(deal.id);
      setActionMessage(
        `Follow-up task created. Deal ${num} is linked — view it on Tasks or Deal Detail.`,
      );
    } catch (err) {
      setActionMessage(getApiErrorMessage(err, 'Could not create the follow-up task.'));
    } finally {
      setFollowUpLoading(false);
    }
  };

  const handleStartDealProcess = async () => {
    if (!analysis) return;
    setStartDealLoading(true);
    setActionMessage(null);
    try {
      const deal = await resolveDeal();
      setLinkedDealId(deal.id);
      setDealState(deal.status);
      await queryClient.invalidateQueries({ queryKey: ['deals'] });
      await queryClient.invalidateQueries({ queryKey: ['deal', deal.id] });
      router.push(`/(app)/deal/${deal.id}`);
    } catch (err) {
      setActionMessage(getApiErrorMessage(err, 'Could not open Deal Detail.'));
    } finally {
      setStartDealLoading(false);
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
  const scoreColor = scoreColorForValue(analysis.score);

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
          label={formatRuleEngineScoreLabel(analysis.recommendation, analysis.score)}
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
        <View style={{ flexDirection: isWide ? 'row' : 'column', gap: 12, alignItems: 'stretch' }}>
          <RecommendationColumn analysis={analysis} recColor={recColor} isWide={isWide} />
          <TriggeredRulesColumn
            analysis={analysis}
            scoreColor={scoreColor}
            expandedRule={expandedRule}
            onToggleRule={(ruleId) =>
              setExpandedRule(expandedRule === ruleId ? null : ruleId)
            }
            isWide={isWide}
          />
        </View>

        <InsightsRow analysis={analysis} isWide={isWide} />

        <NextActionsPanel
          actionMessage={actionMessage}
          followUpLoading={followUpLoading}
          startDealLoading={startDealLoading}
          onFollowUp={() => void handleFollowUp()}
          onStartDealProcess={() => void handleStartDealProcess()}
          isWide={isWide}
          linkedDealId={linkedDealId}
        />

        <View style={{ height: insets.bottom + layout.bottomNavHeight + 16 }} />
      </ScrollView>
    </View>
  );
}

function RecommendationColumn({
  analysis,
  recColor,
  isWide,
}: {
  analysis: AnalysisResult;
  recColor: string;
  isWide: boolean;
}) {
  return (
    <View style={{ flex: isWide ? 1 : undefined, minWidth: isWide ? 0 : undefined }}>
      <View className="rounded-md p-lg" style={{ backgroundColor: recColor, ...shadows.sm }}>
        <Text className="text-h2 font-bold text-white">RECOMMENDATION: {analysis.recommendation}</Text>
        <Text className="mt-2 text-body-small text-white opacity-95">{analysis.reasoning}</Text>
        {analysis.dscr > 0 ? (
          <Text className="mt-3 text-caption font-semibold text-white">
            DSCR {analysis.dscr.toFixed(2)}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

/** Option A: score aligned with rules column header — not duplicated in a separate card. */
function TriggeredRulesColumn({
  analysis,
  scoreColor,
  expandedRule,
  onToggleRule,
  isWide,
}: {
  analysis: AnalysisResult;
  scoreColor: string;
  expandedRule: string | null;
  onToggleRule: (ruleId: string) => void;
  isWide: boolean;
}) {
  return (
    <View
      style={{
        flex: isWide ? 1 : undefined,
        minWidth: isWide ? 0 : undefined,
        maxHeight: isWide ? 420 : undefined,
      }}
    >
      <View className="mb-md flex-row items-center justify-between gap-2">
        <Text className="text-h4 text-navy">Triggered Rules</Text>
        <View
          className="flex-row items-center gap-2 rounded-md px-3 py-2"
          style={{ backgroundColor: colors.white, ...shadows.sm }}
        >
          <Text className="text-caption font-semibold text-text-secondary">Score</Text>
          <Text className="text-h2 font-bold" style={{ color: scoreColor }}>
            {Math.round(analysis.score)}
          </Text>
          <Badge
            label={analysis.recommendation}
            variant={scoreBadgeVariant(analysis.score)}
          />
        </View>
      </View>

      <ScrollView
        style={isWide ? { maxHeight: 340 } : undefined}
        nestedScrollEnabled
        showsVerticalScrollIndicator={isWide}
      >
        {analysis.triggeredRules.map((rule) => (
          <Pressable
            key={rule.id}
            className="mb-sm rounded-md bg-white p-md shadow-sm"
            onPress={() => onToggleRule(rule.id)}
          >
            <View className="flex-row items-center justify-between">
              <Text className="mr-2 flex-1 text-body-small font-bold text-text-primary">{rule.name}</Text>
              <Badge label={`+${rule.impact}`} variant="emerald" />
            </View>
            {expandedRule === rule.id ? (
              <Text className="mt-2 text-body-small text-text-secondary">{rule.detail}</Text>
            ) : null}
          </Pressable>
        ))}
        {analysis.triggeredRules.length === 0 ? (
          <Text className="text-body-small text-text-secondary">No rules triggered for this property.</Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

function InsightsRow({ analysis, isWide }: { analysis: AnalysisResult; isWide: boolean }) {
  if (analysis.risks.length === 0 && analysis.opportunities.length === 0) return null;

  return (
    <View className="mt-lg" style={{ flexDirection: isWide ? 'row' : 'column', gap: 12 }}>
      {analysis.risks.length > 0 ? (
        <View style={{ flex: isWide ? 1 : undefined }}>
          <Text className="mb-md text-h4 text-alert-red">Risk Factors</Text>
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
        </View>
      ) : null}
      {analysis.opportunities.length > 0 ? (
        <View style={{ flex: isWide ? 1 : undefined }}>
          <Text className="mb-md text-h4 text-emerald">Opportunities</Text>
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
        </View>
      ) : null}
    </View>
  );
}

function NextActionsPanel({
  actionMessage,
  followUpLoading,
  startDealLoading,
  onFollowUp,
  onStartDealProcess,
  isWide,
  linkedDealId,
}: {
  actionMessage: string | null;
  followUpLoading: boolean;
  startDealLoading: boolean;
  onFollowUp: () => void;
  onStartDealProcess: () => void;
  isWide: boolean;
  linkedDealId: string | null;
}) {
  return (
    <View
      className="mt-lg rounded-md border-2 border-medium-gray bg-white p-md"
      style={[shadows.sm, { borderColor: colors.mediumGray }]}
    >
      <Text className="mb-sm text-h4 text-navy">Next actions</Text>
      <Text className="mb-md text-caption text-text-secondary">
        Start the deal process to review documents and deal state, or add a follow-up task when you need
        more time before deciding.
      </Text>
      {actionMessage ? (
        <View className="mb-md rounded-sm bg-light-gray p-md">
          <Text className="text-body-small text-navy">{actionMessage}</Text>
          {actionMessage.includes('Deal Detail') || linkedDealId ? (
            <Pressable
              className="mt-2"
              onPress={() =>
                linkedDealId ? router.push(`/(app)/deal/${linkedDealId}`) : undefined
              }
            >
              <Text className="text-body-small font-semibold text-emerald">Open Deal Detail →</Text>
            </Pressable>
          ) : null}
          {actionMessage.includes('Follow-up') ? (
            <Pressable className="mt-2" onPress={() => router.push('/(app)/(tabs)/tasks')}>
              <Text className="text-body-small font-semibold text-emerald">View Tasks →</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      <View style={{ flexDirection: isWide ? 'row' : 'column', gap: 10 }}>
        <View style={{ flex: isWide ? 1 : undefined }}>
          <ActionButton
            title="Start Deal Process"
            variant="primary"
            onPress={onStartDealProcess}
            loading={startDealLoading}
            disabled={followUpLoading}
            style={{ width: '100%' }}
          />
        </View>
        <View style={{ flex: isWide ? 1 : undefined }}>
          <ActionButton
            title="Follow-Up"
            variant="outline"
            onPress={onFollowUp}
            loading={followUpLoading}
            disabled={startDealLoading}
            style={{ width: '100%' }}
          />
        </View>
      </View>
    </View>
  );
}
