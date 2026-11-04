import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppHeader from '../components/AppHeader';
import { colors, fontSize, spacing } from '../lib/theme';

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.container}>
      <AppHeader title="Privacy Policy" />
      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + spacing.xl }]}>
        <Text style={styles.date}>Last updated: 2024</Text>
        <Text style={styles.paragraph}>
          FTC ScoutMaster does not collect, store, or share any personal information beyond what is
          necessary to use the FTC Events API.
        </Text>
        <Text style={styles.paragraph}>
          Your API credentials (username and token) are stored locally on your device only and are
          never transmitted to any server other than the official FTC Events API
          (ftc-api.firstinspires.org).
        </Text>
        <Text style={styles.paragraph}>
          Favorited events and teams are stored locally on your device and are not shared with any
          third parties.
        </Text>
        <Text style={styles.paragraph}>
          This app does not use analytics, advertising, or any third-party tracking services.
        </Text>
        <Text style={styles.paragraph}>
          All data displayed in this app is sourced from the FIRST Tech Challenge Events API, which
          is publicly accessible with a free account.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  body: { padding: spacing.xl - 4 },
  date: { fontSize: fontSize.secondary, color: colors.textSecondary, marginBottom: spacing.lg },
  paragraph: { fontSize: fontSize.body, color: colors.text, lineHeight: 22, marginBottom: spacing.lg },
});
