import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Alert,
  SafeAreaView
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { router } from "expo-router";
import { isValidUTAEmail } from "../lib/appwrite";

const SignIn = () => {
    const { user, login, register, isLoading } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [isRegistering, setIsRegistering] = useState(false);

    // Debug log to verify this component is rendering
    console.log("Sign-in component rendering, user state:", user ? "User exists" : "No user");

    // IMPORTANT: Only redirect if user exists AND is not null/undefined
    useEffect(() => {
        if (user !== null && user !== undefined) {
            console.log("User detected, redirecting to tabs");
            // Use a simple path for navigation
            router.replace("(tabs)");
        } else {
            console.log("No user detected, staying on sign-in page");
        }
    }, [user]);

    // Validate UTA email
    const validateEmail = () => {
        if (!isValidUTAEmail(email)) {
            Alert.alert("Invalid Email", "Please use your @mavs.uta.edu email address");
            return false;
        }
        return true;
    };

    // Handle login
    const handleLogin = async () => {
        if (!validateEmail()) return;
        
        console.log("Attempting login...");
        const success = await login(email, password);
        console.log("Login result:", success ? "Success" : "Failed");
        
        if (success) {
            console.log("Login successful, navigating...");
            router.replace("./(tabs)");
        }
    };

    // Handle registration
    const handleRegister = async () => {
        if (!validateEmail()) return;
        
        if (!name.trim()) {
            Alert.alert("Missing Information", "Please enter your name");
            return;
        }
        
        if (password.length < 8) {
            Alert.alert("Weak Password", "Password must be at least 8 characters long");
            return;
        }
        
        console.log("Attempting registration...");
        const success = await register(email, password, name);
        console.log("Registration result:", success ? "Success" : "Failed");
        
        if (success) {
            Alert.alert("Success", "Registration successful!");
            setIsRegistering(false);
        }
    };

    // Toggle between login and register forms
    const toggleForm = () => {
        setIsRegistering(!isRegistering);
    };

    // If we're loading, show a simple loading screen
    if (isLoading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#4A24B0" />
                <Text style={{marginTop: 20}}>Loading...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Text style={styles.title}>
                    {isRegistering ? "Create Account" : "Sign In"}
                </Text>
                
                <Text style={styles.subtitle}>
                    {isRegistering 
                        ? "Register with your UTA email" 
                        : "Sign in to Maverick Marketplace"}
                </Text>
                
                {isRegistering && (
                    <TextInput
                        style={styles.input}
                        placeholder="Full Name"
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                    />
                )}
                
                <TextInput
                    style={styles.input}
                    placeholder="Email (@mavs.uta.edu)"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                />
                
                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />
                
                <TouchableOpacity 
                    style={[
                        styles.button,
                        isLoading && styles.disabledButton
                    ]}
                    onPress={isRegistering ? handleRegister : handleLogin}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>
                            {isRegistering ? "Register" : "Sign In"}
                        </Text>
                    )}
                </TouchableOpacity>
                
                <TouchableOpacity 
                    onPress={toggleForm} 
                    style={styles.toggleButton}
                    disabled={isLoading}
                >
                    <Text style={styles.toggleText}>
                        {isRegistering 
                            ? "Already have an account? Sign In" 
                            : "Don't have an account? Register"}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#ffffff",
    },
    container: {
        flex: 1,
        padding: 20,
        justifyContent: "center",
        backgroundColor: "#ffffff",
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        marginBottom: 10,
        textAlign: "center",
        color: "#000000",
    },
    subtitle: {
        fontSize: 16,
        color: "#666",
        marginBottom: 30,
        textAlign: "center",
    },
    input: {
        backgroundColor: "#f9f9f9",
        borderRadius: 8,
        padding: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: "#e0e0e0",
    },
    button: {
        backgroundColor: "#4A24B0", // UTA colors
        borderRadius: 8,
        padding: 15,
        alignItems: "center",
        marginTop: 10,
    },
    disabledButton: {
        opacity: 0.7,
    },
    buttonText: {
        color: "white",
        fontWeight: "bold",
        fontSize: 16,
    },
    toggleButton: {
        marginTop: 20,
        alignItems: "center",
        padding: 10,
    },
    toggleText: {
        color: "#4A24B0",
        fontSize: 14,
        fontWeight: "500",
    }
});

export default SignIn;