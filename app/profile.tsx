// ===============================================
//  FILE: app/profile.tsx
//  Phase 2.1 — Profile v1 (UI-only)
// ===============================================

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const router = useRouter();

  const profile = {
    displayName: 'TBD Username',
    username: '@tbd',
    bio: 'Bio will appear here.',
    links: ['https://example.com'],
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Profile</Text>

      <View style={styles.card}>
        <View style={styles.avatar} />

        <Text style={styles.displayName}>{profile.displayName}</Text>
        <Text style={styles.username}>{profile.username}</Text>

        <Text style={styles.sectionLabel}>Bio</Text>
        <Text style={styles.bodyText}>{profile.bio}</Text>

        <Text style={[styles.sectionLabel, { marginTop: 14 }]}>Links</Text>
        {profile.links.map((url, idx) => (
          <Text key={idx} style={styles.linkText}>{url}</Text>
        ))}
      </View>

      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.canGoBack() ? router.back() : router.replace('/')}
      >
        <Text style={styles.backBtnText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0F',
    padding: 16,
    paddingTop: 18,
  },
  header: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 12,
  },
  card: {
    borderRadius: 14,
    padding: 16,
    backgroundColor: '#0f1628',
    borderWidth: 1,
    borderColor: '#1f2a44',
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#111827',
    borderColor: '#00FFD1',
    borderWidth: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  displayName: {
    color: '#EAF2FF',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  username: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  sectionLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 6,
  },
  bodyText: {
    color: '#C7D2FE',
    fontSize: 14,
    fontWeight: '700',
  },
  linkText: {
    color: '#1E90FF',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 6,
  },
  backBtn: {
    marginTop: 14,
    borderRadius: 10,
    paddingVertical: 12,
    backgroundColor: '#00FFD1',
    alignItems: 'center',
  },
  backBtnText: {
    color: '#0A0E15',
    fontSize: 15,
    fontWeight: '900',
  },
});
