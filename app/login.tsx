import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { ID } from 'react-native-appwrite';
import { account, databases, DATABASE_ID, USERS_COLLECTION_ID } from '../appwrite/config';

export default function LoginScreen() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
  }>({});
  const router = useRouter();

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    setIsCheckingSession(true);
    try {
      const session = await account.getSession('current');
      if (session) {
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.log('No active session');
    } finally {
      setIsCheckingSession(false);
    }
  };

  const validateForm = () => {
    let errors: { name?: string; email?: string; password?: string } = {};

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
      console.log("Auth attempt:", { email, mode, endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT });

      if (mode === 'login') {
        // Log in the user
        await account.createEmailPasswordSession(email, password);
        console.log("Session created for login");
      } else {
        // Register a new user
        const user = await account.create(ID.unique(), email, password, name);
        
        console.log("User created:", user);
        
        await account.createEmailPasswordSession(email, password);
        console.log("Session created for new user");

        try{
            await databases.createDocument(
                DATABASE_ID,
                USERS_COLLECTION_ID,
                ID.unique(),
                {
                    userId: user.$id,
                    displayName: name,
                    bio: '',
                    contactEmail: '',
                    phoneNumber: '',
                    createdAt: new Date().toISOString(),
                }
            );
            console.log("Default profile created for user");
        } catch (profileError){
            console.error("Error creating default profile:", profileError);
        }
      }
      
      // Navigate to the main app
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
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Maverick Marketplace</Text>
          <Text style={styles.subtitle}>UTA's own marketplace for students</Text>
        </View>
        
        <View style={styles.form}>
          {mode === 'register' && (
            <>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={[styles.input, fieldErrors.name && styles.error]}
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  setFieldErrors((prev) => ({ 
                    ...prev, 
                    name: text.trim() === "" ? "Name is required." : undefined, }));
                }}
                placeholder="Your full name"
                placeholderTextColor={"rgba(0, 0, 0, 0.5)"}
                autoCapitalize="words"
              />
            </>
          )}
          {fieldErrors.name && <Text style={styles.errorText}>{fieldErrors.name}</Text>}
          
          <Text style={[styles.label, fieldErrors.email && styles.error]}>Email</Text>
          <TextInput
            style={[styles.input, fieldErrors.email && styles.error]}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setFieldErrors((prev) => ({ 
                ...prev, 
                email: text.trim() === "" ? "Email is required." : undefined, }));
            }}
            placeholder="Your email address"
            placeholderTextColor={"rgba(0, 0, 0, 0.5)"}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {fieldErrors.email && <Text style={styles.errorText}>{fieldErrors.email}</Text>}
          
          <Text style={[styles.label, fieldErrors.password && styles.error]}>Password</Text>
          <TextInput
            style={[styles.input, fieldErrors.password && styles.error]}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setFieldErrors((prev) => ({ 
                ...prev, 
                password: text.trim() === "" ? "Password is required." : undefined, }));
            }}
            placeholder="Your password"
            placeholderTextColor={"rgba(0, 0, 0, 0.5)"}
            secureTextEntry
          />
          {fieldErrors.password && <Text style={styles.errorText}>{fieldErrors.password}</Text>}
          
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleAuth}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {mode === 'login' ? 'Log In' : 'Register'}
              </Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.switchMode}
            onPress={() => setMode(mode === 'login' ? 'register' : 'login')}
          >
            <Text style={styles.switchModeText}>
              {mode === 'login' 
                ? "Don't have an account? Register" 
                : "Already have an account? Log In"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2196F3',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: '500',
  },
  input: {
    height: 45,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  button: {
    backgroundColor: '#2196F3',
    height: 45,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#A9A9A9',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  switchMode: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchModeText: {
    color: '#2196F3',
    fontSize: 16,
  },
  error: {
    borderColor: 'red'
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
  }
});
