import React, { createContext, useState, useContext, useEffect } from 'react';
import { account, registerUser, loginUser, logoutUser, getCurrentUser } from '../lib/appwrite';
import { Alert } from 'react-native';

// Create context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    checkUserStatus();
  }, []);

  // Check user authentication status
  const checkUserStatus = async () => {
    try {
      setIsLoading(true);
      console.log("Checking user authentication status...");
      
      const loggedInUser = await getCurrentUser();
      console.log("Auth status result:", loggedInUser ? "User found" : "No user found");
      
      // Important: make sure we're setting user to null explicitly if no user is found
      setUser(loggedInUser || null);
    } catch (error) {
      console.error('Error checking auth status:', error);
      // Explicitly set user to null on error
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Register a new user
  const register = async (email, password, name) => {
    try {
      setIsLoading(true);
      
      // Check if email is a valid UTA email
      if (!email.endsWith('@mavs.uta.edu')) {
        Alert.alert('Invalid Email', 'Only @mavs.uta.edu email addresses are allowed to register');
        return false;
      }
      
      const newUser = await registerUser(email, password, name);
      await checkUserStatus();
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Registration Failed', error.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Login user
  const login = async (email, password) => {
    try {
      setIsLoading(true);
      await loginUser(email, password);
      await checkUserStatus();
      return true;
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Login Failed', 'Invalid email or password');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout user
  const logout = async () => {
    try {
      setIsLoading(true);
      await logoutUser();
      // Important: explicitly set user to null after logout
      setUser(null);
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Context value
  const value = {
    user,
    isLoading,
    register,
    login,
    logout,
    checkUserStatus
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};