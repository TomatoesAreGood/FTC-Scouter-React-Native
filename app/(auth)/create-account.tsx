import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const API_REGISTER = 'https://ftc-events.firstinspires.org/services/API/register';
const API_INFO = 'https://ftc-events.firstinspires.org/services/API';

export default function CreateAccountScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </Pressable>
        <Text style={styles.headerTitle}>Create Account</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.heading}>Getting Your FTC API Credentials</Text>
        <Text style={styles.paragraph}>
          To use FTC ScoutMaster, you need a free account from the FTC Events API. Follow these steps:
        </Text>
        <Text style={styles.step}>1. Visit the FTC Events API registration page.</Text>
        <Text style={styles.step}>2. Fill out the registration form with your information.</Text>
        <Text style={styles.step}>3. You will receive your username and API token via email.</Text>
        <Text style={styles.step}>4. Enter those credentials in the login screen.</Text>

        <Pressable style={styles.linkBtn} onPress={() => Linking.openURL(API_REGISTER)}>
          <Text style={styles.linkBtnText}>Go to Registration Page</Text>
        </Pressable>

        <Text style={styles.paragraph}>
          For more information about the FTC Events API:
        </Text>
        <Pressable onPress={() => Linking.openURL(API_INFO)}>
          <Text style={styles.link}>{API_INFO}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backBtn: { marginRight: 12 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  body: { padding: 24 },
  heading: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  paragraph: { fontSize: 15, color: '#444', marginBottom: 16, lineHeight: 22 },
  step: { fontSize: 15, color: '#333', marginBottom: 8, paddingLeft: 8 },
  linkBtn: {
    backgroundColor: '#70C5E8',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginVertical: 20,
  },
  linkBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  link: { color: '#0066cc', fontSize: 14, textDecorationLine: 'underline' },
});
