// ===============================================
//  app/(tabs)/owner-identity-verification.tsx
//  Phase B — Backend Wired (Stripe Identity)
//  REAL API calls: /identity/start + /identity/status
//  Step 4: HARD GUARD (owner-only) + single token source (api.ts)
// ===============================================

import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import {
  apiGet,
  apiPost,
  hydrateAuthToken,
  requireRole,
} from "../../components/lib/api";

type VerifyStatus = "required" | "started" | "pending" | "verified" | "failed";

export default function OwnerIdentityVerificationScreen() {
  const router = useRouter();

  // 🔒 HARD GUARD: owner-only screen (web-safe: hydrate token first)
  useEffect(() => {
    (async () => {
      try {
        await hydrateAuthToken();
        requireRole("owner");
      } catch (e: any) {
        console.error(String(e?.message || e));
        Alert.alert(
          "Access denied",
          "You are logged in as a buyer. Please log in with an owner account."
        );
        router.replace("/(tabs)");
      }
    })();
  }, [router]);

  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [status, setStatus] = useState<VerifyStatus>("required");
  const [message, setMessage] = useState<string>("");

  function normalizeStatus(s: any): VerifyStatus {
    const v = String(s || "").toLowerCase();
    if (v === "verified") return "verified";
    if (v === "pending") return "pending";
    if (v === "started") return "started";
    if (v === "failed") return "failed";
    return "required";
  }

  // -------------------------------
  // Load real status from backend
  // -------------------------------
  async function loadStatus() {
    setLoading(true);
    try {
      const res: any = await apiGet("/identity/status");
      const st = normalizeStatus(res?.status);
      setStatus(st);
      setMessage(
        st === "verified"
          ? "Identity verified. Payouts can now be enabled."
          : "Identity verification is required before payouts."
      );
    } catch (e: any) {
      Alert.alert("Error", String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  // -------------------------------
  // Start verification (real)
  // -------------------------------
  async function onStart() {
    setWorking(true);
    try {
      const res: any = await apiPost("/identity/start", {});
      const st = normalizeStatus(res?.status);
      setStatus(st);
      setMessage("Verification started. Complete the identity flow to continue.");

      const sessionUrl = String(res?.sessionUrl || "").trim();

      // If backend returns verified (like your PowerShell test), sessionUrl may be absent.
      if (!sessionUrl) {
        if (st === "verified") {
          Alert.alert("Verified", "Identity is already verified.");
          return;
        }

        Alert.alert(
          "Started",
          "Verification started, but no sessionUrl was returned by the backend."
        );
        return;
      }

      // ✅ Open hosted flow (web + native)
      if (Platform.OS === "web") {
        if (typeof window !== "undefined" && typeof window.open === "function") {
          window.open(sessionUrl, "_blank", "noopener,noreferrer");
          return;
        }
        await Linking.openURL(sessionUrl);
        return;
      }

      const can = await Linking.canOpenURL(sessionUrl);
      if (!can) {
        Alert.alert("Cannot open link", sessionUrl);
        return;
      }
      await Linking.openURL(sessionUrl);
    } catch (e: any) {
      Alert.alert("Start failed", String(e?.message || e));
    } finally {
      setWorking(false);
    }
  }

  // -------------------------------
  // Refresh status (real)
  // -------------------------------
  async function onRefresh() {
    await loadStatus();
  }

  const statusColor = useMemo(() => {
    switch (status) {
      case "verified":
        return "#22c55e";
      case "pending":
        return "#f59e0b";
      case "started":
        return "#38bdf8";
      case "failed":
        return "#f87171";
      default:
        return "#f87171";
    }
  }, [status]);

  const startDisabled = working || status === "pending" || status === "verified";

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Identity Verification</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>STATUS</Text>

        {loading ? (
          <View style={{ paddingVertical: 12, alignItems: "center" }}>
            <ActivityIndicator />
            <Text style={styles.note}>Loading status…</Text>
          </View>
        ) : (
          <>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Verification Status</Text>
              <Text
                style={[
                  styles.rowValue,
                  { color: statusColor, fontWeight: "900" },
                ]}
              >
                {status}
              </Text>
            </View>

            {message ? (
              <Text style={[styles.note, { marginTop: 10 }]}>{message}</Text>
            ) : null}

            <Pressable
              disabled={startDisabled}
              onPress={onStart}
              style={({ pressed }) => [
                styles.primaryBtn,
                startDisabled ? styles.btnDisabled : null,
                pressed && !startDisabled ? styles.btnPressed : null,
                { pointerEvents: "auto", zIndex: 9999 },
              ]}
            >
              <Text style={styles.primaryBtnText}>
                {working ? "Starting…" : "Start verification"}
              </Text>
            </Pressable>

            <Pressable
              disabled={working}
              onPress={onRefresh}
              style={({ pressed }) => [
                styles.successBtn,
                working ? styles.btnDisabled : null,
                pressed ? styles.btnPressed : null,
                { pointerEvents: "auto", zIndex: 9999 },
              ]}
            >
              <Text style={styles.successBtnText}>Refresh status</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0b0f1a",
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  title: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 12,
  },
  card: {
    width: "100%",
    borderRadius: 14,
    padding: 14,
    backgroundColor: "#0f1628",
    borderWidth: 1,
    borderColor: "#1f2a44",
  },
  sectionTitle: {
    color: "#e5e7eb",
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 10,
    letterSpacing: 0.4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#18243b",
  },
  rowLabel: {
    color: "#cbd5e1",
    fontSize: 13,
    fontWeight: "700",
  },
  rowValue: {
    color: "#e5e7eb",
    fontSize: 13,
    fontWeight: "800",
  },
  note: {
    color: "#9ca3af",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
  },
  primaryBtn: {
    marginTop: 12,
    width: "100%",
    borderRadius: 10,
    paddingVertical: 12,
    backgroundColor: "#0ea5e9",
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#001018",
    fontSize: 14,
    fontWeight: "900",
  },
  successBtn: {
    marginTop: 10,
    width: "100%",
    borderRadius: 10,
    paddingVertical: 12,
    backgroundColor: "#22c55e",
    alignItems: "center",
  },
  successBtnText: {
    color: "#02140a",
    fontSize: 14,
    fontWeight: "900",
  },
  btnDisabled: { opacity: 0.55 },
  btnPressed: { opacity: 0.85 },
});
