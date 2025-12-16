// ======================================================
// components/OwnerBankInfoScreen.tsx
// TABZ Owner – Bank Information (dark + neon theme)
// ======================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

export default function OwnerBankInfoScreen() {
  const [routingNumber, setRoutingNumber] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSave() {
    if (!routingNumber || !accountNumber) {
      setMessage('Please fill out both routing number and account number.');
      return;
    }

    try {
      setSaving(true);
      setMessage(null);

      // ⚠️ TODO: later we wire this to a real backend endpoint.
      // For now it's just a fake delay so the UI feels real.
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setMessage('Bank information saved (stub only – connect API later).');
    } catch (err) {
      console.log('BANK INFO SAVE ERROR:', err);
      setMessage('Something went wrong saving bank info.');
    } finally {
      setSaving(false);
    }
  }

  if (saving) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#000',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color="#0f0" />
        <Text style={{ color: '#fff', marginTop: 12 }}>Saving…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: '#000',
        paddingHorizontal: 16,
        paddingTop: 18,
        paddingBottom: 60, // space for bottom nav if you show it on web
      }}
    >
      {/* HEADER CARD */}
      <View
        style={{
          borderColor: '#12ff00',
          borderWidth: 1,
          borderRadius: 10,
          padding: 16,
          marginBottom: 18,
          backgroundColor: '#050505',
        }}
      >
        <Text
          style={{
            color: '#7cfc00',
            fontSize: 20,
            fontWeight: 'bold',
            marginBottom: 4,
          }}
        >
          Bank Information
        </Text>
        <Text
          style={{
            color: '#aaa',
            fontSize: 13,
            lineHeight: 18,
          }}
        >
          Add the bank account where TABZ will send your payouts. You can
          update this before funds are sent.
        </Text>
      </View>

      {/* FORM CARD */}
      <View
        style={{
          borderColor: '#12ff00',
          borderWidth: 1,
          borderRadius: 10,
          padding: 16,
          marginBottom: 18,
          backgroundColor: '#050505',
        }}
      >
        {/* Routing Number */}
        <Text style={{ color: '#aaa', fontSize: 13, marginBottom: 6 }}>
          Routing Number
        </Text>
        <TextInput
          value={routingNumber}
          onChangeText={setRoutingNumber}
          placeholder="123456789"
          placeholderTextColor="#555"
          keyboardType="number-pad"
          style={{
            backgroundColor: '#0b0b0b',
            borderColor: '#12ff00',
            borderWidth: 1,
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 10,
            color: '#fff',
            marginBottom: 18,
          }}
        />

        {/* Account Number */}
        <Text style={{ color: '#aaa', fontSize: 13, marginBottom: 6 }}>
          Account Number
        </Text>
        <TextInput
          value={accountNumber}
          onChangeText={setAccountNumber}
          placeholder="000123456789"
          placeholderTextColor="#555"
          secureTextEntry={false}
          keyboardType="number-pad"
          style={{
            backgroundColor: '#0b0b0b',
            borderColor: '#12ff00',
            borderWidth: 1,
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 10,
            color: '#fff',
            marginBottom: 18,
          }}
        />

        {message && (
          <Text
            style={{
              color: message.includes('saved') ? '#7cfc00' : '#ff8080',
              fontSize: 13,
              marginBottom: 12,
            }}
          >
            {message}
          </Text>
        )}

        <TouchableOpacity
          onPress={handleSave}
          style={{
            backgroundColor: '#7cfc00',
            paddingVertical: 12,
            borderRadius: 999,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 15 }}>
            Save
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
