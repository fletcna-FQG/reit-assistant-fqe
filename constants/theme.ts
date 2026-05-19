/**
 * Design tokens — sourced from 01_Style_Guide.md (Kimi AI deliverables)
 * Fletcher Quill Estates Inc. · REIT Assistant
 */

export const colors = {
  navy: '#003366',
  navyLight: '#004080',
  navyDark: '#002244',
  emerald: '#28a745',
  emeraldLight: '#34ce57',
  emeraldDark: '#1e7e34',
  alertRed: '#dc3545',
  warningAmber: '#ffc107',
  white: '#ffffff',
  lightGray: '#f5f5f5',
  mediumGray: '#e0e0e0',
  darkGray: '#666666',
  textPrimary: '#2c3e50',
  textSecondary: '#7f8c8d',
  successGreen: '#28a745',
  dark: {
    canvas: '#16213e',
    surface: '#1a1a2e',
    border: '#0f3460',
    navy: '#4a90e2',
    textPrimary: '#eaeaea',
    textSecondary: '#a0a0a0',
  },
} as const;

export const typography = {
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  display: { fontSize: 28, fontWeight: '700' as const, lineHeight: 33.6 },
  h1: { fontSize: 24, fontWeight: '700' as const, lineHeight: 31.2 },
  h2: { fontSize: 20, fontWeight: '700' as const, lineHeight: 26 },
  h3: { fontSize: 18, fontWeight: '700' as const, lineHeight: 25.2 },
  h4: { fontSize: 16, fontWeight: '700' as const, lineHeight: 22.4 },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22.5 },
  bodySmall: { fontSize: 14, fontWeight: '400' as const, lineHeight: 21 },
  caption: { fontSize: 13, fontWeight: '600' as const, lineHeight: 18.2 },
  overline: { fontSize: 12, fontWeight: '600' as const, lineHeight: 14.4 },
  micro: { fontSize: 11, fontWeight: '700' as const, lineHeight: 13.2 },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
} as const;

export const layout = {
  sidebarWidth: 280,
  bottomNavHeight: 64,
  headerHeight: { mobile: 56, tablet: 60, desktop: 64 },
  contentMaxWidth: 1440,
  cardBorderRadius: { mobile: 12, tablet: 12, desktop: 16 },
  desktopBreakpoint: 1024,
  tabletBreakpoint: 768,
} as const;

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 25,
    elevation: 8,
  },
  navTop: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;

export const animations = {
  fast: { duration: 150, easing: 'ease' as const },
  base: { duration: 300, easing: 'ease-in-out' as const },
  slow: { duration: 500, easing: 'ease-out' as const },
  gauge: { duration: 800, easing: 'ease-out' as const },
  curves: {
    easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
    easeInOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
  },
} as const;

export const icons = {
  strokeWidth: 2,
  sizes: { micro: 16, standard: 20, nav: 24, empty: 32 },
} as const;

export const theme = {
  colors,
  typography,
  spacing,
  layout,
  borderRadius,
  shadows,
  animations,
  icons,
} as const;

export type Theme = typeof theme;
export default theme;
