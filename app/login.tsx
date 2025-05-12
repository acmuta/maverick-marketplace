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
import { account, databases, DATABASE_ID, USERS_COLLECTION_ID } from '../appwrite';
import { Ionicons } from '@expo/vector-icons';

// Define theme colors to match tab layout
const COLORS = {
  darkBlue: '#0A1929',
  mediumBlue: '#0F2942',
  orange: '#FF6F00',
  brightOrange: '#FF9800',
  white: '#FFFFFF',
  inactive: '#546E7A',
  lightBlue: 'rgba(15, 41, 66, 0.8)',
  inputBg: 'rgba(255, 255, 255, 0.1)',
  error: '#FF5252',
};

export default function LoginScreen() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [passwordVisible, setPasswordVisible] = useState(false);
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
        <ActivityIndicator size="large" color={COLORS.brightOrange} />
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
              <View style={[styles.inputContainer, fieldErrors.name && styles.inputError]}>
                <Ionicons name="person-outline" size={20} color={COLORS.inactive} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    setFieldErrors((prev) => ({ 
                      ...prev, 
                      name: text.trim() === "" ? "Name is required." : undefined, }));
                  }}
                  placeholder="Your full name"
                  placeholderTextColor={COLORS.inactive}
                  autoCapitalize="words"
                />
              </View>
              {fieldErrors.name && <Text style={styles.errorText}>{fieldErrors.name}</Text>}
            </>
          )}
          
          <Text style={styles.label}>Email</Text>
          <View style={[styles.inputContainer, fieldErrors.email && styles.inputError]}>
            <Ionicons name="mail-outline" size={20} color={COLORS.inactive} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setFieldErrors((prev) => ({ 
                  ...prev, 
                  email: text.trim() === "" ? "Email is required." : undefined, }));
              }}
              placeholder="Your email address"
              placeholderTextColor={COLORS.inactive}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          {fieldErrors.email && <Text style={styles.errorText}>{fieldErrors.email}</Text>}
          
          <Text style={styles.label}>Password</Text>
          <View style={[styles.inputContainer, fieldErrors.password && styles.inputError]}>
            <Ionicons name="lock-closed-outline" size={20} color={COLORS.inactive} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setFieldErrors((prev) => ({ 
                  ...prev, 
                  password: text.trim() === "" ? "Password is required." : undefined, }));
              }}
              placeholder="Your password"
              placeholderTextColor={COLORS.inactive}
              secureTextEntry={!passwordVisible}
            />
            <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)} style={styles.visibilityIcon}>
              <Ionicons 
                name={passwordVisible ? "eye-outline" : "eye-off-outline"} 
                size={20} 
                color={COLORS.inactive} 
              />
            </TouchableOpacity>
          </View>
          {fieldErrors.password && <Text style={styles.errorText}>{fieldErrors.password}</Text>}
          
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleAuth}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.white} />
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
    backgroundColor: COLORS.darkBlue,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 25,
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
    color: COLORS.brightOrange,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.white,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
    color: COLORS.white,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    backgroundColor: COLORS.inputBg,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  inputIcon: {
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    color: COLORS.white,
    paddingRight: 10,
  },
  visibilityIcon: {
    paddingHorizontal: 12,
  },
  button: {
    backgroundColor: COLORS.orange,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  buttonDisabled: {
    backgroundColor: COLORS.inactive,
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  switchMode: {
    marginTop: 25,
    alignItems: 'center',
  },
  switchModeText: {
    color: COLORS.brightOrange,
    fontSize: 16,
  },
  inputError: {
    borderColor: COLORS.error,
    borderWidth: 1,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: -8,
    marginBottom: 12,
    paddingLeft: 5,
  }
});