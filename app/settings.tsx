import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import AppHeader from '../components/AppHeader';
import SectionHeader from '../components/SectionHeader';
import { rowDivider } from '../components/ListRows';
import { useApp } from '../context/AppContext';
import { colors, fontSize, spacing } from '../lib/theme';

export default function SettingsScreen() {
  const app = useApp();
  const insets = useSafeAreaInsets();
  const version = Constants.expoConfig?.version ?? '1.0.0';

  function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => { app.signOut(); } },
    ]);
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Settings" />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}>
        <SectionHeader title="Account" />
        <Row label="FTC API username" value={app.user || '—'} />
        <Pressable
          onPress={handleSignOut}
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          accessibilityRole="button"
        >
          <Text style={styles.danger}>Sign Out</Text>
        </Pressable>

        <SectionHeader title="App" />
        <Row label="Version" value={version} />
      </ScrollView>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value} numberOfLines={1} selectable>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    ...rowDivider,
  },
  rowPressed: { backgroundColor: colors.pressed },
  label: { flex: 1, fontSize: fontSize.body, color: colors.text },
  value: { flexShrink: 1, fontSize: fontSize.body, color: colors.textSecondary, marginLeft: spacing.md },
  danger: { fontSize: fontSize.body, color: colors.danger, fontWeight: '500' },
});
