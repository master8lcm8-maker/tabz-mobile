// D:\TABZ\tabz-mobile\app\_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Public */}
      <Stack.Screen name="login" />

      {/* Main app */}
      <Stack.Screen name="(tabs)" />

      {/* Keep if you use it */}
      <Stack.Screen name="modal" />
    </Stack>
  );
}
