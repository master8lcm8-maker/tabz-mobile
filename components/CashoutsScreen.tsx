// components/CashoutsScreen.tsx
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { BASE_URL } from "../lib/api";
import { ownerAuthHeaders } from "../lib/ownerToken";

type Cashout = {
  id: number;
  amountCents: number;
  status: string;
  failureReason?: string | null;
  destinationLast4?: string | null;
  createdAt: string;
};

function dollarsFromCents(cents?: number) {
  const v = Number(cents || 0) || 0;
  return `$${(v / 100).toFixed(2)}`;
}

export default function CashoutsScreen() {
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [cashouts, setCashouts] = useState<Cashout[]>([]);
  const [amountUsd, setAmountUsd] = useState("5");

  async function api(path: string, init?: RequestInit) {
    const headers = await ownerAuthHeaders();
    const res = await fetch(`${BASE_URL}${path}`, {
      ...(init || {}),
      headers: {
        ...(headers as any),
        // ensure JSON for POSTs; harmless for GET
        "Content-Type": "application/json",
      },
    });

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = (json && (json.message || json.error)) || `HTTP ${res.status}`;
      throw new Error(String(msg));
    }
    return json;
  }

  async function loadCashouts() {
    setLoading(true);
    try {
      const data = await api("/wallet/cashouts");
      setCashouts(Array.isArray(data) ? data : []);
    } catch (e: any) {
      Alert.alert("Cashouts", String(e?.message || e));
      setCashouts([]);
    } finally {
      setLoading(false);
    }
  }

  async function createCashout() {
    const value = parseFloat(String(amountUsd || "").replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(value) || value <= 0) {
      Alert.alert("Cashout", "Enter a valid amount.");
      return;
    }

    const amountCents = Math.round(value * 100);

    setPosting(true);
    try {
      await api("/wallet/cashout", {
        method: "POST",
        body: JSON.stringify({ amountCents }),
      });
      await loadCashouts();
    } catch (e: any) {
      Alert.alert("Cashout", String(e?.message || e));
    } finally {
      setPosting(false);
    }
  }

  useEffect(() => {
    loadCashouts();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Owner Cashouts</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Amount (USD)</Text>
        <TextInput
          value={amountUsd}
          onChangeText={setAmountUsd}
          keyboardType="numeric"
          style={styles.input}
        />

        <TouchableOpacity
          style={[styles.btn, posting && styles.btnDisabled]}
          onPress={createCashout}
          disabled={posting}
        >
          <Text style={styles.btnText}>{posting ? "Posting..." : "Cash Out"}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={cashouts}
        keyExtractor={(i) => String(i.id)}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.amount}>{dollarsFromCents(item.amountCents)}</Text>
            <Text style={styles.status}>{item.status}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No cashouts found.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0b0f19", padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { color: "white", fontSize: 22, fontWeight: "700", marginBottom: 12 },
  card: { backgroundColor: "#111827", padding: 14, borderRadius: 12, marginBottom: 12 },
  label: { color: "#9ca3af" },
  input: {
    backgroundColor: "#1f2937",
    color: "white",
    padding: 10,
    borderRadius: 8,
    marginVertical: 8,
  },
  btn: {
    backgroundColor: "#10b981",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { fontWeight: "bold", color: "#000" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#1f2937",
  },
  amount: { color: "white", fontWeight: "800" },
  status: { color: "#9ca3af" },
  empty: { color: "#9ca3af", paddingVertical: 16 },
});
