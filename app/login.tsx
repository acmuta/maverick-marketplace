import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { ID } from 'react-native-appwrite';
import { account, databases, DATABASE_ID, USERS_COLLECTION_ID } from '../appwrite';
import { useAuth } from './contexts/AuthContext';
import { TextInput, Button, Text, useTheme } from 'react-native-paper';

export default function LoginScreen() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, login: authLogin, isLoading: isCheckingSession } = useAuth();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
  }>({});
  const router = useRouter();
  const { colors } = useTheme();

  useEffect(() => {
    if (user) {
      router.replace('/(tabs)');
    }
  }, [user]);

  const validateForm = () => {
    let errors: { name?: string; email?: string; password?: string } = {};

    if (!email.trim()) errors.email = "Email is required.";
    if (!password.trim()) errors.password = "Password is required.";
    if (mode === 'register') {
      if (!name.trim()) {
        errors.name = "Name is required.";
      } else if (name.trim().length < 2) {
        errors.name = "Name must be at least 2 characters.";
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAuth = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      if (mode === 'login') {
        await authLogin(email, password);
      } else {
        const user = await account.create(ID.unique(), email, password, name);
        await authLogin(email, password);

        try {
          await databases.createDocument(
            DATABASE_ID || '',
            USERS_COLLECTION_ID || '',
            user.$id,
            {
              displayName: name.trim(),
              bio: '',
              contactEmail: email,
              createdAt: new Date().toISOString(),
            }
          );
        } catch (profileError) {
          console.error("Error creating default profile:", profileError);
        }
      }
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Authentication error:', error);
      Alert.alert(
        'Authentication Error',
        mode === 'login'
          ? 'Failed to log in. Please check your credentials.'
          : 'Failed to register. This email might already be in use.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingSession) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text variant="displaySmall" style={{ color: colors.primary, fontWeight: '900', letterSpacing: -1 }}>CampusMarket</Text>
          <Text variant="bodyLarge" style={{ color: colors.secondary, marginTop: 8 }}>The marketplace for everything.</Text>
        </View>

        <View style={styles.form}>
          {mode === 'register' && (
            <View style={styles.inputContainer}>
              <TextInput
                label="Full Name"
                value={name}
                onChangeText={setName}
                mode="flat"
                style={styles.input}
                underlineColor={colors.outline}
                activeUnderlineColor={colors.primary}
                contentStyle={{ paddingHorizontal: 0 }}
                error={!!fieldErrors.name}
                theme={{ colors: { background: 'transparent' } }}
              />
              {fieldErrors.name && <Text style={{ color: colors.error, marginTop: 4 }}>{fieldErrors.name}</Text>}
            </View>
          )}

          <View style={styles.inputContainer}>
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="flat"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              underlineColor={colors.outline}
              activeUnderlineColor={colors.primary}
              contentStyle={{ paddingHorizontal: 0 }}
              error={!!fieldErrors.email}
              theme={{ colors: { background: 'transparent' } }}
            />
            {fieldErrors.email && <Text style={{ color: colors.error, marginTop: 4 }}>{fieldErrors.email}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              mode="flat"
              style={styles.input}
              secureTextEntry={!passwordVisible}
              underlineColor={colors.outline}
              activeUnderlineColor={colors.primary}
              contentStyle={{ paddingHorizontal: 0 }}
              error={!!fieldErrors.password}
              theme={{ colors: { background: 'transparent' } }}
              right={<TextInput.Icon icon={passwordVisible ? "eye" : "eye-off"} onPress={() => setPasswordVisible(!passwordVisible)} />}
            />
            {fieldErrors.password && <Text style={{ color: colors.error, marginTop: 4 }}>{fieldErrors.password}</Text>}
          </View>

          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handleAuth}
              loading={isLoading}
              disabled={isLoading}
              style={[styles.button, { backgroundColor: colors.primary }]}
              contentStyle={{ height: 50 }}
              labelStyle={{ fontWeight: 'bold' }}
            >
              {mode === 'login' ? 'Log In' : 'Sign Up'}
            </Button>

            <Button
              mode="outlined"
              onPress={() => setMode(mode === 'login' ? 'register' : 'login')}
              style={[styles.button, { borderColor: colors.outline }]}
              contentStyle={{ height: 50 }}
              textColor={colors.primary}
            >
              {mode === 'login' ? "Create Account" : "Log In"}
            </Button>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 30,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 50,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
  },
  buttonContainer: {
    marginTop: 20,
    gap: 12,
  },
  button: {
    borderRadius: 50, // Pill shape
  },
});