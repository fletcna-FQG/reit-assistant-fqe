import { DASHBOARD_HREF } from '@/constants/navigation';
import { Redirect } from 'expo-router';

/** Ensures /(app) always lands on the Dashboard (Home tab). */
export default function AppIndexRedirect() {
  return <Redirect href={DASHBOARD_HREF} />;
}
