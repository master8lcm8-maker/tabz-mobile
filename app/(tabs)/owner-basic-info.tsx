// ===============================================
//  app/(tabs)/owner-basic-info.tsx
//  UI only, no backend calls.
//  Fix: full-width layout like other tabs.
// ===============================================

import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function OwnerBasicInfoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string; baseUrl?: string }>();

  // Keep token support (do not display it)
  const token = useMemo(
    () => (typeof params.token === 'string' ? params.token : ''),
    [params.token]
  );
  void token;

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Owner Basic Info</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>VENUE INFORMATION</Text>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Venue Name</Text>
          <Text style={styles.rowValue}>Not set</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Contact Email</Text>
          <Text style={styles.rowValue}>Not set</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Contact Phone</Text>
          <Text style={styles.rowValue}>Not set</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Address</Text>
          <Text style={styles.rowValue}>Not added</Text>
        </View>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => {
            // UI only for now
          }}
        >
          <Text style={styles.primaryBtnText}>Update info</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.card, { marginTop: 12 }]}>
        <Text style={styles.sectionTitle}>PAYOUT BANK INFORMATION</Text>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Bank Name</Text>
          <Text style={styles.rowValue}>Not set</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Last 4 Digits</Text>
          <Text style={styles.rowValue}>Not available</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Status</Text>
          <Text style={[styles.rowValue, { color: '#f87171', fontWeight: '900' }]}>
            missing
          </Text>
        </View>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => {
            router.push({
              pathname: '/owner-bank-info',
              params: { token: params.token as any },
            });
          }}
        >
          <Text style={styles.primaryBtnText}>Update bank info</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.card, { marginTop: 12 }]}>
        <Text style={styles.sectionTitle}>IDENTITY VERIFICATION</Text>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Verification Status</Text>
          <Text style={[styles.rowValue, { color: '#f87171', fontWeight: '900' }]}>
            required
          </Text>
        </View>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => {
            // UI only for now
          }}
        >
          <Text style={styles.primaryBtnText}>Start verification</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.successBtn}
          onPress={() => {
            // UI only
          }}
        >
          <Text style={styles.successBtnText}>Refresh info</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0b0f1a',
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  title: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 10,
  },
  card: {
    width: '100%',
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#0f1628',
    borderWidth: 1,
    borderColor: '#1f2a44',
  },
  sectionTitle: {
    color: '#e5e7eb',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 10,
    letterSpacing: 0.4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#18243b',
  },
  rowLabel: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '700',
  },
  rowValue: {
    color: '#e5e7eb',
    fontSize: 13,
    fontWeight: '800',
  },
  primaryBtn: {
    marginTop: 12,
    width: '100%',
    borderRadius: 10,
    paddingVertical: 12,
    backgroundColor: '#0ea5e9',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#001018',
    fontSize: 14,
    fontWeight: '900',
  },
  successBtn: {
    marginTop: 10,
    width: '100%',
    borderRadius: 10,
    paddingVertical: 12,
    backgroundColor: '#22c55e',
    alignItems: 'center',
  },
  successBtnText: {
    color: '#02140a',
    fontSize: 14,
    fontWeight: '900',
  },
});
