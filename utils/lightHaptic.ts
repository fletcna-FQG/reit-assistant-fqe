import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/** Safe haptic feedback — no-op on web where expo-haptics can break press handlers. */
export function lightHaptic() {
  if (Platform.OS === 'web') return;
  try {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // ignore unsupported platforms
  }
}
