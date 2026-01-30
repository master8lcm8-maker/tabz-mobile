// D:\TABZ\tabz-mobile\app\_layout.tsx
import React, { useEffect, useState } from "react";
import { Stack, Redirect, useSegments } from "expo-router";
import { Platform } from "react-native";
import {
  getAuthToken,
  setBaseUrl,
  decodeJwtClaims,
  hydrateSession,
  getEnvBaseUrl,
} from "../components/lib/api";

const DEFAULT_BASE_URL =
  Platform.OS === "web"
    ? "https://tabz-backend-bxxbf.ondigitalocean.app"
    : "http://10.0.0.239:3000";


export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // 1) Base URL: env wins (web), otherwise default, then persisted override stays available
    const envUrl = getEnvBaseUrl();
    setBaseUrl(envUrl || DEFAULT_BASE_URL);

    // 2) Hydrate baseUrl + token BEFORE routing decisions
    hydrateSession()
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const segments = useSegments();
  const tok = getAuthToken();

  const inLogin = segments.length > 0 && segments[0] === "login";
  const inStaff = segments.length > 0 && segments[0] === "staff";

  // Don’t redirect until storage hydration is done (prevents web refresh redirect-loop)
  if (!ready) return null;

  // If not authed -> force login
  if (!tok && !inLogin) return <Redirect href="/login" />;

  // If authed -> route by role
  if (tok) {
    const role = String(decodeJwtClaims(tok)?.role || "").toLowerCase();

    if (role === "staff") {
      if (inLogin) return <Redirect href="/staff" />;
      if (!inStaff) return <Redirect href="/staff" />;
    } else {
      if (inLogin) return <Redirect href="/(tabs)" />;
    }
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login/index" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="staff/index" />
      <Stack.Screen name="modal" />
    </Stack>
  );
}
