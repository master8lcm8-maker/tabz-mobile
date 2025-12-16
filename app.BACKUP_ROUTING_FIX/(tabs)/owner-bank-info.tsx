// app/(tabs)/owner-bank-info.tsx
import { useEffect, useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from "react-native";

const BASE_URL = "http://localhost:3000";
const TOKEN = "<OWNER_TOKEN_HERE>";

export default function OwnerBankInfo() {
  const [bank, setBank] = useState<any>(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [status, setStatus] = useState("");

  async function loadInfo() {
    try {
      const res = await fetch(`${BASE_URL}/wallet/bank-info`, {
        headers: { Authorization: `Bearer ${TOKEN}` },
      });
      const data = await res.json();
      setBank(data);
    } catch (err) {
      console.log(err);
    }
  }

  async function saveInfo() {
    try {
      const res = await fetch(`${BASE_URL}/wallet/bank-info`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${TOKEN}`,
        },
        body: JSON.stringify({ accountNumber, routingNumber }),
      });

      const data = await res.json();
      setStatus("Saved!");
      loadInfo();
    } catch (err) {
      setStatus("Error saving.");
    }
  }

  useEffect(() => {
    loadInfo();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Bank Information</Text>

      {bank?.last4 ? (
        <Text style={styles.saved}>Saved Account: •••• {bank.last4}</Text>
      ) : (
        <Text style={styles.saved}>No bank info saved.</Text>
      )}

      <TextInput
        placeholder="Routing Number"
        placeholderTextColor="#666"
        style={styles.input}
        onChangeText={setRoutingNumber}
      />

      <TextInput
        placeholder="Account Number"
        placeholderTextColor="#666"
        style={styles.input}
        secureTextEntry
        onChangeText={setAccountNumber}
      />

      <TouchableOpacity style={styles.button} onPress={saveInfo}>
        <Text style={styles.buttonText}>Save</Text>
      </TouchableOpacity>

      {status ? <Text style={styles.status}>{status}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 24, color: "#fff", marginBottom: 20, fontWeight: "bold" },
  saved: { fontSize: 16, color: "#ccc", marginBottom: 20 },
  input: {
    backgroundColor: "#222",
    color: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#0a84ff",
    padding: 14,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
  status: { marginTop: 15, color: "#0f0" },
});
