// app/(tabs)/owner-payout-math.tsx
import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";

type Metrics = {
  completedPayoutCents?: number;
  // add fields later if needed; keep permissive for now
  [k: string]: any;
};

type Cashout = {
  amountCents?: number;
  status?: string;
  [k: string]: any;
};

type Summary = {
  id?: number;
  userId?: number;
  balanceCents?: number;
  cashoutAvailableCents?: number;
  spendableBalanceCents?: number;
  [k: string]: any;
};

// ✅ SINGLE SOURCE OF TRUTH (from your PowerShell output)
const OWNER_FRESH_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjMsImVtYWlsIjoib3duZXIzQHRhYnouYXBwIiwicm9sZSI6ImJ1eWVyIiwiaWF0IjoxNzY1NTkzNDg4LCJleHAiOjE3NjYxOTgyODh9.5dP5v6k_mmyCVRzIhLyFE00lV6kaV8SWFpLhtGMJJs4";

// Your browser is currently calling 10.0.0.239:3000 (per DevTools)
// Keep default aligned to what you're actually hitting to avoid split-brain.
const DEFAULT_BASE_URL = "http://10.0.0.239:3000";

function toDollars(cents: number) {
  return (cents / 100).toFixed(2);
}

export default function OwnerPayoutMathScreen() {
  const params = useLocalSearchParams();

  const baseUrl = useMemo(() => {
    const p = params?.baseUrl;
    return typeof p === "string" && p.startsWith("http") ? p : DEFAULT_BASE_URL;
  }, [params]);

  const token = useMemo(() => {
    const incoming = params?.token;
    if (typeof incoming === "string" && incoming.startsWith("eyJ")) {
      // If the screen is being fed a stale token via URL, it will show up here.
      // We force the verified PowerShell token unless it's the exact same value.
      if (incoming !== OWNER_FRESH_TOKEN) {
        console.warn(
          "[owner-payout-math] Incoming token does not match PowerShell token. Forcing PowerShell token."
        );
        return OWNER_FRESH_TOKEN;
      }
      return incoming;
    }
    return OWNER_FRESH_TOKEN;
  }, [params]);

  const [summaryErr, setSummaryErr] = useState<string | null>(null);
  const [metricsErr, setMetricsErr] = useState<string | null>(null);
  const [cashoutsErr, setCashoutsErr] = useState<string | null>(null);

  const [summary, setSummary] = useState<Summary | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [cashouts, setCashouts] = useState<Cashout[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchJson(path: string) {
      const url = `${baseUrl}${path}`;
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const text = await res.text();
      let data: any = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = text;
      }

      if (!res.ok) {
        const msg =
          typeof data === "object" && data?.message
            ? data.message
            : `HTTP ${res.status}`;
        throw new Error(msg);
      }

      return data;
    }

    async function run() {
      setSummaryErr(null);
      setMetricsErr(null);
      setCashoutsErr(null);

      // Helpful console proof (no UI changes required)
      console.log("[owner-payout-math] baseUrl =", baseUrl);
      console.log(
        "[owner-payout-math] token(first20) =",
        token.slice(0, 20),
        "..."
      );

      try {
        const s = await fetchJson("/wallet/summary");
        if (!cancelled) setSummary(s);
      } catch (e: any) {
        if (!cancelled) setSummaryErr(String(e?.message || e));
      }

      try {
        const m = await fetchJson("/wallet/metrics");
        if (!cancelled) setMetrics(m);
      } catch (e: any) {
        if (!cancelled) setMetricsErr(String(e?.message || e));
      }

      try {
        const c = await fetchJson("/wallet/cashouts");
        if (!cancelled) setCashouts(Array.isArray(c) ? c : []);
      } catch (e: any) {
        if (!cancelled) setCashoutsErr(String(e?.message || e));
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [baseUrl, token]);

  const completedFromCashoutsCents = useMemo(() => {
    if (!cashouts || !Array.isArray(cashouts)) return 0;
    // Keep conservative: only count items that look "completed/paid"
    const completed = cashouts.filter((x) => {
      const st = String(x?.status || "").toLowerCase();
      return st.includes("paid") || st.includes("complete") || st.includes("completed");
    });
    return completed.reduce((sum, x) => sum + (Number(x?.amountCents || 0) || 0), 0);
  }, [cashouts]);

  const completedFromMetricsCents = useMemo(() => {
    const v = Number(metrics?.completedPayoutCents || 0) || 0;
    return v;
  }, [metrics]);

  const deltaCents = completedFromMetricsCents - completedFromCashoutsCents;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Payout Math (Dev)</Text>
      <Text style={styles.subtitle}>
        Cross-check wallet, cashouts, and metrics for Owner3.
      </Text>

      {summaryErr ? (
        <View style={[styles.alert, styles.alertBad]}>
          <Text style={styles.alertText}>summary HTTP {summaryErr}</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>CROSS-CHECK</Text>

        <Text style={styles.rowLabel}>Completed payouts list vs metrics total</Text>

        <View style={styles.row}>
          <Text style={styles.rowKey}>Completed from cashouts list</Text>
          <Text style={styles.rowVal}>${toDollars(completedFromCashoutsCents)}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.rowKey}>Total from metrics</Text>
          <Text style={styles.rowVal}>${toDollars(completedFromMetricsCents)}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.rowKey}>Delta</Text>
          <Text style={styles.rowVal}>
            {deltaCents === 0 ? "0 (perfect match)" : `$${toDollars(deltaCents)}`}
          </Text>
        </View>

        {metricsErr ? (
          <Text style={styles.errText}>metrics: {metricsErr}</Text>
        ) : null}
        {cashoutsErr ? (
          <Text style={styles.errText}>cashouts: {cashoutsErr}</Text>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>NEXT PAYOUT</Text>
        <Text style={styles.smallMuted}>Simulated amount</Text>
        <Text style={styles.bigMoney}>$0.00</Text>
        <Text style={styles.smallMuted}>When</Text>
        <Text style={styles.muted}>No payout scheduled</Text>
        <Text style={styles.smallMuted}>Notes</Text>
        <Text style={styles.muted}>
          No cashout-ready balance. When cashouts complete, this will simulate the next payout.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#070A12" },
  container: { padding: 16, paddingBottom: 28 },
  title: { color: "white", fontSize: 22, fontWeight: "700", marginBottom: 4 },
  subtitle: { color: "#9AA4B2", marginBottom: 12 },

  alert: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  alertBad: { backgroundColor: "rgba(255,0,0,0.10)", borderColor: "rgba(255,0,0,0.35)" },
  alertText: { color: "#FF6B6B", fontWeight: "600" },

  card: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  cardTitle: { color: "white", fontWeight: "700", marginBottom: 10 },
  rowLabel: { color: "#9AA4B2", marginBottom: 10 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  rowKey: { color: "#D7DBE3" },
  rowVal: { color: "white", fontWeight: "700" },

  bigMoney: { color: "white", fontSize: 28, fontWeight: "800", marginTop: 6, marginBottom: 8 },
  muted: { color: "#B9C2CF" },
  smallMuted: { color: "#9AA4B2", marginTop: 8 },

  errText: { color: "#FF6B6B", marginTop: 8 },
});
