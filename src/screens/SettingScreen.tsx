// src/screens/SettingsScreen.tsx
// IMPORTANT: Replace your existing SettingsScreen.tsx with this version

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useDreams } from '../hooks/useDreams';
import { api } from '../services/api';
import Toast from 'react-native-toast-message';

interface SettingSection {
  title: string;
  items: SettingItem[];
}

interface SettingItem {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  type: 'switch' | 'button' | 'info' | 'action';
  value?: boolean;
  onPress?: () => void;
  onValueChange?: (value: boolean) => void;
  highlighted?: boolean;
}

export default function SettingsScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const { user, isGuest, logout, biometricsEnabled, enableBiometrics, signInWithGoogle } = useAuth();
  const { dreams, refreshDreams } = useDreams();
  const insets = useSafeAreaInsets();

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [autoPlayAudio, setAutoPlayAudio] = useState(true);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [stats, setStats] = useState({
    totalDreams: 0,
    dreamsThisMonth: 0,
    favoriteDreams: 0,
  });

  // Debug logging
  useEffect(() => {
    console.log('=== SettingsScreen Debug ===');
    console.log('User exists:', !!user);
    console.log('Is Guest:', isGuest);
    console.log('User email:', user?.email);
    console.log('User display name:', user?.displayName);
    console.log('========================');
  }, [user, isGuest]);

  useEffect(() => {
    loadSettings();
    loadStats();
  }, [user, isGuest, dreams]);

  const loadSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem('app_settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        setNotificationsEnabled(parsed.notifications || false);
        setAutoPlayAudio(parsed.autoPlayAudio !== false);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const loadStats = () => {
    const localStats = {
      totalDreams: dreams.length,
      dreamsThisMonth: dreams.filter(d => {
        const date = new Date(d.date);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }).length,
      favoriteDreams: dreams.filter(d => d.isFavorite).length,
    };
    
    setStats(localStats);

    if (!isGuest && user) {
      api.getUserStats().then(response => {
        if (response.data) {
          setStats({
            totalDreams: response.data.totalDreams || localStats.totalDreams,
            dreamsThisMonth: response.data.dreamsThisMonth || localStats.dreamsThisMonth,
            favoriteDreams: response.data.favoriteDreams || localStats.favoriteDreams,
          });
        }
      }).catch(error => {
        console.error('Failed to load stats from API:', error);
      });
    }
  };

  const saveSettings = async (key: string, value: any) => {
    try {
      const settings = await AsyncStorage.getItem('app_settings');
      const parsed = settings ? JSON.parse(settings) : {};
      parsed[key] = value;
      await AsyncStorage.setItem('app_settings', JSON.stringify(parsed));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const handleOpenSignInModal = () => {
    console.log('Opening sign-in modal...');
    setShowSignInModal(true);
  };

  const handleSignInWithGoogle = async () => {
    try {
      setIsSigningIn(true);
      console.log('Starting Google sign-in...');
      await signInWithGoogle();
      setShowSignInModal(false);
      await refreshDreams();
      Toast.show({
        type: 'success',
        text1: 'Signed In Successfully',
        text2: 'Your dreams are now synced!',
      });
    } catch (error) {
      console.error('Google sign-in error:', error);
      Alert.alert(
        'Sign In Failed',
        'Unable to sign in with Google. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleBiometricToggle = async (value: boolean) => {
    try {
      if (value) {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        
        if (!hasHardware || !isEnrolled) {
          Alert.alert(
            'Biometrics Not Available',
            'Please enable Face ID or Touch ID in your device settings.',
            [{ text: 'OK' }]
          );
          return;
        }
        
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Enable biometric lock for DreamSprout',
        });
        
        if (result.success) {
          await enableBiometrics(true);
        }
      } else {
        await enableBiometrics(false);
      }
    } catch (error) {
      console.error('Biometric toggle error:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? Your dreams will continue to be saved locally.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            Toast.show({
              type: 'info',
              text1: 'Signed Out',
              text2: 'You have been signed out successfully',
            });
          },
        },
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all your locally stored dreams. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Data',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            Alert.alert('Success', 'All local data has been cleared.');
          },
        },
      ]
    );
  };

  // Build sections - ALWAYS show sign-in option when in guest mode or no user
  const sections: SettingSection[] = [
    {
      title: 'Account',
      items: [
        // Always show current status first
        ...(user && !isGuest ? [
          {
            icon: 'person-circle' as keyof typeof Ionicons.glyphMap,
            title: user.displayName || 'Signed In User',
            subtitle: user.email || 'Synced Account',
            type: 'info' as const,
          },
          {
            icon: 'cloud-done' as keyof typeof Ionicons.glyphMap,
            title: 'Cloud Sync Active',
            subtitle: 'Dreams backed up automatically',
            type: 'info' as const,
          },
        ] : [
          {
            icon: 'person-outline' as keyof typeof Ionicons.glyphMap,
            title: 'Guest Mode Active',
            subtitle: 'Tap here to sign in',
            type: 'action' as const,
            onPress: handleOpenSignInModal,
            highlighted: true,
          },
        ]),
        // Always show sign-in button for guests
        ...(isGuest || !user ? [
          {
            icon: 'log-in' as keyof typeof Ionicons.glyphMap,
            title: 'Sign In to Your Account',
            subtitle: 'Sync dreams across all devices',
            type: 'button' as const,
            onPress: handleOpenSignInModal,
            highlighted: true,
          },
        ] : []),
        // Show sign out for logged-in users
        ...(user && !isGuest ? [
          {
            icon: 'log-out' as keyof typeof Ionicons.glyphMap,
            title: 'Sign Out',
            subtitle: 'Return to guest mode',
            type: 'button' as const,
            onPress: handleLogout,
          },
        ] : []),
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          icon: 'moon',
          title: 'Dark Mode',
          type: 'switch',
          value: isDark,
          onValueChange: toggleTheme,
        },
        {
          icon: 'notifications',
          title: 'Dream Reminders',
          subtitle: 'Daily notifications to record dreams',
          type: 'switch',
          value: notificationsEnabled,
          onValueChange: async (value) => {
            setNotificationsEnabled(value);
            await saveSettings('notifications', value);
          },
        },
        {
          icon: 'volume-high',
          title: 'Auto-Play Audio',
          subtitle: 'Automatically play generated stories',
          type: 'switch',
          value: autoPlayAudio,
          onValueChange: async (value) => {
            setAutoPlayAudio(value);
            await saveSettings('autoPlayAudio', value);
          },
        },
      ],
    },
    {
      title: 'Security',
      items: [
        {
          icon: 'finger-print',
          title: 'Biometric Lock',
          subtitle: 'Use Face ID or Touch ID to unlock',
          type: 'switch',
          value: biometricsEnabled,
          onValueChange: handleBiometricToggle,
        },
      ],
    },
    {
      title: 'Statistics',
      items: [
        {
          icon: 'stats-chart',
          title: 'Total Dreams',
          subtitle: stats.totalDreams.toString(),
          type: 'info',
        },
        {
          icon: 'calendar',
          title: 'Dreams This Month',
          subtitle: stats.dreamsThisMonth.toString(),
          type: 'info',
        },
        {
          icon: 'star',
          title: 'Favorite Dreams',
          subtitle: stats.favoriteDreams.toString(),
          type: 'info',
        },
      ],
    },
    {
      title: 'Data',
      items: [
        {
          icon: 'cloud-download',
          title: 'Export Dreams',
          subtitle: 'Download your dream journal',
          type: 'button',
          onPress: () => Alert.alert('Coming Soon', 'Export feature will be available soon.'),
        },
        ...(isGuest ? [{
          icon: 'trash' as keyof typeof Ionicons.glyphMap,
          title: 'Clear Local Data',
          subtitle: 'Remove all locally stored dreams',
          type: 'button' as const,
          onPress: handleClearData,
        }] : []),
      ],
    },
    {
      title: 'About',
      items: [
        {
          icon: 'information-circle',
          title: 'Version',
          subtitle: '1.0.0',
          type: 'info',
        },
        {
          icon: 'document-text',
          title: 'Privacy Policy',
          type: 'button',
          onPress: () => Linking.openURL('https://dreamsprout.app/privacy'),
        },
        {
          icon: 'document',
          title: 'Terms of Service',
          type: 'button',
          onPress: () => Linking.openURL('https://dreamsprout.app/terms'),
        },
        {
          icon: 'help-circle',
          title: 'Support',
          type: 'button',
          onPress: () => Linking.openURL('mailto:support@dreamsprout.app'),
        },
      ],
    },
  ];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      paddingBottom: insets.bottom + 20,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 14,
      fontFamily: 'Inter-SemiBold',
      color: theme.colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginLeft: 20,
      marginBottom: 8,
      marginTop: 20,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    highlightedItem: {
      backgroundColor: theme.colors.primary + '15',
      borderLeftWidth: 3,
      borderLeftColor: theme.colors.primary,
    },
    itemIcon: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: theme.colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    highlightedIcon: {
      backgroundColor: theme.colors.primary + '30',
    },
    itemContent: {
      flex: 1,
    },
    itemTitle: {
      fontSize: 16,
      fontFamily: 'Inter-Medium',
      color: theme.colors.text,
    },
    highlightedTitle: {
      color: theme.colors.primary,
      fontFamily: 'Inter-SemiBold',
    },
    itemSubtitle: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    chevron: {
      marginLeft: 8,
    },
    // Modal styles
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      width: '85%',
      backgroundColor: theme.colors.background,
      borderRadius: 20,
      overflow: 'hidden',
      maxWidth: 400,
    },
    modalGradient: {
      paddingTop: 30,
      paddingBottom: 20,
      alignItems: 'center',
    },
    modalIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 24,
      fontFamily: 'Playfair-Bold',
      color: 'white',
      marginBottom: 8,
    },
    modalSubtitle: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: 'rgba(255, 255, 255, 0.9)',
      textAlign: 'center',
      paddingHorizontal: 20,
    },
    modalButtons: {
      padding: 20,
    },
    googleButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'white',
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 12,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    googleButtonText: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: '#1F2937',
      marginLeft: 12,
    },
    cancelButton: {
      alignItems: 'center',
      paddingVertical: 14,
      marginTop: 8,
    },
    cancelButtonText: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: theme.colors.textSecondary,
    },
  });

  const renderItem = (item: SettingItem, isLast: boolean) => {
    const isClickable = item.type === 'button' || item.type === 'action';
    
    return (
      <TouchableOpacity
        key={item.title}
        style={[
          styles.item,
          isLast && { borderBottomWidth: 0 },
          item.highlighted && styles.highlightedItem,
        ]}
        onPress={item.onPress}
        disabled={!isClickable && item.type !== 'switch'}
        activeOpacity={isClickable ? 0.7 : 1}
      >
        <View style={[
          styles.itemIcon,
          item.highlighted && styles.highlightedIcon,
        ]}>
          <Ionicons 
            name={item.icon} 
            size={20} 
            color={item.highlighted ? theme.colors.primary : theme.colors.primary} 
          />
        </View>
        <View style={styles.itemContent}>
          <Text style={[
            styles.itemTitle,
            item.highlighted && styles.highlightedTitle,
          ]}>
            {item.title}
          </Text>
          {item.subtitle && (
            <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
          )}
        </View>
        {item.type === 'switch' && (
          <Switch
            value={item.value}
            onValueChange={item.onValueChange}
            trackColor={{ false: theme.colors.disabled, true: theme.colors.primary }}
            thumbColor={item.value ? 'white' : theme.colors.surface}
          />
        )}
        {isClickable && (
          <Ionicons
            name="chevron-forward"
            size={20}
            color={item.highlighted ? theme.colors.primary : theme.colors.textSecondary}
            style={styles.chevron}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View>
              {section.items.map((item, itemIndex) => 
                renderItem(item, itemIndex === section.items.length - 1)
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Sign In Modal */}
      <Modal
        visible={showSignInModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSignInModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.secondary]}
              style={styles.modalGradient}
            >
              <View style={styles.modalIcon}>
                <Ionicons name="moon" size={40} color="white" />
              </View>
              <Text style={styles.modalTitle}>Sign In to DreamSprout</Text>
              <Text style={styles.modalSubtitle}>
                Sync your dreams across all devices and never lose your magical stories
              </Text>
            </LinearGradient>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.googleButton}
                onPress={handleSignInWithGoogle}
                disabled={isSigningIn}
                activeOpacity={0.7}
              >
                {isSigningIn ? (
                  <ActivityIndicator size="small" color="#EA4335" />
                ) : (
                  <>
                    <Ionicons name="logo-google" size={20} color="#EA4335" />
                    <Text style={styles.googleButtonText}>Continue with Google</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowSignInModal(false)}
                disabled={isSigningIn}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}