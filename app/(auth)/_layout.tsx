import { Stack } from 'expo-router';
import JsStack from 'expo-router/js-stack';
import { Platform } from 'react-native';
import { colors } from '../../lib/theme';
import { jsStackScreenOptions, nativePushAnimation } from '../../lib/navigation';

// Same split as the root layout (see lib/navigation.ts): login -> create account and back.
export default function AuthLayout() {
  if (Platform.OS === 'android') {
    return (
      <JsStack detachInactiveScreens={false} screenOptions={jsStackScreenOptions}>
        <JsStack.Screen name="login" />
        <JsStack.Screen name="create-account" />
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
      <Stack.Screen name="login" />
      <Stack.Screen name="create-account" />
    </Stack>
  );
}
