import { useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { validateCredentials } from '../../lib/api';
import { setSavedUser, setSavedToken } from '../../lib/storage';
import { useApp } from '../../context/AppContext';

export default function LoginScreen() {
  const router = useRouter();
  const app = useApp();
  const [username, setUsername] = useState('');
  const [tokenVal, setTokenVal] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    const valid = await validateCredentials(username.trim(), tokenVal.trim());
    setLoading(false);
    if (valid) {
      await setSavedUser(username.trim());
      await setSavedToken(tokenVal.trim());
      app.setCredentials(username.trim(), tokenVal.trim()); // update context so AuthGate allows through
      router.replace('/(tabs)/events');
    } else {
      Alert.alert('Invalid user/token', 'Please check your credentials and try again.');
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Login</Text>
        <Text style={styles.subtitle}>
          A free FTC API account is needed to access this app. This sign-up is a one time thing.
        </Text>

        <View style={styles.iconCircle}>
          <Ionicons name="person" size={80} color="#fff" />
        </View>

        <InputField
          icon="person-outline"
          placeholder="User"
          value={username}
          onChangeText={setUsername}
        />
        <View style={{ height: 20 }} />
        <InputField
          icon="key-outline"
          placeholder="Token"
          value={tokenVal}
          onChangeText={setTokenVal}
        />

        <View style={{ height: 40 }} />

        <Pressable
          style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginBtnText}>Log in</Text>
          )}
        </Pressable>

        <Pressable onPress={() => router.push('/(auth)/create-account')}>
          <Text style={styles.linkText}>Create an account</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function InputField({
  icon,
  placeholder,
  value,
  onChangeText,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
}) {
  return (
    <View style={inputStyles.wrapper}>
      <Ionicons name={icon} size={20} color="#555" style={inputStyles.icon} />
      <TextInput
        style={inputStyles.input}
        placeholder={placeholder}
        placeholderTextColor="#999"
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.length > 0 && (
        <Pressable onPress={() => onChangeText('')}>
          <Ionicons name="close" size={20} color="#555" />
        </Pressable>
      )}
    </View>
  );
}

const inputStyles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 10,
    width: '100%',
  },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#000' },
});

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  title: { fontSize: 36, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { fontSize: 15, textAlign: 'center', color: '#444', marginBottom: 30 },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  loginBtn: {
    backgroundColor: '#70C5E8',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 40,
    marginBottom: 12,
    minWidth: 140,
    alignItems: 'center',
  },
  loginBtnDisabled: { opacity: 0.6 },
  loginBtnText: { color: '#fff', fontSize: 20 },
  linkText: { fontSize: 16, color: '#000', textDecorationLine: 'underline', marginTop: 4 },
});
