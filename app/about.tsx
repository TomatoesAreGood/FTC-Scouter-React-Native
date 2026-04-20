import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AboutScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </Pressable>
        <Text style={styles.headerTitle}>About Us</Text>
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.appName}>FTC ScoutMaster</Text>
        <Text style={styles.version}>Version 1.0.0</Text>
        <Text style={styles.paragraph}>
          FTC ScoutMaster is a minimalistic archiver for FTC (FIRST Tech Challenge) teams and events.
          It uses the official FTC Events API to provide up-to-date information about events,
          team rankings, match schedules, and awards.
        </Text>
        <Text style={styles.paragraph}>
          Developed by Jon Wu. For questions or feedback, please use the "Report a Problem" option
          in the menu.
        </Text>
        <Pressable onPress={() => Linking.openURL('https://ftc-events.firstinspires.org/services/API')}>
          <Text style={styles.link}>FTC Events API</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#90EE90',
  },
  backBtn: { marginRight: 12 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  body: { padding: 24 },
  appName: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  version: { fontSize: 14, color: '#666', marginBottom: 20 },
  paragraph: { fontSize: 15, color: '#444', lineHeight: 22, marginBottom: 16 },
  link: { fontSize: 15, color: '#0066cc', textDecorationLine: 'underline' },
});
