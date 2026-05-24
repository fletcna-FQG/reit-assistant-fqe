import { colors, icons } from '@/constants/theme';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';

type ReitRulesIconProps = {
  size?: number;
  focused?: boolean;
};

/** Tab icon: race car silhouette with horse backdrop (FQE brand motif). */
export function ReitRulesIcon({ size = icons.sizes.nav, focused = false }: ReitRulesIconProps) {
  const stroke = focused ? colors.navy : colors.darkGray;
  const fillHorse = focused ? `${colors.navy}22` : `${colors.mediumGray}88`;
  const sw = icons.strokeWidth;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Horse backdrop */}
      <Ellipse cx="12" cy="14" rx="8" ry="5" fill={fillHorse} />
      <Path
        d="M7 14c1-3 3-5 5-5s4 2 5 5"
        stroke={stroke}
        strokeWidth={sw * 0.8}
        strokeLinecap="round"
        opacity={0.5}
      />
      <Path
        d="M9 12c0.5-1.5 2-2.5 3.5-2.5"
        stroke={stroke}
        strokeWidth={sw * 0.7}
        strokeLinecap="round"
        opacity={0.45}
      />
      {/* Race car body */}
      <Path
        d="M4 16h14l2-3-2-2H8L4 16z"
        stroke={stroke}
        strokeWidth={sw}
        strokeLinejoin="round"
        fill={focused ? `${colors.emerald}33` : 'transparent'}
      />
      <Circle cx="8" cy="16" r="1.5" fill={stroke} />
      <Circle cx="16" cy="16" r="1.5" fill={stroke} />
      <Path d="M10 11h4" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
      <Rect x="14" y="9" width="3" height="2" rx="0.5" fill={focused ? colors.emerald : stroke} opacity={0.8} />
    </Svg>
  );
}
