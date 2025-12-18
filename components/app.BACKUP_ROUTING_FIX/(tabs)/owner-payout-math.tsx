// app/(tabs)/owner-payout-math.tsx
// Dev-only Payout Math dashboard (read-only)
// Uses only: /wallet/summary, /wallet/cashouts, /wallet/metrics
// NO /wallet/next-payout call anymore.

import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

const API_BASE = "http://10.0.0.239:3000";

// Same Owner3 token you’re using everywhere else
const OWNER_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjMsImVtYWlsIjoib3duZXIzQHRhYnouYXBwIiwiaWF0IjoxNzY1MzM0NjA5LCJleHAiOjE3NjU5Mzk0MDl9.4ZaCbBmY0nhuBm385JzY0J7DIFtG3WPgbcfc8TLmkS4";

type WalletSummary = {
  balanceCents: number | string;
  spendableBalanceCents: number | string;
  cashoutAvailableCents: number | string;
};

type CashoutStatus = "PENDING" | "COMPLETED" | "FAILED";

type Cashout = {
  id: number;
  walletId: number;
  amountCents: number | string;
  status: CashoutStatus;
  failureReason?: string | null;
  destinationLast4?: string | null;
  createdAt: string;
};

type Metrics = {
  totalCashouts: number;
  totalCompleted: number;
  totalPending: number;
  totalFailed: number;
  totalPaidOutCents: number;
  [key: string]: any; // keep raw for debug
};

type NextPayoutView = {
  hasBalance: boolean;
  amountCents: number;
  whenLabel: string;
  detail: string;
};

const headers = {
  Authorization: `Bearer ${OWNER_TOKEN}`,
  "Content-Type": "application/json",
};

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function centsToDollars(value: number | string | null | undefined): string {
  const n = toNumber(value);
  return (n / 100).toFixed(2);
}

