import { colors, spacing } from '@/constants/theme';
import { useResponsive } from '@/hooks/useResponsive';
import { Text, View } from 'react-native';

type StepIndicatorProps = {
  steps: readonly string[];
  currentStep: number;
  shortSteps?: readonly string[];
};

/**
 * Full-width responsive step progression.
 * Mobile: equal-width segments (no horizontal scroll).
 * Tablet/desktop: larger circles with short labels when space allows.
 */
export function StepIndicator({ steps, currentStep, shortSteps }: StepIndicatorProps) {
  const { width, isMobile, isTablet } = useResponsive();
  const stepCount = steps.length;
  const currentLabel = steps[currentStep - 1] ?? '';
  const labels = shortSteps ?? steps;

  const horizontalPad = spacing.md;
  const segmentWidth = (width - horizontalPad * 2) / stepCount;
  const showStepLabels = segmentWidth >= (isMobile ? 38 : 52);
  const showFullCurrentLabel = !isMobile || width >= 360;
  const circleSize = isMobile ? 26 : isTablet ? 30 : 32;
  const labelFontSize = isMobile ? 9 : 10;

  return (
    <View
      className="border-b border-medium-gray bg-white"
      style={{ flexGrow: 0, flexShrink: 0, width: '100%' }}
      accessibilityRole="summary"
      accessibilityLabel={`Step ${currentStep} of ${stepCount}: ${currentLabel}`}
    >
      <View className="px-md pt-2">
        <Text
          className="text-caption font-semibold text-navy"
          numberOfLines={showFullCurrentLabel ? 2 : 1}
        >
          Step {currentStep} of {stepCount}
          {showFullCurrentLabel ? `: ${currentLabel}` : ''}
        </Text>
        {!showFullCurrentLabel ? (
          <Text className="mt-0.5 text-micro text-text-secondary" numberOfLines={1}>
            {currentLabel}
          </Text>
        ) : null}
      </View>

      <View className="flex-row px-md pb-2 pt-1" style={{ width: '100%' }}>
        {steps.map((label, index) => {
          const stepNum = index + 1;
          const isActive = stepNum === currentStep;
          const isComplete = stepNum < currentStep;
          const displayLabel = labels[index] ?? label;
          const lineBeforeComplete = stepNum <= currentStep;
          const lineAfterComplete = stepNum < currentStep;

          return (
            <View
              key={`step-${index}`}
              style={{ flex: 1, minWidth: 0 }}
              accessibilityLabel={`Step ${stepNum}: ${label}${isComplete ? ', completed' : isActive ? ', current' : ''}`}
            >
              <View className="flex-row items-center" style={{ width: '100%' }}>
                <View
                  style={{
                    flex: 1,
                    height: 2,
                    backgroundColor: index === 0 ? 'transparent' : lineBeforeComplete ? colors.navy : colors.mediumGray,
                    opacity: index === 0 ? 0 : lineBeforeComplete ? 1 : 0.35,
                  }}
                />
                <View
                  style={{
                    width: circleSize,
                    height: circleSize,
                    borderRadius: circleSize / 2,
                    backgroundColor: isComplete || isActive ? colors.navy : colors.mediumGray,
                    borderWidth: isActive ? 2 : 0,
                    borderColor: colors.emerald,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: colors.white, fontSize: isMobile ? 10 : 11, fontWeight: '700' }}>
                    {isComplete ? '✓' : stepNum}
                  </Text>
                </View>
                <View
                  style={{
                    flex: 1,
                    height: 2,
                    backgroundColor:
                      index === stepCount - 1 ? 'transparent' : lineAfterComplete ? colors.navy : colors.mediumGray,
                    opacity: index === stepCount - 1 ? 0 : lineAfterComplete ? 1 : 0.35,
                  }}
                />
              </View>
              {showStepLabels ? (
                <Text
                  style={{
                    marginTop: 4,
                    fontSize: labelFontSize,
                    fontWeight: isActive ? '700' : '600',
                    color: isActive ? colors.navy : colors.textSecondary,
                    textAlign: 'center',
                    width: '100%',
                    paddingHorizontal: 1,
                  }}
                  numberOfLines={2}
                >
                  {displayLabel}
                </Text>
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}
