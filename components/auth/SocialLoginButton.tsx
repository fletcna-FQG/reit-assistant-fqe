import { colors } from '@/constants/theme';
import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

type SocialLoginButtonProps = {
  provider: 'google' | 'apple';
  onPress: () => void;
  loading?: boolean;
};

export function SocialLoginButton({ provider, onPress, loading }: SocialLoginButtonProps) {
  const label = provider === 'google' ? 'Continue with Google' : 'Continue with Apple';

  return (
    <Pressable
      disabled={loading}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      className="mb-sm flex-row items-center justify-center rounded-sm border border-medium-gray bg-white"
      style={{ height: 48, opacity: loading ? 0.5 : 1 }}
    >
      {loading ? (
        <ActivityIndicator color={colors.navy} />
      ) : (
        <View className="flex-row items-center gap-3 px-md">
          <Text className="text-body font-bold text-text-primary">
            {provider === 'google' ? 'G' : ''}
          </Text>
          <Text className="text-body font-semibold text-text-primary">{label}</Text>
        </View>
      )}
    </Pressable>
  );
}
