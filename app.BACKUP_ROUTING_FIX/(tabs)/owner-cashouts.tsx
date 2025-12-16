import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

const API_BASE = "http://10.0.0.239:3000";

const OWNER_FALLBACK_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjMsImVtYWlsIjoib3duZXIzQHRhYnouYXBwIiwiaWF0IjoxNzY1MzM0NjA5LCJleHAiOjE3NjU5Mzk0MDl9.4ZaCbBmY0nhuBm385JzY0J7DIFtG3WPgbcfc8TLmkS4";

type PayoutStatus = "PENDING" | "COMPLETED" | "FAILED";

type Payout = {
  id: number;
  amountCents: number;
  status: PayoutStatus;
  failureReason: string | null;
  destinationLast4: string | null;
  createdAt: string;
  updatedAt: string;
};

type Summary = {
  totalCount: number;
  completedCount: number;
  failedCount: number;
  pendingCount: number;
  totalPaidOutCents: number;
  lastPayout?: Payout | null;
};

function centsToDollars(cents: number | string | null | undefined): string {
  if (cents === null || cents === undefined) return "0.00";
  const n =
    typeof cents === "number"
      ? cents
      : Number.parseInt(String(cents), 10) || 0;
  return (n / 100).toFixed(2);
}

function statusColor(status: PayoutStatus): string {
  switch (status) {
    case "COMPLETED":
      return "#15FF7F";
    case "PENDING":
      return "#FFC94A";
    case "FAILED":
    default:
      return "#FF4F4F";
  }
}

