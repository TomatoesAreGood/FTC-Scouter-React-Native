import { Pressable, StyleSheet, Text, View } from 'react-native';
import { EventListing, TeamListing } from '../lib/models';
import { formatDateRange, getDisplayLocation } from '../lib/utils';
import { colors, dividerWidth, fontSize, spacing } from '../lib/theme';

/**
 * List dividers are a bottom border on each row (not separate separator views), 1dp on
 * Android (see dividerWidth in lib/theme.ts). Rows deliberately have no background of
 * their own: on Android a neighbouring row can overlap by a pixel after rounding, and an
 * opaque background would paint over this row's divider. The screen behind is white.
 */
export const rowDivider = {
  borderBottomWidth: dividerWidth,
  borderBottomColor: colors.border,
} as const;

export function EventRow({ event, onPress }: { event: EventListing; onPress: () => void }) {
  const format = event.remote ? 'Remote' : event.hybrid ? 'Hybrid' : null;
  const location = [[event.city, event.country].filter(Boolean).join(', '), format].filter(Boolean).join(' · ');
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.eventRow, pressed && styles.pressed]}
      accessibilityRole="button"
    >
      <Text style={styles.eventName} numberOfLines={2}>{event.name}</Text>
      <View style={styles.eventMeta}>
        <Text style={styles.metaText} numberOfLines={1}>{location}</Text>
        <Text style={styles.metaDate} numberOfLines={1}>
          {formatDateRange(event.dateStart, event.dateEnd)}
        </Text>
      </View>
    </Pressable>
  );
}

export function TeamRow({ team, onPress }: { team: TeamListing; onPress: () => void }) {
  const location = getDisplayLocation(team);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.teamRow, pressed && styles.pressed]}
      accessibilityRole="button"
    >
      <Text style={styles.teamNumber} numberOfLines={1}>{team.teamNumber}</Text>
      <View style={styles.teamInfo}>
        <Text style={styles.teamName} numberOfLines={1}>{team.teamName || `Team ${team.teamNumber}`}</Text>
        {location ? <Text style={styles.metaText} numberOfLines={1}>{location}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { backgroundColor: colors.pressed },
  eventRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    ...rowDivider,
  },
  eventName: {
    fontSize: fontSize.body,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 3,
  },
  eventMeta: { flexDirection: 'row', alignItems: 'center' },
  metaText: { flex: 1, fontSize: fontSize.secondary, color: colors.textSecondary, marginRight: spacing.sm },
  metaDate: { fontSize: fontSize.secondary, color: colors.textSecondary },
  teamRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 9,
    ...rowDivider,
  },
  teamNumber: {
    width: 64,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  teamInfo: { flex: 1 },
  teamName: { fontSize: fontSize.body, color: colors.text, marginBottom: 2 },
});
