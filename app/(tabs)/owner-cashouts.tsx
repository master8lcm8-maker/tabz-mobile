// components/app/(tabs)/owner-cashouts.tsx
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

import {
  apiGet,
  apiPost,
  getAuthToken,
  getBaseUrl,
  hydrateSession,
} from "../../lib/api";

type Cashout = {
  id: number;
  walletId?: number;
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

export default function OwnerCashoutsTab() {
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [cashouts, setCashouts] = useState<Cashout[]>([]);
  const [amountUsd, setAmountUsd] = useState("5");

  async function ensureSessionReady() {
    // Safe to call repeatedly; releases hydration gate.
    await hydrateSession();

    const token = getAuthToken();
    if (!token) {
      throw new Error("Not authenticated. Please log in first.");
    }
  }

  async function loadCashouts() {
    setLoading(true);
    try {
      await ensureSessionReady();
      const list = await apiGet("/wallet/cashouts");
      setCashouts(Array.isArray(list) ? (list as Cashout[]) : []);
    } catch (e: any) {
      Alert.alert("Load failed", String(e?.message || e));
      setCashouts([]);
    } finally {
      setLoading(false);
    }
  }

  async function createCashout() {
    const usd = Number(String(amountUsd || "").replace(/[^0-9.]/g, ""));
    if (!isFinite(usd) || usd <= 0) {
      Alert.alert("Invalid amount", "Enter a positive USD amount.");
      return;
    }

    const amountCents = Math.round(usd * 100);

    setPosting(true);
    try {
      await ensureSessionReady();
      await apiPost("/wallet/cashout", { amountCents });

      await loadCashouts();
      Alert.alert(
        "Success",
        `Cashout created for ${dollarsFromCents(amountCents)}.`
      );
    } catch (e: any) {
      Alert.alert("Cashout failed", String(e?.message || e));
    } finally {
      setPosting(false);
    }
  }

  useEffect(() => {
    loadCashouts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          placeholder="5"
          placeholderTextColor="#6b7280"
          style={styles.input}
        />

        <TouchableOpacity
          style={[styles.btn, posting ? styles.btnDisabled : null]}
          onPress={createCashout}
          disabled={posting}
        >
          <Text style={styles.btnText}>{posting ? "Posting..." : "Cash Out"}</Text>
        </TouchableOpacity>

        <Text style={styles.note}>
          Uses: GET {getBaseUrl()}/wallet/cashouts and POST {getBaseUrl()}/wallet/cashout
        </Text>
      </View>

      <FlatList
        data={cashouts}
        keyExtractor={(i) => String(i.id)}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.amount}>{dollarsFromCents(item.amountCents)}</Text>
              <Text style={styles.meta}>{String(item.createdAt || "")}</Text>
              {item.failureReason ? (
                <Text style={styles.fail}>Reason: {String(item.failureReason)}</Text>
              ) : null}
            </View>
            <Text style={styles.status}>{String(item.status || "").toUpperCase()}</Text>
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
  title: { color: "white", fontSize: 22, marginBottom: 12, fontWeight: "700" },

  card: {
    backgroundColor: "#111827",
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
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
  note: { color: "#9ca3af", marginTop: 10, fontSize: 12 },

  sep: { height: 1, backgroundColor: "#1f2937" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  amount: { color: "white", fontWeight: "800" },
  meta: { color: "#9ca3af", fontSize: 12, marginTop: 2 },
  fail: { color: "#fca5a5", fontSize: 12, marginTop: 4 },
  status: { color: "#d1d5db", fontWeight: "800", marginLeft: 12 },
  empty: { color: "#9ca3af", paddingTop: 8 },
});