export default function OwnerCashoutsScreen() {
  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [error, setError] = useState<string | null>(null);

  const headers = {
    Authorization: `Bearer ${OWNER_FALLBACK_TOKEN}`,
    "Content-Type": "application/json",
  };

  const computeSummary = (rows: Payout[]): Summary => {
    let completedCount = 0;
    let failedCount = 0;
    let pendingCount = 0;
    let totalPaidOutCents = 0;
    let lastPayout: Payout | null = null;

    for (const p of rows) {
      if (!lastPayout) {
        lastPayout = p;
      } else if (new Date(p.createdAt) > new Date(lastPayout.createdAt)) {
        lastPayout = p;
      }

      if (p.status === "COMPLETED") {
        completedCount++;
        totalPaidOutCents += p.amountCents;
      } else if (p.status === "FAILED") {
        failedCount++;
      } else if (p.status === "PENDING") {
        pendingCount++;
      }
    }

    return {
      totalCount: rows.length,
      completedCount,
      failedCount,
      pendingCount,
      totalPaidOutCents,
      lastPayout,
    };
  };

  const [summary, setSummary] = useState<Summary>(() => computeSummary([]));

  const loadPayouts = async () => {
    try {
      setLoading(true);
      setError(null);

      // ✅ REAL BACKEND ENDPOINT
      const res = await fetch(`${API_BASE}/wallet/cashouts`, {
        headers,
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`HTTP ${res.status}: ${txt}`);
      }

      const json = (await res.json()) as Payout[];
      console.log("OWNER CASHOUTS length:", json.length);
      console.log("OWNER CASHOUTS sample:", json[0]);

      setPayouts(json);
      setSummary(computeSummary(json));
    } catch (err: any) {
      console.log("OWNER CASHOUTS LOAD ERROR:", err);
      setError(err?.message || "Failed to load cashouts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayouts();
  }, []);

  // LOADING STATE
  if (loading && payouts.length === 0) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color="#15FF7F" />
      </ThemedView>
    );
  }

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* HEADER */}
      <ThemedText type="title" style={{ marginBottom: 4 }}>
        Owner Cashouts
      </ThemedText>
      <ThemedText
        style={{
          color: "rgba(255,255,255,0.6)",
          fontSize: 13,
          marginBottom: 6,
        }}
      >
        Track every cashout created for this owner wallet.
      </ThemedText>

      {/* DEBUG LINE */}
      <ThemedText
        style={{
          color: "rgba(21,255,127,0.85)",
          fontSize: 11,
          marginBottom: 10,
        }}
      >
        Loaded {payouts.length} cashouts from backend.
      </ThemedText>

      {/* ERROR BANNER (non-blocking) */}
      {error && (
        <View style={styles.errorBanner}>
          <ThemedText style={styles.errorBannerText}>{error}</ThemedText>
        </View>
      )}

      {/* SUMMARY CARD */}
      <View style={styles.summaryCard}>
        <ThemedText style={styles.summaryLabel}>Total paid out</ThemedText>
        <ThemedText style={styles.summaryAmount}>
          ${centsToDollars(summary.totalPaidOutCents)}
        </ThemedText>

        <View style={styles.summaryRow}>
          <View style={styles.summaryPill}>
            <ThemedText style={styles.summaryPillLabel}>Completed</ThemedText>
            <ThemedText style={[styles.summaryPillValue, { color: "#15FF7F" }]}>
              {summary.completedCount}
            </ThemedText>
          </View>
          <View style={styles.summaryPill}>
            <ThemedText style={styles.summaryPillLabel}>Pending</ThemedText>
            <ThemedText style={[styles.summaryPillValue, { color: "#FFC94A" }]}>
              {summary.pendingCount}
            </ThemedText>
          </View>
          <View style={styles.summaryPill}>
            <ThemedText style={styles.summaryPillLabel}>Failed</ThemedText>
            <ThemedText style={[styles.summaryPillValue, { color: "#FF4F4F" }]}>
              {summary.failedCount}
            </ThemedText>
          </View>
        </View>

        {summary.lastPayout && (
          <View style={{ marginTop: 10 }}>
            <ThemedText style={styles.summarySmallLabel}>
              Most recent cashout
            </ThemedText>
            <ThemedText style={styles.summarySmallValue}>
              ${centsToDollars(summary.lastPayout.amountCents)} ·{" "}
              {summary.lastPayout.status.toLowerCase()}
            </ThemedText>
          </View>
        )}
      </View>

      {/* LIST HEADER */}
      <View style={styles.listHeaderRow}>
        <ThemedText style={styles.listHeaderText}>Recent cashouts</ThemedText>
        <TouchableOpacity onPress={loadPayouts} style={styles.smallRefresh}>
          <ThemedText style={styles.smallRefreshText}>Refresh</ThemedText>
        </TouchableOpacity>
      </View>

      {/* PAYOUT LIST */}
      {payouts.length === 0 ? (
        <View style={styles.emptyState}>
          <ThemedText style={styles.emptyTitle}>No cashouts yet</ThemedText>
          <ThemedText style={styles.emptySubtitle}>
            When you cash out from the Owner Wallet, cashouts will appear here.
          </ThemedText>
        </View>
      ) : (
        payouts.map((payout) => {
          const color = statusColor(payout.status);
          const created = new Date(payout.createdAt).toLocaleString();
          const last4 = payout.destinationLast4 || "????";

          return (
            <View key={payout.id} style={styles.payoutRow}>
              <View style={{ flex: 1, gap: 2 }}>
                <ThemedText style={styles.payoutAmount}>
                  ${centsToDollars(payout.amountCents)}
                </ThemedText>
                <ThemedText style={styles.payoutMeta}>
                  **** {last4} · {created}
                </ThemedText>
                {payout.failureReason && (
                  <ThemedText style={styles.payoutFailureReason}>
                    Reason: {payout.failureReason}
                  </ThemedText>
                )}
              </View>

              <View style={styles.payoutRight}>
                <View style={[styles.statusChip, { borderColor: color }]}>
                  <ThemedText style={[styles.statusChipText, { color }]}>
                    {payout.status.toLowerCase()}
                  </ThemedText>
                </View>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#05060E",
    paddingHorizontal: 18,
    paddingTop: 20,
  },
  centered: {
    flex: 1,
    backgroundColor: "#05060E",
    justifyContent: "center",
    alignItems: "center",
  },
  errorBanner: {
    backgroundColor: "rgba(255,79,79,0.15)",
    borderColor: "#FF4F4F",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 12,
  },
  errorBannerText: {
    color: "#FFB0B0",
    fontSize: 12,
  },
  errorText: {
    color: "#FF4F4F",
    fontSize: 14,
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: "#15FF7F",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: { color: "#000", fontWeight: "700" },

  summaryCard: {
    backgroundColor: "#080A15",
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "rgba(21,255,127,0.45)",
    shadowColor: "#15FF7F",
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 20,
  },
  summaryLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  summaryAmount: {
    fontSize: 28,
    fontWeight: "700",
    color: "#15FF7F",
    marginTop: 4,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
    flexWrap: "wrap",
  },
  summaryPill: {
    flexDirection: "column",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#050811",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    minWidth: 80,
  },
  summaryPillLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.65)",
  },
  summaryPillValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  summarySmallLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.55)",
    textTransform: "uppercase",
    marginTop: 4,
  },
  summarySmallValue: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
  },

  listHeaderRow: {
    marginTop: 4,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  listHeaderText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  smallRefresh: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(21,255,127,0.5)",
  },
  smallRefreshText: {
    fontSize: 11,
    color: "#15FF7F",
    fontWeight: "600",
  },

  payoutRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#080A15",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 10,
    gap: 12,
  },
  payoutAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  payoutMeta: {
    fontSize: 11,
    color: "rgba(200,220,255,0.8)",
  },
  payoutFailureReason: {
    fontSize: 11,
    color: "#FFB0B0",
  },
  payoutRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusChipText: {
    fontSize: 11,
    textTransform: "uppercase",
    fontWeight: "700",
  },

  emptyState: {
    marginTop: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: "#080A15",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: "rgba(210,220,255,0.8)",
  },
});
