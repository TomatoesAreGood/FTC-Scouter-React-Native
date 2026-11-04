import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize } from '../lib/theme';

/**
 * Horizontal underline tabs. Tabs stretch to fill the width when they fit and
 * scroll horizontally on narrow screens.
 */
export default function TabStrip({
  tabs,
  selectedIndex,
  onSelect,
}: {
  tabs: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        // ScrollView defaults to flexGrow: 1, which would stretch this strip to fill the
        // screen and squeeze the content below it to zero height.
        style={styles.scroll}
        contentContainerStyle={styles.content}
      >
        {tabs.map((tab, i) => {
          const selected = i === selectedIndex;
          return (
            <Pressable
              key={tab}
              onPress={() => onSelect(i)}
              style={({ pressed }) => [styles.tab, pressed && styles.tabPressed]}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
            >
              <Text style={[styles.label, selected && styles.labelSelected]}>{tab}</Text>
              <View style={[styles.indicator, selected && styles.indicatorSelected]} />
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  scroll: { flexGrow: 0 },
  content: { flexGrow: 1 },
  tab: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  tabPressed: { backgroundColor: colors.surfaceMuted },
  label: { fontSize: fontSize.secondary + 1, color: colors.textSecondary, fontWeight: '500' },
  labelSelected: { color: colors.brandDark, fontWeight: '600' },
  indicator: { height: 3, alignSelf: 'stretch', marginTop: 10, backgroundColor: 'transparent' },
  indicatorSelected: { backgroundColor: colors.brandDark },
});
