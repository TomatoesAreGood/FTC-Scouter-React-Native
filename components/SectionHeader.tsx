import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, dividerWidth, fontSize, spacing } from '../lib/theme';

/**
 * Grey section header bar. Pass onPress + expanded to make it a collapsible header.
 */
export default function SectionHeader({
  title,
  subtitle,
  meta,
  onPress,
  expanded,
}: {
  title: string;
  subtitle?: string;
  /** Short right-aligned text, e.g. a count. */
  meta?: string;
  onPress?: () => void;
  expanded?: boolean;
}) {
  const content = (
    <>
      <View style={styles.textBlock}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
      </View>
      {meta ? <Text style={styles.meta}>{meta}</Text> : null}
      {onPress ? (
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.textSecondary}
        />
      ) : null}
    </>
  );

  if (!onPress) return <View style={styles.container}>{content}</View>;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.lg,
    paddingVertical: 9,
    // Only a bottom border: rows above already draw their own bottom border.
    borderBottomWidth: dividerWidth,
    borderBottomColor: colors.border,
  },
  pressed: { backgroundColor: colors.pressed },
  textBlock: { flex: 1 },
  title: { fontSize: fontSize.body, fontWeight: '600', color: colors.text },
  subtitle: { fontSize: fontSize.caption, color: colors.textSecondary, marginTop: 1 },
  meta: { fontSize: fontSize.caption, color: colors.textSecondary, marginRight: spacing.sm },
});
