// app/(tabs)/owner-wallet.tsx
// Owner Wallet with custom cashout amount + recent cashouts (from /wallet/cashouts)

import React, { useEffect, useState } from "react";
import {
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

const API_BASE = "http://10.0.0.239:3000";

const OWNER_FALLBACK_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjMsImVtYWlsIjoib3duZXIzQHRhYnouYXBwIiwiaWF0IjoxNzY1MzM0NjA5LCJleHAiOjE3NjU5Mzk0MDl9.4ZaCbBmY0nhuBm385JzY0J7DIFtG3WPgbcfc8TLmkS4";

type WalletSummary = {
  balanceCents: number;
  spendableBalanceCents: number;
  cashoutAvailableCents: number;
};

type PayoutStatus = "PENDING" | "COMPLETED" | "FAILED";

type Payout = {
  id: number;
  amountCents: number;
  status: PayoutStatus;
  createdAt: string;
  failureReason?: string | null;
  destinationLast4?: string | null;
};

export default function OwnerWalletScreen() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [amountInput, setAmountInput] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const headers = {
    Authorization: `Bearer ${OWNER_FALLBACK_TOKEN}`,
    "Content-Type": "application/json",
  };

  // ---------- helpers ----------
  const centsToDollars = (cents: number | undefined | null) =>
    typeof cents === "number" ? (cents / 100).toFixed(2) : "0.00";

  const parseAmountToCents = (value: string): number | null => {
    const cleaned = value.replace(/[^0-9.]/g, "");
    if (!cleaned) return null;
    const dollars = parseFloat(cleaned);
    if (!isFinite(dollars) || dollars <= 0) return null;
    return Math.round(dollars * 100);
  };

  // ---------- load wallet + payouts ----------
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Wallet summary
      const summaryRes = await fetch(`${API_BASE}/wallet/summary`, {
        headers: { Authorization: headers.Authorization },
      });
      if (!summaryRes.ok) {
        throw new Error(`Failed to load wallet summary (${summaryRes.status})`);
      }
      const summaryJson = (await summaryRes.json()) as WalletSummary;
      setSummary(summaryJson);

      if (summaryJson.cashoutAvailableCents > 0) {
        setAmountInput(centsToDollars(summaryJson.cashoutAvailableCents));
      } else {
        setAmountInput("");
      }

      // Recent cashouts (same canonical endpoint as Owner Cashouts screen)
      const payoutsRes = await fetch(`${API_BASE}/wallet/cashouts`, {
        headers: { Authorization: headers.Authorization },
      });
      if (!payoutsRes.ok) {
        throw new Error(`Failed to load cashouts (${payoutsRes.status})`);
      }
      const payoutsJson = (await payoutsRes.json()) as Payout[];

      // newest first, then take top 5 for the wallet snippet
      const sorted = [...payoutsJson].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setPayouts(sorted.slice(0, 5));
    } catch (err) {
      console.log("OWNER WALLET LOAD ERROR:", err);
      setError("Error loading wallet data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ---------- cashout flow ----------
  const handleCashout = async () => {
    if (!summary) return;

    setError(null);
    setInfo(null);

    const amountCents = parseAmountToCents(amountInput);

    if (amountCents === null) {
      setError("Enter a valid cashout amount.");
      return;
    }

    if (amountCents > summary.cashoutAvailableCents) {
      setError("Amount exceeds cashout-available balance.");
      return;
    }

    if (amountCents <= 0) {
      setError("Amount must be greater than zero.");
      return;
    }

    try {
      setSubmitting(true);

      const body = JSON.stringify({ amountCents });

      const res = await fetch(`${API_BASE}/wallet/cashout`, {
        method: "POST",
        headers,
        body,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const msg = errJson?.message || `Cashout failed (HTTP ${res.status})`;
        setError(typeof msg === "string" ? msg : "Cashout failed.");
        return;
      }

      const payout = (await res.json()) as Payout;

      setInfo(
        `Cashout created: $${centsToDollars(
          payout.amountCents
        )} (${payout.status.toLowerCase()}).`
      );

      await loadData();
    } catch (err) {
      console.log("CASHOUT ERROR:", err);
      setError("Error creating cashout.");
    } finally {
      setSubmitting(false);
    }
  };

  const setQuickAmount = (fraction: number) => {
    if (!summary) return;
    const cents = Math.floor(summary.cashoutAvailableCents * fraction);
    setAmountInput(centsToDollars(cents));
  };

  const setMaxAmount = () => {
    if (!summary) return;
    setAmountInput(centsToDollars(summary.cashoutAvailableCents));
  };

  // ---------- render ----------
  if (loading && !summary) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color="#15FF7F" />
      </ThemedView>
    );
  }

  if (!summary) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText style={styles.errorText}>
          Wallet not available.
        </ThemedText>
        <TouchableOpacity style={styles.refreshButton} onPress={loadData}>
          <ThemedText style={styles.refreshText}>Retry</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* HEADER */}
      <ThemedText type="title" style={{ marginBottom: 6 }}>
        Owner Wallet
      </ThemedText>
      <ThemedText
        style={{
          color: "rgba(255,255,255,0.6)",
          fontSize: 13,
          marginBottom: 16,
        }}
      >
        View your TABZ wallet and choose how much to cash out to your bank.
      </ThemedText>

      {/* SNAPSHOT */}
      <ThemedView style={styles.infoCard}>
        <ThemedText style={styles.label}>Total balance</ThemedText>
        <ThemedText style={styles.mainBalance}>
          ${centsToDollars(summary.balanceCents)}
        </ThemedText>

        <ThemedText style={styles.label}>Spendable inside TABZ</ThemedText>
        <ThemedText style={styles.valueText}>
          ${centsToDollars(summary.spendableBalanceCents)}
        </ThemedText>

        <ThemedText style={styles.label}>Cashout-ready</ThemedText>
        <ThemedText style={[styles.valueText, { color: "#15FF7F" }]}>
          ${centsToDollars(summary.cashoutAvailableCents)}
        </ThemedText>
      </ThemedView>

      {/* CASHOUT FORM */}
      <ThemedView style={[styles.infoCard, { marginTop: 18 }]}>
        <ThemedText style={styles.label}>Cashout amount</ThemedText>

        <ThemedView style={styles.amountRow}>
          <ThemedText style={styles.dollarSign}>$</ThemedText>
          <TextInput
            style={styles.amountInput}
            keyboardType="decimal-pad"
            value={amountInput}
            onChangeText={setAmountInput}
            placeholder="0.00"
            placeholderTextColor="rgba(255,255,255,0.2)"
          />
        </ThemedView>

        <ThemedView style={styles.quickRow}>
          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => setQuickAmount(0.25)}
          >
            <ThemedText style={styles.quickText}>25%</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => setQuickAmount(0.5)}
          >
            <ThemedText style={styles.quickText}>50%</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickButton} onPress={setMaxAmount}>
            <ThemedText style={styles.quickText}>Max</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {error && <ThemedText style={styles.errorText}>{error}</ThemedText>}
        {info && !error && (
          <ThemedText style={styles.infoText}>{info}</ThemedText>
        )}

        <TouchableOpacity
          style={[
            styles.cashoutButton,
            submitting || summary.cashoutAvailableCents <= 0
              ? { opacity: 0.4 }
              : null,
          ]}
          onPress={handleCashout}
          disabled={submitting || summary.cashoutAvailableCents <= 0}
        >
          <ThemedText style={styles.cashoutText}>
            {submitting ? "Processing..." : "Cash out to bank"}
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {/* RECENT CASHOUTS (SHORT LIST) */}
      <ThemedView style={[styles.infoCard, { marginTop: 18 }]}>
        <ThemedText style={styles.label}>Recent cashouts</ThemedText>

        {payouts.length === 0 ? (
          <ThemedText style={styles.mutedText}>
            No cashouts yet. When you cash out, they will appear here.
          </ThemedText>
        ) : (
          payouts.map((p) => (
            <ThemedView key={p.id} style={styles.payoutRow}>
              <ThemedText style={styles.valueText}>
                ${centsToDollars(p.amountCents)}
              </ThemedText>
              <ThemedText style={styles.payoutMeta}>
                {new Date(p.createdAt).toLocaleString()} ·{" "}
                {p.status.toLowerCase()}
              </ThemedText>
            </ThemedView>
          ))
        )}

        <TouchableOpacity style={styles.refreshButton} onPress={loadData}>
          <ThemedText style={styles.refreshText}>Refresh</ThemedText>
        </TouchableOpacity>
      </ThemedView>
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
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#05060E",
  },
  infoCard: {
    backgroundColor: "#080A15",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 8,
  },
  label: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    marginBottom: 4,
  },
  mainBalance: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 10,
  },
  valueText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 6,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 10,
    backgroundColor: "#050713",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  dollarSign: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 20,
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    paddingVertical: 4,
  },
  quickRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  quickButton: {
    flex: 1,
    backgroundColor: "#101325",
    borderRadius: 999,
    paddingVertical: 6,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  quickText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    fontWeight: "600",
  },
  cashoutButton: {
    marginTop: 6,
    backgroundColor: "#15FF7F",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  cashoutText: {
    color: "#000",
    fontSize: 15,
    fontWeight: "800",
  },
  errorText: {
    color: "#FF4F4F",
    fontSize: 13,
    marginTop: 4,
  },
  infoText: {
    color: "#15FF7F",
    fontSize: 13,
    marginTop: 4,
  },
  mutedText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    marginTop: 6,
  },
  payoutRow: {
    marginTop: 8,
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  payoutMeta: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    marginTop: 2,
  },
  refreshButton: {
    marginTop: 12,
    backgroundColor: "#15FF7F",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  refreshText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "700",
  },
});
