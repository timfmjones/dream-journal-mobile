// src/navigation/RootNavigator.tsx

import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

// Import all screens - make sure these files exist!
import OnboardingScreen from '../screens/OnboardingScreen';
import AuthScreen from '../screens/AuthScreen';
import HomeScreen from '../screens/HomeScreen';
import CreateDreamScreen from '../screens/CreateDreamScreen';
import JournalScreen from '../screens/JournalScreen';
import DreamDetailScreen from '../screens/DreamDetailScreen';
import SettingsScreen from '../screens/SettingsScreen';

// These screens might be in the wrong folder - let's handle them gracefully
let BiometricLockScreen: any = null;
let StoryGenerationScreen: any = null;
let AnalysisScreen: any = null;

try {
  BiometricLockScreen = require('../screens/BiometricLockScreen').default;
} catch (e) {
  console.log('BiometricLockScreen not found');
}

try {
  StoryGenerationScreen = require('../screens/StoryGenerationScreen').default;
} catch (e) {
  console.log('StoryGenerationScreen not found');
}

try {
  AnalysisScreen = require('../screens/AnalysisScreen').default;
} catch (e) {
  console.log('AnalysisScreen not found');
}

export type RootStackParamList = {
  Onboarding: undefined;
  Auth: undefined;
  BiometricLock: undefined;
  Main: undefined;
  CreateDream: { mode?: 'text' | 'voice' };
  DreamDetail: { dreamId: string };
  StoryGeneration: { dream: any };
  Analysis: { dream: any };
};

export type MainTabParamList = {
  Home: undefined;
  Journal: undefined;
  Create: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Journal':
              iconName = focused ? 'book' : 'book-outline';
              break;
            case 'Create':
              iconName = focused ? 'add-circle' : 'add-circle-outline';
              break;
            case 'Settings':
              iconName = focused ? 'settings' : 'settings-outline';
              break;
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          paddingBottom: 5,
          paddingTop: 5,
          height: 85,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: 'Inter-Medium',
        },
        headerStyle: {
          backgroundColor: theme.colors.background,
          shadowColor: 'transparent',
          elevation: 0,
        },
        headerTitleStyle: {
          fontFamily: 'Playfair-Bold',
          fontSize: 24,
          color: theme.colors.text,
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          headerTitle: 'DreamSprout',
        }}
      />
      <Tab.Screen
        name="Journal"
        component={JournalScreen}
        options={{
          tabBarLabel: 'Journal',
          headerTitle: 'Dream Journal',
        }}
      />
      <Tab.Screen
        name="Create"
        component={CreateDreamScreen}
        options={{
          tabBarLabel: 'Create',
          headerTitle: 'New Dream',
          tabBarIconStyle: {
            marginTop: -3,
          },
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          headerTitle: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { user, loading, isGuest, biometricsEnabled } = useAuth();
  const { theme } = useTheme();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(true); // Default to unlocked for now

  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    try {
      const seen = await AsyncStorage.getItem('has_seen_onboarding');
      setHasSeenOnboarding(seen === 'true');
    } catch (error) {
      console.error('Error checking onboarding:', error);
      setHasSeenOnboarding(false);
    }
  };

  if (loading || hasSeenOnboarding === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      {!hasSeenOnboarding ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : !user && !isGuest ? (
        <Stack.Screen name="Auth" component={AuthScreen} />
      ) : biometricsEnabled && !isUnlocked && BiometricLockScreen ? (
        <Stack.Screen name="BiometricLock" component={BiometricLockScreen} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen
            name="CreateDream"
            component={CreateDreamScreen}
            options={{
              headerShown: true,
              headerTitle: 'Record Dream',
              headerStyle: {
                backgroundColor: theme.colors.background,
              },
              headerTitleStyle: {
                fontFamily: 'Playfair-Bold',
                fontSize: 20,
                color: theme.colors.text,
              },
              headerTintColor: theme.colors.primary,
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="DreamDetail"
            component={DreamDetailScreen}
            options={{
              headerShown: true,
              headerTitle: 'Dream Details',
              headerStyle: {
                backgroundColor: theme.colors.background,
              },
              headerTitleStyle: {
                fontFamily: 'Playfair-Bold',
                fontSize: 20,
                color: theme.colors.text,
              },
              headerTintColor: theme.colors.primary,
            }}
          />
          {StoryGenerationScreen && (
            <Stack.Screen
              name="StoryGeneration"
              component={StoryGenerationScreen}
              options={{
                headerShown: true,
                headerTitle: 'Generate Story',
                headerStyle: {
                  backgroundColor: theme.colors.background,
                },
                headerTitleStyle: {
                  fontFamily: 'Playfair-Bold',
                  fontSize: 20,
                  color: theme.colors.text,
                },
                headerTintColor: theme.colors.primary,
                presentation: 'modal',
              }}
            />
          )}
          {AnalysisScreen && (
            <Stack.Screen
              name="Analysis"
              component={AnalysisScreen}
              options={{
                headerShown: true,
                headerTitle: 'Dream Analysis',
                headerStyle: {
                  backgroundColor: theme.colors.background,
                },
                headerTitleStyle: {
                  fontFamily: 'Playfair-Bold',
                  fontSize: 20,
                  color: theme.colors.text,
                },
                headerTintColor: theme.colors.primary,
                presentation: 'modal',
              }}
            />
          )}
        </>
      )}
    </Stack.Navigator>
  );
}