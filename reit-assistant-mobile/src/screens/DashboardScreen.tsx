import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { ErrorState } from '../components/ErrorState';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { mobileTheme } from '../constants/mobileTheme';
import { portfolioApi } from '../services/portfolioApi';
import { useAuthStore } from '../store/authStore';
import { formatCurrency, formatPercent } from '../utils/format';

const activityIcons = {
  deal: '📋',
  analysis: '📊',
  rule: '⚠️',
  task: '✓',
  closed: '✅',
} as const;

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.kpiCard}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiValue}>{value}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const user = useAuthStore((state) => state.user);

  const {
    data: kpis,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['portfolio', 'kpis'],
    queryFn: () => portfolioApi.fetchKpis(),
  });

  const { data: activity = [] } = useQuery({
    queryKey: ['portfolio', 'activity'],
    queryFn: () => portfolioApi.fetchActivity(),
  });

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>Welcome, {user?.full_name ?? user?.email ?? 'Analyst'}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={mobileTheme.accentGreen} />
        }
      >
        {isLoading ? (
          <LoadingSkeleton rows={3} />
        ) : isError ? (
          <ErrorState
            message="Could not load portfolio KPIs. Check that the backend is running and you are signed in."
            onRetry={() => void refetch()}
          />
        ) : kpis ? (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.kpiRow}>
              <KpiCard label="Total AUM" value={formatCurrency(kpis.totalAum)} />
              <KpiCard label="Avg Cap Rate" value={formatPercent(kpis.avgCapRate)} />
              <KpiCard label="Active Deals" value={String(kpis.activeDeals)} />
              <KpiCard label="Pending Tasks" value={String(kpis.pendingTasks)} />
            </ScrollView>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Portfolio Summary</Text>
              <Text style={styles.summaryLine}>Total NOI: {formatCurrency(kpis.totalNoi)}</Text>
              <Text style={styles.summaryLine}>
                Portfolio Value: {formatCurrency(kpis.totalPortfolioValue)}
              </Text>
            </View>

            {Object.keys(kpis.dealCountByState).length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Deals by State</Text>
                {Object.entries(kpis.dealCountByState).map(([state, count]) => (
                  <Text key={state} style={styles.summaryLine}>
                    {state}: {count}
                  </Text>
                ))}
              </View>
            ) : null}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              {activity.length === 0 ? (
                <Text style={styles.emptyText}>No recent activity yet.</Text>
              ) : (
                activity.map((item) => (
                  <View key={item.id} style={styles.activityRow}>
                    <Text style={styles.activityIcon}>{activityIcons[item.icon] ?? '•'}</Text>
                    <View style={styles.activityBody}>
                      <Text style={styles.activityMessage}>{item.message}</Text>
                      <Text style={styles.activityTime}>{item.timestamp}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </>
        ) : (
          <ActivityIndicator color={mobileTheme.accentGreen} style={styles.loader} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: mobileTheme.bg,
    paddingTop: 56,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: mobileTheme.text,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: mobileTheme.textMuted,
  },
  scroll: {
    flex: 1,
  },
  kpiRow: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 8,
  },
  kpiCard: {
    width: 140,
    padding: 14,
    borderRadius: 8,
    backgroundColor: mobileTheme.surface,
    borderWidth: 1,
    borderColor: mobileTheme.surfaceBorder,
  },
  kpiLabel: {
    fontSize: 12,
    color: mobileTheme.textMuted,
    marginBottom: 6,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '700',
    color: mobileTheme.text,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
    backgroundColor: mobileTheme.surface,
    borderWidth: 1,
    borderColor: mobileTheme.surfaceBorder,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: mobileTheme.text,
    marginBottom: 10,
  },
  summaryLine: {
    fontSize: 14,
    color: mobileTheme.textMuted,
    marginBottom: 4,
  },
  activityRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: mobileTheme.surfaceBorder,
  },
  activityIcon: {
    fontSize: 18,
  },
  activityBody: {
    flex: 1,
  },
  activityMessage: {
    fontSize: 14,
    color: mobileTheme.text,
  },
  activityTime: {
    marginTop: 2,
    fontSize: 12,
    color: mobileTheme.textSubtle,
  },
  emptyText: {
    fontSize: 14,
    color: mobileTheme.textSubtle,
  },
  loader: {
    marginTop: 32,
  },
});
