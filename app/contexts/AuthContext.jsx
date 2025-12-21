import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { account } from '../../appwrite';

const AuthContext = createContext({
  user: null,
  isLoading: true,
  login: async (email, password) => { },
  logout: async () => { },
  refreshUser: async () => { },
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load cached user on mount
  useEffect(() => {
    loadCachedUser();
  }, []);

  const loadCachedUser = async () => {
    try {
      // First, try to load from cache for instant display
      const cachedUser = await AsyncStorage.getItem('currentUser');
      if (cachedUser) {
        setUser(JSON.parse(cachedUser));
        setIsLoading(false); // Show cached data immediately
      }

      // Then check for actual session
      const session = await account.getSession('current');
      if (session) {
        const freshUser = await account.get();
        setUser(freshUser);
        // Update cache
        await AsyncStorage.setItem('currentUser', JSON.stringify(freshUser));
      } else {
        // No session, clear cache
        setUser(null);
        await AsyncStorage.removeItem('currentUser');
      }
    } catch (error) {
      console.log('No active session:', error.message);
      setUser(null);
      await AsyncStorage.removeItem('currentUser');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      await account.createEmailPasswordSession(email, password);
      const user = await account.get();
      setUser(user);
      await AsyncStorage.setItem('currentUser', JSON.stringify(user));
      return user;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await account.deleteSession('current');
      setUser(null);
      await AsyncStorage.removeItem('currentUser');
    } catch (error) {
      console.error('Logout error:', error);
      // Clear local state anyway
      setUser(null);
      await AsyncStorage.removeItem('currentUser');
    }
  };

  const refreshUser = async () => {
    try {
      const freshUser = await account.get();
      setUser(freshUser);
      await AsyncStorage.setItem('currentUser', JSON.stringify(freshUser));
      return freshUser;
    } catch (error) {
      console.error('Error refreshing user:', error);
      setUser(null);
      await AsyncStorage.removeItem('currentUser');
      throw error;
    }
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
