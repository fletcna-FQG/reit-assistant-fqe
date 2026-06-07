const PRIMARY_TAB_SEGMENTS = new Set([
  'index',
  'rules',
  'analyze',
  'properties',
  'tasks',
  'deals',
  'portfolio',
]);

/** True for main tab screens (Dashboard, Deals, etc.) — no back affordance needed. */
export function isPrimaryTabRoute(pathname: string): boolean {
  if (
    pathname.includes('/property/') ||
    pathname.includes('/analysis/') ||
    pathname.includes('/deal/') ||
    pathname.includes('/rules/')
  ) {
    return false;
  }

  const segment = pathname.split('/').filter(Boolean).pop() ?? 'index';
  if (PRIMARY_TAB_SEGMENTS.has(segment)) return true;

  return pathname.endsWith('/(tabs)') || pathname === '/';
}

/** Chevron for sidebar collapse/expand; flips when sidebar is on the right (left-handed). */
export function getSidebarToggleIcon(
  isCollapsed: boolean,
  sidebarOnRight: boolean,
): 'chevron-back' | 'chevron-forward' {
  if (sidebarOnRight) {
    return isCollapsed ? 'chevron-back' : 'chevron-forward';
  }
  return isCollapsed ? 'chevron-forward' : 'chevron-back';
}
