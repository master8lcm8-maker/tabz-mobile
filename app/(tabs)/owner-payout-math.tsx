// components/app/(tabs)/owner-payout-math.tsx
import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { apiGet, getAuthToken, getBaseUrl, hydrateSession } from "../../lib/api";

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

function toDollars(cents: number) {
  return (cents / 100).toFixed(2);
}

export default function OwnerPayoutMathScreen() {
  const [summaryErr, setSummaryErr] = useState<string | null>(null);
  const [metricsErr, setMetricsErr] = useState<string | null>(null);
  const [cashoutsErr, setCashoutsErr] = useState<string | null>(null);

  const [summary, setSummary] = useState<Summary | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [cashouts, setCashouts] = useState<Cashout[] | null>(null);

  async function ensureSessionReady() {
    await hydrateSession();
    const token = getAuthToken();
    if (!token) throw new Error("Not authenticated. Please log in first.");
  }

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setSummaryErr(null);
      setMetricsErr(null);
      setCashoutsErr(null);

      // Helpful console proof (no UI changes required)
      try {
        console.log("[owner-payout-math] baseUrl =", getBaseUrl());
      } catch {}

      try {
        await ensureSessionReady();
      } catch (e: any) {
        if (!cancelled) {
          const msg = String(e?.message || e);
          setSummaryErr(msg);
          setMetricsErr(msg);
          setCashoutsErr(msg);
          setSummary(null);
          setMetrics(null);
          setCashouts(null);
        }
        return;
      }

      // summary
      try {
        const s = await apiGet("/wallet/summary");
        if (!cancelled) setSummary((s || null) as any);
      } catch (e: any) {
        if (!cancelled) setSummaryErr(String(e?.message || e));
      }

      // metrics
      try {
        const m = await apiGet("/wallet/metrics");
        if (!cancelled) setMetrics((m || null) as any);
      } catch (e: any) {
        if (!cancelled) setMetricsErr(String(e?.message || e));
      }

      // cashouts
      try {
        const c = await apiGet("/wallet/cashouts");
        if (!cancelled) setCashouts(Array.isArray(c) ? (c as any) : []);
      } catch (e: any) {
        if (!cancelled) setCashoutsErr(String(e?.message || e));
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, []);

  const completedFromCashoutsCents = useMemo(() => {
    if (!cashouts || !Array.isArray(cashouts)) return 0;

    // Conservative: only count items that look "completed/paid"
    const completed = cashouts.filter((x) => {
      const st = String(x?.status || "").toLowerCase();
      return st.includes("paid") || st.includes("complete") || st.includes("completed");
    });

    return completed.reduce((sum, x) => sum + (Number(x?.amountCents || 0) || 0), 0);
  }, [cashouts]);

  const completedFromMetricsCents = useMemo(() => {
    return Number(metrics?.completedPayoutCents || 0) || 0;
  }, [metrics]);

  const deltaCents = completedFromMetricsCents - completedFromCashoutsCents;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Payout Math (Dev)</Text>
      <Text style={styles.subtitle}>
        Cross-check wallet, cashouts, and metrics for the logged-in owner.
      </Text>

      {summaryErr ? (
        <View style={[styles.alert, styles.alertBad]}>
          <Text style={styles.alertText}>summary: {summaryErr}</Text>
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

        {metricsErr ? <Text style={styles.errText}>metrics: {metricsErr}</Text> : null}
        {cashoutsErr ? <Text style={styles.errText}>cashouts: {cashoutsErr}</Text> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>WALLET SNAPSHOT</Text>
        <Text style={styles.smallMuted}>Balance</Text>
        <Text style={styles.bigMoney}>
          {summary ? `$${toDollars(Number(summary.balanceCents || 0) || 0)}` : "$0.00"}
        </Text>

        <Text style={styles.smallMuted}>Spendable</Text>
        <Text style={styles.muted}>
          {summary ? `$${toDollars(Number(summary.spendableBalanceCents || 0) || 0)}` : "$0.00"}
        </Text>

        <Text style={styles.smallMuted}>Cashout-ready</Text>
        <Text style={styles.muted}>
          {summary ? `$${toDollars(Number(summary.cashoutAvailableCents || 0) || 0)}` : "$0.00"}
        </Text>

        <Text style={styles.smallMuted}>Base URL</Text>
        <Text style={styles.muted}>{getBaseUrl()}</Text>
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
  alertBad: {
    backgroundColor: "rgba(255,0,0,0.10)",
    borderColor: "rgba(255,0,0,0.35)",
  },
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
