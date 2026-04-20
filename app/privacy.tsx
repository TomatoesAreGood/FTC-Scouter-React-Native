import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PrivacyScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </Pressable>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.heading}>Privacy Policy</Text>
        <Text style={styles.date}>Last updated: 2024</Text>
        <Text style={styles.paragraph}>
          FTC ScoutMaster does not collect, store, or share any personal information beyond what is
          necessary to use the FTC Events API.
        </Text>
        <Text style={styles.paragraph}>
          Your API credentials (username and token) are stored locally on your device only and are
          never transmitted to any server other than the official FTC Events API
          (ftc-api.firstinspires.org).
        </Text>
        <Text style={styles.paragraph}>
          Favorited events and teams are stored locally on your device and are not shared with any
          third parties.
        </Text>
        <Text style={styles.paragraph}>
          This app does not use analytics, advertising, or any third-party tracking services.
        </Text>
        <Text style={styles.paragraph}>
          All data displayed in this app is sourced from the FIRST Tech Challenge Events API, which
          is publicly accessible with a free account.
        </Text>
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
  heading: { fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  date: { fontSize: 13, color: '#888', marginBottom: 20 },
  paragraph: { fontSize: 15, color: '#444', lineHeight: 22, marginBottom: 16 },
});
