import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { getStaffOrders, staffMarkOrder, type StaffOrderRow } from "@/components/lib/api";

export default function StaffScreen() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [orders, setOrders] = useState<StaffOrderRow[]>([]);
  const [customStatus, setCustomStatus] = useState("completed");

  const sorted = useMemo(() => {
    const copy = [...orders];
    // newest first if createdAt is sortable; otherwise keep as-is
    copy.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    return copy;
  }, [orders]);

  async function refresh() {
    setErr(null);
    setLoading(true);
    try {
      const rows = await getStaffOrders();
      setOrders(Array.isArray(rows) ? rows : []);
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  async function mark(orderId: number, status: string) {
    setErr(null);
    setLoading(true);
    try {
      await staffMarkOrder(orderId, status);
      await refresh(); // re-load list
    } catch (e: any) {
      setErr(String(e?.message || e));
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={22} />
        </TouchableOpacity>

        <View style={styles.headerTextBlock}>
          <ThemedText type="title">Staff Orders</ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            Queue + status updates (M28.2)
          </ThemedText>
        </View>

        <TouchableOpacity
          style={styles.refreshButton}
          activeOpacity={0.7}
          onPress={refresh}
        >
          <Ionicons name="refresh" size={18} />
        </TouchableOpacity>
      </View>

      {err ? (
        <View style={styles.errorBox}>
          <ThemedText style={styles.errorText}>{err}</ThemedText>
        </View>
      ) : null}

      <View style={styles.statusRow}>
        <ThemedText style={{ opacity: 0.8 }}>Default status:</ThemedText>
        <TextInput
          value={customStatus}
          onChangeText={setCustomStatus}
          placeholder="completed"
          placeholderTextColor="#777"
          style={styles.statusInput}
          autoCapitalize="none"
        />
      </View>

      {loading ? (
        <View style={{ paddingVertical: 18 }}>
          <ActivityIndicator />
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {sorted.length === 0 ? (
          <View style={{ paddingVertical: 20 }}>
            <ThemedText style={{ opacity: 0.7 }}>
              No orders returned for this staff venue.
            </ThemedText>
          </View>
        ) : (
          sorted.map((o) => (
            <View key={String(o.orderId)} style={styles.card}>
              <View style={styles.cardTop}>
                <ThemedText type="subtitle">#{o.orderId}</ThemedText>
                <ThemedText style={{ opacity: 0.8 }}>{o.status}</ThemedText>
              </View>

              <ThemedText style={{ opacity: 0.9 }}>
                {o.itemName} × {o.quantity}
              </ThemedText>

              <ThemedText style={styles.meta}>
                Venue: {o.venueName} (#{o.venueId}) • Buyer #{o.buyerId}
              </ThemedText>

              <ThemedText style={styles.meta}>
                Created: {String(o.createdAt)}
              </ThemedText>

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  activeOpacity={0.8}
                  onPress={() => mark(Number(o.orderId), "completed")}
                >
                  <ThemedText style={styles.actionText}>Mark Completed</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBtnOutline}
                  activeOpacity={0.8}
                  onPress={() => mark(Number(o.orderId), customStatus)}
                >
                  <ThemedText style={styles.actionText}>
                    Set: {customStatus || "…"}
                  </ThemedText>
                </TouchableOpacity>
              </View>

              <ThemedText style={styles.note}>
                Note: only “completed” is proven. Custom status is sent as text;
                server decides if it’s accepted.
              </ThemedText>
            </View>
          ))
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  headerTextBlock: {
    flex: 1,
  },
  headerSubtitle: {
    marginTop: 4,
    opacity: 0.8,
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  errorBox: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#552222",
    marginBottom: 12,
  },
  errorText: { color: "#ff7b7b" },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  statusInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#fff",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  card: {
    borderWidth: 1,
    borderColor: "#222",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  meta: {
    marginTop: 6,
    fontSize: 12,
    opacity: 0.75,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  actionBtnOutline: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#444",
  },
  actionText: {
    fontSize: 12,
    opacity: 0.95,
  },
  note: {
    marginTop: 10,
    fontSize: 11,
    opacity: 0.65,
  },
});
