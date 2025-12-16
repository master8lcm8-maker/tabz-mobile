// app/(tabs)/_layout.tsx
import React from 'react';
import { Tabs } from 'expo-router';

// ✅ PICK ONE and STICK TO IT (matches your DevTools requests)
const BASE_URL = 'http://10.0.0.239:3000';

// ✅ EXACT token you generated in PowerShell ($tok)
const OWNER_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjMsImVtYWlsIjoib3duZXIzQHRhYnouYXBwIiwicm9sZSI6ImJ1eWVyIiwiaWF0IjoxNzY1NTkzNDg4LCJleHAiOjE3NjYxOTgyODh9.5dP5v6k_mmyCVRzIhLyFE00lV6kaV8SWFpLhtGMJJs4';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* TABZ Home */}
      <Tabs.Screen
        name="index"
        options={{ title: 'TABZ' }}
        initialParams={{ token: OWNER_TOKEN, baseUrl: BASE_URL }}
      />

      {/* Buyer Orders */}
      <Tabs.Screen
        name="buyer-orders"
        options={{ title: 'Buyer Orders' }}
        initialParams={{ token: OWNER_TOKEN, baseUrl: BASE_URL }}
      />

      {/* Owner Dashboard */}
      <Tabs.Screen
        name="owner-dashboard"
        options={{ title: 'Owner Dashboard' }}
        initialParams={{ token: OWNER_TOKEN, baseUrl: BASE_URL }}
      />

      {/* Cashouts (Owner Cashouts screen/tab) */}
      <Tabs.Screen
        name="cashouts"
        options={{ title: 'Cashouts' }}
        initialParams={{ token: OWNER_TOKEN, baseUrl: BASE_URL }}
      />

      {/* Owner Orders */}
      <Tabs.Screen
        name="owner-orders"
        options={{ title: 'Owner Orders' }}
        initialParams={{ token: OWNER_TOKEN, baseUrl: BASE_URL }}
      />

      {/* Owner Wallet */}
      <Tabs.Screen
        name="owner-wallet"
        options={{ title: 'Owner Wallet' }}
        initialParams={{ token: OWNER_TOKEN, baseUrl: BASE_URL }}
      />

      {/* Bank Info */}
      <Tabs.Screen
        name="owner-bank-info"
        options={{ title: 'Bank Info' }}
        initialParams={{ token: OWNER_TOKEN, baseUrl: BASE_URL }}
      />

      {/* Basic Info */}
      <Tabs.Screen
        name="owner-basic-info"
        options={{ title: 'Basic Info' }}
        initialParams={{ token: OWNER_TOKEN, baseUrl: BASE_URL }}
      />

      {/* Payout Math */}
      <Tabs.Screen
        name="owner-payout-math"
        options={{ title: 'Payout Math' }}
        initialParams={{ token: OWNER_TOKEN, baseUrl: BASE_URL }}
      />
    </Tabs>
  );
}
