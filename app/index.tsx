import { DASHBOARD_HREF } from '@/constants/navigation';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { useAuth } from '@/hooks/useAuth';
import { Redirect } from 'expo-router';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    return <Redirect href={DASHBOARD_HREF} />;
  }

  return <Redirect href="/login" />;
}
