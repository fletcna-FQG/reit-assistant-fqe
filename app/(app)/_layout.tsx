import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { DealStateProvider } from '@/hooks/useDealState';
import { useAuth } from '@/hooks/useAuth';
import { Redirect, Stack } from 'expo-router';

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <DealStateProvider>
      <ResponsiveLayout>
        <Stack screenOptions={{ headerShown: false }} />
      </ResponsiveLayout>
    </DealStateProvider>
  );
}
