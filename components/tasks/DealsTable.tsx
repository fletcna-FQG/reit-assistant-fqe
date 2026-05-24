import { DEAL_STATE_DROPDOWN_LABELS } from '@/constants/deals';
import { colors } from '@/constants/theme';
import type { Deal } from '@/types/deal';
import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

type DealsTableProps = {
  deals: Deal[];
  emptyMessage?: string;
};

const COLUMNS = [
  { key: 'address', label: 'Property', flex: 2 },
  { key: 'location', label: 'Location', flex: 1.2 },
  { key: 'price', label: 'Price', flex: 1 },
  { key: 'capRate', label: 'Cap Rate', flex: 0.8 },
  { key: 'status', label: 'Status', flex: 1 },
  { key: 'type', label: 'Type', flex: 1 },
] as const;

function formatPrice(price: number): string {
  if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(1)}M`;
  return `$${Math.round(price).toLocaleString()}`;
}

export function DealsTable({ deals, emptyMessage = 'No deals match this deal state.' }: DealsTableProps) {
  if (deals.length === 0) {
    return (
      <View className="mx-md mt-md rounded-md bg-white p-lg">
        <Text className="text-center text-body-small text-text-secondary">{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <View className="mx-md mt-md overflow-hidden rounded-md border border-medium-gray bg-white">
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ minWidth: 640 }}>
          <View
            className="flex-row border-b border-medium-gray px-md py-3"
            style={{ backgroundColor: `${colors.navy}08` }}
          >
            {COLUMNS.map((col) => (
              <Text
                key={col.key}
                className="text-caption font-bold text-navy"
                style={{ flex: col.flex }}
              >
                {col.label}
              </Text>
            ))}
          </View>
          {deals.map((deal, index) => (
            <Pressable
              key={deal.id}
              onPress={() => router.push(`/(app)/deal/${deal.id}`)}
              className="flex-row px-md py-3"
              style={{
                borderBottomWidth: index < deals.length - 1 ? 1 : 0,
                borderBottomColor: colors.mediumGray,
                backgroundColor: index % 2 === 0 ? colors.white : colors.lightGray,
              }}
            >
              <Text className="text-body-small font-semibold text-text-primary" style={{ flex: 2 }}>
                {deal.address}
              </Text>
              <Text className="text-body-small text-text-secondary" style={{ flex: 1.2 }}>
                {deal.city}, {deal.state}
              </Text>
              <Text className="text-body-small font-semibold text-text-primary" style={{ flex: 1 }}>
                {formatPrice(deal.price)}
              </Text>
              <Text className="text-body-small text-text-primary" style={{ flex: 0.8 }}>
                {Number.isFinite(deal.capRate) ? `${deal.capRate.toFixed(1)}%` : '—'}
              </Text>
              <Text className="text-body-small text-text-primary" style={{ flex: 1 }}>
                {DEAL_STATE_DROPDOWN_LABELS[deal.status] ?? deal.status}
              </Text>
              <Text className="text-body-small text-text-secondary" style={{ flex: 1 }}>
                {deal.propertyType}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
