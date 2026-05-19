import { getPasswordStrength } from '@/utils/passwordStrength';
import { Text, View } from 'react-native';

type PasswordStrengthBarProps = {
  password: string;
};

export function PasswordStrengthBar({ password }: PasswordStrengthBarProps) {
  const strength = getPasswordStrength(password);

  if (!password) return <View className="mb-md h-1" />;

  return (
    <View className="mb-md">
      <View
        className="h-1 overflow-hidden rounded-full bg-medium-gray"
        style={{ height: 4 }}
      >
        <View
          style={{
            height: 4,
            width: `${strength.percent}%`,
            backgroundColor: strength.color,
            borderRadius: 4,
          }}
        />
      </View>
      {strength.label ? (
        <Text className="mt-1 text-micro" style={{ color: strength.color }}>
          {strength.label}
        </Text>
      ) : null}
    </View>
  );
}
