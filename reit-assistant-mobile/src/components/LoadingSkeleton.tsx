import { View, StyleSheet } from 'react-native';
import { mobileTheme } from '../constants/mobileTheme';

type LoadingSkeletonProps = {
  rows?: number;
};

export function LoadingSkeleton({ rows = 4 }: LoadingSkeletonProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: rows }).map((_, index) => (
        <View key={index} style={[styles.row, index === rows - 1 && styles.rowLast]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  row: {
    height: 72,
    borderRadius: 8,
    backgroundColor: mobileTheme.surface,
    borderWidth: 1,
    borderColor: mobileTheme.surfaceBorder,
  },
  rowLast: {
    marginBottom: 0,
  },
});
