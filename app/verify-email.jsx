import React, { useState, useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, Button, TextInput, useTheme, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Permission, Role } from 'react-native-appwrite';
import { useAuth } from './contexts/AuthContext';
import { databases, DATABASE_ID, USERS_COLLECTION_ID } from '../appwrite';

export default function VerifyEmailScreen() {
    const { user, isEmailVerified, sendVerificationCode, verifyCode } = useAuth();
    const router = useRouter();
    const { colors } = useTheme();
    const [code, setCode] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [pendingEmail, setPendingEmail] = useState('');

    // Load pending profile email on mount
    useEffect(() => {
        const loadPendingProfile = async () => {
            try {
                const profileData = await AsyncStorage.getItem('pendingProfile');
                if (profileData) {
                    const profile = JSON.parse(profileData);
                    setPendingEmail(profile.email);
                }
            } catch (e) {
                console.log('No pending profile found');
            }
        };
        loadPendingProfile();
    }, []);

    // Auto-redirect if already verified
    useEffect(() => {
        if (isEmailVerified) {
            router.replace('/(tabs)');
        }
    }, [isEmailVerified]);

    const handleVerifyCode = async () => {
        if (!code || code.length !== 6) {
            setError('Please enter a 6-digit code');
            return;
        }

        setError('');
        setIsVerifying(true);

        try {
            await verifyCode(code);

            // After successful verification, create user profile if pending
            try {
                const profileData = await AsyncStorage.getItem('pendingProfile');
                if (profileData) {
                    const profile = JSON.parse(profileData);
                    console.log('Creating user profile for:', profile.userId);

                    await databases.createDocument(
                        DATABASE_ID || '',
                        USERS_COLLECTION_ID || '',
                        profile.userId,
                        {
                            displayName: profile.displayName,
                            bio: '',
                            contactEmail: profile.email,
                            createdAt: new Date().toISOString(),
                        },
                        [
                            Permission.read(Role.users()),
                            Permission.update(Role.user(profile.userId)),
                            Permission.delete(Role.user(profile.userId))
                        ]
                    );
                    console.log('User profile created!');

                    // Clear pending profile
                    await AsyncStorage.removeItem('pendingProfile');
                }
            } catch (profileError) {
                console.error('Error creating profile:', profileError);
                // Don't fail verification if profile creation fails
            }

            setSuccess('Email verified successfully!');
            // Router will auto-redirect via useEffect
        } catch (e) {
            setError(e.message || 'Invalid or expired code');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleResendCode = async () => {
        setError('');
        setSuccess('');
        setIsResending(true);

        try {
            await sendVerificationCode();
            setSuccess('New code sent! Check your email.');
            setCode('');
        } catch (e) {
            setError(e.message || 'Failed to send code');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <StatusBar barStyle="dark-content" />

            <View style={styles.content}>
                <Ionicons name="mail-outline" size={80} color={colors.primary} />

                <Text variant="headlineSmall" style={[styles.title, { color: colors.onBackground }]}>
                    Verify Your Email
                </Text>

                <Text variant="bodyMedium" style={[styles.subtitle, { color: colors.secondary }]}>
                    We've sent a 6-digit code to
                </Text>

                <Text variant="bodyLarge" style={[styles.email, { color: colors.primary }]}>
                    {pendingEmail || user?.email || 'your email'}
                </Text>

                <View style={styles.codeInputContainer}>
                    <TextInput
                        label="Verification Code"
                        value={code}
                        onChangeText={(text) => {
                            setCode(text.replace(/[^0-9]/g, '').substring(0, 6));
                            setError('');
                        }}
                        mode="outlined"
                        keyboardType="number-pad"
                        maxLength={6}
                        style={styles.codeInput}
                        error={!!error}
                        disabled={isVerifying}
                        theme={{ roundness: 12 }}
                    />
                    {error ? (
                        <Text style={styles.errorText}>{error}</Text>
                    ) : null}
                    {success ? (
                        <Text style={styles.successText}>{success}</Text>
                    ) : null}
                </View>

                <Button
                    mode="contained"
                    onPress={handleVerifyCode}
                    loading={isVerifying}
                    disabled={isVerifying || code.length !== 6}
                    style={styles.button}
                    contentStyle={{ height: 52 }}
                >
                    Verify Email
                </Button>

                <Button
                    mode="text"
                    onPress={handleResendCode}
                    loading={isResending}
                    disabled={isResending || isVerifying}
                    style={styles.resendButton}
                >
                    Resend Code
                </Button>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    title: {
        marginTop: 24,
        fontWeight: '700',
        textAlign: 'center',
    },
    subtitle: {
        marginTop: 12,
        textAlign: 'center',
    },
    email: {
        marginTop: 4,
        fontWeight: '600',
        textAlign: 'center',
    },
    codeInputContainer: {
        width: '100%',
        marginTop: 32,
        marginBottom: 24,
    },
    codeInput: {
        fontSize: 24,
        textAlign: 'center',
        letterSpacing: 8,
        fontWeight: 'bold',
    },
    button: {
        width: '100%',
        borderRadius: 12,
    },
    resendButton: {
        marginTop: 16,
    },
    errorText: {
        color: '#DC2626',
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
    },
    successText: {
        color: '#16a34a',
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
    },
});
