import {
  Alert, Animated, Modal, Pressable, StyleSheet, Text, TouchableWithoutFeedback, View,
} from 'react-native';
import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { logOut } from '../lib/storage';

interface DrawerMenuProps {
  visible: boolean;
  onClose: () => void;
}

export default function DrawerMenu({ visible, onClose }: DrawerMenuProps) {
  const router = useRouter();
  const slideAnim = useRef(new Animated.Value(-280)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -280,
        duration: 180,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  function navigate(path: string) {
    onClose();
    setTimeout(() => router.push(path as any), 200);
  }

  function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          onClose();
          await logOut();
          setTimeout(() => router.replace('/(auth)/login'), 200);
        },
      },
    ]);
  }

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>
      <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
        <View style={styles.drawerHeader}>
          <Text style={styles.drawerTitle}>FTC ScoutMaster</Text>
        </View>
        <DrawerItem icon="settings-outline" label="Settings" onPress={() => navigate('/settings')} />
        <DrawerItem icon="information-circle-outline" label="About Us" onPress={() => navigate('/about')} />
        <DrawerItem icon="shield-checkmark-outline" label="Privacy Policy" onPress={() => navigate('/privacy')} />
        <DrawerItem icon="flag-outline" label="Report a Problem" onPress={() => navigate('/report')} />
        <View style={styles.divider} />
        <DrawerItem icon="log-out-outline" label="Sign Out" onPress={handleSignOut} color="#c00" />
      </Animated.View>
    </Modal>
  );
}

function DrawerItem({
  icon,
  label,
  onPress,
  color = '#000',
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
}) {
  return (
    <Pressable style={styles.item} onPress={onPress}>
      <Ionicons name={icon} size={22} color={color} style={styles.itemIcon} />
      <Text style={[styles.itemLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 280,
    backgroundColor: '#fff',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  drawerHeader: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#90EE90',
  },
  drawerTitle: { fontSize: 20, fontWeight: 'bold', color: '#000' },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  itemIcon: { marginRight: 16 },
  itemLabel: { fontSize: 16 },
  divider: { height: 1, backgroundColor: '#e0e0e0', marginVertical: 4 },
});
