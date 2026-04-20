import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppProvider, useApp } from '../context/AppContext';
import { getSavedUser, getSavedToken } from '../lib/storage';

function AuthGate() {
  const { user, token } = useApp();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inAuth = segments[0] === '(auth)';
    if (!user || !token) {
      if (!inAuth) router.replace('/(auth)/login');
    } else {
      if (inAuth) router.replace('/(tabs)/events');
    }
  }, [user, token, segments]);

  return null;
}

export default function RootLayout() {
  const [initialUser, setInitialUser] = useState<string>('');
  const [initialToken, setInitialToken] = useState<string>('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Promise.all([getSavedUser(), getSavedToken()]).then(([u, t]) => {
      setInitialUser(u ?? '');
      setInitialToken(t ?? '');
      setReady(true);
    });
  }, []);

  if (!ready) return null;

  return (
    <AppProvider initialUser={initialUser} initialToken={initialToken}>
      <AuthGate />
      <Stack screenOptions={{ headerShown: false }}>
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
