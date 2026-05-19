import { useWindowDimensions } from 'react-native';
import { layout } from '@/constants/theme';

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  const isDesktop = width >= layout.desktopBreakpoint;
  const isTablet = width >= layout.tabletBreakpoint && width < layout.desktopBreakpoint;
  const isMobile = width < layout.tabletBreakpoint;

  return {
    width,
    height,
    isDesktop,
    isTablet,
    isMobile,
    sidebarWidth: layout.sidebarWidth,
    bottomNavHeight: layout.bottomNavHeight,
  };
}
