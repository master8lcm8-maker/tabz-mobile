import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function SpotlightScreen() {
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
          <ThemedText type="title">Spotlight</ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            Trigger hype, effects, and spotlight moments.
          </ThemedText>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Quick actions */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Actions
          </ThemedText>

          <View style={styles.quickRow}>
            <QuickActionCard
              icon="flash"
              label="Trigger Flash"
              description="Burst of hype on the dance floor."
              onPress={() => console.log('Trigger Flash')}
            />
            <QuickActionCard
              icon="megaphone"
              label="Announce"
              description="Send a loud venue-wide announcement."
              onPress={() => console.log('Announcement')}
            />
          </View>
        </View>

        {/* Recent triggers */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Recent Events
          </ThemedText>

          <EmptyMessage />
        </View>
      </ScrollView>
    </ThemedView>
  );
}

type QuickActionCardProps = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  description?: string;
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
      <ThemedText style={{ opacity: 0.7 }}>No spotlight events yet.</ThemedText>
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


