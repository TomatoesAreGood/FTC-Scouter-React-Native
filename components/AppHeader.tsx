import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize } from '../lib/theme';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  /** Shows a menu button instead of the back button. */
  onMenu?: () => void;
  /** Hide the leading button entirely (e.g. auth screens). */
  hideBack?: boolean;
  right?: React.ReactNode;
}

/**
 * The app bar used on every screen. It extends behind the status bar using the
 * safe area inset, so screens should NOT also wrap themselves in a top-edge SafeAreaView.
 */
export default function AppHeader({ title, subtitle, onMenu, hideBack, right }: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/events');
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.bar}>
        {onMenu ? (
          <HeaderButton icon="menu" label="Open menu" onPress={onMenu} />
        ) : !hideBack ? (
          <HeaderButton icon="arrow-back" label="Back" onPress={goBack} />
        ) : (
          <View style={styles.leadingSpacer} />
        )}
        <View style={styles.titleBlock}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
        </View>
        {right}
      </View>
    </View>
  );
}

export function HeaderButton({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={24} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.brand,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.15)',
  },
  bar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  leadingSpacer: { width: 12 },
  titleBlock: { flex: 1, justifyContent: 'center', paddingHorizontal: 4 },
  title: { fontSize: fontSize.title, fontWeight: '600', color: colors.text },
  subtitle: { fontSize: fontSize.caption, color: '#2f4a2f', marginTop: 1 },
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: { backgroundColor: 'rgba(0,0,0,0.08)' },
});
