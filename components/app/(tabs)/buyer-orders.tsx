// app/(tabs)/buyer-orders.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { DEFAULT_BASE_URL, getAuthHeaders, hasAuthToken } from '@/lib/tabz-api';

type BuyerOrder = {
  // NEW API shape (current backend)
  orderId?: number;
  createdAt?: string;
  status?: string;
  itemName?: string;
  quantity?: number;
  amountCents?: number;
  feeCents?: number;
  venueId?: number;

  // Legacy/alternate (just in case)
  id?: number;
  itemId?: number;
  totalCents?: number;
};

function toStr(x: any) {
  return typeof x === 'string' ? x : Array.isArray(x) ? x[0] : '';
}

function formatMoney(cents?: number) {
  if (typeof cents !== 'number') return '-';
  return `$${(cents / 100).toFixed(2)}`;
}

function pickKey(o: BuyerOrder) {
  return String(o.orderId ?? o.id ?? Math.random());
}

export default function BuyerOrdersScreen() {
  const params = useLocalSearchParams();

  // Phase 2.1: still allow baseUrl override, but auth comes from tabz-api (not URL, not dev-login)
  const baseUrlFromUrl = toStr((params as any).baseUrl);

  const BASE_URL = useMemo(() => {
    const b = baseUrlFromUrl?.trim();
    return b && b.length > 0 ? b : DEFAULT_BASE_URL;
  }, [baseUrlFromUrl]);

  const [orders, setOrders] = useState<BuyerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [who, setWho] = useState<{ userId?: number; email?: string; role?: string } | null>(null);

  const fetchWhoAmI = useCallback(async () => {
    try {
      if (!hasAuthToken()) {
        setWho(null);
        return null;
      }

      const res = await fetch(`${BASE_URL}/auth/me`, {
        method: 'GET',
        headers: getAuthHeaders(),
        cache: 'no-store' as any,
      });

      if (!res.ok) {
        setWho(null);
        return null;
      }

      const data = await res.json();
      const identity = {
        userId: data?.userId,
        email: data?.email,
        role: data?.role,
      };
      setWho(identity);
      return identity;
    } catch {
      setWho(null);
      return null;
    }
  }, [BASE_URL]);

  const fetchBuyerOrders = useCallback(async () => {
    setError(null);

    try {
      // Phase 2.1 hardening: no auto-login, no URL token
      if (!hasAuthToken()) {
        throw new Error('Not authenticated. Set auth token before loading Buyer Orders.');
      }

      await fetchWhoAmI();

      const res = await fetch(`${BASE_URL}/store-items/my-orders`, {
        method: 'GET',
        headers: getAuthHeaders(),
        cache: 'no-store' as any,
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`GET /store-items/my-orders failed: ${res.status} ${txt}`);
      }

      const data = await res.json();
      const arr: any[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.value)
        ? data.value
        : [];
      setOrders(arr);
    } catch (e: any) {
      setOrders([]);
      setError(e?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [BASE_URL, fetchWhoAmI]);

  useEffect(() => {
    fetchBuyerOrders();
  }, [fetchBuyerOrders]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBuyerOrders();
  }, [fetchBuyerOrders]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.muted}>Loading orders…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Orders</Text>

      {who ? (
        <Text style={styles.debug}>
          Token user: {who.email ?? 'unknown'} (id {who.userId ?? '?'}, role {who.role ?? '?'})
        </Text>
      ) : (
        <Text style={styles.debug}>Token user: (unknown / not authenticated)</Text>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={orders}
        keyExtractor={(item) => pickKey(item)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.muted}>No orders yet.</Text>}
        renderItem={({ item }) => {
          const id = item.orderId ?? item.id ?? 0;
          const name = item.itemName ?? (item.itemId != null ? `Item #${item.itemId}` : '-');
          const qty = item.quantity ?? '-';
          const total = item.amountCents ?? item.totalCents;

          return (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Order #{id || '-'}</Text>
              <Text style={styles.cardLine}>Item: {name}</Text>
              <Text style={styles.cardLine}>Qty: {qty}</Text>
              <Text style={styles.cardLine}>Total: {formatMoney(total)}</Text>
              <Text style={styles.cardLine}>Status: {item.status ?? '-'}</Text>
              <Text style={styles.cardLine}>Created: {item.createdAt ?? '-'}</Text>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 6 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  muted: { opacity: 0.7 },
  error: { color: '#ff4d4f', marginBottom: 10 },
  debug: { opacity: 0.7, marginBottom: 10, fontSize: 12 },
  card: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  cardTitle: { fontWeight: '700', marginBottom: 6 },
  cardLine: { opacity: 0.9 },
});
