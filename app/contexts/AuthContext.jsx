import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { account } from '../../appwrite';

const AuthContext = createContext({
  user: null,
  isLoading: true,
  isEmailVerified: false,
  login: async (email, password) => { },
  logout: async () => { },
  refreshUser: async () => { },
  sendVerificationCode: async () => { },
  verifyCode: async (code) => { },
  deleteAccount: async () => { },
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

  // Use Appwrite's built-in email verification
  const isEmailVerified = user?.emailVerification === true;

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

  // Store pending verification userId for the OTP flow
  const [pendingUserId, setPendingUserId] = useState(null);

  const sendVerificationCode = async (userId = null, email = null) => {
    try {
      // Use provided args (for registration flow) or current user state
      const targetUserId = userId || user?.$id;
      const targetEmail = email || user?.email;

      if (!targetEmail) throw new Error('No email provided');

      console.log('EMAIL OTP: Sending verification code to', targetEmail);

      // Use Appwrite's built-in Email OTP
      // This sends a 6-digit code to the user's email via Appwrite's email system
      const { ID } = await import('react-native-appwrite');
      const token = await account.createEmailToken(
        targetUserId || ID.unique(),
        targetEmail
      );

      console.log('EMAIL OTP: Token created, userId:', token.userId);

      // Store the userId for verification step
      setPendingUserId(token.userId);
      await AsyncStorage.setItem('pendingVerificationUserId', token.userId);

      return true;
    } catch (error) {
      console.error('Error sending verification code:', error);
      throw error;
    }
  };

  const verifyCode = async (code) => {
    try {
      let targetUserId = pendingUserId;
      if (!targetUserId) {
        targetUserId = await AsyncStorage.getItem('pendingVerificationUserId');
      }
      if (!targetUserId && user) {
        targetUserId = user.$id;
      }

      if (!targetUserId) {
        throw new Error('No pending verification found. Please request a new code.');
      }

      console.log('EMAIL OTP: Verifying code for userId:', targetUserId);

      const session = await account.createSession(targetUserId, code);

      console.log('EMAIL OTP: Session created!', session.$id);

      setPendingUserId(null);
      await AsyncStorage.removeItem('pendingVerificationUserId');

      const freshUser = await account.get();
      setUser(freshUser);
      await AsyncStorage.setItem('currentUser', JSON.stringify(freshUser));

      return true;
    } catch (error) {
      console.error('Error verifying code:', error);
      throw error;
    }
  };

  const deleteAccount = async () => {
    try {
      if (!user) throw new Error('No user logged in');
      
      await account.updateStatus();
      
      setUser(null);
      await AsyncStorage.removeItem('currentUser');
      
      return true;
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  };

  const value = {
    user,
    isLoading,
    isEmailVerified,
    login,
    logout,
    refreshUser,
    sendVerificationCode,
    verifyCode,
    deleteAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;

