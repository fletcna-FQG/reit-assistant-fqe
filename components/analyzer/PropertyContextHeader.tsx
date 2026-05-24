import { Badge } from '@/components/ui/Badge';
import { Text, View } from 'react-native';

type PropertyContextHeaderProps = {
  address: string;
  city: string;
  state: string;
  zip: string;
  propertyType: string;
};

/** Compact property context strip — sits directly under the step indicator. */
export function PropertyContextHeader({
  address,
  city,
  state,
  zip,
  propertyType,
}: PropertyContextHeaderProps) {
  if (!address.trim()) return null;

  return (
    <View
      className="flex-row items-center gap-2 border-b border-medium-gray bg-light-gray px-md py-2"
      style={{ flexGrow: 0, flexShrink: 0 }}
    >
      <Text
        className="min-w-0 flex-1 text-caption font-semibold text-navy"
        numberOfLines={1}
        accessibilityRole="header"
      >
        {address}, {city}, {state} {zip}
      </Text>
      <Badge label={propertyType} variant="navy" />
    </View>
  );
}
