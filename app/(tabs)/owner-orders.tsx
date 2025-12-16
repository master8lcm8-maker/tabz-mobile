// app/(tabs)/owner-orders.tsx
// ===============================================
// Option A (Phase Stabilization)
// Orders screen intentionally disabled until backend routes exist.
// ===============================================

import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';

export default function OwnerOrdersScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Owner Orders
      </ThemedText>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
            Orders backend is not live yet
          </ThemedText>

          <ThemedText style={styles.body}>
            This screen is intentionally disabled under Option A (Phase Stabilization).
          </ThemedText>

          <ThemedText style={styles.body}>
            Missing backend routes:
          </ThemedText>

          <View style={styles.list}>
            <ThemedText style={styles.mono}>GET  /owner/orders</ThemedText>
            <ThemedText style={styles.mono}>POST /owner/orders/:id/cancel</ThemedText>
          </View>

          <ThemedText style={styles.body}>
            Wallet + Bank Info + Cashouts remain fully active.
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05060A',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  title: {
    color: '#F7F7FF',
    fontSize: 20,
    marginBottom: 12,
  },
  content: {
    paddingBottom: 24,
  },
  card: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#0b0f20',
    borderWidth: 1,
    borderColor: '#222b55',
  },
  cardTitle: {
    color: '#f6f6ff',
    fontSize: 14,
    marginBottom: 8,
  },
  body: {
    color: '#c0c3ff',
    fontSize: 13,
    marginBottom: 8,
    lineHeight: 18,
  },
  list: {
    marginTop: 6,
    marginBottom: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#070a16',
    borderWidth: 1,
    borderColor: '#1b2242',
  },
  mono: {
    color: '#b0b4ff',
    fontSize: 12,
    marginBottom: 6,
  },
});
