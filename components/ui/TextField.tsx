import { colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, TextInput, View, type TextInputProps } from 'react-native';
import { ShakeView } from './ShakeView';

type TextFieldProps = TextInputProps & {
  label: string;
  error?: string;
  shakeTrigger?: number;
  required?: boolean;
  showPasswordToggle?: boolean;
};

export function TextField({
  label,
  error,
  shakeTrigger = 0,
  required = false,
  showPasswordToggle = false,
  style,
  secureTextEntry,
  ...props
}: TextFieldProps) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const hasError = Boolean(error);
  const isSecure = Boolean(secureTextEntry) && !(showPasswordToggle && passwordVisible);

  return (
    <View className="mb-md">
      <Text className="mb-1 text-body-small font-semibold text-text-primary">
        {label}
        {required ? <Text className="text-alert-red"> *</Text> : null}
      </Text>
      <ShakeView trigger={shakeTrigger}>
        <View className="relative">
          <TextInput
            className="rounded-sm bg-white px-md text-body text-text-primary"
            placeholderTextColor={colors.darkGray}
            style={[
              {
                height: 48,
                borderWidth: 2,
                borderColor: hasError ? colors.alertRed : colors.mediumGray,
                paddingRight: showPasswordToggle ? 48 : undefined,
              },
              style,
            ]}
            secureTextEntry={isSecure}
            {...props}
          />
          {showPasswordToggle ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
              onPress={() => setPasswordVisible((visible) => !visible)}
              className="absolute bottom-0 right-0 top-0 items-center justify-center px-md"
            >
              <Ionicons
                name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
                size={22}
                color={colors.darkGray}
              />
            </Pressable>
          ) : null}
        </View>
      </ShakeView>
      {error ? (
        <Text className="mt-1 text-caption text-alert-red">{error}</Text>
      ) : null}
    </View>
  );
}
