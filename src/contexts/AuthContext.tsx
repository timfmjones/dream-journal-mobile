// src/contexts/AuthContext.tsx

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, signInWithCredential, signOut, onAuthStateChanged, GoogleAuthProvider } from 'firebase/auth';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebase';
import { Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  continueAsGuest: () => void;
  checkBiometrics: () => Promise<boolean>;
  enableBiometrics: (enable: boolean) => Promise<void>;
  biometricsEnabled: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);

  // Google Sign-In configuration
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: Platform.select({
      ios: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      android: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
      default: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    }),
  });

  useEffect(() => {
    // Check for stored guest mode preference
    const checkGuestMode = async () => {
      try {
        const guestMode = await AsyncStorage.getItem('dreamsprout_guest_mode');
        if (guestMode === 'true') {
          setIsGuest(true);
        }
        
        // Check biometrics preference
        const bioEnabled = await SecureStore.getItemAsync('biometrics_enabled');
        setBiometricsEnabled(bioEnabled === 'true');
      } catch (error) {
        console.error('Error checking auth preferences:', error);
      }
    };
    
    checkGuestMode();

    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        setIsGuest(false);
        AsyncStorage.removeItem('dreamsprout_guest_mode');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    // Handle Google Sign-In response
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential)
        .then(() => {
          setIsGuest(false);
          AsyncStorage.removeItem('dreamsprout_guest_mode');
        })
        .catch((error) => {
          console.error('Error signing in with Google:', error);
        });
    }
  }, [response]);

  const signInWithGoogle = async () => {
    try {
      await promptAsync();
    } catch (error) {
      console.error('Error with Google Sign-In:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setIsGuest(false);
      await AsyncStorage.removeItem('dreamsprout_guest_mode');
      await SecureStore.deleteItemAsync('biometrics_enabled');
      setBiometricsEnabled(false);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const continueAsGuest = async () => {
    setIsGuest(true);
    await AsyncStorage.setItem('dreamsprout_guest_mode', 'true');
  };

  const checkBiometrics = async (): Promise<boolean> => {
    try {
      const LocalAuthentication = await import('expo-local-authentication');
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return hasHardware && isEnrolled;
    } catch (error) {
      console.error('Error checking biometrics:', error);
      return false;
    }
  };

  const enableBiometrics = async (enable: boolean) => {
    try {
      if (enable) {
        const canUse = await checkBiometrics();
        if (!canUse) {
          throw new Error('Biometrics not available');
        }
        await SecureStore.setItemAsync('biometrics_enabled', 'true');
      } else {
        await SecureStore.deleteItemAsync('biometrics_enabled');
      }
      setBiometricsEnabled(enable);
    } catch (error) {
      console.error('Error setting biometrics:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    isGuest,
    signInWithGoogle,
    logout,
    continueAsGuest,
    checkBiometrics,
    enableBiometrics,
    biometricsEnabled,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};