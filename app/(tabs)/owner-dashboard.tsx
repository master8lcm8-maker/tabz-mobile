// app/(tabs)/owner-dashboard.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { apiGet } from '../../components/lib/api';




type OwnerDashboardWallet = {
  id: number;
  userId: number;
  balanceCents: number;
  spendableBalanceCents: number;
  cashoutAvailableCents: number;
  createdAt: string;
  updatedAt: string;
};

type OwnerStatsTotal = {
  ordersCount: number;
  amountCents: number;
  feeCents: number;
  payoutCents: number;
};

type OwnerStatsVenue = {
  venueId: number;
  venueName: string;
  ordersCount: number;
  amountCents: number;
  feeCents: number;
  payoutCents: number;
};

type OwnerStats = {
  total: OwnerStatsTotal;
  byVenue: OwnerStatsVenue[];
};

type OwnerRecentOrder = {
  orderId: number;
  createdAt: string;
  status: string;
  itemName: string;
  quantity: number;
  amountCents: number;
  feeCents: number;
  payoutCents: number;
  buyerId: number;
  venueId: number;
  venueName: string;
};

type OwnerDashboardResponse = {
  wallet: OwnerDashboardWallet;
  stats: OwnerStats;
  recentOrders: OwnerRecentOrder[];
};

function centsToDollars(cents: number | string | null | undefined): string {
  if (cents === null || cents === undefined) return '0.00';
  const n =
    typeof cents === 'number' ? cents : Number.parseInt(String(cents), 10) || 0;
  return (n / 100).toFixed(2);
}

function statusColor(status: string): string {
  const normalized = (status || '').toLowerCase();
  if (normalized === 'completed') return '#15FF7F';
  if (normalized === 'pending') return '#FFC94A';
  if (normalized === 'failed') return '#FF4F4F';
  return '#AAAAAA';
}

