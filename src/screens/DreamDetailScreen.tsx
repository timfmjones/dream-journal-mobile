// src/screens/DreamDetailScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  Share,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';

import { useTheme } from '../contexts/ThemeContext';
import { useDreams } from '../hooks/useDreams';
import { RootStackParamList } from '../navigation/RootNavigator';
import { api } from '../services/api';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type RoutePropType = RouteProp<RootStackParamList, 'DreamDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function DreamDetailScreen() {
  const { theme } = useTheme();
  const route = useRoute<RoutePropType>();
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { getDreamById, toggleFavorite, deleteDream, updateDream, dreams } = useDreams();
  
  const dreamId = route.params?.dreamId;
  console.log('DreamDetailScreen - dreamId:', dreamId);
  
  const [dream, setDream] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dream' | 'story' | 'analysis'>('dream');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [isSavingTitle, setIsSavingTitle] = useState(false);

  // Load dream when screen focuses or dreams array changes
  useFocusEffect(
    React.useCallback(() => {
      console.log('DreamDetailScreen - Focus effect triggered');
      console.log('DreamDetailScreen - Looking for dream with ID:', dreamId);
      console.log('DreamDetailScreen - Available dreams:', dreams.map(d => ({ id: d.id, title: d.title })));
      
      if (dreamId) {
        const foundDream = getDreamById(dreamId);
        console.log('DreamDetailScreen - Found dream:', foundDream);
        
        if (foundDream) {
          setDream(foundDream);
          setEditedTitle(foundDream.title);
          setLoading(false);
        } else {
          // Wait a bit and try again, as the dream might still be propagating
          setTimeout(() => {
            const retryDream = getDreamById(dreamId);
            console.log('DreamDetailScreen - Retry found dream:', retryDream);
            if (retryDream) {
              setDream(retryDream);
              setEditedTitle(retryDream.title);
            }
            setLoading(false);
          }, 500);
        }
      } else {
        console.log('DreamDetailScreen - No dreamId provided');
        setLoading(false);
      }
    }, [dreamId, dreams])
  );

  // Also update when dreams array changes
  useEffect(() => {
    if (dreamId && dreams.length > 0) {
      const foundDream = getDreamById(dreamId);
      if (foundDream) {
        console.log('DreamDetailScreen - Updating dream from dreams array');
        setDream(foundDream);
        if (!isEditingTitle) {
          setEditedTitle(foundDream.title);
        }
      }
    }
  }, [dreams, dreamId]);

  const handleStartEditTitle = () => {
    setIsEditingTitle(true);
    setEditedTitle(dream.title);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleCancelEditTitle = () => {
    setIsEditingTitle(false);
    setEditedTitle(dream.title);
  };

  const handleSaveTitle = async () => {
    if (!editedTitle.trim()) {
      Alert.alert('Invalid Title', 'Please enter a title for your dream.');
      return;
    }

    if (editedTitle === dream.title) {
      setIsEditingTitle(false);
      return;
    }

    setIsSavingTitle(true);
    try {
      const updatedDream = await updateDream(dream.id, { title: editedTitle.trim() });
      setDream(updatedDream);
      setIsEditingTitle(false);
      Toast.show({
        type: 'success',
        text1: 'Title Updated',
        text2: 'Your dream title has been changed.',
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error updating title:', error);
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: 'Unable to update the dream title.',
      });
    } finally {
      setIsSavingTitle(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      minHeight: SCREEN_HEIGHT,
    },
    headerGradient: {
      height: 150,
      width: '100%',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
    },
    tabBar: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
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
      paddingBottom: 120,
    },
    header: {
      marginBottom: 24,
    },
    metaContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 12,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      gap: 4,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    badgeText: {
      fontSize: 12,
      fontFamily: 'Inter-Medium',
      color: theme.colors.textSecondary,
    },
    date: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: theme.colors.textSecondary,
      marginBottom: 8,
    },
    title: {
      fontSize: 32,
      fontFamily: 'Playfair-Bold',
      color: theme.colors.text,
      marginBottom: 16,
      lineHeight: 38,
    },
    titleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    titleEditContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    titleInput: {
      flex: 1,
      fontSize: 32,
      fontFamily: 'Playfair-Bold',
      color: theme.colors.text,
      lineHeight: 38,
      borderBottomWidth: 2,
      borderBottomColor: theme.colors.primary,
      paddingBottom: 4,
      paddingTop: 0,
    },
    titleText: {
      flex: 1,
      fontSize: 32,
      fontFamily: 'Playfair-Bold',
      color: theme.colors.text,
      lineHeight: 38,
    },
    editButton: {
      padding: 8,
      marginLeft: 8,
    },
    editActions: {
      flexDirection: 'row',
      gap: 8,
      marginLeft: 8,
    },
    editActionButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: theme.colors.surface,
    },
    saveButton: {
      backgroundColor: theme.colors.primary,
    },
    section: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 20,
      fontFamily: 'Inter-SemiBold',
      color: theme.colors.text,
      marginBottom: 16,
    },
    contentCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    dreamText: {
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: theme.colors.text,
      lineHeight: 26,
    },
    storyContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.primary,
    },
    analysisContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.secondary,
    },
    generateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 12,
      gap: 8,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    generateButtonText: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: 'white',
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    emptyStateIcon: {
      marginBottom: 16,
      opacity: 0.5,
    },
    emptyStateText: {
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: 20,
      lineHeight: 24,
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
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    primaryAction: {
      backgroundColor: theme.colors.primary,
    },
    secondaryAction: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    dangerAction: {
      backgroundColor: theme.colors.error,
    },
    actionText: {
      fontSize: 14,
      fontFamily: 'Inter-SemiBold',
      color: 'white',
    },
    secondaryActionText: {
      fontSize: 14,
      fontFamily: 'Inter-SemiBold',
      color: theme.colors.text,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      padding: 20,
    },
    errorText: {
      fontSize: 18,
      fontFamily: 'Inter-Medium',
      color: theme.colors.text,
      marginBottom: 20,
      textAlign: 'center',
    },
    backButton: {
      padding: 10,
      marginTop: 20,
    },
    backButtonText: {
      color: theme.colors.primary,
      fontSize: 16,
      fontFamily: 'Inter-Medium',
    },
  });

  useEffect(() => {
    // Set header options
    navigation.setOptions({
      headerRight: () => dream ? (
        <View style={{ flexDirection: 'row', gap: 12, paddingRight: 16 }}>
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
      ) : null,
    });
  }, [dream, navigation]);

  const handleToggleFavorite = async () => {
    if (!dream) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await toggleFavorite(dream.id);
      setDream({ ...dream, isFavorite: !dream.isFavorite });
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleShare = async () => {
    if (!dream) return;
    
    const content = dream.story || dream.originalDream;
    const message = `✨ ${dream.title}\n\n${content}\n\nShared from DreamSprout 🌙`;
    
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
    if (!dream) return;
    
    setIsGenerating(true);
    try {
      const result = await api.generateStory(
        dream.originalDream,
        dream.tone || 'whimsical',
        dream.length || 'medium'
      );
      
      if (result.data) {
        const updatedDream = await updateDream(dream.id, { story: result.data.story });
        setDream(updatedDream);
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
    if (!dream) return;
    
    setIsGenerating(true);
    try {
      const result = await api.analyzeDream(dream.originalDream, dream.id);
      
      if (result.data) {
        const updatedDream = await updateDream(dream.id, { analysis: result.data.analysis });
        setDream(updatedDream);
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

  const handleDelete = () => {
    if (!dream) return;
    
    Alert.alert(
      'Delete Dream',
      'Are you sure you want to delete this dream? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteDream(dream.id);
            navigation.goBack();
            Toast.show({
              type: 'success',
              text1: 'Dream Deleted',
              text2: 'The dream has been removed.',
            });
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return 'No date';
    }
  };

  // Show loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 16, color: theme.colors.textSecondary }}>Loading dream...</Text>
      </View>
    );
  }

  // Handle no dream found
  if (!dream) {
    console.log('DreamDetailScreen - No dream to display');
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="moon-outline" size={64} color={theme.colors.textSecondary} />
        <Text style={styles.errorText}>Dream not found</Text>
        <Text style={{ color: theme.colors.textSecondary, marginBottom: 20 }}>
          The dream you're looking for might have been deleted or is still loading.
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Background Gradient */}
      <LinearGradient
        colors={[theme.colors.primary + '20', 'transparent']}
        style={styles.headerGradient}
      />

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
          <Text style={styles.date}>{formatDate(dream.date)}</Text>
          
          {/* Editable Title */}
          <View style={styles.titleContainer}>
            {isEditingTitle ? (
              <View style={styles.titleEditContainer}>
                <TextInput
                  style={styles.titleInput}
                  value={editedTitle}
                  onChangeText={setEditedTitle}
                  autoFocus
                  maxLength={100}
                  placeholder="Dream title"
                  placeholderTextColor={theme.colors.textSecondary}
                  editable={!isSavingTitle}
                />
                <View style={styles.editActions}>
                  {isSavingTitle ? (
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                  ) : (
                    <>
                      <TouchableOpacity 
                        style={[styles.editActionButton, styles.saveButton]}
                        onPress={handleSaveTitle}
                      >
                        <Ionicons name="checkmark" size={20} color="white" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.editActionButton}
                        onPress={handleCancelEditTitle}
                      >
                        <Ionicons name="close" size={20} color={theme.colors.text} />
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            ) : (
              <View style={styles.titleEditContainer}>
                <Text style={styles.titleText}>{dream.title}</Text>
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={handleStartEditTitle}
                >
                  <Ionicons name="pencil" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>
            )}
          </View>
          
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
            <View style={styles.contentCard}>
              <Text style={styles.dreamText}>{dream.originalDream}</Text>
            </View>
          </View>
        )}

        {activeTab === 'story' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fairy Tale</Text>
            {dream.story ? (
              <View style={styles.storyContainer}>
                <Text style={styles.dreamText}>{dream.story}</Text>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="sparkles-outline" size={48} color={theme.colors.textSecondary} style={styles.emptyStateIcon} />
                <Text style={styles.emptyStateText}>
                  Transform your dream into a magical fairy tale
                </Text>
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
              </View>
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
              <View style={styles.emptyState}>
                <Ionicons name="bulb-outline" size={48} color={theme.colors.textSecondary} style={styles.emptyStateIcon} />
                <Text style={styles.emptyStateText}>
                  Discover the hidden meanings in your dream
                </Text>
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
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Floating Actions */}
      <View style={styles.floatingActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryAction]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={18} color={theme.colors.text} />
          <Text style={styles.secondaryActionText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.dangerAction]}
          onPress={handleDelete}
        >
          <Ionicons name="trash" size={18} color="white" />
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}