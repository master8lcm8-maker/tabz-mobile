// ===============================================
//  app/wallet/index.tsx
//  Expo Router route for Owner Wallet Home
//  URL: /wallet  (optional ?token=JWT for debugging)
// ===============================================

import React, { useEffect, useMemo, useState } from "react";
import { View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import OwnerWalletScreen from "../../components/OwnerWalletScreen";

const AUTH_TOKEN_KEY = "TABZ_AUTH_TOKEN";

function tokenFromParams(params: any): string {
  const t = params?.token;
  if (typeof t === "string") return t.trim();
  if (Array.isArray(t) && typeof t[0] === "string") return String(t[0]).trim();
  return "";
}

export default function WalletHomeRoute() {
  const params = useLocalSearchParams<{ token?: string | string[] }>();

  const urlToken = useMemo(() => tokenFromParams(params), [params]);

  const [storedToken, setStoredToken] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const t = ((await AsyncStorage.getItem(AUTH_TOKEN_KEY)) || "").trim();
        if (!cancelled) setStoredToken(t);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Priority: URL token (explicit override for debugging) -> stored auth token
  const token = urlToken || storedToken;

  if (loading) {
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
          Loading…
        </Text>
      </View>
    );
  }

  if (!token) {
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
          Missing auth token.{"\n"}
          Please log in, then return to Wallet.
        </Text>
      </View>
    );
  }

  // ✅ Pass the token down to the OwnerWalletScreen
  return <OwnerWalletScreen token={token} />;
}