export default function OwnerPayoutMathScreen() {
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [cashouts, setCashouts] = useState<Cashout[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---------- LOAD EVERYTHING ----------
  const loadAll = async () => {
    try {
      setLoading(true);
      setError(null);

      const [summaryRes, cashoutsRes, metricsRes] = await Promise.all([
        fetch(`${API_BASE}/wallet/summary`, { headers }),
        fetch(`${API_BASE}/wallet/cashouts`, { headers }),
        fetch(`${API_BASE}/wallet/metrics`, { headers }),
      ]);

      if (!summaryRes.ok) {
        throw new Error(`summary HTTP ${summaryRes.status}`);
      }
      if (!cashoutsRes.ok) {
        throw new Error(`cashouts HTTP ${cashoutsRes.status}`);
      }
      if (!metricsRes.ok) {
        throw new Error(`metrics HTTP ${metricsRes.status}`);
      }

      const summaryJson = (await summaryRes.json()) as WalletSummary;
      const cashoutsJson = (await cashoutsRes.json()) as Cashout[];
      const metricsJson = (await metricsRes.json()) as Metrics;

      setSummary(summaryJson);
      setCashouts(Array.isArray(cashoutsJson) ? cashoutsJson : []);
      setMetrics(metricsJson);
    } catch (err: any) {
      console.log("PAYOUT-MATH LOAD ERROR:", err);
      setError(err?.message || "Failed to load payout math data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // ---------- DERIVED METRICS ----------
  const completedCashouts = cashouts.filter(
    (c) => c.status === "COMPLETED"
  );
  const failedCashouts = cashouts.filter((c) => c.status === "FAILED");
  const pendingCashouts = cashouts.filter((c) => c.status === "PENDING");

  const totalFromList = completedCashouts.reduce(
    (sum, c) => sum + toNumber(c.amountCents),
    0
  );

  const metricsTotalPaid = metrics ? toNumber(metrics.totalPaidOutCents) : 0;
  const crossDelta = metricsTotalPaid - totalFromList;

  // ---------- NEXT PAYOUT (DEV LOGIC, CLIENT-ONLY) ----------
  const nextPayout: NextPayoutView = (() => {
    const availableCents = summary
      ? toNumber(summary.cashoutAvailableCents)
      : 0;

    if (!summary || availableCents <= 0) {
      return {
        hasBalance: false,
        amountCents: 0,
        whenLabel: "No payout scheduled",
        detail: "No cashout-ready balance. When cashouts complete, this will simulate the next payout.",
      };
    }

    // Simple dev rule:
    // - We pretend payouts run "next business day"
    // - Amount = current cashout-ready balance
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const whenLabel = `Simulated next payout: ${tomorrow.toLocaleDateString()} (next business day)`;
    const detail = `Dev-only: uses current cashout-ready balance, does NOT move real money.`;

    return {
      hasBalance: true,
      amountCents: availableCents,
      whenLabel,
      detail,
    };
  })();

  // ---------- RENDER ----------
  if (loading && !summary && !metrics && cashouts.length === 0) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color="#15FF7F" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.page}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 18, paddingVertical: 20, paddingBottom: 40 }}
      >
        {/* TITLE */}
        <ThemedText type="title" style={{ marginBottom: 4 }}>
          Payout Math (Dev)
        </ThemedText>
        <ThemedText
          style={{
            color: "rgba(255,255,255,0.6)",
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          Cross-check wallet, cashouts, and metrics for Owner3.
        </ThemedText>

        {/* ERROR BANNER */}
        {error && (
          <View style={styles.errorBanner}>
            <ThemedText style={styles.errorBannerText}>{error}</ThemedText>
          </View>
        )}

        {/* WALLET SNAPSHOT */}
        {summary && (
          <View style={styles.card}>
            <ThemedText style={styles.sectionTitle}>Wallet snapshot</ThemedText>

            <View style={{ marginTop: 8 }}>
              <ThemedText style={styles.label}>Total balance</ThemedText>
              <ThemedText style={styles.mainNumber}>
                ${centsToDollars(summary.balanceCents)}
              </ThemedText>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.label}>Spendable inside TABZ</ThemedText>
                <ThemedText style={styles.value}>
                  ${centsToDollars(summary.spendableBalanceCents)}
                </ThemedText>
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.label}>Cashout-ready</ThemedText>
                <ThemedText style={[styles.value, { color: "#15FF7F" }]}>
                  ${centsToDollars(summary.cashoutAvailableCents)}
                </ThemedText>
              </View>
            </View>
          </View>
        )}

        {/* METRICS SNAPSHOT */}
        {metrics && (
          <View style={styles.card}>
            <ThemedText style={styles.sectionTitle}>Metrics snapshot</ThemedText>

            <View style={styles.metricsRow}>
              <View style={styles.metricsBlock}>
                <ThemedText style={styles.label}>Total cashouts</ThemedText>
                <ThemedText style={styles.value}>{metrics.totalCashouts}</ThemedText>
              </View>
              <View style={styles.metricsBlock}>
                <ThemedText style={styles.label}>Completed</ThemedText>
                <ThemedText style={[styles.value, { color: "#15FF7F" }]}>
                  {metrics.totalCompleted}
                </ThemedText>
              </View>
            </View>

            <View style={styles.metricsRow}>
              <View style={styles.metricsBlock}>
                <ThemedText style={styles.label}>Pending</ThemedText>
                <ThemedText style={[styles.value, { color: "#FFC94A" }]}>
                  {metrics.totalPending}
                </ThemedText>
              </View>
              <View style={styles.metricsBlock}>
                <ThemedText style={styles.label}>Failed</ThemedText>
                <ThemedText style={[styles.value, { color: "#FF4F4F" }]}>
                  {metrics.totalFailed}
                </ThemedText>
              </View>
            </View>

            <View style={[styles.metricsRow, { marginTop: 10 }]}>
              <View style={styles.metricsBlock}>
                <ThemedText style={styles.label}>Total paid out</ThemedText>
                <ThemedText style={[styles.value, { color: "#15FF7F" }]}>
                  ${centsToDollars(metrics.totalPaidOutCents)}
                </ThemedText>
              </View>
            </View>
          </View>
        )}

        {/* CROSS-CHECK */}
        <View style={styles.card}>
          <ThemedText style={styles.sectionTitle}>Cross-check</ThemedText>

          <ThemedText style={styles.smallLabel}>
            Completed payouts list vs metrics.totalPaidOutCents
          </ThemedText>

          <View style={{ marginTop: 8 }}>
            <ThemedText style={styles.label}>Completed from cashouts list</ThemedText>
            <ThemedText style={styles.value}>
              {completedCashouts.length} · ${centsToDollars(totalFromList)}
            </ThemedText>
          </View>

          <View style={{ marginTop: 8 }}>
            <ThemedText style={styles.label}>Total from metrics</ThemedText>
            <ThemedText style={styles.value}>
              ${centsToDollars(metricsTotalPaid)}
            </ThemedText>
          </View>

          <View style={{ marginTop: 8 }}>
            <ThemedText style={styles.label}>Delta</ThemedText>
            <ThemedText
              style={[
                styles.value,
                { color: crossDelta === 0 ? "#15FF7F" : "#FFC94A" },
              ]}
            >
              {crossDelta === 0
                ? "0 (perfect match)"
                : `${crossDelta > 0 ? "+" : ""}${centsToDollars(
                    crossDelta
                  )} difference`}
            </ThemedText>
          </View>

          {completedCashouts[0] && (
            <View style={{ marginTop: 10 }}>
              <ThemedText style={styles.smallLabel}>Last from list</ThemedText>
              <ThemedText style={styles.smallValue}>
                ${centsToDollars(completedCashouts[0].amountCents)} ·{" "}
                {completedCashouts[0].status.toLowerCase()} ·{" "}
                {new Date(completedCashouts[0].createdAt).toLocaleString()}
              </ThemedText>
            </View>
          )}
        </View>

        {/* NEXT PAYOUT (DEV, NO API CALL) */}
        <View style={styles.card}>
          <ThemedText style={styles.sectionTitle}>Next payout</ThemedText>

          <ThemedText style={styles.label}>Simulated amount</ThemedText>
          <ThemedText style={[styles.mainNumber, { fontSize: 22 }]}>
            ${centsToDollars(nextPayout.amountCents)}
          </ThemedText>

          <View style={{ marginTop: 8 }}>
            <ThemedText style={styles.smallLabel}>When</ThemedText>
            <ThemedText style={styles.smallValue}>
              {nextPayout.whenLabel}
            </ThemedText>
          </View>

          <View style={{ marginTop: 6 }}>
            <ThemedText style={styles.smallLabel}>Notes</ThemedText>
            <ThemedText style={styles.smallValue}>{nextPayout.detail}</ThemedText>
          </View>
        </View>

        {/* RAW DEBUG (METRICS JSON) */}
        {metrics && (
          <View style={styles.card}>
            <ThemedText style={styles.sectionTitle}>Raw debug</ThemedText>
            <ThemedText style={styles.smallLabel}>metrics JSON</ThemedText>
            <ThemedText
              style={{
                marginTop: 6,
                fontSize: 10,
                color: "rgba(200,220,255,0.85)",
                fontFamily: "monospace",
              }}
            >
              {JSON.stringify(metrics, null, 2)}
            </ThemedText>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#05060E",
  },
  centered: {
    flex: 1,
    backgroundColor: "#05060E",
    justifyContent: "center",
    alignItems: "center",
  },
  errorBanner: {
    backgroundColor: "rgba(255,79,79,0.18)",
    borderColor: "#FF4F4F",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 14,
  },
  errorBannerText: {
    color: "#FFB0B0",
    fontSize: 12,
  },
  card: {
    backgroundColor: "#080A15",
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255,255,255,0.9)",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    color: "rgba(255,255,255,0.65)",
  },
  mainNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  value: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  row: {
    flexDirection: "row",
    marginTop: 8,
    gap: 12,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 14,
    marginTop: 8,
  },
  metricsBlock: {
    flex: 1,
    gap: 2,
  },
  smallLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.55)",
  },
  smallValue: {
    fontSize: 11,
    color: "rgba(210,220,255,0.9)",
  },
});
