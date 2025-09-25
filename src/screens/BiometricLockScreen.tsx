// src/screens/BiometricLockScreen.tsx

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from 'expo-local-authentication';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';

export default function BiometricLockScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();

  useEffect(() => {
    authenticate();
  }, []);

  const authenticate = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock DreamSprout',
        disableDeviceFallback: false,
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use Passcode',
      });

      if (result.success) {
        navigation.navigate('Main' as never);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      Alert.alert('Error', 'Authentication failed. Please try again.');
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    gradient: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    iconContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 40,
    },
    title: {
      fontSize: 28,
      fontFamily: 'Playfair-Bold',
      color: 'white',
      marginBottom: 16,
    },
    subtitle: {
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: 'rgba(255, 255, 255, 0.9)',
      textAlign: 'center',
      marginBottom: 40,
    },
    unlockButton: {
      backgroundColor: 'white',
      paddingHorizontal: 40,
      paddingVertical: 16,
      borderRadius: 30,
    },
    unlockButtonText: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: theme.colors.primary,
    },
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        style={styles.gradient}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="finger-print" size={60} color="white" />
        </View>
        
        <Text style={styles.title}>DreamSprout Locked</Text>
        <Text style={styles.subtitle}>
          Use Face ID or Touch ID to unlock your dream journal
        </Text>

        <TouchableOpacity 
          style={styles.unlockButton} 
          onPress={authenticate}
        >
          <Text style={styles.unlockButtonText}>Unlock</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}