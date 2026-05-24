import { Redirect } from 'expo-router';
import { SETTINGS_HREF } from '@/constants/navigation';

/** Profile tab hidden from nav — use Settings screen. */
export default function ProfileRedirect() {
  return <Redirect href={SETTINGS_HREF} />;
}
