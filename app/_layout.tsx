import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { AppProvider, useApp } from '../context/AppContext';
import { getSavedUser, getSavedToken } from '../lib/storage';
import { colors } from '../lib/theme';

function AuthGate() {
  const { user, token } = useApp();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const first = segments[0] as string | undefined;
    // "/" is handled by app/index.tsx's redirect.
    if (!first || first === 'index') return;
    const inAuth = first === '(auth)';
    if (!user || !token) {
      if (!inAuth) {
        // Signed out (possibly from a pushed screen like Settings): clear the stack so
        // back can't return to signed-in screens, then show login.
        if (router.canDismiss()) router.dismissAll();
        router.replace('/(auth)/login');
      }
    } else if (inAuth) {
      router.replace('/(tabs)/events');
    }
  }, [user, token, segments, router]);

  return null;
}

export default function RootLayout() {
  const [initialUser, setInitialUser] = useState<string>('');
  const [initialToken, setInitialToken] = useState<string>('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Promise.all([getSavedUser(), getSavedToken()])
      .then(([u, t]) => {
        setInitialUser(u ?? '');
        setInitialToken(t ?? '');
      })
      // If storage can't be read, fall through to the login screen rather than hanging.
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  if (!ready) return null;

  return (
    <AppProvider initialUser={initialUser} initialToken={initialToken}>
      {/* Dark icons on the light green app bar, on both platforms. */}
      <StatusBar style="dark" />
      <AuthGate />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="event/[code]" />
        <Stack.Screen name="team/[number]" />
        <Stack.Screen name="about" />
        <Stack.Screen name="privacy" />
        <Stack.Screen name="report" />
        <Stack.Screen name="settings" />
      </Stack>
    </AppProvider>
  );
}
