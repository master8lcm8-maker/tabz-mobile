// ======================================================
// components/CashoutsScreen.tsx
// Unified (NO query params; uses x-user-id header ONLY)
// ======================================================

import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from "react-native";
import axios from "axios";

import { BASE_URL } from "../lib/api";
import { OWNER_TOKEN } from "../lib/ownerToken";

type WalletSummary = {
  balanceCents: number;
  cashoutAvailableCents: number;
};

type WalletMetrics = {
  totalCashouts: number;
  totalPending: number;
  totalCompleted: number;
  totalFailed: number;
  totalAmountPaidOut: number;
  totalAmountPending: number;
  totalAmountFailedReturned: number;
};

type CashoutRecord = {
  id: number;
  walletId: number;
  amountCents: number;
  status: string;
  failureReason?: string;
  destinationLast4?: string;
  createdAt: string;
};

function dollarsFromCents(cents?: number) {
  const v = Number(cents || 0) || 0;
  return `$${(v / 100).toFixed(2)}`;
}

export default function CashoutsScreen() {
  const token = OWNER_TOKEN;

  const headers = useMemo(() => {
    return {
      Authorization: `Bearer ${token}`,
      "x-user-id": "3",
    };
  }, [token]);

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [metrics, setMetrics] = useState<WalletMetrics | null>(null);
  const [history, setHistory] = useState<CashoutRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [amountUsd, setAmountUsd] = useState("5");

  function describeAxiosError(err: any): string {
    try {
      if (err.response) {
        const status = err.response.status;
        const data = err.response.data;
        const msg =
          typeof data === "string"
            ? data
            : data?.message || JSON.stringify(data);
        return `HTTP ${status} – ${msg}`;
      }
      if (err.request) return "No response from server.";
      return err.message || "Unknown error";
    } catch {
      return "Error parsing error";
    }
  }

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      const [summaryRes, metricsRes, historyRes] = await Promise.all([
        axios.get(`${BASE_URL}/wallet/summary`, { headers }),
        axios.get(`${BASE_URL}/wallet/metrics`, { headers }),
        axios.get(`${BASE_URL}/wallet/cashouts`, { headers }),
      ]);

      setSummary(summaryRes.data);
      setMetrics(metricsRes.data);
      setHistory(Array.isArray(historyRes.data) ? historyRes.data : []);
    } catch (err: any) {
      const desc = describeAxiosError(err);
      console.log("LOAD ERROR:", desc);
      setError(`Unable to load wallet data.\n${desc}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function requestCashout() {
    try {
      const usd = Number(String(amountUsd || "").replace(/[^0-9.]/g, ""));
      if (!isFinite(usd) || usd <= 0) {
        Alert.alert("Invalid amount", "Enter a positive USD amount.");
        return;
      }
      const amountCents = Math.round(usd * 100);

      setLoading(true);
      console.log("CASHOUTS SCREEN — CREATE CASHOUT", { amountCents });

      await axios.post(
        `${BASE_URL}/wallet/cashout`,
        { amountCents },
        { headers }
      );

      await loadData();
    } catch (err: any) {
      const msg = describeAxiosError(err);
      console.log("CASHOUT ERROR:", msg);
      Alert.alert("Cashout failed", msg);
      setLoading(false);
    }
  }

  async function retryCashout(id: number) {
    try {
      setLoading(true);

      await axios.post(
        `${BASE_URL}/wallet/cashouts/${id}/retry`,
        {},
        { headers }
      );

      await loadData();
    } catch (err: any) {
      Alert.alert("Retry failed", describeAxiosError(err));
      setLoading(false);
    }
  }

  if (loading || !summary || !metrics) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#000",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#0f0" />
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#000",
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}
      >
        <Text
          style={{
            color: "#fff",
            marginBottom: 14,
            textAlign: "center",
            whiteSpace: "pre-line" as any,
          }}
        >
          {error}
        </Text>
        <TouchableOpacity
          onPress={loadData}
          style={{
            backgroundColor: "#7CFC00",
            paddingHorizontal: 30,
            paddingVertical: 12,
            borderRadius: 10,
          }}
        >
          <Text style={{ color: "#000", fontWeight: "bold" }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const balance = (summary.balanceCents ?? 0) / 100;
  const cashoutAvailable = (summary.cashoutAvailableCents ?? 0) / 100;

  const totalCashouts = metrics.totalCashouts ?? 0;
  const totalCompleted = metrics.totalCompleted ?? 0;
  const totalFailed = metrics.totalFailed ?? 0;

  const paidOut = (metrics.totalAmountPaidOut ?? 0) / 100;
  const failedReturned = (metrics.totalAmountFailedReturned ?? 0) / 100;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#000", padding: 14 }}>
      <View style={{ borderColor: "#0f0", borderWidth: 1, padding: 14, borderRadius: 10, marginBottom: 14 }}>
        <Text style={{ color: "#0f0", fontSize: 18, fontWeight: "bold" }}>
          Wallet Summary
        </Text>
        <Text style={{ color: "#fff", marginTop: 10 }}>
          Balance: ${balance.toFixed(2)}
        </Text>
        <Text style={{ color: "#fff" }}>
          Available for Cashout: ${cashoutAvailable.toFixed(2)}
        </Text>
      </View>

      <View style={{ borderColor: "#0f0", borderWidth: 1, padding: 14, borderRadius: 10, marginBottom: 14 }}>
        <Text style={{ color: "#0f0", fontSize: 18, fontWeight: "bold" }}>
          Cashout Metrics
        </Text>
        <Text style={{ color: "#fff", marginTop: 10 }}>
          Total Cashouts: {totalCashouts}
        </Text>
        <Text style={{ color: "#fff" }}>Completed: {totalCompleted}</Text>
        <Text style={{ color: "#fff" }}>Failed: {totalFailed}</Text>
        <Text style={{ color: "#fff" }}>Paid Out: ${paidOut.toFixed(2)}</Text>
        <Text style={{ color: "#fff" }}>
          Failed Returned: ${failedReturned.toFixed(2)}
        </Text>
      </View>

      <View style={{ borderColor: "#0f0", borderWidth: 1, padding: 14, borderRadius: 10, marginBottom: 14 }}>
        <Text style={{ color: "#0f0", fontSize: 18, fontWeight: "bold" }}>
          Create Cashout
        </Text>

        <TextInput
          value={amountUsd}
          onChangeText={setAmountUsd}
          placeholder="5"
          placeholderTextColor="#666"
          keyboardType="numeric"
          style={{
            marginTop: 10,
            backgroundColor: "#111",
            color: "#fff",
            padding: 10,
            borderRadius: 8,
            borderColor: "#222",
            borderWidth: 1,
          }}
        />

        <TouchableOpacity
          onPress={requestCashout}
          style={{
            backgroundColor: "#7CFC00",
            paddingVertical: 16,
            borderRadius: 10,
            alignItems: "center",
            marginTop: 12,
          }}
        >
          <Text style={{ color: "#000", fontSize: 16, fontWeight: "bold" }}>
            REQUEST CASHOUT
          </Text>
        </TouchableOpacity>

        <Text style={{ color: "#777", marginTop: 10, fontSize: 12 }}>
          Uses: GET {BASE_URL}/wallet/cashouts and POST {BASE_URL}/wallet/cashout
        </Text>
      </View>

      <Text style={{ color: "#0f0", fontSize: 20, marginBottom: 10 }}>
        History
      </Text>

      {history.map((c) => {
        const status = String(c.status || "").toUpperCase();
        const isCompleted = status === "COMPLETED";
        const isFailed = status === "FAILED";

        return (
          <View key={c.id} style={{ borderBottomColor: "#222", borderBottomWidth: 1, paddingVertical: 12 }}>
            <Text style={{ color: "#fff", fontSize: 16, marginBottom: 4 }}>
              #{c.id} — {dollarsFromCents(c.amountCents)}
            </Text>

            <Text style={{ color: isCompleted ? "#0f0" : isFailed ? "#f00" : "#fff" }}>
              {status}
            </Text>

            {isFailed && (
              <>
                <Text style={{ color: "#ccc", marginBottom: 6 }}>
                  Reason: {c.failureReason || "—"}
                </Text>

                <TouchableOpacity
                  onPress={() => retryCashout(c.id)}
                  style={{
                    borderColor: "#0f0",
                    borderWidth: 1,
                    paddingVertical: 6,
                    paddingHorizontal: 16,
                    borderRadius: 8,
                    width: 80,
                    marginTop: 4,
                  }}
                >
                  <Text style={{ color: "#0f0", textAlign: "center" }}>
                    Retry
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}
