import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useAuth } from "../context/AuthContext";
import { router } from "expo-router";
import { isValidUTAEmail } from "../lib/appwrite";

const SignIn = () => {
    const { login, register, isLoading } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [isRegistering, setIsRegistering] = useState(false);

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
        
        const success = await login(email, password);
        if (success) {
            router.replace("/(root)/(tabs)/");
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
        
        const success = await register(email, password, name);
        if (success) {
            Alert.alert("Success", "Registration successful!");
            setIsRegistering(false);
        }
    };

    // Toggle between login and register forms
    const toggleForm = () => {
        setIsRegistering(!isRegistering);
    };

    return (
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
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: "center",
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        marginBottom: 10,
        textAlign: "center",
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
    },
    toggleText: {
        color: "#4A24B0",
        fontSize: 14,
    }
});

export default SignIn;