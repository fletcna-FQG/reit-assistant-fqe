import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { mobileTheme } from '../constants/mobileTheme';

type ErrorStateProps = {
  message?: string;
  onRetry?: () => void;
};

export function ErrorState({
  message = 'Something went wrong loading data.',
  onRetry,
}: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <TouchableOpacity style={styles.button} onPress={onRetry}>
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    padding: 20,
    borderRadius: 8,
    backgroundColor: mobileTheme.surface,
    borderWidth: 1,
    borderColor: mobileTheme.surfaceBorder,
    alignItems: 'center',
  },
  message: {
    color: mobileTheme.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: mobileTheme.accent,
  },
  buttonText: {
    color: mobileTheme.text,
    fontSize: 14,
    fontWeight: '600',
  },
});
