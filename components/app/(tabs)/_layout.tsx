// app/(tabs)/_layout.tsx
import React, { useEffect } from "react";
import { Tabs, Redirect } from "expo-router";
import { getAuthToken, setBaseUrl } from "../../components/lib/api";

const DEFAULT_BASE_URL = "http://10.0.0.239:3000";

export default function TabsLayout() {
  // Always lock the base URL once
  useEffect(() => {
    setBaseUrl(DEFAULT_BASE_URL);
  }, []);

  // ✅ IMPORTANT:
  // Never do router.replace() here (it can fire before RootLayout mounts).
  // Use Redirect instead.
  const tok = getAuthToken();
  if (!tok) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: "TABZ" }} />
      <Tabs.Screen name="buyer-orders" options={{ title: "Buyer Orders" }} />
      <Tabs.Screen name="owner-dashboard" options={{ title: "Owner Dashboard" }} />
      <Tabs.Screen name="owner-cashouts" options={{ title: "Owner Cashouts" }} />
      <Tabs.Screen name="owner-orders" options={{ title: "Owner Orders" }} />
      <Tabs.Screen name="owner-wallet" options={{ title: "Owner Wallet" }} />
      <Tabs.Screen name="owner-bank-info" options={{ title: "Bank Info" }} />
      <Tabs.Screen name="owner-basic-info" options={{ title: "Basic Info" }} />
      <Tabs.Screen name="owner-payout-math" options={{ title: "Payout Math" }} />
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}
