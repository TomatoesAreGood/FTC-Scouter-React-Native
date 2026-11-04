import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../components/AppHeader';
import { openLink } from '../lib/utils';
import { colors, fontSize, spacing } from '../lib/theme';

const CONTACT_EMAIL = 'jonwu333@gmail.com';

export default function ReportScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.container}>
      <AppHeader title="Report a Problem" />
      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + spacing.xl }]}>
        <Text style={styles.paragraph}>
          If you encounter a bug, incorrect data, or have a feature request, please reach out via
          email. Include as much detail as possible about the issue.
        </Text>
        <Pressable
          style={({ pressed }) => [styles.emailButton, pressed && styles.emailButtonPressed]}
          onPress={() => openLink(`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('FTC ScoutMaster - Report')}`)}
          accessibilityRole="link"
        >
          <Ionicons name="mail-outline" size={20} color={colors.brandDark} />
          <Text style={styles.emailText} selectable>{CONTACT_EMAIL}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  body: { padding: spacing.xl - 4 },
  paragraph: { fontSize: fontSize.body, color: colors.text, lineHeight: 22, marginBottom: spacing.xl },
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.brandDark,
  },
  emailButtonPressed: { backgroundColor: colors.brandTint },
  emailText: { fontSize: fontSize.body, color: colors.brandDark, fontWeight: '600' },
});
