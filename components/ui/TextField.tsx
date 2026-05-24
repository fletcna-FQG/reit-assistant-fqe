import { colors } from '@/constants/theme';
import { Text, TextInput, View, type TextInputProps } from 'react-native';
import { ShakeView } from './ShakeView';

type TextFieldProps = TextInputProps & {
  label: string;
  error?: string;
  shakeTrigger?: number;
  required?: boolean;
};

export function TextField({
  label,
  error,
  shakeTrigger = 0,
  required = false,
  style,
  ...props
}: TextFieldProps) {
  const hasError = Boolean(error);

  return (
    <View className="mb-md">
      <Text className="mb-1 text-body-small font-semibold text-text-primary">
        {label}
        {required ? <Text className="text-alert-red"> *</Text> : null}
      </Text>
      <ShakeView trigger={shakeTrigger}>
        <TextInput
          className="rounded-sm bg-white px-md text-body text-text-primary"
          placeholderTextColor={colors.darkGray}
          style={[
            {
              height: 48,
              borderWidth: 2,
              borderColor: hasError ? colors.alertRed : colors.mediumGray,
            },
            style,
          ]}
          {...props}
        />
      </ShakeView>
      {error ? (
        <Text className="mt-1 text-caption text-alert-red">{error}</Text>
      ) : null}
    </View>
  );
}