export default function OwnerDashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wallet, setWallet] = useState<OwnerDashboardWallet | null>(null);
  const [stats, setStats] = useState<OwnerStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<OwnerRecentOrder[]>([]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      // 🔗 Use shared API helper (handles BASE_URL + token)
      const json = (await apiGet(
        '/store-items/owner/dashboard',
      )) as OwnerDashboardResponse;

      console.log('OWNER DASHBOARD:', json);

      setWallet(json.wallet ?? null);
      setStats(json.stats ?? null);
      setRecentOrders(json.recentOrders ?? []);
    } catch (err: any) {
      console.log('OWNER DASHBOARD LOAD ERROR:', err);
      setError(err?.message || 'Failed to load owner dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  // Initial loading
  if (loading && !wallet && !stats && recentOrders.length === 0) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color="#15FF7F" />
      </ThemedView>
    );
  }

  const totalOrders = stats?.total?.ordersCount ?? 0;
  const totalGross = stats?.total?.amountCents ?? 0;
  const totalFees = stats?.total?.feeCents ?? 0;
  const totalPayouts = stats?.total?.payoutCents ?? 0;

  const cashoutAvailable = wallet?.cashoutAvailableCents ?? 0;
  const spendable = wallet?.spendableBalanceCents ?? 0;
  const balance = wallet?.balanceCents ?? 0;

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* HEADER */}
      <ThemedText type="title" style={{ marginBottom: 4 }}>
        Owner Dashboard
      </ThemedText>
      <ThemedText
        style={{
          color: 'rgba(255,255,255,0.6)',
          fontSize: 13,
          marginBottom: 8,
        }}
      >
        High-level view of your wallet, sales and recent orders.
      </ThemedText>

      {/* DEBUG LINE */}
      <ThemedText
        style={{
          color: 'rgba(21,255,127,0.85)',
          fontSize: 11,
          marginBottom: 10,
        }}
      >
        Loaded {recentOrders.length} recent orders from backend.
      </ThemedText>

      {/* ERROR BANNER (non-blocking) */}
      {error && (
        <View style={styles.errorBanner}>
          <ThemedText style={styles.errorBannerText}>{error}</ThemedText>
        </View>
      )}

      {/* WALLET CARD */}
      <View style={styles.walletCard}>
        <ThemedText style={styles.sectionLabel}>Owner wallet</ThemedText>

        <ThemedText style={styles.walletBalanceLabel}>Total balance</ThemedText>
        <ThemedText style={styles.walletBalanceAmount}>
          ${centsToDollars(balance)}
        </ThemedText>

        <View style={styles.walletRow}>
          <View style={styles.walletPill}>
            <ThemedText style={styles.walletPillLabel}>Spendable</ThemedText>
            <ThemedText style={styles.walletPillValue}>
              ${centsToDollars(spendable)}
            </ThemedText>
          </View>
          <View style={styles.walletPill}>
            <ThemedText style={styles.walletPillLabel}>
              Cashout-ready
            </ThemedText>
            <ThemedText style={[styles.walletPillValue, { color: '#15FF7F' }]}>
              ${centsToDollars(cashoutAvailable)}
            </ThemedText>
          </View>
        </View>
      </View>

      {/* SALES SUMMARY CARD */}
      <View style={styles.salesCard}>
        <ThemedText style={styles.sectionLabel}>Sales summary</ThemedText>

        <View style={styles.salesRow}>
          <View style={styles.salesMetric}>
            <ThemedText style={styles.salesMetricLabel}>Orders</ThemedText>
            <ThemedText style={styles.salesMetricValue}>
              {totalOrders}
            </ThemedText>
          </View>
          <View style={styles.salesMetric}>
            <ThemedText style={styles.salesMetricLabel}>Gross</ThemedText>
            <ThemedText style={styles.salesMetricValue}>
              ${centsToDollars(totalGross)}
            </ThemedText>
          </View>
        </View>

        <View style={styles.salesRow}>
          <View style={styles.salesMetric}>
            <ThemedText style={styles.salesMetricLabel}>
              Platform fees
            </ThemedText>
            <ThemedText style={styles.salesMetricValue}>
              ${centsToDollars(totalFees)}
            </ThemedText>
          </View>
          <View style={styles.salesMetric}>
            <ThemedText style={styles.salesMetricLabel}>Your payout</ThemedText>
            <ThemedText style={[styles.salesMetricValue, { color: '#15FF7F' }]}>
              ${centsToDollars(totalPayouts)}
            </ThemedText>
          </View>
        </View>

        {/* By-venue list (compact) */}
        {stats?.byVenue?.length ? (
          <View style={{ marginTop: 12 }}>
            <ThemedText style={styles.byVenueTitle}>By venue</ThemedText>
            {stats.byVenue.map((v) => (
              <View key={v.venueId} style={styles.byVenueRow}>
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.byVenueName}>
                    {v.venueName}
                  </ThemedText>
                  <ThemedText style={styles.byVenueSub}>
                    {v.ordersCount} orders · ${centsToDollars(v.amountCents)}{' '}
                    gross
                  </ThemedText>
                </View>
                <ThemedText style={styles.byVenuePayout}>
                  ${centsToDollars(v.payoutCents)}
                </ThemedText>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      {/* LIST HEADER */}
      <View style={styles.listHeaderRow}>
        <ThemedText style={styles.listHeaderText}>Recent orders</ThemedText>
        <TouchableOpacity onPress={loadDashboard} style={styles.smallRefresh}>
          <ThemedText style={styles.smallRefreshText}>Refresh</ThemedText>
        </TouchableOpacity>
      </View>

      {/* RECENT ORDERS LIST */}
      {recentOrders.length === 0 ? (
        <View style={styles.emptyState}>
          <ThemedText style={styles.emptyTitle}>No orders yet</ThemedText>
          <ThemedText style={styles.emptySubtitle}>
            When guests start buying items at your venues, they will appear
            here.
          </ThemedText>
        </View>
      ) : (
        recentOrders.map((o) => {
          const amount = centsToDollars(o.amountCents);
          const status = (o.status || '').toLowerCase();
          const color = statusColor(o.status);
          const created = new Date(o.createdAt).toLocaleString();

          return (
            <View key={o.orderId} style={styles.orderRow}>
              <View style={{ flex: 1, gap: 2 }}>
                <ThemedText style={styles.orderAmount}>${amount}</ThemedText>
                <ThemedText style={styles.orderTitle}>
                  {o.itemName} · {o.quantity}x
                </ThemedText>
                <ThemedText style={styles.orderMeta}>
                  {o.venueName} · {created}
                </ThemedText>
              </View>
              <View style={styles.orderRight}>
                <View style={[styles.statusChip, { borderColor: color }]}>
                  <ThemedText
                    style={[styles.statusChipText, { color }]}
                  >
                    {status}
                  </ThemedText>
                </View>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#05060E',
    paddingHorizontal: 18,
    paddingTop: 20,
  },
  centered: {
    flex: 1,
    backgroundColor: '#05060E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorBanner: {
    backgroundColor: 'rgba(255,79,79,0.15)',
    borderColor: '#FF4F4F',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 12,
  },
  errorBannerText: {
    color: '#FFB0B0',
    fontSize: 12,
  },

  sectionLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },

  walletCard: {
    backgroundColor: '#080A15',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(21,255,127,0.45)',
    shadowColor: '#15FF7F',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 16,
  },
  walletBalanceLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  walletBalanceAmount: {
    fontSize: 26,
    fontWeight: '700',
    color: '#15FF7F',
    marginTop: 2,
  },
  walletRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  walletPill: {
    flexDirection: 'column',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#050811',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    minWidth: 100,
  },
  walletPillLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
  },
  walletPillValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  salesCard: {
    backgroundColor: '#080A15',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 18,
  },
  salesRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  salesMetric: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#050811',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  salesMetricLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
  },
  salesMetricValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },

  byVenueTitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    marginBottom: 4,
    marginTop: 8,
  },
  byVenueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  byVenueName: {
    fontSize: 13,
    color: '#FFFFFF',
  },
  byVenueSub: {
    fontSize: 11,
    color: 'rgba(200,220,255,0.8)',
  },
  byVenuePayout: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15FF7F',
    marginLeft: 10,
  },

  listHeaderRow: {
    marginTop: 4,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listHeaderText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  smallRefresh: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(21,255,127,0.5)',
  },
  smallRefreshText: {
    fontSize: 11,
    color: '#15FF7F',
    fontWeight: '600',
  },

  orderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#080A15',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 10,
    gap: 12,
  },
  orderAmount: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  orderTitle: {
    fontSize: 13,
    color: '#FFFFFF',
  },
  orderMeta: {
    fontSize: 11,
    color: 'rgba(200,220,255,0.8)',
  },
  orderRight: {
    alignItems: 'flex-end',
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusChipText: {
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '700',
  },

  emptyState: {
    marginTop: 10,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#080A15',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: 'rgba(210,220,255,0.8)',
  },
});
