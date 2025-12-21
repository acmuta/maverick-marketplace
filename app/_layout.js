import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { AuthProvider } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import { theme } from './theme-config'; // Updated import

export default function RootLayout() {
  return (
    <PaperProvider theme={theme}>
      <AuthProvider>
        <ChatProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="login" />
            <Stack.Screen name="search" />
            <Stack.Screen name="listing/[id]" />
            <Stack.Screen name="listing/edit/[id]" />
          </Stack>
        </ChatProvider>
      </AuthProvider>
    </PaperProvider>
  );
}