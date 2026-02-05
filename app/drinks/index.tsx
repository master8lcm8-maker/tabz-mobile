// app/drinks/index.tsx

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// FIX: web bundler cannot resolve "@/..." because alias isn't configured.
// Use relative imports from app/drinks -> components (two levels up)
import { ThemedText } from "../../components/themed-text";
import { ThemedView } from "../../components/themed-view";

// ---- Base URL + Token sourcing (NO DEV HARDCODES) ----
const PROD_BASE_URL = process.env.EXPO_PUBLIC_TABZ_API_BASE_URL || "";
const ENV_BASE_URL = (process.env.EXPO_PUBLIC_BASE_URL || "").trim();
const AUTH_TOKEN_KEY = "TABZ_AUTH_TOKEN";

function getBaseUrl(): string {
  return ENV_BASE_URL || PROD_BASE_URL;
}

async function getAuthTokenOrThrow(): Promise<string> {
  const tok = (await AsyncStorage.getItem(AUTH_TOKEN_KEY)) || "";
  if (!tok.trim()) {
    throw new Error(
      `Missing auth token. Log in first so "${AUTH_TOKEN_KEY}" is set.`
    );
  }
  return tok.trim();
}

type ItemSnapshot = {
  id: number;
  name: string;
  priceCents: number;
  venueId: number | null;
  metadata: any | null;
  createdAt: string;
  updatedAt: string;
};

type DrinkOrder = {
  id: number;
  userId: number;
  itemId: number;
  quantity: number;
  status: string;
  venueId: number | null;
  itemSnapshot?: ItemSnapshot | null;
  createdAt: string;
  updatedAt: string;
};

export default function DrinksScreen() {
  const [orders, setOrders] = useState<DrinkOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // Track if a fetch is already in-flight so auto-refresh doesn't overlap calls
  const isFetchingRef = useRef(false);

  const baseUrl = getBaseUrl();

  const fetchOrders = useCallback(
    async (opts?: { showSpinner?: boolean }) => {
      const showSpinner = opts?.showSpinner ?? true;

      if (isFetchingRef.current) return;

      isFetchingRef.current = true;
      setError(null);
      if (showSpinner) setLoading(true);

      try {
        const token = await getAuthTokenOrThrow();

        const res = await fetch(`${baseUrl}/store-items/venue-orders`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const text = await res.text();
          console.error("[DrinksScreen] Failed to fetch orders:", res.status, text);
          setError(`Failed to load orders (status ${res.status}). Check backend logs.`);
          setOrders([]);
          return;
        }

        const data = (await res.json()) as DrinkOrder[];
        setOrders(Array.isArray(data) ? data : []);
      } catch (err: any) {
        console.error("[DrinksScreen] Network/auth error while loading orders:", err);
        setError(String(err?.message || "Network/auth error while loading orders"));
        setOrders([]);
      } finally {
        if (showSpinner) setLoading(false);
        isFetchingRef.current = false;
      }
    },
    [baseUrl]
  );

  // Initial load (show spinner)
  useEffect(() => {
    fetchOrders({ showSpinner: true });
  }, [fetchOrders]);

  // Auto-refresh every 5 seconds without spinner
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders({ showSpinner: false });
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchOrders]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders({ showSpinner: false });
    setRefreshing(false);
  }, [fetchOrders]);

  const formatPrice = (cents?: number) => {
    if (typeof cents !== "number") return "$0.00";
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDateTime = (iso?: string) => {
    if (!iso) return "Unknown";
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch {
      return iso;
    }
  };

  const updateStatus = async (orderId: number, newStatus: string) => {
    setUpdatingId(orderId);
    setError(null);

    try {
      const token = await getAuthTokenOrThrow();

      const res = await fetch(`${baseUrl}/store-items/order/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("[DrinksScreen] Failed to update status:", res.status, text);
        setError(`Failed to update status (status ${res.status}). See backend logs.`);
        return;
      }

      // Refetch list after update (no spinner)
      await fetchOrders({ showSpinner: false });
    } catch (err: any) {
      console.error("[DrinksScreen] Network/auth error while updating status:", err);
      setError(String(err?.message || "Network/auth error while updating order status"));
    } finally {
      setUpdatingId(null);
    }
  };

  const renderOrder = ({ item }: { item: DrinkOrder }) => {
    const priceCents = item.itemSnapshot?.priceCents;
    const isUpdating = updatingId === item.id;

    return (
      <View style={styles.card}>
        <ThemedText style={styles.cardTitle}>
          {item.itemSnapshot?.name ?? `Item #${item.itemId}`}
        </ThemedText>
        <ThemedText>
          Qty: {item.quantity} â€¢ Status: {item.status}
        </ThemedText>
        <ThemedText>Price: {formatPrice(priceCents)} per unit</ThemedText>
        <ThemedText>Venue ID: {item.venueId ?? "N/A"}</ThemedText>
        <ThemedText style={styles.metaText}>
          Order ID: {item.id} â€¢ User: {item.userId}
        </ThemedText>
        <ThemedText style={styles.metaText}>
          Created: {formatDateTime(item.createdAt)}
        </ThemedText>

        {/* Status action buttons */}
        <View style={styles.buttonRow}>
          <StatusButton
            label="Preparing"
            targetStatus="preparing"
            currentStatus={item.status}
            disabled={isUpdating}
            onPress={() => updateStatus(item.id, "preparing")}
          />
          <StatusButton
            label="Ready"
            targetStatus="ready"
            currentStatus={item.status}
            disabled={isUpdating}
            onPress={() => updateStatus(item.id, "ready")}
          />
          <StatusButton
            label="Delivered"
            targetStatus="delivered"
            currentStatus={item.status}
            disabled={isUpdating}
            onPress={() => updateStatus(item.id, "delivered")}
          />
        </View>

        {isUpdating && (
          <View style={styles.updatingRow}>
            <ActivityIndicator size="small" />
            <Text style={styles.updatingText}>Updating statusâ€¦</Text>
          </View>
        )}
      </View>
    );
  };

  const keyExtractor = (item: DrinkOrder) => String(item.id);

  const showEmpty = !loading && !error && orders.length === 0;

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Venue Orders
      </ThemedText>

      {error && (
        <View style={styles.errorBox}>
          <ThemedText style={styles.errorTitle}>Error</ThemedText>
          <ThemedText>{error}</ThemedText>
        </View>
      )}

      {loading && !refreshing && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" />
          <ThemedText>Loading ordersâ€¦</ThemedText>
        </View>
      )}

      {showEmpty && (
        <View style={styles.emptyBox}>
          <ThemedText>No orders yet</ThemedText>
          <ThemedText style={styles.emptySub}>
            New drink orders will appear here in real time.
          </ThemedText>
        </View>
      )}

      <FlatList
        data={orders}
        keyExtractor={keyExtractor}
        renderItem={renderOrder}
        contentContainerStyle={
          orders.length === 0 ? styles.listEmptyContent : styles.listContent
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    </ThemedView>
  );
}

