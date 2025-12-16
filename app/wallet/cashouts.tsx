// ===============================================
// app/wallet/cashouts.tsx
// Expo Router route for Owner Cashouts
// URL: /wallet/cashouts
// ===============================================

import React from "react";
import { View, Text } from "react-native";
import CashoutsScreen from "../../components/CashoutsScreen";

// 🔐 Single source of truth — use the same API helper as dashboard
// We import nothing here; token is passed through CashoutsScreen props.
import { OWNER_TOKEN } from "@/components/lib/api"; // <-- NEW unified token import

export default function WalletCashoutsRoute() {
  // If TOKEN is missing (should not happen once login flow works)
  if (!OWNER_TOKEN) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#000",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <Text style={{ color: "#fff", fontSize: 16, textAlign: "center" }}>
          Missing owner token.{"\n"}
          Please log in through the owner login screen.
        </Text>
      </View>
    );
  }

  // Pass down the GOOD token to CashoutsScreen
  return <CashoutsScreen token={OWNER_TOKEN} />;
}
