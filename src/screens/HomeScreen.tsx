// src/screens/HomeScreen.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { format } from 'date-fns';

import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useDreams } from '../hooks/useDreams';
import { api } from '../services/api';
import DreamCard from '../components/DreamCard';
import QuickActionCard from '../components/QuickActionCard';
import StatsCard from '../components/StatsCard';
import { RootStackParamList } from '../navigation/RootNavigator';

const { width: screenWidth } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const { user, isGuest } = useAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { dreams, recentDreams, favoriteDreams, refreshDreams, isLoading } = useDreams();
  
  const [stats, setStats] = useState({
    totalDreams: 0,
    dreamsThisMonth: 0,
    favoriteDreams: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [greeting, setGreeting] = useState('');

  // Refresh dreams when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('HomeScreen focused, refreshing dreams...');
      refreshDreams();
    }, [])
  );

  useEffect(() => {
    updateGreeting();
    loadStats();
  }, []);

  // Debug logging
  useEffect(() => {
    console.log('HomeScreen - Dreams updated:');
    console.log('Total dreams:', dreams.length);
    console.log('Recent dreams:', recentDreams.map(d => ({ id: d.id, title: d.title })));
    console.log('Favorite dreams:', favoriteDreams.length);
  }, [dreams, recentDreams, favoriteDreams]);

  const updateGreeting = () => {
    const hour = new Date().getHours();
    let greetingText = '';
    
    if (hour < 12) {
      greetingText = 'Good morning';
    } else if (hour < 18) {
      greetingText = 'Good afternoon';
    } else {
      greetingText = 'Good evening';
    }
    
    if (user?.displayName) {
      greetingText += `, ${user.displayName.split(' ')[0]}`;
    } else if (!isGuest) {
      greetingText += '!';
    } else {
      greetingText += ', Dreamer';
    }
    
    setGreeting(greetingText);
  };

  const loadStats = async () => {
    if (!isGuest && user) {
      try {
        const response = await api.getUserStats();
        if (response.data) {
          setStats({
            totalDreams: response.data.totalDreams,
            dreamsThisMonth: response.data.dreamsThisMonth,
            favoriteDreams: response.data.favoriteDreams,
          });
        }
      } catch (error) {
        console.error('Failed to load stats:', error);
        // Use local stats as fallback
        setStats({
          totalDreams: dreams.length,
          dreamsThisMonth: dreams.filter(d => {
            const date = new Date(d.date);
            const now = new Date();
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
          }).length,
          favoriteDreams: favoriteDreams.length,
        });
      }
    } else {
      // Guest mode - use local stats
      setStats({
        totalDreams: dreams.length,
        dreamsThisMonth: dreams.filter(d => {
          const date = new Date(d.date);
          const now = new Date();
          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        }).length,
        favoriteDreams: favoriteDreams.length,
      });
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refreshDreams(),
      loadStats(),
    ]);
    setRefreshing(false);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 30,
    },
    gradientHeader: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      height: 200,
    },
    greeting: {
      fontSize: 32,
      fontFamily: 'Playfair-Bold',
      color: theme.colors.text,
      marginBottom: 8,
    },
    date: {
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: theme.colors.textSecondary,
    },
    quickActions: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      marginTop: -20,
      marginBottom: 20,
      gap: 12,
    },
    statsSection: {
      paddingHorizontal: 20,
      marginBottom: 30,
    },
    sectionTitle: {
      fontSize: 20,
      fontFamily: 'Inter-SemiBold',
      color: theme.colors.text,
      marginBottom: 16,
    },
    statsRow: {
      flexDirection: 'row',
      gap: 12,
    },
    dreamsSection: {
      paddingHorizontal: 20,
      marginBottom: 30,
    },
    dreamsList: {
      gap: 12,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
    },
    emptyStateText: {
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: theme.colors.textSecondary,
      marginTop: 12,
    },
    floatingButton: {
      position: 'absolute',
      bottom: 30,
      right: 20,
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    testSection: {
      padding: 20,
      backgroundColor: '#f0f0f0',
      margin: 10,
      borderRadius: 10,
    },
    testButton: {
      backgroundColor: '#6B46C1',
      padding: 12,
      borderRadius: 8,
      marginBottom: 10,
    },
    testButtonText: {
      color: 'white',
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.primary + '20', 'transparent']}
        style={styles.gradientHeader}
      />
      
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.date}>{format(new Date(), 'EEEE, MMMM d, yyyy')}</Text>
        </View>

        {/* Test Navigation Buttons - Remove these in production */}
        <View style={styles.testSection}>
          <Text style={{ marginBottom: 10 }}>Navigation Test:</Text>
          <TouchableOpacity
            style={styles.testButton}
            onPress={() => {
              console.log('TEST: Navigating to DreamDetail with ID: test-123');
              navigation.navigate('DreamDetail', { dreamId: 'test-123' });
            }}
          >
            <Text style={styles.testButtonText}>
              Test Navigate to Dream (ID: test-123)
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: '#7C3AED' }]}
            onPress={() => {
              console.log('TEST: Pushing DreamDetail with ID: push-456');
              navigation.push('DreamDetail' as any, { dreamId: 'push-456' });
            }}
          >
            <Text style={styles.testButtonText}>
              Test Push to Dream (ID: push-456)
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.quickActions}>
          <QuickActionCard
            icon="mic"
            title="Voice Dream"
            color={theme.colors.primary}
            onPress={() => navigation.navigate('CreateDream', { mode: 'voice' })}
          />
          <QuickActionCard
            icon="create"
            title="Write Dream"
            color={theme.colors.secondary}
            onPress={() => navigation.navigate('CreateDream', { mode: 'text' })}
          />
        </View>

        {!isGuest && (
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Your Statistics</Text>
            <View style={styles.statsRow}>
              <StatsCard
                title="Total Dreams"
                value={stats.totalDreams}
                icon="moon"
                color={theme.colors.primary}
              />
              <StatsCard
                title="This Month"
                value={stats.dreamsThisMonth}
                icon="calendar"
                color={theme.colors.secondary}
              />
              <StatsCard
                title="Favorites"
                value={stats.favoriteDreams}
                icon="star"
                color={theme.colors.accent}
              />
            </View>
          </View>
        )}

        <View style={styles.dreamsSection}>
          <Text style={styles.sectionTitle}>Recent Dreams</Text>
          {recentDreams.length > 0 ? (
            <View style={styles.dreamsList}>
              {recentDreams.slice(0, 3).map((dream) => {
                console.log('Rendering dream card for:', dream.id, dream.title); // Debug log
                return (
                  <DreamCard
                    key={dream.id}
                    dream={dream}
                    onPress={() => {
                      console.log('Navigating to dream detail with ID:', dream.id); // Debug log
                      navigation.navigate('DreamDetail', { dreamId: dream.id });
                    }}
                  />
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No dreams yet. Start recording your dreams!
              </Text>
            </View>
          )}
        </View>

        {favoriteDreams.length > 0 && (
          <View style={styles.dreamsSection}>
            <Text style={styles.sectionTitle}>Favorite Dreams</Text>
            <View style={styles.dreamsList}>
              {favoriteDreams.slice(0, 2).map((dream) => (
                <DreamCard
                  key={dream.id}
                  dream={dream}
                  onPress={() => navigation.navigate('DreamDetail', { dreamId: dream.id })}
                />
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => navigation.navigate('CreateDream', {})}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>
    </View>
  );
}