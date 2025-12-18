// app/index.tsx
// Always send "/" to the Tabs group.

import { Redirect } from 'expo-router';

export default function Index() {
  return <Redirect href="/(tabs)" />;
}
