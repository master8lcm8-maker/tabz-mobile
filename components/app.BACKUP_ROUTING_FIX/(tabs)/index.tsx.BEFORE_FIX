// app/(tabs)/index.tsx
// TABZ bottom tab layout

import React from 'react';
import { Tabs } from 'expo-router';

// 🔐 SAME TOKEN THAT WORKS IN POWERSHELL
const BASE_URL = 'http://localhost:3000';

const OWNER_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjMsImVtYWlsIjoib3duZXIzQHRhYnouYXBwIiwicm9sZSI6ImJ1eWVyIiwiaWF0IjoxNzY1NTA0MTQ4LCJleHAiOjE3NjYxMDg5NDh9.DXHTW-nSHY55qXE9VY5lujcYikZd0LrYOWP5kg4mstM';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#16f597',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#05060A',
          borderTopColor: '#111827',
        },
        tabBarLabelStyle: {
          fontSize: 11,
        },
      }}
    >
      {/* Main buyer tab */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'TABZ',
        }}
      />

      {/* Buyer orders tab */}
      <Tabs.Screen
        name="my-orders"
        options={{ title: 'My Orders' }}
        initialParams={{ token: OWNER_TOKEN, baseUrl: BASE_URL }}
      />

      {/* Owner dashboard */}
      <Tabs.Screen
        name="owner-dashboard"
        options={{ title: 'Owner Dashboard' }}
        initialParams={{ token: OWNER_TOKEN, baseUrl: BASE_URL }}
      />

      {/* Owner cashouts */}
      <Tabs.Screen
        name="owner-cashouts"
        options={{ title: 'Owner Cashouts' }}
        initialParams={{ token: OWNER_TOKEN, baseUrl: BASE_URL }}
      />

      {/* Owner orders (the one we just fixed) */}
      <Tabs.Screen
        name="owner-orders"
        options={{ title: 'Owner Orders' }}
        initialParams={{ token: OWNER_TOKEN, baseUrl: BASE_URL }}
      />

      {/* Owner wallet */}
      <Tabs.Screen
        name="owner-wallet"
        options={{ title: 'Owner Wallet' }}
        initialParams={{ token: OWNER_TOKEN, baseUrl: BASE_URL }}
      />

      {/* Bank info */}
      <Tabs.Screen
        name="owner-bank-info"
        options={{ title: 'Bank Info' }}
        initialParams={{ token: OWNER_TOKEN, baseUrl: BASE_URL }}
      />

      {/* Basic info */}
      <Tabs.Screen
        name="owner-basic-info"
        options={{ title: 'Basic Info' }}
        initialParams={{ token: OWNER_TOKEN, baseUrl: BASE_URL }}
      />

      {/* Payout math */}
      <Tabs.Screen
        name="owner-payout-math"
        options={{ title: 'Payout Math' }}
        initialParams={{ token: OWNER_TOKEN, baseUrl: BASE_URL }}
      />
    </Tabs>
  );
}
