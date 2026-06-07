import type { Href } from 'expo-router';

export type NavItem = {
  name: string;
  title: string;
  href: Href;
  icon: 'home' | 'rules' | 'analyze' | 'properties' | 'deals' | 'tasks' | 'portfolio' | 'profile';
};

/** Primary navigation — Home, REIT Rules, Analyze, Property, Tasks, Deals, Portfolio */
export const DASHBOARD_HREF = '/(app)/(tabs)' as const;
export const SETTINGS_HREF = '/(app)/settings' as const;

export const NAV_ITEMS: NavItem[] = [
  { name: 'index', title: 'Home', href: DASHBOARD_HREF, icon: 'home' },
  { name: 'rules', title: 'REIT Rules', href: '/(app)/(tabs)/rules', icon: 'rules' },
  { name: 'analyze', title: 'Analyze', href: '/(app)/(tabs)/analyze', icon: 'analyze' },
  { name: 'properties', title: 'Property', href: '/(app)/(tabs)/properties', icon: 'properties' },
  { name: 'tasks', title: 'Tasks', href: '/(app)/(tabs)/tasks', icon: 'tasks' },
  { name: 'deals', title: 'Deal', href: '/(app)/(tabs)/deals', icon: 'deals' },
  { name: 'portfolio', title: 'Portfolio', href: '/(app)/(tabs)/portfolio', icon: 'portfolio' },
];

export const BRAND = {
  name: 'REIT Assistant',
  company: 'Fletcher Quill Estates Inc.',
} as const;
