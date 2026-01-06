import 'react-native-url-polyfill/auto';
import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { AuthProvider } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import { theme } from './_constants/theme';
import { SnackbarProvider } from './components/SnackbarManager';

export default function RootLayout() {
  return (
    <PaperProvider theme={theme}>
      <SnackbarProvider>
        <AuthProvider>
          <ChatProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="login" />
              <Stack.Screen name="verify-email" />
              <Stack.Screen name="listing/[id]" />
              <Stack.Screen name="listing/edit/[id]" />
            </Stack>
          </ChatProvider>
        </AuthProvider>
      </SnackbarProvider>
    </PaperProvider>
  );
}