// app/(tabs)/explore.tsx
// Simple placeholder screen so this route is valid and doesn’t crash the app.

import React from 'react';
import { StyleSheet } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';

export default function ExploreScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Explore
      </ThemedText>
      <ThemedText style={styles.subtitle}>
        Placeholder screen. We will wire real Explore content later.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05060A',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  title: {
    color: '#f6f6ff',
    marginBottom: 8,
  },
  subtitle: {
    color: '#a0a3d0',
    textAlign: 'center',
    fontSize: 13,
  },
});
