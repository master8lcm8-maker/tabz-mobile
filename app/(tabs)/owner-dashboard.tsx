// app/(tabs)/owner-dashboard.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

function toStr(x: any) {
  return typeof x === "string" ? x : Array.isArray(x) ? x[0] : "";
}

type WalletSummary = {
  id: number;
  userId: number;
  balanceCents: number;
  spendableBalanceCents: number;
  cashoutAvailableCents: number;
};

// ---- Base URL + Token sourcing (NO DEV HARDCODES) ----
const PROD_BASE_URL = process.env.EXPO_PUBLIC_TABZ_API_BASE_URL || "";
const ENV_BASE_URL = (process.env.EXPO_PUBLIC_BASE_URL || "").trim();
const AUTH_TOKEN_KEY = "TABZ_AUTH_TOKEN";

function getDefaultBaseUrl(): string {
  return ENV_BASE_URL || PROD_BASE_URL;
}

async function getAuthToken(): Promise<string> {
  const tok = (await AsyncStorage.getItem(AUTH_TOKEN_KEY)) || "";
  return tok.trim();
}

export default function OwnerDashboardScreen() {
  const params = useLocalSearchParams();
  const baseUrlFromUrl = toStr((params as any).baseUrl);

  // Base URL can come from URL for convenience (explicit override),
  // otherwise env/prod default (NEVER a dev IP fallback).
  const BASE_URL = useMemo(() => {
    const b = baseUrlFromUrl?.trim();
    return b && b.length > 0 ? b : getDefaultBaseUrl();
  }, [baseUrlFromUrl]);

  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [dashError, setDashError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setDashError(null);

    const token = await getAuthToken();

    if (!token) {
      setWallet(null);
      setLoading(false);
      setDashError("Not authenticated. Please log in.");
      return;
    }

    try {
      // Wallet summary
      const w = await fetch(`${BASE_URL}/wallet/summary`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!w.ok) {
        const txt = await w.text().catch(() => "");
        throw new Error(`GET /wallet/summary failed: ${w.status} ${txt}`);
      }

      const walletJson = await w.json();
      setWallet(walletJson);

      // Owner dashboard (store-items)
      const d = await fetch(`${BASE_URL}/store-items/owner/dashboard`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // If this fails, we still keep the wallet info visible
      if (!d.ok) {
        const txt = await d.text().catch(() => "");
        setDashError(
          `GET /store-items/owner/dashboard failed: ${d.status} ${txt}`
        );
      } else {
        // If you want to render dashboard data later, parse it here.
        // const dashJson = await d.json();
      }
    } catch (e: any) {
      setDashError(e?.message || "Failed to load owner dashboard");
    } finally {
      setLoading(false);
    }
  }, [BASE_URL]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.muted}>Loading dashboardâ€¦</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Owner Dashboard</Text>

      {dashError ? <Text style={styles.error}>{dashError}</Text> : null}

      <View style={styles.block}>
        <Text style={styles.blockTitle}>OWNER WALLET</Text>
        <Text style={styles.bigMoney}>
          {wallet ? `$${(wallet.balanceCents / 100).toFixed(2)}` : "$0.00"}
        </Text>
        <View style={styles.row}>
          <View style={styles.pill}>
            <Text style={styles.pillLabel}>Spendable</Text>
            <Text style={styles.pillValue}>
              {wallet
                ? `$${(wallet.spendableBalanceCents / 100).toFixed(2)}`
                : "$0.00"}
            </Text>
          </View>
          <View style={styles.pill}>
            <Text style={styles.pillLabel}>Cashout-ready</Text>
            <Text style={styles.pillValue}>
              {wallet
                ? `$${(wallet.cashoutAvailableCents / 100).toFixed(2)}`
                : "$0.00"}
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity onPress={fetchAll} style={styles.refreshBtn}>
        <Text style={styles.refreshText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 8 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  muted: { opacity: 0.7 },
  error: { color: "#ff4d4f", marginBottom: 10 },

  block: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.15)",
    borderRadius: 12,
    padding: 14,
  },
  blockTitle: { fontWeight: "700", marginBottom: 8, opacity: 0.8 },
  bigMoney: { fontSize: 28, fontWeight: "800", marginBottom: 10 },

  row: { flexDirection: "row", gap: 10 },
  pill: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  pillLabel: { fontSize: 12, opacity: 0.75 },
  pillValue: { fontSize: 16, fontWeight: "700" },

  refreshBtn: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.15)",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  refreshText: { fontWeight: "700" },
});


