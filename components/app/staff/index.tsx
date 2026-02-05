import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function StaffScreen() {
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
          <ThemedText type="title">Staff Mode</ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            Scan, redeem & manage tabs.
          </ThemedText>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Actions */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Actions
          </ThemedText>

          <View style={styles.actionsRow}>
            <ActionCard
              icon="qr-code"
              label="Scan QR"
              description="Scan to redeem drinks & items."
            />
            <ActionCard
              icon="people"
              label="Manage"
              description="Check active tabs & redemptions."
            />
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Recent Scans
          </ThemedText>

          <EmptyMessage />
        </View>

      </ScrollView>
    </ThemedView>
  );
}

type ActionCardProps = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  description?: string;
};

function ActionCard({ icon, label, description }: ActionCardProps) {
  return (
    <TouchableOpacity style={styles.actionCard} activeOpacity={0.8}>
      <Ionicons name={icon} size={26} style={styles.actionIcon} />
      <ThemedText type="subtitle">{label}</ThemedText>
      <ThemedText style={styles.actionDescription}>{description}</ThemedText>
    </TouchableOpacity>
  );
}

function EmptyMessage() {
  return (
    <View style={{ paddingVertical: 20 }}>
      <ThemedText style={{ opacity: 0.7 }}>No staff activity yet.</ThemedText>
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
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    minHeight: 120,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  actionIcon: {
    marginBottom: 6,
  },
  actionDescription: {
    fontSize: 12,
    opacity: 0.8,
  },
});


