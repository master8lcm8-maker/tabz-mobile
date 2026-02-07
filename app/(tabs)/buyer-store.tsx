// app/(tabs)/buyer-store.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Redirect } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { apiGet, apiPost, requireRole } from "../../components/lib/api";

type StoreItem = {
  id: number;
  name?: string;
  priceCents?: number;
  venueId?: number | null;
  metadata?: any;
  [k: string]: any;
};

function money(cents?: number) {
  if (typeof cents !== "number") return "-";
  return `$${(cents / 100).toFixed(2)}`;
}

function normalizeItems(payload: any): StoreItem[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.value)) return payload.value;
  return [];
}

export default function BuyerStoreScreen() {
  // IMPORTANT: hooks must ALWAYS run in the same order on every render.
  // So: do NOT early-return before hooks.

  const [roleOk, setRoleOk] = useState<boolean | null>(null); // null = checking
  const [items, setItems] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [qtyById, setQtyById] = useState<Record<string, string>>({});
  const [buyingId, setBuyingId] = useState<number | null>(null);

  // Role gate (buyer only) — runs once, sets roleOk, never throws to UI
  useEffect(() => {
    try {
      requireRole("buyer");
      setRoleOk(true);
    } catch {
      setRoleOk(false);
    }
  }, []);

  const fetchItems = useCallback(async () => {
    setError(null);
    try {
      const data = await apiGet("/store-items");
      setItems(normalizeItems(data));
    } catch (e: any) {
      setItems([]);
      setError(e?.message || "Failed to load store items");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Only fetch if roleOk === true
  useEffect(() => {
    if (roleOk === true) fetchItems();
    if (roleOk === false) {
      setLoading(false);
      setRefreshing(false);
      setItems([]);
    }
  }, [roleOk, fetchItems]);

  const onRefresh = useCallback(() => {
    if (roleOk !== true) return;
    setRefreshing(true);
    fetchItems();
  }, [roleOk, fetchItems]);

  const setQty = (id: number, v: string) => {
    const cleaned = String(v || "").replace(/[^\d]/g, "").slice(0, 3);
    setQtyById((prev) => ({ ...prev, [String(id)]: cleaned }));
  };

  const getQty = (id: number) => {
    const raw = qtyById[String(id)];
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
  };

  const buy = async (item: StoreItem) => {
    const itemId = Number(item?.id);
    if (!itemId) {
      Alert.alert("Error", "Invalid item id");
      return;
    }
    const quantity = getQty(itemId);

    setBuyingId(itemId);
    setError(null);

    try {
      await apiPost("/store-items/order", { itemId, quantity });
      Alert.alert("Success", `Order placed (item #${itemId}, qty ${quantity}).`);
    } catch (e: any) {
      setError(e?.message || "Order failed");
      Alert.alert("Order failed", String(e?.message || "Order failed"));
    } finally {
      setBuyingId(null);
    }
  };

  // While checking role, show a tiny loader (prevents hook-order crash)
  if (roleOk === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.muted}>Checking access…</Text>
      </View>
    );
  }

  // If not buyer, redirect cleanly (NO crash)
  if (roleOk === false) {
    return <Redirect href="/(tabs)" />;
  }

  // Buyer path
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.muted}>Loading store…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Store</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={items}
        keyExtractor={(it) => String(it.id ?? Math.random())}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.muted}>No items available.</Text>
        }
        renderItem={({ item }) => {
          const id = Number(item.id);
          const qty = qtyById[String(id)] ?? "1";
          const disabled = buyingId === id;

          return (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.name ?? `Item #${id}`}</Text>
              <Text style={styles.cardLine}>Price: {money(item.priceCents)}</Text>
              <Text style={styles.cardLine}>Venue: {item.venueId ?? "-"}</Text>

              <View style={styles.row}>
                <Text style={styles.qtyLabel}>Qty</Text>
                <TextInput
                  value={qty}
                  onChangeText={(v) => setQty(id, v)}
                  keyboardType="number-pad"
                  style={styles.qtyInput}
                />
                <TouchableOpacity
                  style={[styles.buyBtn, disabled && styles.buyBtnDisabled]}
                  disabled={disabled}
                  onPress={() => buy(item)}
                >
                  <Text style={styles.buyBtnText}>
                    {disabled ? "Buying…" : "Buy"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 10 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  muted: { opacity: 0.7 },
  error: { color: "#ff4d4f", marginBottom: 10 },
  card: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.15)",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  cardTitle: { fontWeight: "700", marginBottom: 6 },
  cardLine: { opacity: 0.9 },
  row: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 },
  qtyLabel: { width: 30, opacity: 0.75 },
  qtyInput: {
    width: 70,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.2)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  buyBtn: {
    marginLeft: "auto",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.25)",
  },
  buyBtnDisabled: { opacity: 0.6 },
  buyBtnText: { fontWeight: "700" },
});
