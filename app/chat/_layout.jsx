import React from 'react';
import { Stack } from 'expo-router';

// Define consistent theme colors - matching the Messages screen
const COLORS = {
  darkBlue: '#0A1929',
  mediumBlue: '#0F2942',
  brightOrange: '#FF9800',
  white: '#FFFFFF',
};

export default function ChatLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.mediumBlue,
        },
        headerTintColor: COLORS.white,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        contentStyle: {
          backgroundColor: COLORS.darkBlue,
        },
        headerShadowVisible: false,
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'My Messages',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}