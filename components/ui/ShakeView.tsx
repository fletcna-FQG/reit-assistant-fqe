import { useEffect } from 'react';
import type { ViewProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

type ShakeViewProps = ViewProps & {
  trigger: number;
  children: React.ReactNode;
};

/** 300ms shake — 05_Developer_Handoff.md / 02_Component_Library.md */
export function ShakeView({ trigger, children, style, ...props }: ShakeViewProps) {
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (trigger === 0) return;
    translateX.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-8, { duration: 50 }),
      withTiming(8, { duration: 50 }),
      withTiming(0, { duration: 50 }),
    );
  }, [trigger, translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View style={[style, animatedStyle]} {...props}>
      {children}
    </Animated.View>
  );
}
