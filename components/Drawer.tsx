import {
  Alert, Animated, BackHandler, PanResponder, Pressable, StyleSheet, Text, View,
  useWindowDimensions,
} from 'react-native';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { colors, fontSize, spacing } from '../lib/theme';

/**
 * Side drawer for the tab screens.
 *
 * Rendered once, above the tab navigator (see app/(tabs)/_layout.tsx), as an in-tree
 * overlay rather than a <Modal>. That keeps it in the same native window as the
 * navigators, so pushing a route while it closes needs no timers, the close
 * animation actually plays, and safe-area insets apply the same way on iOS and Android.
 */

interface DrawerContextType {
  open: () => void;
  close: () => void;
}

const DrawerContext = createContext<DrawerContextType | null>(null);

export function useDrawer(): DrawerContextType {
  const ctx = useContext(DrawerContext);
  if (!ctx) throw new Error('useDrawer must be used inside DrawerProvider');
  return ctx;
}

const OPEN_DURATION = 220;
const CLOSE_DURATION = 180;

export function DrawerProvider({ children }: { children: React.ReactNode }) {
  const { width: screenWidth } = useWindowDimensions();
  const drawerWidth = Math.min(300, Math.round(screenWidth * 0.8));

  // 0 = closed, 1 = fully open
  const progress = useRef(new Animated.Value(0)).current;
  const [isOpen, setIsOpen] = useState(false);
  // Stays true until the close animation finishes so the overlay can animate out.
  const [mounted, setMounted] = useState(false);

  const animateTo = useCallback((toValue: 0 | 1) => {
    Animated.timing(progress, {
      toValue,
      duration: toValue === 1 ? OPEN_DURATION : CLOSE_DURATION,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && toValue === 0) setMounted(false);
    });
  }, [progress]);

  const open = useCallback(() => {
    setMounted(true);
    setIsOpen(true);
    animateTo(1);
  }, [animateTo]);

  const close = useCallback(() => {
    setIsOpen(false);
    animateTo(0);
  }, [animateTo]);

  // Android hardware back closes the drawer instead of leaving the screen.
  useEffect(() => {
    if (!isOpen) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      close();
      return true;
    });
    return () => sub.remove();
  }, [isOpen, close]);

  // Swipe left on the drawer to close it.
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => g.dx < -8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
        onPanResponderMove: (_, g) => {
          progress.setValue(Math.max(0, Math.min(1, 1 + g.dx / drawerWidth)));
        },
        onPanResponderRelease: (_, g) => {
          if (g.dx < -drawerWidth / 3 || g.vx < -0.5) close();
          else animateTo(1);
        },
        onPanResponderTerminate: () => animateTo(1),
      }),
    [progress, drawerWidth, close, animateTo]
  );

  const value = useMemo(() => ({ open, close }), [open, close]);

  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [-drawerWidth, 0] });

  return (
    <DrawerContext.Provider value={value}>
      <View style={styles.root}>
        {children}
        {mounted && (
          <View style={StyleSheet.absoluteFill} pointerEvents={isOpen ? 'auto' : 'none'}>
            <Animated.View style={[styles.overlay, { opacity: progress }]}>
              <Pressable
                style={StyleSheet.absoluteFill}
                onPress={close}
                accessibilityRole="button"
                accessibilityLabel="Close menu"
              />
            </Animated.View>
            <Animated.View
              style={[styles.drawer, { width: drawerWidth, transform: [{ translateX }] }]}
              accessibilityViewIsModal
              {...panResponder.panHandlers}
            >
              <DrawerContent onClose={close} />
            </Animated.View>
          </View>
        )}
      </View>
    </DrawerContext.Provider>
  );
}

function DrawerContent({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const app = useApp();
  const insets = useSafeAreaInsets();

  function navigate(path: '/settings' | '/about' | '/privacy' | '/report') {
    onClose();
    router.push(path);
  }

  function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          onClose();
          app.signOut();
        },
      },
    ]);
  }

  return (
    <View style={styles.content}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <Text style={styles.appName}>FTC ScoutMaster</Text>
        {app.user ? (
          <Text style={styles.signedIn} numberOfLines={1}>Signed in as {app.user}</Text>
        ) : null}
      </View>
      <View style={styles.items}>
        <DrawerItem icon="settings-outline" label="Settings" onPress={() => navigate('/settings')} />
        <DrawerItem icon="information-circle-outline" label="About" onPress={() => navigate('/about')} />
        <DrawerItem icon="shield-checkmark-outline" label="Privacy Policy" onPress={() => navigate('/privacy')} />
        <DrawerItem icon="flag-outline" label="Report a Problem" onPress={() => navigate('/report')} />
      </View>
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}>
        <DrawerItem icon="log-out-outline" label="Sign Out" onPress={handleSignOut} color={colors.danger} />
      </View>
    </View>
  );
}

function DrawerItem({
  icon,
  label,
  onPress,
  color = colors.text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <Ionicons name={icon} size={22} color={color === colors.text ? colors.textSecondary : color} style={styles.itemIcon} />
      <Text style={[styles.itemLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: colors.overlay },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: colors.background,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  content: { flex: 1 },
  header: {
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.xl - 4,
    backgroundColor: colors.brand,
  },
  appName: { fontSize: fontSize.title + 1, fontWeight: '700', color: colors.text },
  signedIn: { fontSize: fontSize.secondary, color: '#2f4a2f', marginTop: 4 },
  items: { flex: 1, paddingTop: spacing.sm },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.xs,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: spacing.xl - 4,
  },
  itemPressed: { backgroundColor: colors.pressed },
  itemIcon: { marginRight: spacing.lg + 4 },
  itemLabel: { fontSize: fontSize.body + 1 },
});
