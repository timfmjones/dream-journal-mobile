// src/screens/SettingsScreen.tsx

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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useDreams } from '../hooks/useDreams';
import { api } from '../services/api';

interface SettingSection {
  title: string;
  items: SettingItem[];
}

interface SettingItem {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  type: 'switch' | 'button' | 'info';
  value?: boolean;
  onPress?: () => void;
  onValueChange?: (value: boolean) => void;
}

export default function SettingsScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const { user, isGuest, logout, biometricsEnabled, enableBiometrics } = useAuth();
  const { dreams } = useDreams();
  const insets = useSafeAreaInsets();

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [autoPlayAudio, setAutoPlayAudio] = useState(true);
  const [preferredVoice, setPreferredVoice] = useState('alloy');
  const [stats, setStats] = useState({
    totalDreams: 0,
    dreamsThisMonth: 0,
    favoriteDreams: 0,
  });

  useEffect(() => {
    loadSettings();
    loadStats();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem('app_settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        setNotificationsEnabled(parsed.notifications || false);
        setAutoPlayAudio(parsed.autoPlayAudio !== false);
        setPreferredVoice(parsed.voice || 'alloy');
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const loadStats = async () => {
    if (!isGuest && user) {
      const response = await api.getUserStats();
      if (response.data) {
        setStats({
          totalDreams: response.data.totalDreams,
          dreamsThisMonth: response.data.dreamsThisMonth,
          favoriteDreams: response.data.favoriteDreams,
        });
      }
    } else {
      setStats({
        totalDreams: dreams.length,
        dreamsThisMonth: dreams.filter(d => {
          const date = new Date(d.date);
          const now = new Date();
          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        }).length,
        favoriteDreams: dreams.filter(d => d.isFavorite).length,
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
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: logout,
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

  const sections: SettingSection[] = [
    {
      title: 'Account',
      items: user && !isGuest ? [
        {
          icon: 'person-circle',
          title: user.displayName || 'User',
          subtitle: user.email || undefined,
          type: 'info',
        },
        {
          icon: 'log-out',
          title: 'Sign Out',
          type: 'button',
          onPress: handleLogout,
        },
      ] : [
        {
          icon: 'person',
          title: 'Guest Mode',
          subtitle: 'Sign in to sync across devices',
          type: 'info',
        },
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
    itemIcon: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: theme.colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    itemContent: {
      flex: 1,
    },
    itemTitle: {
      fontSize: 16,
      fontFamily: 'Inter-Medium',
      color: theme.colors.text,
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
  });

  const renderItem = (item: SettingItem, isLast: boolean) => {
    return (
      <TouchableOpacity
        key={item.title}
        style={[styles.item, isLast && { borderBottomWidth: 0 }]}
        onPress={item.onPress}
        disabled={item.type === 'info' || item.type === 'switch'}
        activeOpacity={item.type === 'button' ? 0.7 : 1}
      >
        <View style={styles.itemIcon}>
          <Ionicons name={item.icon} size={20} color={theme.colors.primary} />
        </View>
        <View style={styles.itemContent}>
          <Text style={styles.itemTitle}>{item.title}</Text>
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
        {item.type === 'button' && (
          <Ionicons
            name="chevron-forward"
            size={20}
            color={theme.colors.textSecondary}
            style={styles.chevron}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {sections.map((section, sectionIndex) => (
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
    </View>
  );
}