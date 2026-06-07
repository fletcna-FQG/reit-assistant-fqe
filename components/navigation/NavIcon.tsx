import { ReitRulesIcon } from '@/components/navigation/ReitRulesIcon';
import { colors, icons } from '@/constants/theme';
import Svg, { Circle, Path, Polyline, Rect } from 'react-native-svg';

type NavIconName = 'home' | 'rules' | 'deals' | 'analyze' | 'properties' | 'tasks' | 'portfolio' | 'profile';

type NavIconProps = {
  name: NavIconName;
  size?: number;
  color?: string;
  focused?: boolean;
};

export function NavIcon({
  name,
  size = icons.sizes.nav,
  color = colors.darkGray,
  focused = false,
}: NavIconProps) {
  const stroke = focused ? colors.navy : color;
  const sw = icons.strokeWidth;

  switch (name) {
    case 'rules':
      return <ReitRulesIcon size={size} focused={focused} />;
    case 'home':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x="3" y="3" width="7" height="7" stroke={stroke} strokeWidth={sw} />
          <Rect x="14" y="3" width="7" height="7" stroke={stroke} strokeWidth={sw} />
          <Rect x="3" y="14" width="7" height="7" stroke={stroke} strokeWidth={sw} />
          <Rect x="14" y="14" width="7" height="7" stroke={stroke} strokeWidth={sw} />
        </Svg>
      );
    case 'deals':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 2L21 8v8l-9 6-9-6V8l9-6z"
            stroke={stroke}
            strokeWidth={sw}
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'analyze':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="10" cy="10" r="6" stroke={stroke} strokeWidth={sw} />
          <Path d="M14.5 14.5L20 20" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
          <Path d="M10 7v6M7 10h6" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    case 'properties':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M4 20V8l8-5 8 5v12"
            stroke={stroke}
            strokeWidth={sw}
            strokeLinejoin="round"
          />
          <Path d="M9 20v-6h6v6" stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
          <Path d="M4 10h16" stroke={stroke} strokeWidth={sw} />
        </Svg>
      );
    case 'tasks':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M9 6h11M9 12h11M9 18h11" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
          <Polyline
            points="4,8 5,9 7,6"
            stroke={stroke}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Polyline
            points="4,14 5,15 7,12"
            stroke={stroke}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'portfolio':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x="3" y="7" width="18" height="13" rx="1" stroke={stroke} strokeWidth={sw} />
          <Path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" stroke={stroke} strokeWidth={sw} />
          <Path d="M3 12h18" stroke={stroke} strokeWidth={sw} />
        </Svg>
      );
    case 'profile':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="8" r="4" stroke={stroke} strokeWidth={sw} />
          <Path
            d="M4 20c1.5-4 6-5 8-5s6.5 1 8 5"
            stroke={stroke}
            strokeWidth={sw}
            strokeLinecap="round"
          />
        </Svg>
      );
    default:
      return null;
  }
}
