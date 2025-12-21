import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { ID } from 'react-native-appwrite';
import { account, databases, DATABASE_ID, USERS_COLLECTION_ID } from '../appwrite';
import { useAuth } from './contexts/AuthContext';
import { TextInput, Button, Text, useTheme } from 'react-native-paper';

export default function LoginScreen() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, login: authLogin, isLoading: isCheckingSession } = useAuth();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<any>({});
  const router = useRouter();
  const { colors } = useTheme();

  useEffect(() => { if (user) router.replace('/(tabs)'); }, [user]);

  const validateForm = () => {
    let errors: any = {};
    if (!email.trim()) errors.email = "Email is required.";
    if (!password.trim()) errors.password = "Password is required.";
    if (mode === 'register' && !name.trim()) errors.name = "Name is required.";
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
          await databases.createDocument(DATABASE_ID || '', USERS_COLLECTION_ID || '', user.$id, {
            displayName: name.trim(), bio: '', contactEmail: email, createdAt: new Date().toISOString(),
          });
        } catch (e) { console.error(e); }
      }
      router.replace('/(tabs)');
    } catch (e) { Alert.alert('Error', 'Authentication failed.'); } finally { setIsLoading(false); }
  };

  if (isCheckingSession) return <View style={[styles.centered, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.primary} /></View>;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text variant="displaySmall" style={{ color: colors.primary, fontWeight: '900', letterSpacing: -1 }}>CampusMarket</Text>
          <Text variant="bodyLarge" style={{ color: colors.secondary, marginTop: 8 }}>The marketplace for everything.</Text>
        </View>

        <View style={styles.form}>
          {mode === 'register' && (
            <View style={styles.inputContainer}>
              <TextInput label="Full Name" value={name} onChangeText={setName} mode="flat" style={styles.input} underlineColor="transparent" activeUnderlineColor="transparent" error={!!fieldErrors.name} theme={{ roundness: 3 }} />
              {fieldErrors.name && <Text style={styles.errorText}>{fieldErrors.name}</Text>}
            </View>
          )}

          <View style={styles.inputContainer}>
            <TextInput label="Email" value={email} onChangeText={setEmail} mode="flat" style={styles.input} keyboardType="email-address" autoCapitalize="none" underlineColor="transparent" activeUnderlineColor="transparent" error={!!fieldErrors.email} theme={{ roundness: 3 }} />
            {fieldErrors.email && <Text style={styles.errorText}>{fieldErrors.email}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <TextInput label="Password" value={password} onChangeText={setPassword} mode="flat" style={styles.input} secureTextEntry={!passwordVisible} underlineColor="transparent" activeUnderlineColor="transparent" error={!!fieldErrors.password} right={<TextInput.Icon icon={passwordVisible ? "eye" : "eye-off"} onPress={() => setPasswordVisible(!passwordVisible)} />} theme={{ roundness: 3 }} />
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
  input: { backgroundColor: '#F9FAFB', borderRadius: 12, borderTopLeftRadius: 12, borderTopRightRadius: 12, height: 56 }, // Filled style
  buttonContainer: { marginTop: 24, gap: 12 },
  button: { borderRadius: 16 },
  errorText: { color: '#EF4444', marginTop: 4, fontSize: 12 }
});