type StatusButtonProps = {
  label: string;
  targetStatus: string;
  currentStatus: string;
  disabled?: boolean;
  onPress: () => void;
};

function StatusButton({
  label,
  targetStatus,
  currentStatus,
  disabled,
  onPress,
}: StatusButtonProps) {
  const isActive = currentStatus === targetStatus;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || isActive}
      style={[
        styles.statusButton,
        isActive && styles.statusButtonActive,
        disabled && !isActive && styles.statusButtonDisabled,
      ]}
    >
      <Text
        style={[
          styles.statusButtonText,
          isActive && styles.statusButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 24,
    paddingHorizontal: 16,
  },
  title: {
    textAlign: "center",
    marginBottom: 16,
    fontWeight: "bold",
  },
  errorBox: {
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    backgroundColor: "rgba(200,0,0,0.15)",
  },
  errorTitle: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  loadingBox: {
    alignItems: "center",
    marginTop: 24,
  },
  emptyBox: {
    alignItems: "center",
    marginTop: 24,
  },
  emptySub: {
    fontSize: 12,
    marginTop: 4,
  },
  listContent: {
    paddingBottom: 32,
  },
  listEmptyContent: {
    flexGrow: 1,
  },
  card: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  cardTitle: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  metaText: {
    fontSize: 12,
    marginTop: 2,
  },
  buttonRow: {
    flexDirection: "row",
    marginTop: 8,
    gap: 8,
  },
  statusButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  statusButtonActive: {
    backgroundColor: "rgba(0,180,0,0.25)",
    borderColor: "rgba(0,200,0,0.9)",
  },
  statusButtonDisabled: {
    opacity: 0.5,
  },
  statusButtonText: {
    fontSize: 12,
  },
  statusButtonTextActive: {
    fontWeight: "bold",
  },
  updatingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 6,
  },
  updatingText: {
    fontSize: 12,
  },
});


