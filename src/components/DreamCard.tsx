// src/components/DreamCard.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../contexts/ThemeContext';
import { Dream } from '../services/api';

const { width: screenWidth } = Dimensions.get('window');

interface DreamCardProps {
  dream: Dream;
  onPress: () => void;
  onLongPress?: () => void;
}

export default function DreamCard({ dream, onPress, onLongPress }: DreamCardProps) {
  const { theme } = useTheme();

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const handleLongPress = async () => {
    if (onLongPress) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onLongPress();
    }
  };

  const getExcerpt = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    titleContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 8,
    },
    title: {
      fontSize: 18,
      fontFamily: 'Inter-SemiBold',
      color: theme.colors.text,
      flex: 1,
    },
    editIndicator: {
      marginLeft: 4,
      opacity: 0.5,
    },
    favoriteIcon: {
      padding: 4,
    },
    excerpt: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: theme.colors.textSecondary,
      lineHeight: 20,
      marginBottom: 12,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    date: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: theme.colors.textSecondary,
    },
    badges: {
      flexDirection: 'row',
      gap: 8,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primary + '20',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 4,
    },
    badgeText: {
      fontSize: 11,
      fontFamily: 'Inter-Medium',
      color: theme.colors.primary,
    },
    editHint: {
      fontSize: 10,
      fontFamily: 'Inter-Regular',
      color: theme.colors.textSecondary,
      fontStyle: 'italic',
      marginTop: 4,
    },
  });

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={handlePress}
      onLongPress={handleLongPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {dream.title}
          </Text>
        </View>
        {dream.isFavorite && (
          <View style={styles.favoriteIcon}>
            <Ionicons 
              name="star" 
              size={16} 
              color={theme.colors.accent}
            />
          </View>
        )}
      </View>
      
      <Text style={styles.excerpt} numberOfLines={3}>
        {getExcerpt(dream.originalDream, 150)}
      </Text>
      
      <View style={styles.footer}>
        <Text style={styles.date}>
          {format(new Date(dream.date), 'MMM dd, yyyy')}
        </Text>
        
        <View style={styles.badges}>
          {dream.inputMode === 'voice' && (
            <View style={styles.badge}>
              <Ionicons name="mic" size={11} color={theme.colors.primary} />
              <Text style={styles.badgeText}>Voice</Text>
            </View>
          )}
          {dream.story && (
            <View style={styles.badge}>
              <Ionicons name="sparkles" size={11} color={theme.colors.primary} />
              <Text style={styles.badgeText}>Story</Text>
            </View>
          )}
          {dream.analysis && (
            <View style={styles.badge}>
              <Ionicons name="bulb" size={11} color={theme.colors.primary} />
              <Text style={styles.badgeText}>Analysis</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}