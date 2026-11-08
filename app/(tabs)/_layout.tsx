import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DrawerProvider } from '../../components/Drawer';
import { colors } from '../../lib/theme';

export default function TabLayout() {
  return (
    // The drawer wraps the tab navigator so it overlays both the screen and the tab bar.
    <DrawerProvider>
      <Tabs
        // Render the tab scenes as plain views (inactive tabs are display: none) instead of in a
        // nested native screen container. While a pushed screen (event, team, ...) covers the
        // tabs, Android detaches them, and a nested container then drops all of its views
        // (react-native-screens ScreenContainer.onDetachedFromWindow) and only rebuilds them
        // after it's re-attached. Going back, the tabs page would slide in blank, app bar
        // included. Plain views stay in place, so going back looks the same as going in.
        detachInactiveScreens={false}
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.brandDark,
          tabBarInactiveTintColor: colors.textSecondary,
          // No fixed height here: the navigator adds the bottom safe-area inset itself.
          tabBarStyle: { backgroundColor: colors.background, borderTopColor: colors.border },
          tabBarLabelStyle: { fontSize: 12 },
          sceneStyle: { backgroundColor: colors.background },
        }}
      >
        <Tabs.Screen
          name="events"
          options={{
            title: 'Events',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={size} color={color as string} />
            ),
          }}
        />
        <Tabs.Screen
          name="teams"
          options={{
            title: 'Teams',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? 'people' : 'people-outline'} size={size} color={color as string} />
            ),
          }}
        />
        <Tabs.Screen
          name="favorites"
          options={{
            title: 'Favorites',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? 'star' : 'star-outline'} size={size} color={color as string} />
            ),
          }}
        />
      </Tabs>
    </DrawerProvider>
  );
}
