import { useEffect, useRef, useState } from 'react';
import {
  Animated, Easing, FlatList, Modal, Platform, Pressable, StyleSheet, Text, View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing } from '../lib/theme';

export interface PickerOption {
  value: string;
  label: string;
  /** Secondary text shown after the label, e.g. a season's game name. */
  detail?: string | null;
}

const OPEN_DURATION = 260;
const CLOSE_DURATION = 200;

/**
 * Bottom-sheet single-select list used by the season / region / type filters.
 *
 * The Modal itself doesn't animate (animationType="none"); instead the backdrop fades
 * in and only the sheet slides up. The Modal stays mounted until the close animation
 * finishes so dismissing animates too.
 */
export default function PickerSheet({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: PickerOption[];
  selected: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);
  const [sheetHeight, setSheetHeight] = useState(0);
  // 0 = hidden, 1 = fully shown
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      if (mounted) {
        // Re-opened while the close animation was running: the Modal is still on
        // screen, so onShow won't fire again. Animate back in from where it is.
        animateIn();
      } else {
        progress.setValue(0);
        setMounted(true);
        // The open animation starts from the Modal's onShow, once its view exists.
      }
    } else if (mounted) {
      Animated.timing(progress, {
        toValue: 0,
        duration: CLOSE_DURATION,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  function animateIn() {
    Animated.timing(progress, {
      toValue: 1,
      duration: OPEN_DURATION,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }

  // Slide by the sheet's own height once measured (window height until then, so the
  // sheet starts off-screen on the first frame).
  const slideDistance = sheetHeight || windowHeight;
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [slideDistance, 0] });

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      onShow={animateIn}
      onRequestClose={onClose}
      // Draw edge-to-edge on Android so the safe-area insets below apply the same way as iOS.
      statusBarTranslucent={Platform.OS === 'android'}
      navigationBarTranslucent={Platform.OS === 'android'}
    >
      <View style={styles.root}>
        <Animated.View style={[styles.overlay, { opacity: progress }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        </Animated.View>
        <Animated.View
          style={[styles.sheet, { paddingBottom: insets.bottom + spacing.sm, transform: [{ translateY }] }]}
          onLayout={(e) => setSheetHeight(e.nativeEvent.layout.height)}
        >
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel="Close">
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>
          <FlatList
            // Without flexGrow: 0 the list stretches the sheet to its max height even for short lists.
            style={styles.list}
            data={options}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => {
              const isSelected = item.value === selected;
              return (
                <Pressable
                  style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
                  onPress={() => onSelect(item.value)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                >
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]} numberOfLines={1}>
                    {item.label}
                    {item.detail ? <Text style={styles.optionDetail}>{'  '}{item.detail}</Text> : null}
                  </Text>
                  {isSelected ? <Ionicons name="checkmark" size={20} color={colors.brandDark} /> : null}
                </Pressable>
              );
            }}
          />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: colors.overlay },
  sheet: {
    backgroundColor: colors.background,
    maxHeight: '65%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg + 4,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  title: { fontSize: fontSize.body + 1, fontWeight: '600', color: colors.text },
  list: { flexGrow: 0 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg + 4,
    paddingVertical: 13,
  },
  optionPressed: { backgroundColor: colors.pressed },
  optionText: { flex: 1, fontSize: fontSize.body, color: colors.text },
  optionTextSelected: { fontWeight: '600', color: colors.brandDark },
  optionDetail: { fontWeight: '400', color: colors.textSecondary, fontSize: fontSize.secondary },
});
