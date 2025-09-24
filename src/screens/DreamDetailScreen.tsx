// src/screens/DreamDetailScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Share,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import Toast from 'react-native-toast-message';

import { useTheme } from '../contexts/ThemeContext';
import { useDreams } from '../hooks/useDreams';
import { RootStackParamList } from '../navigation/RootNavigator';
import { api } from '../services/api';

type RoutePropType = RouteProp<RootStackParamList, 'DreamDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function DreamDetailScreen() {
  const { theme } = useTheme();
  const route = useRoute<RoutePropType>();
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { getDreamById, toggleFavorite, deleteDream, updateDream } = useDreams();
  
  const [dream, setDream] = useState(getDreamById(route.params.dreamId));
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [activeTab, setActiveTab] = useState<'dream' | 'story' | 'analysis'>('dream');

  useEffect(() => {
    // Set header options
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity onPress={handleShare}>
            <Ionicons name="share-outline" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleToggleFavorite}>
            <Ionicons 
              name={dream?.isFavorite ? "star" : "star-outline"} 
              size={24} 
              color={dream?.isFavorite ? theme.colors.accent : theme.colors.primary}
            />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [dream]);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const handleToggleFavorite = async () => {
    if (!dream) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await toggleFavorite(dream.id);
    setDream({ ...dream, isFavorite: !dream.isFavorite });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Dream',
      'Are you sure you want to delete this dream? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!dream) return;
            await deleteDream(dream.id);
            navigation.goBack();
            Toast.show({
              type: 'success',
              text1: 'Dream Deleted',
              text2: 'The dream has been removed from your journal.',
            });
          },
        },
      ]
    );
  };

  const handleShare = async () => {
    if (!dream) return;
    
    const content = dream.story || dream.originalDream;
    const message = `✨ ${dream.title}\n\n${content}\n\nCreated with DreamSprout 🌙`;
    
    try {
      await Share.share({
        message,
        title: dream.title,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleGenerateStory = async () => {
    if (!dream || dream.story) return;
    
    setIsGenerating(true);
    try {
      const result = await api.generateStory(
        dream.originalDream,
        'whimsical',
        'medium'
      );
      
      if (result.data) {
        await updateDream(dream.id, { story: result.data.story });
        setDream({ ...dream, story: result.data.story });
        setActiveTab('story');
        Toast.show({
          type: 'success',
          text1: 'Story Generated!',
          text2: 'Your fairy tale is ready.',
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Generation Failed',
        text2: 'Unable to generate story. Please try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateAnalysis = async () => {
    if (!dream || dream.analysis) return;
    
    setIsGenerating(true);
    try {
      const result = await api.analyzeDream(dream.originalDream, dream.id);
      
      if (result.data) {
        await updateDream(dream.id, { analysis: result.data.analysis });
        setDream({ ...dream, analysis: result.data.analysis });
        setActiveTab('analysis');
        Toast.show({
          type: 'success',
          text1: 'Analysis Complete!',
          text2: 'Your dream insights are ready.',
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Analysis Failed',
        text2: 'Unable to analyze dream. Please try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const playAudio = async () => {
    if (!dream?.audioUri) return;
    
    try {
      if (sound) {
        await sound.unloadAsync();
      }
      
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: dream.audioUri },
        { shouldPlay: true }
      );
      
      setSound(newSound);
      setIsPlaying(true);
      
      newSound.setOnPlaybackStatusUpdate((status) => {
        if ('didJustFinish' in status && status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (error) {
      console.error('Audio playback error:', error);
    }
  };

  if (!dream) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.text }}>Dream not found</Text>
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    tabBar: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      borderRadius: 8,
    },
    tabActive: {
      backgroundColor: theme.colors.primary + '20',
    },
    tabText: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: theme.colors.textSecondary,
    },
    tabTextActive: {
      color: theme.colors.primary,
      fontFamily: 'Inter-SemiBold',
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: 20,
      paddingBottom: 100,
    },
    header: {
      marginBottom: 20,
    },
    date: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: theme.colors.textSecondary,
      marginBottom: 8,
    },
    title: {
      fontSize: 28,
      fontFamily: 'Playfair-Bold',
      color: theme.colors.text,
      marginBottom: 12,
    },
    metaContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      gap: 4,
    },
    badgeText: {
      fontSize: 12,
      fontFamily: 'Inter-Medium',
      color: theme.colors.textSecondary,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontFamily: 'Inter-SemiBold',
      color: theme.colors.text,
      marginBottom: 12,
    },
    dreamText: {
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: theme.colors.text,
      lineHeight: 24,
      backgroundColor: theme.colors.surface,
      padding: 16,
      borderRadius: 12,
    },
    storyContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      borderLeftWidth: 3,
      borderLeftColor: theme.colors.primary,
    },
    analysisContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      borderLeftWidth: 3,
      borderLeftColor: theme.colors.secondary,
    },
    generateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 12,
      gap: 8,
      marginTop: 16,
    },
    generateButtonText: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: 'white',
    },
    imageGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginTop: 16,
    },
    imageContainer: {
      width: '48%',
      aspectRatio: 1,
      borderRadius: 12,
      overflow: 'hidden',
    },
    image: {
      width: '100%',
      height: '100%',
    },
    floatingActions: {
      position: 'absolute',
      bottom: insets.bottom + 20,
      left: 20,
      right: 20,
      flexDirection: 'row',
      gap: 12,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      borderRadius: 12,
      gap: 8,
    },
    primaryAction: {
      backgroundColor: theme.colors.primary,
    },
    dangerAction: {
      backgroundColor: theme.colors.error,
    },
    actionText: {
      fontSize: 14,
      fontFamily: 'Inter-SemiBold',
      color: 'white',
    },
  });

  return (
    <View style={styles.container}>
      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'dream' && styles.tabActive]}
          onPress={() => setActiveTab('dream')}
        >
          <Text style={[styles.tabText, activeTab === 'dream' && styles.tabTextActive]}>
            Dream
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'story' && styles.tabActive]}
          onPress={() => setActiveTab('story')}
        >
          <Text style={[styles.tabText, activeTab === 'story' && styles.tabTextActive]}>
            Story
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'analysis' && styles.tabActive]}
          onPress={() => setActiveTab('analysis')}
        >
          <Text style={[styles.tabText, activeTab === 'analysis' && styles.tabTextActive]}>
            Analysis
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.date}>{dream.date}</Text>
          <Text style={styles.title}>{dream.title}</Text>
          <View style={styles.metaContainer}>
            {dream.inputMode === 'voice' && (
              <View style={styles.badge}>
                <Ionicons name="mic" size={12} color={theme.colors.textSecondary} />
                <Text style={styles.badgeText}>Voice Memo</Text>
              </View>
            )}
            {dream.tone && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{dream.tone}</Text>
              </View>
            )}
            {dream.length && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{dream.length}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Content based on active tab */}
        {activeTab === 'dream' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Original Dream</Text>
            <Text style={styles.dreamText}>{dream.originalDream}</Text>
            
            {dream.inputMode === 'voice' && dream.audioUri && (
              <TouchableOpacity
                style={styles.generateButton}
                onPress={playAudio}
                disabled={isPlaying}
              >
                <Ionicons name={isPlaying ? "pause" : "play"} size={20} color="white" />
                <Text style={styles.generateButtonText}>
                  {isPlaying ? 'Playing...' : 'Play Recording'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {activeTab === 'story' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fairy Tale</Text>
            {dream.story ? (
              <>
                <View style={styles.storyContainer}>
                  <Text style={styles.dreamText}>{dream.story}</Text>
                </View>
                {dream.images && dream.images.length > 0 && (
                  <View style={styles.imageGrid}>
                    {dream.images.map((image, index) => (
                      <View key={index} style={styles.imageContainer}>
                        <Image source={{ uri: image.url }} style={styles.image} />
                      </View>
                    ))}
                  </View>
                )}
              </>
            ) : (
              <TouchableOpacity
                style={styles.generateButton}
                onPress={handleGenerateStory}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Ionicons name="sparkles" size={20} color="white" />
                )}
                <Text style={styles.generateButtonText}>
                  {isGenerating ? 'Generating...' : 'Generate Fairy Tale'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {activeTab === 'analysis' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dream Analysis</Text>
            {dream.analysis ? (
              <View style={styles.analysisContainer}>
                <Text style={styles.dreamText}>{dream.analysis}</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.generateButton}
                onPress={handleGenerateAnalysis}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Ionicons name="bulb" size={20} color="white" />
                )}
                <Text style={styles.generateButtonText}>
                  {isGenerating ? 'Analyzing...' : 'Analyze Dream'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* Floating Actions */}
      <View style={styles.floatingActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.dangerAction]}
          onPress={handleDelete}
        >
          <Ionicons name="trash" size={18} color="white" />
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}