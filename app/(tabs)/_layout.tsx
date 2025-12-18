// D:\TABZ\tabz-mobile\app\(tabs)\_layout.tsx
import React from 'react';
import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'TABZ' }} />
      <Tabs.Screen name="buyer-orders" options={{ title: 'Buyer Orders' }} />
      <Tabs.Screen name="owner-dashboard" options={{ title: 'Owner Dashboard' }} />
      <Tabs.Screen name="owner-cashouts" options={{ title: 'Owner Cashouts' }} />
      <Tabs.Screen name="owner-orders" options={{ title: 'Owner Orders' }} />
      <Tabs.Screen name="owner-wallet" options={{ title: 'Owner Wallet' }} />
      <Tabs.Screen name="owner-bank-info" options={{ title: 'Bank Info' }} />
      <Tabs.Screen name="owner-basic-info" options={{ title: 'Basic Info' }} />
      <Tabs.Screen name="owner-payout-math" options={{ title: 'Payout Math' }} />
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}
