import { Badge } from '@/components/ui/Badge';
import { colors, shadows } from '@/constants/theme';
import type { Deal } from '@/types/deal';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

const statusColors = {
  pipeline: colors.warningAmber,
  review: colors.navy,
  approved: colors.emerald,
  closed: colors.darkGray,
};

const statusLabels = {
  pipeline: 'Pipeline',
  review: 'Under Review',
  approved: 'Approved',
  closed: 'Closed',
};

type DealCardProps = { deal: Deal };

export function DealCard({ deal }: DealCardProps) {
  const priceColor =
    deal.priceChange !== undefined && deal.priceChange >= 0
      ? colors.emerald
      : colors.alertRed;

  return (
    <Pressable
      onPress={() => router.push(`/(app)/deal/${deal.id}`)}
      className="mb-md rounded-md bg-white p-md"
      style={[shadows.sm, { borderLeftWidth: 4, borderLeftColor: statusColors[deal.status] }]}
    >
      <Text className="text-h4 text-text-primary">
        {deal.address}, {deal.city}, {deal.state}
      </Text>
      <View className="mt-2 flex-row items-center justify-between">
        <Text className="text-body font-bold" style={{ color: priceColor }}>
          ${(deal.price / 1_000_000).toFixed(1)}M
          {deal.priceChange !== undefined
            ? ` ${deal.priceChange >= 0 ? '▲' : '▼'}${Math.abs(deal.priceChange).toFixed(1)}%`
            : ''}
        </Text>
        <View className="flex-row gap-2">
          <Badge label={`${deal.capRate.toFixed(1)}% Cap`} variant="navy" />
          <Badge label={statusLabels[deal.status]} variant={deal.status === 'approved' ? 'emerald' : deal.status === 'pipeline' ? 'amber' : 'navy'} />
        </View>
      </View>
    </Pressable>
  );
}
