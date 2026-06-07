import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { ErrorState } from '../components/ErrorState';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { mobileTheme } from '../constants/mobileTheme';
import { dealApi, type DealRecord } from '../services/dealApi';
import { formatCurrency, formatPercent } from '../utils/format';

const STATUS_LABELS: Record<DealRecord['status'], string> = {
  pipeline: 'New / Pending',
  review: 'In Progress',
  approved: 'Completed',
  closed: 'Cancelled',
};

const FILTERS = ['All', 'Multifamily', 'Retail', 'Office', 'Industrial', 'Land', 'Property'] as const;

function DealCard({ deal }: { deal: DealRecord }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{deal.address}</Text>
      <Text style={styles.cardSubtitle}>
        {deal.city}, {deal.state} {deal.zip}
      </Text>
      <View style={styles.cardRow}>
        <Text style={styles.cardStat}>{formatCurrency(deal.price)}</Text>
        <Text style={styles.cardStat}>{formatPercent(deal.capRate)} cap</Text>
      </View>
      <View style={styles.cardRow}>
        <Text style={styles.badge}>{STATUS_LABELS[deal.status] ?? deal.status}</Text>
        <Text style={styles.cardMeta}>{deal.propertyType}</Text>
      </View>
    </View>
  );
}

export default function DealsScreen() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('All');

  const {
    data: deals = [],
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['deals', search, filter],
    queryFn: () => dealApi.fetchDeals(search, filter),
  });

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const emptyMessage = useMemo(() => {
    if (search || filter !== 'All') return 'No deals match your search or filter.';
    return 'No deals yet. Save a property and create a deal from Analyze.';
  }, [filter, search]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Deals</Text>

      <TextInput
        style={styles.search}
        placeholder="Search by address, city..."
        placeholderTextColor={mobileTheme.textSubtle}
        value={search}
        onChangeText={setSearch}
      />

      <View style={styles.filters}>
        {FILTERS.map((item) => (
          <TouchableOpacity
            key={item}
            style={[styles.filterChip, filter === item && styles.filterChipActive]}
            onPress={() => setFilter(item)}
          >
            <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <LoadingSkeleton rows={5} />
      ) : isError ? (
        <ErrorState
          message="Could not load deals. Confirm the SQL migration ran and the backend is up."
          onRetry={() => void refetch()}
        />
      ) : (
        <FlatList
          data={deals}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <DealCard deal={item} />}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={mobileTheme.accentGreen} />
          }
          contentContainerStyle={deals.length === 0 ? styles.emptyList : styles.list}
          ListEmptyComponent={<Text style={styles.emptyText}>{emptyMessage}</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: mobileTheme.bg,
    paddingTop: 56,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: mobileTheme.text,
    marginBottom: 12,
  },
  search: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: mobileTheme.surfaceBorder,
    backgroundColor: mobileTheme.surface,
    paddingHorizontal: 14,
    color: mobileTheme.text,
    marginBottom: 10,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: mobileTheme.surface,
    borderWidth: 1,
    borderColor: mobileTheme.surfaceBorder,
  },
  filterChipActive: {
    backgroundColor: mobileTheme.accent,
    borderColor: mobileTheme.accent,
  },
  filterText: {
    fontSize: 12,
    color: mobileTheme.textMuted,
    fontWeight: '600',
  },
  filterTextActive: {
    color: mobileTheme.text,
  },
  list: {
    paddingBottom: 24,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 24,
  },
  emptyText: {
    textAlign: 'center',
    color: mobileTheme.textSubtle,
    fontSize: 14,
    paddingVertical: 24,
  },
  card: {
    backgroundColor: mobileTheme.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: mobileTheme.surfaceBorder,
    padding: 14,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: mobileTheme.text,
  },
  cardSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: mobileTheme.textMuted,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    alignItems: 'center',
  },
  cardStat: {
    fontSize: 13,
    color: mobileTheme.text,
    fontWeight: '600',
  },
  badge: {
    fontSize: 12,
    color: mobileTheme.accentGreen,
    fontWeight: '600',
  },
  cardMeta: {
    fontSize: 12,
    color: mobileTheme.textSubtle,
  },
});
