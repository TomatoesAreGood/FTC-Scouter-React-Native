import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppHeader from '../../components/AppHeader';
import { openLink } from '../../lib/utils';
import { colors, fontSize, spacing } from '../../lib/theme';

const API_REGISTER = 'https://ftc-events.firstinspires.org/services/API/register';
const API_INFO = 'https://ftc-events.firstinspires.org/services/API';

const STEPS = [
  'Open the FTC Events API registration page.',
  'Fill out the registration form with your information.',
  'You will receive your username and API token by email.',
  'Come back to this app and enter those credentials on the sign-in screen.',
];

export default function CreateAccountScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.container}>
      <AppHeader title="Get API Credentials" />
      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + spacing.xl }]}>
        <Text style={styles.paragraph}>
          FTC ScoutMaster reads data from the official FTC Events API, which requires a free account.
        </Text>
        {STEPS.map((step, i) => (
          <View key={i} style={styles.step}>
            <Text style={styles.stepNumber}>{i + 1}.</Text>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}

        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={() => openLink(API_REGISTER)}
          accessibilityRole="link"
        >
          <Text style={styles.buttonText}>Open Registration Page</Text>
        </Pressable>

        <Text style={styles.paragraph}>More information about the FTC Events API:</Text>
        <Pressable onPress={() => openLink(API_INFO)} accessibilityRole="link" hitSlop={4}>
          <Text style={styles.link}>{API_INFO}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  body: { padding: spacing.xl - 4 },
  paragraph: { fontSize: fontSize.body, color: colors.textSecondary, lineHeight: 22, marginBottom: spacing.lg },
  step: { flexDirection: 'row', marginBottom: spacing.sm },
  stepNumber: { width: 22, fontSize: fontSize.body, color: colors.text, fontWeight: '600', lineHeight: 22 },
  stepText: { flex: 1, fontSize: fontSize.body, color: colors.text, lineHeight: 22 },
  button: {
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.brandDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.xl,
  },
  buttonPressed: { opacity: 0.85 },
  buttonText: { color: '#fff', fontSize: fontSize.body + 1, fontWeight: '600' },
  link: { color: colors.link, fontSize: fontSize.secondary + 1 },
});
