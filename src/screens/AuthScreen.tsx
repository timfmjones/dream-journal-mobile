// src/screens/AuthScreen.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function AuthScreen() {
  const { signInWithGoogle, continueAsGuest } = useAuth();
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await signInWithGoogle();
    } catch (error) {
      console.error('Google sign-in error:', error);
      Alert.alert(
        'Sign In Failed',
        'Unable to sign in with Google. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestMode = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      'Guest Mode',
      'Your dreams will be saved locally on this device only. Sign in later to sync across devices.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Continue',
          onPress: continueAsGuest,
        },
      ]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    gradient: {
      flex: 1,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 30,
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: 40,
    },
    logoIcon: {
      width: 120,
      height: 120,
      borderRadius: 30,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
    },
    appName: {
      fontSize: 40,
      fontFamily: 'Playfair-Bold',
      color: 'white',
      marginBottom: 8,
    },
    tagline: {
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: 'rgba(255, 255, 255, 0.9)',
      textAlign: 'center',
    },
    animationContainer: {
      width: SCREEN_WIDTH * 0.8,
      height: 200,
      marginBottom: 40,
    },
    buttonsContainer: {
      width: '100%',
      marginTop: 20,
    },
    googleButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'white',
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 12,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    googleIcon: {
      width: 24,
      height: 24,
      marginRight: 12,
    },
    googleButtonText: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: '#1F2937',
    },
    dividerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 20,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    dividerText: {
      marginHorizontal: 16,
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: 'rgba(255, 255, 255, 0.7)',
    },
    guestButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    guestButtonText: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: 'white',
      marginLeft: 8,
    },
    footer: {
      position: 'absolute',
      bottom: 30,
      left: 30,
      right: 30,
    },
    footerText: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: 'rgba(255, 255, 255, 0.6)',
      textAlign: 'center',
      lineHeight: 18,
    },
    linkText: {
      color: 'white',
      fontFamily: 'Inter-Medium',
      textDecorationLine: 'underline',
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#6B46C1', '#7C3AED', '#8B5CF6']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={styles.content}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            {/* Logo */}
            <View style={styles.logoContainer}>
              <View style={styles.logoIcon}>
                <Ionicons name="moon" size={60} color="white" />
              </View>
              <Text style={styles.appName}>DreamSprout</Text>
              <Text style={styles.tagline}>
                Transform your dreams into magical fairy tales
              </Text>
            </View>

            {/* Animation placeholder */}
            {/* <View style={styles.animationContainer}>
              <LottieView
                source={require('../../assets/animations/auth-animation.json')}
                autoPlay
                loop
                style={{ flex: 1 }}
              />
            </View> */}

            {/* Auth Buttons */}
            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={styles.googleButton}
                onPress={handleGoogleSignIn}
                activeOpacity={0.8}
                disabled={isLoading}
              >
                <View style={styles.googleIcon}>
                  <Ionicons name="logo-google" size={24} color="#EA4335" />
                </View>
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </TouchableOpacity>

              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={styles.guestButton}
                onPress={handleGuestMode}
                activeOpacity={0.8}
                disabled={isLoading}
              >
                <Ionicons name="person-outline" size={20} color="white" />
                <Text style={styles.guestButtonText}>Continue as Guest</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By continuing, you agree to our{' '}
              <Text style={styles.linkText}>Terms of Service</Text> and{' '}
              <Text style={styles.linkText}>Privacy Policy</Text>
            </Text>
          </View>
        </SafeAreaView>

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="white" />
          </View>
        )}
      </LinearGradient>
    </View>
  );
}