// D:\TABZ\tabz-mobile\app\_layout.tsx
import React, { useEffect } from "react";
import { Stack, Redirect, useSegments } from "expo-router";
import { getAuthToken, setBaseUrl } from "../components/lib/api";

const DEFAULT_BASE_URL = "http://10.0.0.239:3000";

export default function RootLayout() {
  useEffect(() => {
    setBaseUrl(DEFAULT_BASE_URL);
  }, []);

  const segments = useSegments();
  const tok = getAuthToken();

  const inLogin = segments.length > 0 && segments[0] === "login";

  if (!tok && !inLogin) return <Redirect href="/login" />;
  if (tok && inLogin) return <Redirect href="/(tabs)" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login/index" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="modal" />
    </Stack>
  );
}

