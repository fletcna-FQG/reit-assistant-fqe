import { AnalyzeFlowChrome } from '@/components/analyzer/AnalyzeFlowChrome';
import { AttomMarketDataPanel } from '@/components/property/AttomMarketDataPanel';
import { PropertyMapView } from '@/components/property/PropertyMapView';
import { ShareModal } from '@/components/property/ShareModal';
import { ActionButton } from '@/components/ui/ActionButton';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { IconActionButton } from '@/components/ui/IconActionButton';
import { FINANCIAL_LABELS, RULES_ENGINE_MESSAGES } from '@/constants/financialLabels';
import { colors } from '@/constants/theme';
import {
  analyzeProperty,
  getApiErrorMessage,
  getDeals,
  propertyApi,
  propertyRecordToAnalysisInput,
} from '@/services/api';
import { formatCurrency } from '@/utils/propertyValidation';
import { getPropertyMeta, savePropertyMeta, type PropertyExtendedMeta } from '@/utils/propertyMetaStorage';
import type { AttomMarketSnapshot } from '@/types/attom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

type RulesStatus = 'idle' | 'running' | 'complete' | 'error';

export default function PropertyDetailScreen() {
  const { id, propertyType: typeParam, autoRunRules, flowStep: flowStepParam } = useLocalSearchParams<{
    id: string;
    propertyType?: string;
    autoRunRules?: string;
    flowStep?: string;
  }>();
  const shouldAutoRun = autoRunRules === '1';

  const [meta, setMeta] = useState<PropertyExtendedMeta | null>(null);
  const [metaLoaded, setMetaLoaded] = useState(false);
  const propertyType = typeParam ?? meta?.propertyType ?? 'Homes';
  const [rulesStatus, setRulesStatus] = useState<RulesStatus>(shouldAutoRun ? 'running' : 'idle');
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [rulesError, setRulesError] = useState<string | null>(null);
  const [attomSnapshot, setAttomSnapshot] = useState<AttomMarketSnapshot | null>(null);
  const [attomEnabled, setAttomEnabled] = useState(false);
  const [attomMessage, setAttomMessage] = useState<string | null>(null);
  const [attomLoading, setAttomLoading] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const autoRunStarted = useRef(false);
  const marketDataFetched = useRef(false);
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ['property', id],
    queryFn: () => propertyApi.getProperty(id!),
    enabled: Boolean(id),
    staleTime: 0,
  });

  const { data: deals = [] } = useQuery({
    queryKey: ['deals'],
    queryFn: () => getDeals(),
    enabled: Boolean(id),
  });

  useEffect(() => {
    if (!id) return;
    getPropertyMeta(id).then((loaded) => {
      setMeta(loaded);
      if (loaded?.attom_snapshot) {
        setAttomSnapshot(loaded.attom_snapshot);
      }
      setMetaLoaded(true);
    });
  }, [id]);

  useEffect(() => {
    if (!id || analysisId || rulesStatus === 'running') return;
    const linked = deals.find((deal) => deal.propertyId === id && deal.analysisId);
    if (linked?.analysisId) {
      setAnalysisId(linked.analysisId);
      setRulesStatus('complete');
    }
  }, [deals, id, analysisId, rulesStatus]);

  const loadMarketData = useCallback(
    async (refresh = false) => {
      if (!id || meta?.lat == null || meta?.lon == null) return;
      setAttomLoading(true);
      setAttomMessage(null);
      try {
        const response = refresh
          ? await propertyApi.refreshMarketData(id, meta.lat, meta.lon)
          : await propertyApi.getMarketData(id, meta.lat, meta.lon, refresh);
        setAttomEnabled(response.attom_enabled);
        setAttomSnapshot(response.attom_data);
        setAttomMessage(response.message);
        if (response.attom_data && id) {
          setMeta((prev) => {
            const nextMeta: PropertyExtendedMeta = {
              ...(prev ?? {}),
              attom_snapshot: response.attom_data,
            };
            void savePropertyMeta(id, nextMeta);
            return nextMeta;
          });
        }
      } catch (err) {
        setAttomMessage(getApiErrorMessage(err, 'Could not load ATTOM market data'));
      } finally {
        setAttomLoading(false);
      }
    },
    [id, meta?.lat, meta?.lon],
  );

  useEffect(() => {
    if (!metaLoaded || meta?.lat == null || meta?.lon == null) return;
    if (meta.attom_snapshot) {
      setAttomSnapshot(meta.attom_snapshot);
      setAttomEnabled(true);
      return;
    }
    if (marketDataFetched.current) return;
    marketDataFetched.current = true;
    void loadMarketData(false);
  }, [metaLoaded, meta?.lat, meta?.lon, meta?.attom_snapshot, loadMarketData]);

  const runRulesEngine = useCallback(async () => {
    if (!data?.property) return;
    setRulesStatus('running');
    setRulesError(null);
    try {
      const input = propertyRecordToAnalysisInput(data.property, propertyType, meta ?? undefined);
      const result = await analyzeProperty(input, { propertyId: id });
      setAnalysisId(result.id);
      setRulesStatus('complete');
      await queryClient.invalidateQueries({ queryKey: ['deals'] });
      await queryClient.invalidateQueries({ queryKey: ['deal'] });
    } catch (err) {
      setRulesStatus('error');
      setRulesError(getApiErrorMessage(err, 'REIT Rules Engine failed'));
    }
  }, [data?.property, propertyType, meta, id, queryClient]);

  useEffect(() => {
    if (
      shouldAutoRun &&
      data?.property &&
      !autoRunStarted.current &&
      rulesStatus !== 'complete' &&
      (typeParam || metaLoaded)
    ) {
      autoRunStarted.current = true;
      void runRulesEngine();
    }
  }, [shouldAutoRun, data?.property, runRulesEngine, rulesStatus, typeParam, metaLoaded]);

  const flowStep = useMemo(() => {
    if (flowStepParam === '5') return 5;
    if (rulesStatus === 'complete') return 5;
    if (shouldAutoRun && rulesStatus === 'running') return 4;
    if (rulesStatus === 'error') return 4;
    return 5;
  }, [flowStepParam, rulesStatus, shouldAutoRun]);

  if (isLoading || (isFetching && !data?.property)) {
    return (
      <View className="flex-1 items-center justify-center bg-light-gray p-md">
        <ActivityIndicator color={colors.navy} size="large" />
        <Text className="mt-md text-body-small text-text-secondary">Loading property summary…</Text>
      </View>
    );
  }

  if (isError || !data?.property) {
    return (
      <View className="flex-1 items-center justify-center bg-light-gray p-md">
        <Text className="mb-md text-h4 text-navy">Property not found</Text>
        <Text className="mb-lg text-body-small text-text-secondary">
          {getApiErrorMessage(error, 'Could not load this property record.')}
        </Text>
        <PrimaryButton title="Back to Home" onPress={() => router.replace('/(app)/(tabs)')} />
      </View>
    );
  }

  const p = data.property;

  return (
    <View className="flex-1 bg-light-gray">
      <AnalyzeFlowChrome
        title="Property Summary"
        currentStep={flowStep}
        context={{
          address: p.address,
          city: p.city,
          state: p.state,
          zip: p.zip,
          propertyType: meta?.propertyType ?? propertyType,
        }}
      />

      <ScrollView
        className="flex-1 px-md"
        contentContainerClassName="pt-md pb-xl"
        style={{ flex: 1 }}
      >
        {flowStep === 4 ? (
          <RulesEngineStatusPanel status={rulesStatus} error={rulesError} onRetry={() => void runRulesEngine()} />
        ) : null}

        {meta?.lat != null && meta?.lon != null ? (
          <View className="mb-md">
            <PropertyMapView lat={meta.lat} lon={meta.lon} label={`${p.address}, ${p.city}`} interactive={false} />
          </View>
        ) : null}

        <AttomMarketDataPanel
          property={p}
          snapshot={attomSnapshot}
          attomEnabled={attomEnabled}
          loading={attomLoading}
          message={attomMessage}
          onRefresh={() => void loadMarketData(true)}
        />

        <View className="mb-md rounded-md bg-white p-md shadow-sm">
          <Text className="mb-sm text-h4 text-navy">Calculated valuation summary</Text>
          <Text className="mb-md text-caption text-text-secondary">
            Saved to your account — server-calculated from the financials you entered.
          </Text>
          <Row label={FINANCIAL_LABELS.egi} value={formatCurrency(p.egi)} />
          <Row label={FINANCIAL_LABELS.totalExpenses} value={formatCurrency(p.total_operating_expenses)} />
          <Row label={FINANCIAL_LABELS.noi} value={formatCurrency(p.noi)} highlight />
          <Row label={FINANCIAL_LABELS.capRate} value={`${p.cap_rate}%`} />
          <Row label={FINANCIAL_LABELS.indicatedValue} value={formatCurrency(p.indicated_value)} highlight />
        </View>

        {rulesStatus === 'complete' && analysisId ? (
          <View className="mb-md rounded-md border-2 bg-white p-md" style={{ borderColor: colors.emerald }}>
            <Text className="mb-1 text-body-small font-semibold text-emerald">
              {RULES_ENGINE_MESSAGES.ready}
            </Text>
            <Text className="mb-md text-caption text-text-secondary">
              Valuation summary is saved. Review Rule Engine results to finish step 6, then start the deal
              process from the results page.
            </Text>
            <PrimaryButton
              title={RULES_ENGINE_MESSAGES.viewResults}
              onPress={() =>
                router.push({
                  pathname: '/(app)/analysis/[id]',
                  params: { id: analysisId, propertyType, propertyId: id, flowStep: '6' },
                })
              }
            />
            <Pressable className="mt-3 items-center py-2" onPress={() => void runRulesEngine()}>
              <Text className="text-caption font-semibold text-navy">
                Re-run Rules Engine (optional)
              </Text>
            </Pressable>
          </View>
        ) : rulesStatus === 'running' ? (
          <View className="mb-md rounded-md bg-white p-md shadow-sm">
            <Text className="text-caption text-text-secondary">
              {RULES_ENGINE_MESSAGES.eta} The valuation summary above is already saved.
            </Text>
          </View>
        ) : rulesStatus === 'error' ? (
          <View className="mb-md rounded-md border-2 bg-white p-md" style={{ borderColor: colors.alertRed }}>
            <Text className="text-body-small font-semibold text-alert-red">Rules Engine could not complete</Text>
            {rulesError ? (
              <Text className="mt-1 text-caption text-text-secondary">{rulesError}</Text>
            ) : null}
            <View className="mt-md">
              <PrimaryButton
                title={RULES_ENGINE_MESSAGES.runAgain}
                onPress={() => void runRulesEngine()}
              />
            </View>
          </View>
        ) : (
          <View className="mb-md">
            <PrimaryButton
              title="Run REIT Rules Engine"
              onPress={() => void runRulesEngine()}
              loading={rulesStatus === 'running'}
            />
          </View>
        )}

        <View className="mb-md">
          <ActionButton title="Share" variant="outline" onPress={() => setShareModalVisible(true)} />
        </View>
      </ScrollView>

      {id ? (
        <ShareModal
          visible={shareModalVisible}
          propertyId={id}
          onClose={() => setShareModalVisible(false)}
        />
      ) : null}
    </View>
  );
}

