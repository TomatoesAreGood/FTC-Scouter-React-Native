import { Stack, useRouter, useSegments } from 'expo-router';
import JsStack from 'expo-router/js-stack';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { AppProvider, useApp } from '../context/AppContext';
import { getSavedUser, getSavedToken } from '../lib/storage';
import { colors } from '../lib/theme';
import {
  jsStackRootSwapOptions, jsStackScreenOptions, nativePushAnimation, nativeRootSwapAnimation,
} from '../lib/navigation';

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
      <RootStack />
    </AppProvider>
  );
}

/** Screens pushed on top of the tabs. (auth) and (tabs) are added separately. */
const PUSHED_SCREENS = ['event/[code]', 'team/[number]', 'about', 'privacy', 'report', 'settings'];

// Android uses the JavaScript stack so going back animates like going forward
// (see lib/navigation.ts); iOS keeps the native stack and its swipe-back gesture.
function RootStack() {
  if (Platform.OS === 'android') {
    return (
      <JsStack detachInactiveScreens={false} screenOptions={jsStackScreenOptions}>
        <JsStack.Screen name="index" />
        <JsStack.Screen name="(auth)" options={jsStackRootSwapOptions} />
        <JsStack.Screen name="(tabs)" options={jsStackRootSwapOptions} />
        {PUSHED_SCREENS.map((name) => <JsStack.Screen key={name} name={name} />)}
      </JsStack>
    );
  }
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: nativePushAnimation,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" options={{ animation: nativeRootSwapAnimation }} />
      <Stack.Screen name="(tabs)" options={{ animation: nativeRootSwapAnimation }} />
      {PUSHED_SCREENS.map((name) => <Stack.Screen key={name} name={name} />)}
    </Stack>
  );
}
