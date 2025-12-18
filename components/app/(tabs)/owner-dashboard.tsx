// app/(tabs)/owner-dashboard.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

function toStr(x: any) {
  return typeof x === 'string' ? x : Array.isArray(x) ? x[0] : '';
}

type WalletSummary = {
  id: number;
  userId: number;
  balanceCents: number;
  spendableBalanceCents: number;
  cashoutAvailableCents: number;
};

export default function OwnerDashboardScreen() {
  const params = useLocalSearchParams();

    const baseUrlFromUrl = toStr((params as any).baseUrl);

  // Base URL can still come from URL for convenience
  const BASE_URL = useMemo(() => {
    const b = baseUrlFromUrl?.trim();
    return b && b.length > 0 ? b : 'http://10.0.0.239:3000';
  }, [baseUrlFromUrl]);

  // ✅ BEST FOR THE APP:
  // Token comes from the single source of truth (login flow), not URL params
  const { getAuthToken } = require('../../components/lib/api');
  const TOKEN: string = getAuthToken?.() || '';


  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [dashError, setDashError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setDashError(null);

    if (!TOKEN) {
      setWallet(null);
      setLoading(false);
     setDashError('Not authenticated. Please log in (and optional &baseUrl=http://10.0.0.239:3000)');
      return;
    }

    try {
      // Wallet summary (you already confirmed this works)
      const w = await fetch(`${BASE_URL}/wallet/summary`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      if (!w.ok) {
        const txt = await w.text().catch(() => '');
        throw new Error(`GET /wallet/summary failed: ${w.status} ${txt}`);
      }

      const walletJson = await w.json();
      setWallet(walletJson);

      // Owner dashboard (store-items)
      const d = await fetch(`${BASE_URL}/store-items/owner/dashboard`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      // If this fails, we still keep the wallet info visible
      if (!d.ok) {
        const txt = await d.text().catch(() => '');
        setDashError(`GET /store-items/owner/dashboard failed: ${d.status} ${txt}`);
      } else {
        // If you want to render dashboard data later, parse it here.
        // const dashJson = await d.json();
      }
    } catch (e: any) {
      setDashError(e?.message || 'Failed to load owner dashboard');
    } finally {
      setLoading(false);
    }
  }, [BASE_URL, TOKEN]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.muted}>Loading dashboard…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Owner Dashboard</Text>

      {dashError ? <Text style={styles.error}>{dashError}</Text> : null}

      <View style={styles.block}>
        <Text style={styles.blockTitle}>OWNER WALLET</Text>
        <Text style={styles.bigMoney}>
          {wallet ? `$${(wallet.balanceCents / 100).toFixed(2)}` : '$0.00'}
        </Text>
        <View style={styles.row}>
          <View style={styles.pill}>
            <Text style={styles.pillLabel}>Spendable</Text>
            <Text style={styles.pillValue}>
              {wallet ? `$${(wallet.spendableBalanceCents / 100).toFixed(2)}` : '$0.00'}
            </Text>
          </View>
          <View style={styles.pill}>
            <Text style={styles.pillLabel}>Cashout-ready</Text>
            <Text style={styles.pillValue}>
              {wallet ? `$${(wallet.cashoutAvailableCents / 100).toFixed(2)}` : '$0.00'}
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity onPress={fetchAll} style={styles.refreshBtn}>
        <Text style={styles.refreshText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  muted: { opacity: 0.7 },
  error: { color: '#ff4d4f', marginBottom: 10 },

  block: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
    borderRadius: 12,
    padding: 14,
  },
  blockTitle: { fontWeight: '700', marginBottom: 8, opacity: 0.8 },
  bigMoney: { fontSize: 28, fontWeight: '800', marginBottom: 10 },

  row: { flexDirection: 'row', gap: 10 },
  pill: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  pillLabel: { fontSize: 12, opacity: 0.75 },
  pillValue: { fontSize: 16, fontWeight: '700' },

  refreshBtn: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  refreshText: { fontWeight: '700' },
});
