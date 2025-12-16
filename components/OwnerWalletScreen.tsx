// ======================================================
// components/OwnerWalletScreen.tsx
// Owner wallet screen (summary + metrics + cashouts)
// WEB FIX: do NOT send x-user-id header (CORS blocks it)
// Uses ?userId=3 query param instead (controller supports it)
// ======================================================

import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { BASE_URL, OWNER_TOKEN } from '../lib/api';
import { OWNER_USER_ID } from '../lib/ownerToken';

type Summary = {
  balanceCents: number;
  spendableBalanceCents: number;
  cashoutAvailableCents: number;
};

type Metrics = {
  totalCashouts: number;
  totalPending: number;
  totalCompleted: number;
  totalFailed: number;
  totalAmountPaidOut: number;
  totalAmountPending: number;
  totalAmountFailedReturned: number;
};

type Cashout = {
  id: number;
  amountCents: number;
  status: string;
  failureReason?: string | null;
  destinationLast4?: string | null;
  createdAt: string;
};

function formatMoney(cents: number) {
  const v = Number(cents || 0) || 0;
  return `$${(v / 100).toFixed(2)}`;
}

export default function OwnerWalletScreen() {
  const token = OWNER_TOKEN;

  // ✅ Web-safe: pass userId via query param (not a header)
  const userId = OWNER_USER_ID || '3';
  const qs = useMemo(() => `?userId=${encodeURIComponent(String(userId))}`, [userId]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [summary, setSummary] = useState<Summary | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [cashouts, setCashouts] = useState<Cashout[]>([]);

  const [amountInput, setAmountInput] = useState('5');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const authHeaders = useMemo(() => {
    // ✅ IMPORTANT: NO x-user-id header (CORS preflight blocks it on web)
    return () => ({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }, [token]);

  const loadAll = async () => {
    try {
      setLoading(true);
      setError(null);

      const [summaryRes, metricsRes, cashoutsRes] = await Promise.all([
        fetch(`${BASE_URL}/wallet/summary${qs}`, { headers: authHeaders() }),
        fetch(`${BASE_URL}/wallet/metrics${qs}`, { headers: authHeaders() }),
        fetch(`${BASE_URL}/wallet/cashouts${qs}`, { headers: authHeaders() }),
      ]);

      const summaryJson = await summaryRes.json().catch(() => null);
      const metricsJson = await metricsRes.json().catch(() => null);
      const cashoutsJson = await cashoutsRes.json().catch(() => null);

      if (!summaryRes.ok) throw new Error(summaryJson?.message || 'Summary failed');
      if (!metricsRes.ok) throw new Error(metricsJson?.message || 'Metrics failed');
      if (!cashoutsRes.ok) throw new Error(cashoutsJson?.message || 'Cashouts failed');

      setSummary(summaryJson);
      setMetrics(metricsJson);
      setCashouts(Array.isArray(cashoutsJson) ? cashoutsJson : []);
    } catch (e: any) {
      console.log('LOAD ERROR:', e);
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [qs]);

  const handleCashout = async () => {
    setMessage(null);
    setError(null);

    const value = parseFloat(amountInput.replace(/[^0-9.]/g, ''));
    if (Number.isNaN(value) || value <= 0) {
      setError('Enter a valid cashout amount.');
      return;
    }

    const amountCents = Math.round(value * 100);

    if (summary && amountCents > Number(summary.cashoutAvailableCents || 0)) {
      setError('Amount is higher than your cashout-ready balance.');
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch(`${BASE_URL}/wallet/cashout${qs}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ amountCents }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        console.log('CASHOUT ERROR:', errJson || res.statusText);
        setError(errJson?.message || 'Cashout failed.');
        return;
      }

      await res.json().catch(() => null);
      setMessage(`Cashout created for ${formatMoney(amountCents)}.`);
      setAmountInput('5');
      await loadAll();
    } catch (e) {
      console.log('CASHOUT EXCEPTION:', e);
      setError('Error creating cashout.');
    } finally {
      setSubmitting(false);
    }
  };

  const cancelCashout = async (cashoutId: number) => {
    try {
      setSubmitting(true);

      const res = await fetch(`${BASE_URL}/wallet/cashouts/${cashoutId}/cancel${qs}`, {
        method: 'POST',
        headers: authHeaders(),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.message || `Cancel failed (HTTP ${res.status})`);
      }

      await loadAll();
    } catch (e: any) {
      Alert.alert('Cancel failed', String(e?.message || e));
    } finally {
      setSubmitting(false);
    }
  };

  const retryCashout = async (cashoutId: number) => {
    try {
      setSubmitting(true);

      const res = await fetch(`${BASE_URL}/wallet/cashouts/${cashoutId}/retry${qs}`, {
        method: 'POST',
        headers: authHeaders(),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.message || `Retry failed (HTTP ${res.status})`);
      }

      await loadAll();
    } catch (e: any) {
      Alert.alert('Retry failed', String(e?.message || e));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Owner Wallet</Text>

      {error ? <Text style={styles.err}>{error}</Text> : null}
      {message ? <Text style={styles.msg}>{message}</Text> : null}

      <View style={styles.card}>
        <Text style={styles.h2}>Summary</Text>
        <Text style={styles.p}>Balance: {formatMoney(summary?.balanceCents || 0)}</Text>
        <Text style={styles.p}>
          Cashout Ready: {formatMoney(summary?.cashoutAvailableCents || 0)}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.h2}>Create Cashout</Text>

        <TextInput
          value={amountInput}
          onChangeText={setAmountInput}
          keyboardType="numeric"
          placeholder="5"
          placeholderTextColor="#666"
          style={styles.input}
        />

        <TouchableOpacity
          style={[styles.btn, submitting ? styles.btnDisabled : null]}
          onPress={handleCashout}
          disabled={submitting}
        >
          <Text style={styles.btnText}>{submitting ? 'Submitting...' : 'Cash Out'}</Text>
        </TouchableOpacity>

        <Text style={styles.note}>
          Sends: userId={userId} | POST {BASE_URL}/wallet/cashout{qs}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.h2}>Cashouts</Text>

        <FlatList
          data={cashouts}
          keyExtractor={(i) => String(i.id)}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          renderItem={({ item }) => {
            const status = String(item.status || '').toUpperCase();
            const isFailed = status === 'FAILED';
            const isPending = status === 'PENDING';

            return (
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.amount}>{formatMoney(item.amountCents || 0)}</Text>
                  <Text style={styles.meta}>{item.createdAt}</Text>
                  {item.failureReason ? (
                    <Text style={styles.fail}>Reason: {String(item.failureReason)}</Text>
                  ) : null}
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.status}>{status}</Text>

                  {isPending ? (
                    <TouchableOpacity
                      style={styles.smallBtn}
                      onPress={() => cancelCashout(item.id)}
                      disabled={submitting}
                    >
                      <Text style={styles.smallBtnText}>Cancel</Text>
                    </TouchableOpacity>
                  ) : null}

                  {isFailed ? (
                    <TouchableOpacity
                      style={styles.smallBtn}
                      onPress={() => retryCashout(item.id)}
                      disabled={submitting}
                    >
                      <Text style={styles.smallBtnText}>Retry</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            );
          }}
          ListEmptyComponent={<Text style={styles.muted}>No cashouts found.</Text>}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000', padding: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  title: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 10 },
  h2: { color: '#7CFC00', fontWeight: '800', marginBottom: 8 },

  p: { color: '#fff', marginBottom: 6 },
  err: { color: '#ff6b6b', marginBottom: 10 },
  msg: { color: '#7CFC00', marginBottom: 10 },

  card: { borderWidth: 1, borderColor: '#0f0', borderRadius: 10, padding: 12, marginBottom: 12 },

  input: {
    backgroundColor: '#111',
    borderColor: '#333',
    borderWidth: 1,
    borderRadius: 8,
    color: '#fff',
    padding: 10,
    marginBottom: 10,
  },

  btn: {
    backgroundColor: '#7CFC00',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#000', fontWeight: '800' },

  note: { color: '#777', marginTop: 10, fontSize: 12 },

  sep: { height: 1, backgroundColor: '#222', marginVertical: 10 },
  row: { flexDirection: 'row', alignItems: 'center' },

  amount: { color: '#fff', fontWeight: '800' },
  meta: { color: '#888', fontSize: 12, marginTop: 2 },
  status: { color: '#fff', fontWeight: '800' },
  fail: { color: '#ffaaaa', fontSize: 12, marginTop: 4 },
  muted: { color: '#aaa', marginTop: 8 },

  smallBtn: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#7CFC00',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  smallBtnText: { color: '#7CFC00', fontWeight: '800' },
});
