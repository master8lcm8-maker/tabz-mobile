// app/(tabs)/owner-bank-info.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { apiGet, apiPost } from "../../components/lib/api";

export default function OwnerBankInfoScreen() {
  const router = useRouter();

  const [bankName, setBankName] = useState("Test Bank");
  const [accountHolderName, setAccountHolderName] = useState("Troy Rocha");
  const [routingNumber, setRoutingNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Auto-load existing bank info (DEV)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const info: any = await apiGet("/wallet/bank-info");

        if (!cancelled && info && typeof info === "object") {
          if (info.bankName) setBankName(String(info.bankName));
          if (info.accountHolderName) setAccountHolderName(String(info.accountHolderName));
          if (info.routingNumber) setRoutingNumber(String(info.routingNumber));
          if (info.accountNumber) setAccountNumber(String(info.accountNumber));
        }
      } catch {
        // If none exists yet, keep defaults/empty fields.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function onSave() {
    const bn = String(bankName || "").trim();
    const ah = String(accountHolderName || "").trim();
    const rn = String(routingNumber || "").trim();
    const an = String(accountNumber || "").trim();

    if (!bn || !ah || !rn || !an) {
      Alert.alert(
        "Missing info",
        "Bank name, account holder, routing number, and account number are required."
      );
      return;
    }

    setSaving(true);
    try {
      await apiPost("/wallet/bank-info", {
        bankName: bn,
        accountHolderName: ah,
        routingNumber: rn,
        accountNumber: an,
      });

      // IMPORTANT: valid tab route
      router.replace("/owner-cashouts");
    } catch (e: any) {
      Alert.alert("Save failed", String(e?.message || e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Bank Information</Text>

      <View style={styles.card}>
        {loading ? (
          <View style={{ paddingVertical: 12, alignItems: "center" }}>
            <ActivityIndicator />
            <Text style={styles.loadingText}>Loading…</Text>
          </View>
        ) : null}

        <View style={styles.field}>
          <Text style={styles.label}>Bank Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Test Bank"
            placeholderTextColor="#64748b"
            value={bankName}
            onChangeText={setBankName}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Account Holder Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Troy Rocha"
            placeholderTextColor="#64748b"
            value={accountHolderName}
            onChangeText={setAccountHolderName}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Routing Number</Text>
          <TextInput
            style={styles.input}
            placeholder="110000000"
            placeholderTextColor="#64748b"
            keyboardType="number-pad"
            value={routingNumber}
            onChangeText={setRoutingNumber}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Account Number</Text>
          <TextInput
            style={styles.input}
            placeholder="000123456789"
            placeholderTextColor="#64748b"
            keyboardType="number-pad"
            value={accountNumber}
            onChangeText={setAccountNumber}
          />
        </View>

        <TouchableOpacity
          style={[styles.primaryBtn, saving ? styles.primaryBtnDisabled : null]}
          onPress={onSave}
          disabled={saving}
        >
          <Text style={styles.primaryBtnText}>
            {saving ? "Saving..." : "Save"}
          </Text>
        </TouchableOpacity>
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
  loadingText: { color: "#9ca3af", marginTop: 8, fontWeight: "700" },
  field: { marginBottom: 12 },
  label: {
    color: "#cbd5e1",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#020617",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1f2a44",
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#e5e7eb",
    fontSize: 14,
    fontWeight: "700",
  },
  primaryBtn: {
    marginTop: 14,
    width: "100%",
    borderRadius: 10,
    paddingVertical: 12,
    backgroundColor: "#0ea5e9",
    alignItems: "center",
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: {
    color: "#001018",
    fontSize: 14,
    fontWeight: "900",
  },
});
