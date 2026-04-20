import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const CONTACT_EMAIL = 'jonwu333@gmail.com';

export default function ReportScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </Pressable>
        <Text style={styles.headerTitle}>Report a Problem</Text>
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.heading}>Having an issue?</Text>
        <Text style={styles.paragraph}>
          If you encounter a bug, incorrect data, or have a feature request, please reach out via
          email. Include as much detail as possible about the issue.
        </Text>
        <Pressable
          style={styles.emailBtn}
          onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}?subject=FTC ScoutMaster - Report`)}
        >
          <Ionicons name="mail-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.emailBtnText}>{CONTACT_EMAIL}</Text>
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
  heading: { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  paragraph: { fontSize: 15, color: '#444', lineHeight: 22, marginBottom: 24 },
  emailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#70C5E8',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignSelf: 'flex-start',
  },
  emailBtnText: { color: '#fff', fontSize: 15 },
});
