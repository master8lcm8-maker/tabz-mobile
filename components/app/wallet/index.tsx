// ===============================================
//  app/wallet/index.tsx
//  Expo Router route for Owner Wallet Home
//  URL: /wallet or /wallet?token=JWT
// ===============================================

import React from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import OwnerWalletScreen from '../../components/OwnerWalletScreen';

// 🔐 Fallback Owner3 token – SAME as in app/wallet/cashouts.tsx
const OWNER_FALLBACK_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjMsImVtYWlsIjoib3duZXIzQHRhYnouYXBwIiwiaWF0IjoxNzY1MjkwNjY5LCJleHAiOjE3NjU4OTU0Njl9.QcudaWVK6bnbT9vXUZVISVSaP5hCCt1l4tGiBncupWQ';

export default function WalletHomeRoute() {
  // Allow override via ?token= in URL, but default to OWNER_FALLBACK_TOKEN
  const params = useLocalSearchParams<{ token?: string | string[] }>();

  const tokenFromUrl =
    typeof params.token === 'string'
      ? params.token
      : Array.isArray(params.token)
      ? params.token[0]
      : undefined;

  const token = tokenFromUrl || OWNER_FALLBACK_TOKEN;

  if (!token) {
    // Simple fallback if somehow no token at all
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#000',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <Text style={{ color: '#fff', fontSize: 16, textAlign: 'center' }}>
          Missing owner token.{'\n'}
          Open this screen from the owner login/dashboard so we can include
          your JWT.
        </Text>
      </View>
    );
  }

  // ✅ Pass the token down to the OwnerWalletScreen
  return <OwnerWalletScreen token={String(token)} />;
}
