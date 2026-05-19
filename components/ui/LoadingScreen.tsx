import { BRAND } from '@/constants/navigation';
import { colors } from '@/constants/theme';
import { ActivityIndicator, Text, View } from 'react-native';

export function LoadingScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-navy">
      <View
        className="mb-lg items-center justify-center rounded-xl bg-white"
        style={{ width: 64, height: 64 }}
      >
        <Text className="text-2xl font-bold text-navy">FQ</Text>
      </View>
      <Text className="mb-2 text-h2 text-white">{BRAND.name}</Text>
      <ActivityIndicator size="large" color={colors.white} className="mt-md" />
    </View>
  );
}