function RulesEngineStatusPanel({
  status,
  error,
  onRetry,
}: {
  status: RulesStatus;
  error: string | null;
  onRetry: () => void;
}) {
  if (status === 'running') {
    return (
      <View className="mb-md rounded-md bg-white p-md shadow-sm">
        <View className="flex-row items-center gap-3">
          <ActivityIndicator color={colors.navy} />
          <View className="flex-1">
            <Text className="text-body-small font-semibold text-navy">Step 4 — REIT Rules Engine running</Text>
            <Text className="mt-1 text-caption text-text-secondary">{RULES_ENGINE_MESSAGES.running}</Text>
            <Text className="mt-1 text-caption text-emerald">{RULES_ENGINE_MESSAGES.eta}</Text>
          </View>
        </View>
      </View>
    );
  }

  if (status === 'error' && error) {
    return (
      <View className="mb-md rounded-md border-2 bg-white p-md" style={{ borderColor: colors.alertRed }}>
        <Text className="text-body-small font-semibold text-alert-red">Rules Engine could not complete</Text>
        <Text className="mt-1 text-caption text-text-secondary">{error}</Text>
        <View className="mt-md">
          <IconActionButton icon="↻" label="Retry Rules Engine" variant="secondary" compact onPress={onRetry} />
        </View>
      </View>
    );
  }

  return null;
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View className="mb-2 flex-row justify-between border-b border-light-gray py-2">
      <Text className="mr-2 flex-1 text-body-small text-text-secondary">{label}</Text>
      <Text className={`text-body-small font-bold ${highlight ? 'text-navy' : 'text-text-primary'}`}>{value}</Text>
    </View>
  );
}
