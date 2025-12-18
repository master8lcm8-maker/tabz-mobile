// D:\TABZ\tabz-mobile\app\_layout.tsx
import React, { useEffect } from "react";
import { Stack, Redirect, useSegments } from "expo-router";
import { getAuthToken, setBaseUrl } from "../components/lib/api";

const DEFAULT_BASE_URL = "http://10.0.0.239:3000";

export default function RootLayout() {
  // Always lock the base URL once at the root
  useEffect(() => {
    setBaseUrl(DEFAULT_BASE_URL);
  }, []);

  const segments = useSegments();
  const tok = getAuthToken();

  // Determine if we are currently in the /login route
  const inLogin = segments.length > 0 && segments[0] === "login";

  // If not authenticated, force /login (but don't loop if we're already there)
  if (!tok && !inLogin) {
    return <Redirect href="/login" />;
  }

  // If authenticated and user is on /login, send them to the main app
  if (tok && inLogin) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="modal" />
    </Stack>
  );
}
