import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { useAuth } from '@/hooks/useAuth';
import { Redirect, Slot } from 'expo-router';

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <ResponsiveLayout>
      <Slot />
    </ResponsiveLayout>
  );
}
