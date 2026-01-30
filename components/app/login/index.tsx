// app/login/index.tsx
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View, Platform } from "react-native";
import { loginWithPassword, setBaseUrl } from "../../components/lib/api";

export default function LoginScreen() {
  const [email, setEmail] = useState("buyer@tabz.app");
  const [password, setPassword] = useState("password");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    setLoading(true);

    try {
      // Ensure correct backend before login      // WEB must use DigitalOcean; native can use LAN dev backend
      if (Platform.OS !== "web") setBaseUrl("http://10.0.0.239:3000");
      await loginWithPassword(email.trim(), password);

      // Go to TABZ (tabs group)
      router.replace("/");
    } catch (err: any) {
      const msg = err?.message || "Login failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>TABZ Login</Text>
      <Text style={styles.sub}>Enter your credentials.</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable onPress={handleLogin} disabled={loading} style={styles.button}>
        <Text style={styles.buttonText}>{loading ? "Logging in…" : "Log in"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 16, justifyContent: "center" },
  title: { fontSize: 28, fontWeight: "700", color: "#fff" },
  sub: { color: "#aaa" },
  field: { gap: 6, marginTop: 10 },
  label: { color: "#ddd" },
  input: {
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#fff",
  },
  error: { color: "#ff5c5c", marginTop: 8 },
  button: {
    marginTop: 16,
    backgroundColor: "#fff",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { color: "#000", fontWeight: "700" },
});
