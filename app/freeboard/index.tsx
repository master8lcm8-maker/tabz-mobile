import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

// FIX: remove "@/..." alias (not configured) -> use relative path from app/freeboard/index.tsx
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';

export default function FreeBoardScreen() {
  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={22} />
        </TouchableOpacity>

        <View style={styles.headerTextBlock}>
          <ThemedText type="title">FreeBoard</ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            Drop, claim, and manage floating items.
          </ThemedText>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Quick actions */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Quick actions
          </ThemedText>

          <View style={styles.quickRow}>
            <QuickActionCard
              icon="gift"
              label="Drop Item"
              description="Create a FreeBoard drop."
              onPress={() => console.log('Drop Item')}
            />
            <QuickActionCard
              icon="qr-code-outline"
              label="Scan Claim"
              description="Scan a QR to claim items."
              onPress={() => console.log('Scan Claim')}
            />
          </View>
        </View>

        {/* Current floating items */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Floating Items
          </ThemedText>

          <EmptyMessage />
        </View>
      </ScrollView>
    </ThemedView>
  );
}

type QuickActionCardProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  description: string;
  onPress: () => void;
};

function QuickActionCard({ icon, label, description, onPress }: QuickActionCardProps) {
  return (
    <TouchableOpacity style={styles.quickCard} activeOpacity={0.8} onPress={onPress}>
      <Ionicons name={icon} size={22} style={{ marginBottom: 6 }} />
      <ThemedText type="subtitle">{label}</ThemedText>
      <ThemedText style={styles.quickDescription}>{description}</ThemedText>
    </TouchableOpacity>
  );
}

function EmptyMessage() {
  return (
    <View style={{ paddingVertical: 20 }}>
      <ThemedText style={{ opacity: 0.7 }}>No FreeBoard items right now.</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTextBlock: {
    flex: 1,
  },
  headerSubtitle: {
    marginTop: 4,
    opacity: 0.8,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    minHeight: 110,
    justifyContent: 'space-between',
  },
  quickDescription: {
    fontSize: 12,
    opacity: 0.8,
  },
});
