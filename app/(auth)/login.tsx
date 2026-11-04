import { useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { validateCredentials } from '../../lib/api';
import { setSavedUser, setSavedToken } from '../../lib/storage';
import { useApp } from '../../context/AppContext';
import { colors, fontSize, spacing } from '../../lib/theme';

export default function LoginScreen() {
  const router = useRouter();
  const app = useApp();
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState('');
  const [tokenVal, setTokenVal] = useState('');
  const [loading, setLoading] = useState(false);

  const canSubmit = username.trim().length > 0 && tokenVal.trim().length > 0 && !loading;

  async function handleLogin() {
    if (!canSubmit) return;
    const user = username.trim();
    const token = tokenVal.trim();
    setLoading(true);
    try {
      const result = await validateCredentials(user, token);
      if (result === 'valid') {
        await setSavedUser(user);
        await setSavedToken(token);
        // Updating context makes the auth gate (app/_layout.tsx) route into the app.
        app.setCredentials(user, token);
      } else if (result === 'network-error') {
        Alert.alert("Couldn't reach the FTC API", 'Check your internet connection and try again.');
      } else {
        Alert.alert('Invalid username or token', 'Please check your FTC Events API credentials and try again.');
      }
    } catch {
      Alert.alert('Sign in failed', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.root}>
      <View style={[styles.brandBar, { paddingTop: insets.top + spacing.xl }]}>
        <Text style={styles.appName}>FTC ScoutMaster</Text>
        <Text style={styles.tagline}>Events, teams, rankings and results for FIRST Tech Challenge</Text>
      </View>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.form, { paddingBottom: insets.bottom + spacing.xl }]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.heading}>Sign in</Text>
          <Text style={styles.body}>
            This app uses the official FTC Events API. Enter the username and authorization token from your free
            API account. You only need to do this once.
          </Text>

          <Field
            label="Username"
            icon="person-outline"
            value={username}
            onChangeText={setUsername}
            returnKeyType="next"
            textContentType="username"
          />
          <Field
            label="API Token"
            icon="key-outline"
            value={tokenVal}
            onChangeText={setTokenVal}
            returnKeyType="go"
            onSubmitEditing={handleLogin}
            textContentType="password"
          />

          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              !canSubmit && styles.primaryButtonDisabled,
              pressed && canSubmit && styles.primaryButtonPressed,
            ]}
            onPress={handleLogin}
            disabled={!canSubmit}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSubmit, busy: loading }}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Sign In</Text>}
          </Pressable>

          <Pressable
            onPress={() => router.push('/(auth)/create-account')}
            style={styles.secondaryLink}
            hitSlop={8}
            accessibilityRole="link"
          >
            <Text style={styles.secondaryLinkText}>Don't have API credentials? Get them here</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function Field({
  label,
  icon,
  value,
  onChangeText,
  returnKeyType,
  onSubmitEditing,
  textContentType,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  onChangeText: (v: string) => void;
  returnKeyType: 'next' | 'go';
  onSubmitEditing?: () => void;
  textContentType: 'username' | 'password';
}) {
  return (
    <View style={fieldStyles.container}>
      <Text style={fieldStyles.label}>{label}</Text>
      <View style={fieldStyles.inputRow}>
        <Ionicons name={icon} size={18} color={colors.textSecondary} />
        <TextInput
          style={fieldStyles.input}
          value={value}
          onChangeText={onChangeText}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          textContentType={textContentType}
          accessibilityLabel={label}
        />
        {value.length > 0 ? (
          <Pressable
            onPress={() => onChangeText('')}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Clear ${label}`}
          >
            <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  container: { marginBottom: spacing.lg },
  label: { fontSize: fontSize.secondary, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    height: 46,
    backgroundColor: colors.background,
  },
  input: { flex: 1, fontSize: fontSize.body + 1, color: colors.text, paddingVertical: 0 },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  brandBar: {
    backgroundColor: colors.brand,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  appName: { fontSize: 26, fontWeight: '700', color: colors.text },
  tagline: { fontSize: fontSize.secondary + 1, color: '#2f4a2f', marginTop: spacing.xs },
  form: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl },
  heading: { fontSize: 20, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  body: { fontSize: fontSize.body, color: colors.textSecondary, lineHeight: 21, marginBottom: spacing.xl },
  primaryButton: {
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.brandDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  primaryButtonPressed: { opacity: 0.85 },
  primaryButtonDisabled: { backgroundColor: '#9bb59b' },
  primaryButtonText: { color: '#fff', fontSize: fontSize.body + 1, fontWeight: '600' },
  secondaryLink: { alignSelf: 'center', marginTop: spacing.xl, paddingVertical: spacing.xs },
  secondaryLinkText: { fontSize: fontSize.body, color: colors.link },
});
