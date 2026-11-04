import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, spacing } from '../lib/theme';

export function LoadingView() {
  return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={colors.brandDark} />
    </View>
  );
}

/** Used for empty states and error states. Pass onAction to show a retry-style button. */
export function MessageView({
  title,
  message,
  actionLabel,
  onAction,
}: {
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.centered}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <Text style={styles.message}>{message}</Text>
      {onAction ? (
        <Pressable
          onPress={onAction}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>{actionLabel ?? 'Retry'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: 48,
  },
  title: {
    fontSize: fontSize.body + 1,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  message: {
    fontSize: fontSize.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },
  button: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.brandDark,
  },
  buttonPressed: { backgroundColor: colors.brandTint },
  buttonText: { fontSize: fontSize.body, fontWeight: '600', color: colors.brandDark },
});
