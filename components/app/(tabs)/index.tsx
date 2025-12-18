import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';

export default function TabzHomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>TABZ</Text>
      <Text style={styles.subtitle}>Home Dashboard</Text>

      <Text style={styles.note}>
        Backend connected. UI wiring comes AFTER backend is locked.
      </Text>

      {/* View Profile Button */}
      <Link href="/profile" asChild>
        <TouchableOpacity style={styles.profileBtn}>
          <Text style={styles.profileBtnText}>View Profile</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0F',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00FFD1',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  note: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },

  // New styles (added only)
  profileBtn: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    backgroundColor: '#1E90FF',
  },
  profileBtnText: {
    color: '#0A0E15',
    fontSize: 16,
    fontWeight: '900',
  },
});
