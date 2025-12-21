import { MD3LightTheme as DefaultTheme } from 'react-native-paper';

// "Anti-Sting" Theme Palette
// Primary: Indigo-600 (#4F46E5)
// Background: Slate-100 (#F2F4F7)
// Surface: White (#FFFFFF)
// Text: Gray-900 (#111827) & Gray-500 (#6B7280)
// Outline: Gray-200 (#E5E7EB)

export const theme = {
  ...DefaultTheme,
  roundness: 3, // Base unit 4 * 3 = 12px for buttons, can use 4 for 16px cards
  colors: {
    ...DefaultTheme.colors,
    primary: '#4F46E5', // Indigo-600
    onPrimary: '#FFFFFF',
    primaryContainer: '#E0E7FF', // Indigo-100
    onPrimaryContainer: '#3730A3', // Indigo-800

    secondary: '#6B7280', // Gray-500
    onSecondary: '#FFFFFF',
    secondaryContainer: '#F3F4F6', // Gray-100
    onSecondaryContainer: '#1F2937', // Gray-800

    background: '#F2F4F7', // Slate-100
    onBackground: '#111827', // Gray-900

    surface: '#FFFFFF',
    onSurface: '#111827',
    surfaceVariant: '#F9FAFB', // Gray-50 (for inputs)
    onSurfaceVariant: '#6B7280', // Gray-500

    outline: '#E5E7EB', // Gray-200
    outlineVariant: '#D1D5DB', // Gray-300

    error: '#EF4444', // Red-500

    elevation: {
      level0: 'transparent',
      level1: 'rgba(0,0,0,0.05)', // Very subtle shadow
      level2: 'rgba(0,0,0,0.08)',
      level3: 'rgba(0,0,0,0.11)',
      level4: 'rgba(0,0,0,0.12)',
      level5: 'rgba(0,0,0,0.14)',
    },
  },
  fonts: {
    ...DefaultTheme.fonts,
    // Using System fonts but defining weights as requested
    displaySmall: { fontFamily: 'System', fontSize: 36, fontWeight: '700', letterSpacing: -0.5, lineHeight: 44 },
    headlineMedium: { fontFamily: 'System', fontSize: 28, fontWeight: '700', letterSpacing: -0.5, lineHeight: 36 },
    headlineSmall: { fontFamily: 'System', fontSize: 24, fontWeight: '700', letterSpacing: -0.5, lineHeight: 32 },
    titleLarge: { fontFamily: 'System', fontSize: 22, fontWeight: '700', letterSpacing: 0, lineHeight: 28 },
    titleMedium: { fontFamily: 'System', fontSize: 16, fontWeight: '600', letterSpacing: 0.15, lineHeight: 24 },
    bodyLarge: { fontFamily: 'System', fontSize: 16, fontWeight: '500', letterSpacing: 0.15, lineHeight: 24 }, // Medium weight body
    bodyMedium: { fontFamily: 'System', fontSize: 14, fontWeight: '500', letterSpacing: 0.25, lineHeight: 20 },
    labelLarge: { fontFamily: 'System', fontSize: 14, fontWeight: '600', letterSpacing: 0.1, lineHeight: 20 },
  },
  animation: {
    scale: 1.0,
  },
};
