import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { ID, Permission, Role } from 'react-native-appwrite';
import { account, databases, DATABASE_ID, USERS_COLLECTION_ID } from '../appwrite';
import { useAuth } from './contexts/AuthContext';
import { TextInput, Button, Text, useTheme } from 'react-native-paper';

export default function LoginScreen() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, isEmailVerified, login: authLogin, sendVerificationCode, isLoading: isCheckingSession } = useAuth();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<any>({});
  const [authError, setAuthError] = useState<string | null>(null);  // Inline error state
  const router = useRouter();
  const { colors } = useTheme();

  // Redirect based on verification status
  useEffect(() => {
    if (user) {
      if (isEmailVerified) {
        router.replace('/(tabs)');
      } else {
        router.replace('/verify-email');
      }
    }
  }, [user, isEmailVerified]);

  const isValidUtaEmail = (email: string) => {
    const lowerEmail = email.toLowerCase().trim();
    return lowerEmail.endsWith('@uta.edu') || lowerEmail.endsWith('@mavs.uta.edu');
  };

  const validateForm = () => {
    let errors: any = {};
    if (!email.trim()) {
      errors.email = "Email is required.";
    } else if (mode === 'register' && !isValidUtaEmail(email)) {
      errors.email = "Please use your UTA email (@uta.edu or @mavs.uta.edu)";
    }
    if (!password.trim()) errors.password = "Password is required.";
    if (mode === 'register' && !name.trim()) errors.name = "Name is required.";
    setFieldErrors(errors);
    setAuthError(null);  // Clear auth error when form changes
    return Object.keys(errors).length === 0;
  };

  // Convert API errors to user-friendly messages
  const getFriendlyErrorMessage = (error: string) => {
    if (error.includes('same id, email, or phone already exists')) {
      return 'An account with this email already exists. Try logging in instead.';
    }
    if (error.includes('Invalid credentials') || error.includes('Invalid password')) {
      return 'Incorrect email or password. Please try again.';
    }
    if (error.includes('user not found')) {
      return 'No account found with this email. Please sign up first.';
    }
    if (error.includes('password must be')) {
      return 'Password must be at least 8 characters long.';
    }
    if (error.includes('network') || error.includes('fetch')) {
      return 'Network error. Please check your connection and try again.';
    }
    return error;  // Return original if no match
  };

  const handleAuth = async () => {
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      if (mode === 'login') {
        console.log('LOGIN: Attempting login for', email);
        await authLogin(email, password);
        console.log('LOGIN: Success');
      } else {
        // Registration flow with Email OTP
        console.log('REGISTER: Creating account for', email);
        const newUser = await account.create(ID.unique(), email, password, name);
        console.log('REGISTER: Account created, ID:', newUser.$id);

        // Create user profile document (we can do this without being logged in using server-side API)
        // For now, we'll create it after verification succeeds
        // Store profile data for later
        try {
          console.log('REGISTER: Storing profile data for post-verification...');
          await AsyncStorage.setItem('pendingProfile', JSON.stringify({
            userId: newUser.$id,
            displayName: name.trim(),
            email: email,
          }));
        } catch (e: any) {
          console.error('REGISTER: Error storing profile data:', e.message || e);
        }

        // Send verification code via Email OTP
        // This will send the 6-digit code to the user's email
        try {
          console.log('REGISTER: Sending Email OTP...');
          await sendVerificationCode(newUser.$id, email);
          console.log('REGISTER: Email OTP sent!');
          // Navigate to verify-email screen
          router.replace('/verify-email');
        } catch (e: any) {
          console.error('REGISTER: Failed to send Email OTP:', e.message || e);
          setAuthError('Failed to send verification email. Please try again.');
        }
      }
      // Navigation handled by useEffect based on verification status
    } catch (e: any) {
      console.error('AUTH ERROR:', e.message || e);
      const friendlyMessage = getFriendlyErrorMessage(e.message || 'Authentication failed.');
      setAuthError(friendlyMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingSession) return <View style={[styles.centered, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.primary} /></View>;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text variant="displaySmall" style={{ color: colors.primary, fontWeight: '900', letterSpacing: -1 }}>MaverickMarket</Text>
          <Text variant="bodyLarge" style={{ color: colors.secondary, marginTop: 8 }}>The marketplace for everything.</Text>
        </View>

        <View style={styles.form}>
          {/* Inline Error Banner */}
          {authError && (
            <View style={[styles.errorBanner, { backgroundColor: '#FEE2E2', borderColor: '#FECACA' }]}>
              <Text style={{ color: '#DC2626', fontSize: 14, textAlign: 'center' }}>{authError}</Text>
            </View>
          )}

          {mode === 'register' && (
            <View style={styles.inputContainer}>
              <TextInput label="Full Name" value={name} onChangeText={(t) => { setName(t); setAuthError(null); }} mode="flat" style={styles.input} underlineColor="transparent" activeUnderlineColor="transparent" error={!!fieldErrors.name} theme={{ roundness: 3 }} />
              {fieldErrors.name && <Text style={styles.errorText}>{fieldErrors.name}</Text>}
            </View>
          )}

          <View style={styles.inputContainer}>
            <TextInput label="Email" value={email} onChangeText={(t) => { setEmail(t); setAuthError(null); }} mode="flat" style={styles.input} keyboardType="email-address" autoCapitalize="none" underlineColor="transparent" activeUnderlineColor="transparent" error={!!fieldErrors.email} theme={{ roundness: 3 }} />
            {fieldErrors.email && <Text style={styles.errorText}>{fieldErrors.email}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <TextInput label="Password" value={password} onChangeText={(t) => { setPassword(t); setAuthError(null); }} mode="flat" style={styles.input} secureTextEntry={!passwordVisible} underlineColor="transparent" activeUnderlineColor="transparent" error={!!fieldErrors.password} right={<TextInput.Icon icon={passwordVisible ? "eye" : "eye-off"} onPress={() => setPasswordVisible(!passwordVisible)} />} theme={{ roundness: 3 }} />
            {fieldErrors.password && <Text style={styles.errorText}>{fieldErrors.password}</Text>}
          </View>

          <View style={styles.buttonContainer}>
            <Button mode="contained" onPress={handleAuth} loading={isLoading} disabled={isLoading} style={styles.button} contentStyle={{ height: 56 }} labelStyle={{ fontWeight: 'bold', fontSize: 16 }}>
              {mode === 'login' ? 'Log In' : 'Sign Up'}
            </Button>
            <Button mode="text" onPress={() => setMode(mode === 'login' ? 'register' : 'login')} contentStyle={{ height: 48 }} textColor={colors.secondary}>
              {mode === 'login' ? "New here? Create Account" : "Already have an account? Log In"}
            </Button>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { flexGrow: 1, padding: 30, justifyContent: 'center' },
  header: { marginBottom: 40, alignItems: 'center' },
  form: { width: '100%' },
  inputContainer: { marginBottom: 16 },
  input: { backgroundColor: '#F9FAFB', borderRadius: 12, borderTopLeftRadius: 12, borderTopRightRadius: 12, height: 56 },
  buttonContainer: { marginTop: 24, gap: 12 },
  button: { borderRadius: 16 },
  errorText: { color: '#EF4444', marginTop: 4, fontSize: 12 },
  errorBanner: { padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 16 }
});