import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, Button, useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

/**
 * Reusable login prompt component for consistent UX across all screens
 */
export default function LoginPrompt({
    message = "Please log in to continue",
    icon = "person-circle-outline",
    buttonText = "Log In"
}) {
    const router = useRouter();
    const { colors } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Ionicons name={icon} size={64} color={colors.outline} />
            <Text variant="titleMedium" style={[styles.message, { color: colors.onBackground }]}>
                {message}
            </Text>
            <Button
                mode="contained"
                onPress={() => router.push('/login')}
                style={styles.button}
                contentStyle={{ height: 48 }}
            >
                {buttonText}
            </Button>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    message: {
        marginTop: 16,
        marginBottom: 24,
        textAlign: 'center',
    },
    button: {
        borderRadius: 12,
        minWidth: 160,
    },
});
