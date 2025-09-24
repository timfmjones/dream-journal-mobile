// src/screens/OnboardingScreen.tsx

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { RootStackParamList } from '../navigation/RootNavigator';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface OnboardingSlide {
  id: number;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: [string, string];
}

const slides: OnboardingSlide[] = [
  {
    id: 1,
    title: 'Record Your Dreams',
    description: 'Capture your dreams with voice memos or text. Never forget those magical moments from your sleep.',
    icon: 'moon-outline',
    gradient: ['#6B46C1', '#7C3AED'],
  },
  {
    id: 2,
    title: 'Transform into Stories',
    description: 'Watch your dreams become enchanting fairy tales with AI-powered storytelling magic.',
    icon: 'sparkles-outline',
    gradient: ['#7C3AED', '#8B5CF6'],
  },
  {
    id: 3,
    title: 'Discover Insights',
    description: 'Uncover hidden meanings and patterns in your dreams with thoughtful analysis.',
    icon: 'bulb-outline',
    gradient: ['#8B5CF6', '#A78BFA'],
  },
  {
    id: 4,
    title: 'Your Dream Journal',
    description: 'Keep all your dreams safe in one magical place. Access them anytime, anywhere.',
    icon: 'book-outline',
    gradient: ['#A78BFA', '#C4B5FD'],
  },
];

export default function OnboardingScreen() {
  const navigation = useNavigation<NavigationProp>();
  const scrollX = useSharedValue(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<any>(null);

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      completeOnboarding();
    }
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  const completeOnboarding = async () => {
    await AsyncStorage.setItem('has_seen_onboarding', 'true');
    navigation.replace('Auth');
  };

  const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => {
    const inputRange = [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH];
    
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        {
          scale: interpolate(
            scrollX.value,
            inputRange,
            [0.9, 1, 0.9],
            Extrapolate.CLAMP
          ),
        },
      ],
      opacity: interpolate(
        scrollX.value,
        inputRange,
        [0.5, 1, 0.5],
        Extrapolate.CLAMP
      ),
    }));

    return (
      <View style={styles.slide}>
        <LinearGradient
          colors={item.gradient}
          style={styles.gradientBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <Animated.View style={[styles.slideContent, animatedStyle]}>
          <View style={styles.iconContainer}>
            <Ionicons name={item.icon} size={120} color="white" />
          </View>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </Animated.View>
      </View>
    );
  };

  const renderDots = () => {
    return (
      <View style={styles.dotsContainer}>
        {slides.map((_, index) => {
          const inputRange = [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH];
          
          const animatedDotStyle = useAnimatedStyle(() => ({
            width: interpolate(
              scrollX.value,
              inputRange,
              [8, 20, 8],
              Extrapolate.CLAMP
            ),
            opacity: interpolate(
              scrollX.value,
              inputRange,
              [0.3, 1, 0.3],
              Extrapolate.CLAMP
            ),
          }));

          return (
            <Animated.View
              key={index}
              style={[styles.dot, animatedDotStyle]}
            />
          );
        })}
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'white',
    },
    slide: {
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
      justifyContent: 'center',
      alignItems: 'center',
    },
    gradientBackground: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    },
    slideContent: {
      alignItems: 'center',
      paddingHorizontal: 40,
    },
    iconContainer: {
      width: 200,
      height: 200,
      borderRadius: 100,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 40,
    },
    title: {
      fontSize: 32,
      fontFamily: 'Playfair-Bold',
      color: 'white',
      textAlign: 'center',
      marginBottom: 20,
    },
    description: {
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: 'rgba(255, 255, 255, 0.9)',
      textAlign: 'center',
      lineHeight: 24,
    },
    footer: {
      position: 'absolute',
      bottom: 50,
      left: 0,
      right: 0,
      paddingHorizontal: 30,
    },
    dotsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 30,
    },
    dot: {
      height: 8,
      borderRadius: 4,
      backgroundColor: 'white',
      marginHorizontal: 4,
    },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    skipButton: {
      padding: 10,
    },
    skipText: {
      fontSize: 16,
      fontFamily: 'Inter-Medium',
      color: 'rgba(255, 255, 255, 0.7)',
    },
    nextButton: {
      backgroundColor: 'white',
      paddingHorizontal: 30,
      paddingVertical: 15,
      borderRadius: 25,
      flexDirection: 'row',
      alignItems: 'center',
    },
    nextButtonText: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: '#6B46C1',
      marginRight: 8,
    },
    getStartedText: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: '#6B46C1',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <Animated.FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        onScroll={(event) => {
          scrollX.value = event.nativeEvent.contentOffset.x;
        }}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setCurrentIndex(index);
        }}
        keyExtractor={(item) => item.id.toString()}
      />
      <View style={styles.footer}>
        {renderDots()}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            {currentIndex === slides.length - 1 ? (
              <Text style={styles.getStartedText}>Get Started</Text>
            ) : (
              <>
                <Text style={styles.nextButtonText}>Next</Text>
                <Ionicons name="arrow-forward" size={20} color="#6B46C1" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}