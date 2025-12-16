// app/(tabs)/buyer-orders.tsx

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
  Text,
} from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';

const BASE_URL = 'http://localhost:3000';

type BuyerOrder = {
  orderId: number;
  createdAt: string;
  status: string;
  itemName: string;
  quantity: number;
  amountCents: number;
  venueName?: string;
  payoutCents?: number | null;
};

async function loginDemoBuyer(): Promise<string> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'demo@tabz.app',
      password: 'password123',
    }),
  });

  if (!res.ok) {
    throw new Error(`Login failed with status ${res.status}`);
  }

  const json = await res.json();
  if (!json.access_token) {
    throw new Error('Login response missing access_token');
  }

  return json.access_token as string;
}

async function fetchBuyerOrders(): Promise<BuyerOrder[]> {
  const token = await loginDemoBuyer();

  const res = await fetch(`${BASE_URL}/store-items/my-orders`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to load orders: ${res.status}`);
  }

  const json = await res.json();

  // PowerShell shows a "value" property; support both shapes just in case.
  const raw = Array.isArray(json) ? json : json.value;

  if (!Array.isArray(raw)) return [];

  return raw as BuyerOrder[];
}

export default function BuyerOrdersScreen() {
  const [orders, setOrders] = useState<BuyerOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchBuyerOrders();
      setOrders(data);
    } catch (err: any) {
      console.error('Failed to load buyer orders', err);
      setError(err?.message ?? 'Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const renderItem = ({ item }: { item: BuyerOrder }) => {
    const dollars = (item.amountCents ?? 0) / 100;
    const payoutDollars =
      item.payoutCents != null ? item.payoutCents / 100 : null;

    return (
      <View style={styles.card}>
        <ThemedText type="subtitle">{item.itemName}</ThemedText>
        <ThemedText style={styles.line}>
          Qty: <Text style={styles.value}>{item.quantity}</Text>
        </ThemedText>
        <ThemedText style={styles.line}>
          Status: <Text style={styles.value}>{item.status}</Text>
        </ThemedText>
        {item.venueName ? (
          <ThemedText style={styles.line}>
            Venue: <Text style={styles.value}>{item.venueName}</Text>
          </ThemedText>
        ) : null}
        <ThemedText style={styles.line}>
          Amount:{' '}
          <Text style={styles.value}>
            ${dollars.toFixed(2)}
          </Text>
        </ThemedText>
        {payoutDollars != null && (
          <ThemedText style={styles.line}>
            Your payout:{' '}
            <Text style={styles.value}>
              ${payoutDollars.toFixed(2)}
            </Text>
          </ThemedText>
        )}
        <ThemedText style={styles.createdAt}>{item.createdAt}</ThemedText>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        My Orders
      </ThemedText>

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator />
          <ThemedText style={styles.loadingText}>
            Loading your orders...
          </ThemedText>
        </View>
      )}

      {!loading && error && (
        <View style={styles.center}>
          <ThemedText type="defaultSemiBold">
            Error: {error}
          </ThemedText>
        </View>
      )}

      {!loading && !error && orders.length === 0 && (
        <View style={styles.center}>
          <ThemedText>No orders yet.</ThemedText>
        </View>
      )}

      {!loading && !error && orders.length > 0 && (
        <FlatList
          data={orders}
          keyExtractor={(item) => String(item.orderId)}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
    paddingHorizontal: 16,
  },
  title: {
    marginBottom: 16,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
  },
  listContent: {
    paddingBottom: 32,
  },
  card: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  line: {
    fontSize: 12,
  },
  value: {
    fontWeight: '600',
  },
  createdAt: {
    marginTop: 4,
    fontSize: 10,
    opacity: 0.7,
  },
});
