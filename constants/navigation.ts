import type { Href } from 'expo-router';

export type NavItem = {
  name: string;
  title: string;
  href: Href;
  icon: 'home' | 'deals' | 'analyze' | 'tasks' | 'profile';
};

/** Primary navigation — 02_Component_Library.md (5 tabs) */
export const NAV_ITEMS: NavItem[] = [
  { name: 'index', title: 'Home', href: '/(app)/(tabs)', icon: 'home' },
  { name: 'deals', title: 'Deals', href: '/(app)/(tabs)/deals', icon: 'deals' },
  { name: 'analyze', title: 'Analyze', href: '/(app)/(tabs)/analyze', icon: 'analyze' },
  { name: 'tasks', title: 'Tasks', href: '/(app)/(tabs)/tasks', icon: 'tasks' },
  { name: 'profile', title: 'Profile', href: '/(app)/(tabs)/profile', icon: 'profile' },
];

export const SECONDARY_NAV = [
  { name: 'rules', title: 'Rules', href: '/(app)/rules' as const },
] as const;

export const BRAND = {
  name: 'REIT Assistant',
  company: 'Fletcher Quill Estates Inc.',
} as const;
