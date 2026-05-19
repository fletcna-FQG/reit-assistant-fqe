import { colors } from '@/constants/theme';
import { useNetwork } from '@/hooks/useNetwork';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { Text, View } from 'react-native';

export function OfflineBanner() {
  const { isOffline } = useNetwork();
  const { pendingCount } = useOfflineQueue();

  if (!isOffline) return null;

  return (
    <View
      className="items-center justify-center px-md py-2"
      style={{ backgroundColor: colors.alertRed }}
    >
      <Text className="text-caption font-semibold text-white">
        You are offline
        {pendingCount > 0 ? ` · ${pendingCount} change(s) queued` : ''}
      </Text>
    </View>
  );
}
