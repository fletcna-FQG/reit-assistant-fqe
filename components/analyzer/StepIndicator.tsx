import { colors } from '@/constants/theme';
import { Text, View } from 'react-native';

type StepIndicatorProps = {
  steps: string[];
  currentStep: number;
};

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <View className="mb-lg flex-row items-center justify-between px-md">
      {steps.map((label, index) => {
        const stepNum = index + 1;
        const isActive = stepNum === currentStep;
        const isComplete = stepNum < currentStep;
        return (
          <View key={label} className="flex-1 flex-row items-center">
            <View className="items-center">
              <View
                className="h-8 w-8 items-center justify-center rounded-full"
                style={{
                  backgroundColor: isComplete || isActive ? colors.navy : colors.mediumGray,
                }}
              >
                <Text className="text-caption font-bold text-white">
                  {isComplete ? '✓' : stepNum}
                </Text>
              </View>
              <Text
                className="mt-1 text-micro"
                style={{ color: isActive ? colors.navy : colors.textSecondary }}
              >
                {label}
              </Text>
            </View>
            {index < steps.length - 1 ? (
              <View
                className="mx-1 h-0.5 flex-1"
                style={{
                  backgroundColor: isComplete ? colors.navy : colors.mediumGray,
                }}
              />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
