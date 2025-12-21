import { MD3LightTheme, configureFonts } from 'react-native-paper';

const fontConfig = {
  fontFamily: 'System',
};

// Invisible UI Theme - Monochrome & Stark
export const theme = {
  ...MD3LightTheme,
  fonts: configureFonts({ config: fontConfig }),
  colors: {
    ...MD3LightTheme.colors,
    // Primary is Pitch Black
    primary: '#000000',
    onPrimary: '#FFFFFF',
    primaryContainer: '#FFFFFF',
    onPrimaryContainer: '#000000',

    // Secondary is Zinc-500 for subtle text
    secondary: '#71717A',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#F4F4F5', // Zinc-100
    onSecondaryContainer: '#18181B', // Zinc-900

    // Backgrounds - Pure White
    background: '#FFFFFF',
    onBackground: '#000000',
    surface: '#FFFFFF',
    onSurface: '#000000',
    surfaceVariant: '#FFFFFF', // No grey backgrounds for cards by default
    onSurfaceVariant: '#000000',

    // Borders / Dividers (Zinc-200)
    outline: '#E4E4E7',
    outlineVariant: '#E4E4E7',

    // Error
    error: '#DC2626', // Red-600
    onError: '#FFFFFF',

    elevation: {
      level0: 'transparent',
      level1: '#FFFFFF',
      level2: '#FFFFFF', // Flatten elevation
      level3: '#FFFFFF',
      level4: '#FFFFFF',
      level5: '#FFFFFF',
    },
  },
  // Sharp or Micro-rounding
  roundness: 4,
};
