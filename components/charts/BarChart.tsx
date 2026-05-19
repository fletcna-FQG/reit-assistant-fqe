import { colors } from '@/constants/theme';
import type { CapRateDistribution } from '@/types/api';
import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';

type BarChartProps = {
  data: CapRateDistribution[];
  height?: number;
};

export function BarChart({ data, height = 180 }: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const barWidth = 48;
  const gap = 16;
  const chartWidth = data.length * (barWidth + gap);
  const chartHeight = height - 40;

  return (
    <View className="rounded-md bg-white p-md">
      <Text className="mb-md text-h4 text-navy">Cap Rate Distribution</Text>
      <Svg width={chartWidth} height={height}>
        {data.map((item, i) => {
          const barHeight = (item.value / max) * chartHeight;
          const x = i * (barWidth + gap);
          const y = chartHeight - barHeight;
          return (
            <React.Fragment key={item.label}>
              <Rect x={x} y={y} width={barWidth} height={barHeight} fill={colors.navy} rx={4} />
              <SvgText
                x={x + barWidth / 2}
                y={chartHeight + 16}
                fontSize={11}
                fill={colors.textSecondary}
                textAnchor="middle"
              >
                {item.label}
              </SvgText>
              <SvgText
                x={x + barWidth / 2}
                y={y - 6}
                fontSize={11}
                fill={colors.navy}
                textAnchor="middle"
                fontWeight="700"
              >
                {String(item.value)}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}
