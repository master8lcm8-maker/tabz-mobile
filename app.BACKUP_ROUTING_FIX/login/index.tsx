// app/login/index.tsx

import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { loginWithPassword } from '../../components/lib/api';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function LoginScreen() {
  const [email, setEmail] = useState('demo@tabz.app');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    setLoading(true);

    try {
      await loginWithPassword(email.trim(), password);
      // If no error, we have a token saved – go to main home
      router.replace('/');
    } catch (err: any) {
      console.error('Login failed', err);
      const msg = err?.message || '';
      if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('unauthorized')) {
        setError('Invalid email or password');
      } else {
        setError(msg || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">TABZ Login</ThemedText>
      <ThemedText>Enter your credentials.</ThemedText>

      <View style={styles.field}>
        <ThemedText>Email</ThemedText>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
      </View>

      <View style={styles.field}>
        <ThemedText>Password</ThemedText>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>

      {error && <ThemedText style={styles.error}>{error}</ThemedText>}

      <Pressable
        onPress={handleLogin}
        disabled={loading}
        style={styles.button}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Logging in…' : 'Log in'}
        </Text>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 16,
    justifyContent: 'center',
  },
  field: {
    gap: 4,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#fff',
  },
  error: {
    color: '#ff5c5c',
    marginTop: 8,
  },
  button: {
    marginTop: 16,
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: {
    color: '#000',
    fontWeight: '600',
  },
});
