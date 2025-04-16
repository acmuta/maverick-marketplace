import { Stack } from "expo-router";
import { View, Text } from 'react-native';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="chat" options={{ headerShown: false }} />
      <Stack.Screen name="listing/[id]" options={{ headerTitle: 'Listing Details' }} />
    </Stack>
  );
}