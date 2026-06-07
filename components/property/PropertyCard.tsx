import { Badge } from '@/components/ui/Badge';
import { colors, shadows } from '@/constants/theme';
import type { PropertyRecord } from '@/services/api';
import { formatCurrency } from '@/utils/propertyValidation';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

type PropertyCardProps = {
  property: PropertyRecord;
};

export function PropertyCard({ property }: PropertyCardProps) {
  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: '/(app)/property/[id]',
          params: { id: property.id },
        })
      }
      className="mb-md rounded-md bg-white p-md"
      style={[shadows.sm, { borderLeftWidth: 4, borderLeftColor: colors.navy }]}
    >
      <Text className="text-h4 text-text-primary">
        {property.address}, {property.city}, {property.state}
      </Text>
      <Text className="mt-1 text-body-small text-text-secondary">{property.zip}</Text>
      <View className="mt-2 flex-row flex-wrap items-center gap-2">
        <Badge label={`NOI ${formatCurrency(property.noi)}`} variant="navy" />
        {property.indicated_value != null ? (
          <Badge label={`Value ${formatCurrency(property.indicated_value)}`} variant="emerald" />
        ) : null}
        <Badge label={`${property.cap_rate}% Cap`} variant="gray" />
      </View>
    </Pressable>
  );
}
