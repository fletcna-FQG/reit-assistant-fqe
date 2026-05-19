import { ScoreGauge } from '@/components/ScoreGauge';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Badge } from '@/components/ui/Badge';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors, shadows } from '@/constants/theme';
import { getAnalysisById } from '@/services/api';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const recColors = {
  BUY: colors.emerald,
  NEGOTIATE: colors.warningAmber,
  HOLD: colors.navy,
  PASS: colors.alertRed,
};

export default function AnalysisResultScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [expandedRule, setExpandedRule] = useState<string | null>(null);

  const { data: analysis, isLoading } = useQuery({
    queryKey: ['analysis', id],
    queryFn: () => getAnalysisById(id!),
    enabled: Boolean(id),
  });

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
      <ScreenHeader title="Analysis Results" />
      <ScrollView className="flex-1" contentContainerClassName="p-md pb-32">
        <View
          className="mb-lg items-center rounded-md p-lg"
          style={{ backgroundColor: recColor }}
        >
          <Text className="text-h2 font-bold text-white">
            RECOMMENDATION: {analysis.recommendation}
          </Text>
          <Text className="mt-2 text-center text-body-small text-white">
            {analysis.reasoning}
          </Text>
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
      </ScrollView>

      <View
        className="absolute bottom-0 left-0 right-0 flex-row gap-2 border-t border-medium-gray bg-white p-md"
        style={{ paddingBottom: insets.bottom + 16, ...shadows.lg }}
      >
        <View className="flex-1">
          <PrimaryButton title="Add to Portfolio" onPress={() => {}} />
        </View>
        <View className="flex-1">
          <PrimaryButton title="Request Info" variant="secondary" onPress={() => {}} />
        </View>
      </View>
    </View>
  );
}
