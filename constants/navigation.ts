import type { Href } from 'expo-router';

export type NavItem = {
  name: string;
  title: string;
  href: Href;
  icon: 'home' | 'rules' | 'analyze' | 'deals' | 'tasks' | 'profile';
};

/** Primary navigation — Home, REIT Rules, Analyze, Tasks, Deals (+ Deal State in nav bar) */
export const DASHBOARD_HREF = '/(app)/(tabs)' as const;
export const SETTINGS_HREF = '/(app)/settings' as const;

export const NAV_ITEMS: NavItem[] = [
  { name: 'index', title: 'Home', href: DASHBOARD_HREF, icon: 'home' },
  { name: 'rules', title: 'REIT Rules', href: '/(app)/(tabs)/rules', icon: 'rules' },
  { name: 'analyze', title: 'Analyze', href: '/(app)/(tabs)/analyze', icon: 'analyze' },
  { name: 'tasks', title: 'Tasks', href: '/(app)/(tabs)/tasks', icon: 'tasks' },
  { name: 'deals', title: 'Deals', href: '/(app)/(tabs)/deals', icon: 'deals' },
];

export const BRAND = {
  name: 'REIT Assistant',
  company: 'Fletcher Quill Estates Inc.',
} as const;
