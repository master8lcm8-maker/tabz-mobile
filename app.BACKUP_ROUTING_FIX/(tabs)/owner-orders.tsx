// app/(tabs)/owner-orders.tsx
// ===============================================
// Owner Orders – TABZ dark + neon theme
// Data source: GET /owner/orders (owner-scoped orders)
// SIMPLE VERSION: single hard-coded Owner3 JWT (centralized in ownerToken.ts)
// ===============================================

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { OWNER_TOKEN, BASE_URL } from '../../lib/ownerToken';




type OwnerOrder = {
  id: number;
  buyerId: number;
  buyerName: string;
  itemName: string;
  quantity: number;
  amountCents: number;
  status: string;
  venueId: number;
  createdAt: string;
};

const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? fallback : parsed;
  }
  return fallback;
};

const formatCents = (cents: number): string => {
  const dollars = cents / 100;
  return `$${dollars.toFixed(2)}`;
};

const formatDateTime = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
};

function OwnerOrdersScreen() {
  const [orders, setOrders] = useState<OwnerOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelingId, setCancelingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchOwnerOrders = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      const res = await fetch(`${BASE_URL}/owner/orders`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${OWNER_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('Failed to load owner orders:', text);
        throw new Error(`Error ${res.status}: ${text}`);
      }

      const data: OwnerOrder[] = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error fetching owner orders:', err);
      setError(err?.message ?? 'Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOwnerOrders();
  }, [fetchOwnerOrders]);

  const handleCancelOrder = useCallback(
    async (orderId: number) => {
      try {
        setCancelingId(orderId);
        setError(null);

        const res = await fetch(`${BASE_URL}/owner/orders/${orderId}/cancel`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${OWNER_TOKEN}`,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          const text = await res.text();
          console.error('Failed to cancel order:', text);
          throw new Error(`Error ${res.status}: ${text}`);
        }

        // Re-fetch list after cancel
        await fetchOwnerOrders();
      } catch (err: any) {
        console.error('Error canceling owner order:', err);
        setError(err?.message ?? 'Failed to cancel order');
      } finally {
        setCancelingId(null);
      }
    },
    [fetchOwnerOrders],
  );

  // Load once on mount
  useEffect(() => {
    fetchOwnerOrders();
  }, [fetchOwnerOrders]);

  const isEmpty = !loading && orders.length === 0;

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>
          Owner Orders
        </ThemedText>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
          disabled={loading || refreshing}
        >
          <ThemedText type="defaultSemiBold" style={styles.refreshText}>
            {refreshing || loading ? 'Refreshing...' : 'Refresh'}
          </ThemedText>
        </TouchableOpacity>
      </View>

      {loading && !refreshing && (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <ThemedText style={styles.loadingText}>Loading orders…</ThemedText>
        </View>
      )}

      {error && (
        <View style={styles.errorBox}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        </View>
      )}

      {isEmpty && !error && (
        <View style={styles.center}>
          <ThemedText style={styles.emptyTitle}>
            No orders found for this venue
          </ThemedText>
          <ThemedText style={styles.emptySubtitle}>
            When buyers send drink or store orders to this venue,
            they will appear here.
          </ThemedText>
        </View>
      )}

      {!isEmpty && (
        <ScrollView style={styles.scroll}>
          {orders.map((order) => {
            const amount = formatCents(toNumber(order.amountCents));
            const created = formatDateTime(order.createdAt);
            const isPending = order.status === 'PENDING';
            const isCanceled = order.status === 'CANCELED';
            const isCompleted = order.status === 'COMPLETED';

            return (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.rowBetween}>
                  <ThemedText type="defaultSemiBold" style={styles.itemName}>
                    {order.itemName} x{order.quantity}
                  </ThemedText>
                  <ThemedText type="defaultSemiBold" style={styles.amount}>
                    {amount}
                  </ThemedText>
                </View>

                <View style={styles.rowBetween}>
                  <ThemedText style={styles.buyerText}>
                    Buyer: {order.buyerName || `#${order.buyerId}`}
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.status,
                      isPending && styles.statusPending,
                      isCompleted && styles.statusCompleted,
                      isCanceled && styles.statusCanceled,
                    ]}
                  >
                    {order.status}
                  </ThemedText>
                </View>

                <ThemedText style={styles.dateText}>{created}</ThemedText>

                {isPending && (
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        styles.cancelButton,
                        cancelingId === order.id && styles.actionButtonDisabled,
                      ]}
                      onPress={() => handleCancelOrder(order.id)}
                      disabled={cancelingId === order.id}
                    >
                      {cancelingId === order.id ? (
                        <ActivityIndicator size="small" />
                      ) : (
                        <ThemedText style={styles.actionButtonText}>
                          Cancel
                        </ThemedText>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05060A', // deep dark
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitle: {
    color: '#F7F7FF',
    fontSize: 20,
  },
  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#16f597', // neon green accent
  },
  refreshText: {
    fontSize: 13,
    color: '#020308',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#b0b4ff',
  },
  errorBox: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#3a1020',
    borderWidth: 1,
    borderColor: '#ff4f7a',
    marginBottom: 8,
  },
  errorText: {
    color: '#ffb8c9',
    fontSize: 13,
  },
  emptyTitle: {
    color: '#f2f2ff',
    fontSize: 16,
    marginBottom: 4,
  },
  emptySubtitle: {
    color: '#a0a3d0',
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  scroll: {
    flex: 1,
  },
  orderCard: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#0b0f20',
    borderWidth: 1,
    borderColor: '#222b55',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    color: '#f6f6ff',
    fontSize: 15,
    maxWidth: '70%',
  },
  amount: {
    color: '#16f597',
    fontSize: 15,
  },
  buyerText: {
    marginTop: 4,
    color: '#c0c3ff',
    fontSize: 13,
  },
  status: {
    marginTop: 4,
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: 'hidden',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statusPending: {
    color: '#ffd86b',
    backgroundColor: '#35240f',
  },
  statusCompleted: {
    color: '#16f597',
    backgroundColor: '#062417',
  },
  statusCanceled: {
    color: '#ff7083',
    backgroundColor: '#301019',
  },
  dateText: {
    marginTop: 4,
    color: '#8d90c2',
    fontSize: 12,
  },
  actionsRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#ff4f7a',
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  cancelButton: {},
  actionButtonText: {
    color: '#fff',
    fontSize: 13,
  },
});

export default OwnerOrdersScreen;
