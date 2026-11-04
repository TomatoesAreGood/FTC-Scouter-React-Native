import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import AppHeader from '../components/AppHeader';
import { openLink } from '../lib/utils';
import { colors, fontSize, spacing } from '../lib/theme';

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const version = Constants.expoConfig?.version ?? '1.0.0';
  return (
    <View style={styles.container}>
      <AppHeader title="About" />
      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + spacing.xl }]}>
        <Text style={styles.appName}>FTC ScoutMaster</Text>
        <Text style={styles.version}>Version {version}</Text>
        <Text style={styles.paragraph}>
          FTC ScoutMaster is a minimalistic archiver for FTC (FIRST Tech Challenge) teams and events.
          It uses the official FTC Events API to provide up-to-date information about events,
          team rankings, match schedules, and awards.
        </Text>
        <Text style={styles.paragraph}>
          Developed by Jon Wu. For questions or feedback, please use the "Report a Problem" option
          in the menu.
        </Text>
        <Pressable onPress={() => openLink('https://ftc-events.firstinspires.org/services/API')} accessibilityRole="link">
          <Text style={styles.link}>FTC Events API</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  body: { padding: spacing.xl - 4 },
  appName: { fontSize: 20, fontWeight: '700', color: colors.text },
  version: { fontSize: fontSize.secondary, color: colors.textSecondary, marginTop: 2, marginBottom: spacing.lg },
  paragraph: { fontSize: fontSize.body, color: colors.text, lineHeight: 22, marginBottom: spacing.lg },
  link: { fontSize: fontSize.body, color: colors.link },
});
