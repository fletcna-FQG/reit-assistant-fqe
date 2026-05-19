import { colors, shadows } from '@/constants/theme';
import { Text, View } from 'react-native';

type KPICardProps = {
  label: string;
  value: string;
  delta?: number;
  deltaLabel?: string;
};

export function KPICard({ label, value, delta, deltaLabel }: KPICardProps) {
  const isPositive = delta !== undefined && delta >= 0;
  const deltaColor = isPositive ? colors.emerald : colors.alertRed;

  return (
    <View
      className="mr-md min-w-[160px] rounded-md bg-white p-md"
      style={shadows.sm}
    >
      <Text className="text-overline uppercase text-text-secondary">{label}</Text>
      <Text className="mt-1 text-h2 text-navy">{value}</Text>
      {delta !== undefined ? (
        <Text className="mt-1 text-micro" style={{ color: deltaColor }}>
          {isPositive ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}% {deltaLabel ?? 'vs last month'}
        </Text>
      ) : null}
    </View>
  );
}
