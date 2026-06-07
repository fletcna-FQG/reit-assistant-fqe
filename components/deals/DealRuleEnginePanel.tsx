import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { RULES_ENGINE_MESSAGES } from '@/constants/financialLabels';
import { colors } from '@/constants/theme';
import {
  analyzeProperty,
  getApiErrorMessage,
  propertyApi,
  propertyRecordToAnalysisInput,
} from '@/services/api';
import { getPropertyMeta } from '@/utils/propertyMetaStorage';
import type { DealDetail } from '@/types/deal';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';

type DealRuleEnginePanelProps = {
  deal: DealDetail;
  dealId: string;
  variant?: 'header' | 'tab';
};

export function DealRuleEnginePanel({ deal, dealId, variant = 'tab' }: DealRuleEnginePanelProps) {
  const queryClient = useQueryClient();
  const hasResults = Boolean(
    deal.recommendation && (deal.analysisId || deal.score != null),
  );

  const runMutation = useMutation({
    mutationFn: async () => {
      if (!deal.propertyId) {
        throw new Error('This deal is not linked to a property record.');
      }
      const { property } = await propertyApi.getProperty(deal.propertyId);
      const meta = await getPropertyMeta(deal.propertyId);
      const input = propertyRecordToAnalysisInput(property, deal.propertyType, meta ?? undefined);
      return analyzeProperty(input, { propertyId: deal.propertyId });
    },
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ['deal', dealId] });
      void queryClient.invalidateQueries({ queryKey: ['deals'] });
      void queryClient.invalidateQueries({ queryKey: ['portfolio', 'kpis'] });
      router.push({
        pathname: '/(app)/analysis/[id]',
        params: {
          id: result.id,
          propertyType: deal.propertyType,
          propertyId: deal.propertyId ?? '',
        },
      });
    },
  });

  const errorMessage = runMutation.error
    ? getApiErrorMessage(runMutation.error, 'REIT Rules Engine failed')
    : null;

  if (variant === 'header') {
    if (hasResults) {
      return (
        <PrimaryButton
          title={RULES_ENGINE_MESSAGES.runAgain}
          variant="secondary"
          onPress={() => runMutation.mutate()}
          loading={runMutation.isPending}
        />
      );
    }

    return (
      <PrimaryButton
        title="Run Rules Engine"
        onPress={() => runMutation.mutate()}
        loading={runMutation.isPending}
      />
    );
  }

  return (
    <View
      className="rounded-md p-md"
      style={{
        backgroundColor: hasResults ? colors.emerald : colors.white,
        borderWidth: hasResults ? 0 : 1,
        borderColor: colors.mediumGray,
      }}
    >
      {hasResults ? (
        <>
          <Text className="text-h3 font-bold text-white">Rule Engine: {deal.recommendation}</Text>
          <Text className="mt-1 text-body-small text-white">Score: {deal.score}</Text>
          {deal.analysisId ? (
            <View className="mt-md gap-2">
              <PrimaryButton
                title="View Rule Engine Results"
                variant="secondary"
                onPress={() =>
                  router.push({
                    pathname: '/(app)/analysis/[id]',
                    params: {
                      id: deal.analysisId!,
                      propertyType: deal.propertyType,
                      propertyId: deal.propertyId ?? '',
                    },
                  })
                }
              />
              <PrimaryButton
                title={RULES_ENGINE_MESSAGES.runAgain}
                variant="secondary"
                onPress={() => runMutation.mutate()}
                loading={runMutation.isPending}
              />
            </View>
          ) : null}
        </>
      ) : (
        <>
          <Text className="text-h4 text-navy">Rule Engine: Pending</Text>
          <Text className="mt-1 text-body-small text-text-secondary">
            Run the REIT Rules Engine against this property to generate a score and recommendation.
          </Text>
          {!deal.propertyId ? (
            <Text className="mt-md text-body-small text-alert-red">
              No property is linked to this deal — save the property from Analyze first.
            </Text>
          ) : runMutation.isPending ? (
            <View className="mt-md flex-row items-center gap-2">
              <ActivityIndicator color={colors.navy} />
              <Text className="text-body-small text-text-secondary">{RULES_ENGINE_MESSAGES.running}</Text>
            </View>
          ) : (
            <View className="mt-md gap-2">
              <PrimaryButton title="Run Rules Engine" onPress={() => runMutation.mutate()} />
              <PrimaryButton
                title="Open Property Summary"
                variant="secondary"
                onPress={() =>
                  router.push({
                    pathname: '/(app)/property/[id]',
                    params: { id: deal.propertyId!, propertyType: deal.propertyType },
                  })
                }
              />
            </View>
          )}
        </>
      )}

      {errorMessage ? (
        <Text className="mt-md text-body-small text-alert-red">{errorMessage}</Text>
      ) : null}
    </View>
  );
}
