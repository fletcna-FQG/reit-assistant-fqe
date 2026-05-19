import { colors } from '@/constants/theme';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

type DataPoint = { label: string; value: number };

type LineChartProps = {
  data: DataPoint[];
  width?: number;
  height?: number;
};

export function LineChart({ data, width = 300, height = 120 }: LineChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const padding = 10;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  const points = data.map((d, i) => {
    const x = padding + (i / Math.max(data.length - 1, 1)) * innerW;
    const y = padding + innerH - (d.value / max) * innerH;
    return { x, y };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = `${linePath} L${points[points.length - 1]?.x ?? 0},${height} L${points[0]?.x ?? 0},${height} Z`;

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.emerald} stopOpacity={0.2} />
          <Stop offset="1" stopColor={colors.emerald} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Path d={areaPath} fill="url(#areaGrad)" />
      <Path d={linePath} stroke={colors.emerald} strokeWidth={3} fill="none" strokeLinecap="round" />
      {points.map((p, i) => (
        <Circle key={i} cx={p.x} cy={p.y} r={4} fill={colors.emerald} stroke={colors.white} strokeWidth={2} />
      ))}
    </Svg>
  );
}
