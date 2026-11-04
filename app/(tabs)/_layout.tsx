import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DrawerProvider } from '../../components/Drawer';
import { colors } from '../../lib/theme';

export default function TabLayout() {
  return (
    // The drawer wraps the tab navigator so it overlays both the screen and the tab bar.
    <DrawerProvider>
      <Tabs
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
