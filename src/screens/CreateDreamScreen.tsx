// src/screens/CreateDreamScreen.tsx

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';

import { useTheme } from '../contexts/ThemeContext';
import { api } from '../services/api';
import { useDreams } from '../hooks/useDreams';
import { RootStackParamList } from '../navigation/RootNavigator';
import GenerationOptionsModal from '../components/GenerationOptionsModal';
import VoiceRecordingModal from '../components/VoiceRecordingModal';
import LoadingModal from '../components/LoadingModal';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RoutePropType = RouteProp<RootStackParamList, 'CreateDream'>;

interface GenerationOptions {
  mode: 'story' | 'analysis' | 'save';
  tone?: 'whimsical' | 'mystical' | 'adventurous' | 'gentle' | 'mysterious' | 'comedy';
  length?: 'short' | 'medium' | 'long';
  generateImages?: boolean;
}

export default function CreateDreamScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const { createDream } = useDreams();

  const [inputMode, setInputMode] = useState<'text' | 'voice'>(route.params?.mode || 'text');
  const [dreamText, setDreamText] = useState('');
  const [title, setTitle] = useState('');
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showGenerationOptions, setShowGenerationOptions] = useState(false);
  const [showRecordingModal, setShowRecordingModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState('');

  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const recordingAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnimation.setValue(1);
    }
  }, [isRecording]);

  useEffect(() => {
    setupAudio();
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, []);

  const setupAudio = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    } catch (error) {
      console.error('Failed to setup audio:', error);
    }
  };

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please allow microphone access to record dreams.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Use WAV format which has the best compatibility with OpenAI Whisper
      const recordingOptions = {
        android: {
          extension: '.wav',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_DEFAULT,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_DEFAULT,
          sampleRate: 16000, // Whisper's preferred sample rate
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
          sampleRate: 16000, // Whisper's preferred sample rate
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
      };

      console.log('Starting recording with options:', recordingOptions);
      const { recording } = await Audio.Recording.createAsync(recordingOptions);

      setRecording(recording);
      setIsRecording(true);
      setShowRecordingModal(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      console.log('Recording stopped');
      console.log('Audio URI:', uri);
      console.log('URI parts:', uri?.split('.'));
      
      if (!uri) {
        throw new Error('No audio URI obtained from recording');
      }
      
      setAudioUri(uri);
      setRecording(null);
      setShowRecordingModal(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Transcribe the audio
      await transcribeAudio(uri);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to stop recording. Please try again.');
      setShowRecordingModal(false);
      setRecording(null);
    }
  };

  const transcribeAudio = async (uri: string) => {
    setIsTranscribing(true);
    setGenerationProgress('Transcribing your dream...');

    try {
      console.log('Starting transcription with URI:', uri);
      
      // Pass the URI directly - React Native handles this differently than web
      const result = await api.transcribeAudio(uri);
      
      if (result.data?.text) {
        setDreamText(result.data.text);
        Toast.show({
          type: 'success',
          text1: 'Transcription Complete',
          text2: 'Your dream has been transcribed successfully.',
        });
      } else {
        throw new Error(result.error || 'No transcription text received');
      }
    } catch (error: any) {
      console.error('Transcription error:', error);
      
      // Provide helpful alternatives when transcription fails
      Alert.alert(
        'Transcription Service Issue',
        'The audio transcription service is having difficulties. This might be due to:\n\n• Audio format compatibility\n• Server configuration\n• API limitations\n\nYou can:',
        [
          {
            text: 'Type Dream Instead',
            onPress: () => {
              setInputMode('text');
              setAudioUri(null);
              Toast.show({
                type: 'info',
                text1: 'Switched to Text Mode',
                text2: 'Type your dream to continue.',
              });
            }
          },
          {
            text: 'Use Sample Dream',
            onPress: () => {
              setDreamText('Last night I had the most vivid dream. I was walking through a mystical forest where the trees had glowing leaves that changed colors with each breath of wind. The path beneath my feet was made of soft moss that sparkled like stardust. As I walked deeper into the forest, I discovered a hidden clearing with a crystalline lake. The water was so clear I could see another world reflected beneath - a mirror universe where everything moved in reverse. Suddenly, I realized I could fly, and I soared above the treetops, feeling completely free and weightless. The dream felt so real that when I woke up, I could still feel the sensation of flying.');
              Toast.show({
                type: 'success',
                text1: 'Sample Dream Added',
                text2: 'You can edit or use this as is.',
              });
            }
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              setAudioUri(null);
            }
          }
        ]
      );
    } finally {
      setIsTranscribing(false);
      setGenerationProgress('');
    }
  };

  const handleGenerate = async (options: GenerationOptions) => {
    if (!dreamText.trim()) {
      Alert.alert('No Dream Text', 'Please record or write your dream first.');
      return;
    }

    setShowGenerationOptions(false);
    setIsGenerating(true);

    try {
      // Generate title if not provided
      if (!title) {
        setGenerationProgress('Creating title...');
        const titleResult = await api.generateTitle(dreamText);
        if (titleResult.data?.title) {
          setTitle(titleResult.data.title);
        } else {
          // Fallback title if API fails
          setTitle(`Dream on ${new Date().toLocaleDateString()}`);
        }
      }

      let story, analysis, images;

      if (options.mode === 'story') {
        setGenerationProgress('Generating your fairy tale...');
        const storyResult = await api.generateStory(
          dreamText,
          options.tone || 'whimsical',
          options.length || 'medium'
        );
        
        if (storyResult.data?.story) {
          story = storyResult.data.story;
          
          if (options.generateImages) {
            setGenerationProgress('Creating magical illustrations...');
            const imagesResult = await api.generateImages(story, options.tone || 'whimsical');
            if (imagesResult.data?.images) {
              images = imagesResult.data.images;
            }
          }
        } else {
          throw new Error('Failed to generate story');
        }
      } else if (options.mode === 'analysis') {
        setGenerationProgress('Analyzing your dream...');
        const analysisResult = await api.analyzeDream(dreamText);
        if (analysisResult.data?.analysis) {
          analysis = analysisResult.data.analysis;
        } else {
          throw new Error('Failed to analyze dream');
        }
      }

      // Save the dream
      setGenerationProgress('Saving your dream...');
      
      // Create the dream object
      const dreamData = {
        title: title || 'Untitled Dream',
        originalDream: dreamText,
        story,
        analysis,
        images,
        tone: options.tone,
        length: options.length,
        inputMode,
        audioUri,
        date: new Date().toISOString(),
      };

      console.log('Creating dream with data:', dreamData);
      
      const dream = await createDream(dreamData);
      
      console.log('Created dream:', dream);
      console.log('Dream ID:', dream.id);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Navigate back to main screen first
      navigation.navigate('Main' as any);
      
      // Then navigate to the detail after a short delay
      setTimeout(() => {
        navigation.navigate('DreamDetail', { dreamId: dream.id });
      }, 100);
      
      Toast.show({
        type: 'success',
        text1: 'Dream Saved!',
        text2: options.mode === 'story' ? 'Your fairy tale is ready!' : 
                options.mode === 'analysis' ? 'Your analysis is complete!' : 
                'Your dream has been saved.',
      });
    } catch (error) {
      console.error('Generation error:', error);
      Alert.alert('Error', 'Failed to process your dream. Please try again.');
    } finally {
      setIsGenerating(false);
      setGenerationProgress('');
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    keyboardAvoid: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: 20,
      paddingBottom: 100,
    },
    modeSelector: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 4,
      marginBottom: 20,
    },
    modeButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    modeButtonActive: {
      backgroundColor: theme.colors.primary,
    },
    modeButtonText: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: theme.colors.textSecondary,
    },
    modeButtonTextActive: {
      color: 'white',
    },
    titleInput: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      fontFamily: 'Inter-Medium',
      color: theme.colors.text,
      marginBottom: 16,
    },
    textInput: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: theme.colors.text,
      minHeight: 200,
      textAlignVertical: 'top',
    },
    voiceContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 300,
    },
    recordButton: {
      width: 120,
      height: 120,
      borderRadius: 60,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    recordButtonInner: {
      width: 100,
      height: 100,
      borderRadius: 50,
      justifyContent: 'center',
      alignItems: 'center',
    },
    transcribedText: {
      marginTop: 20,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
    },
    transcribedTextLabel: {
      fontSize: 12,
      fontFamily: 'Inter-Medium',
      color: theme.colors.textSecondary,
      marginBottom: 8,
    },
    transcribedTextContent: {
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: theme.colors.text,
      lineHeight: 24,
    },
    recordingHint: {
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: theme.colors.textSecondary,
      marginTop: 20,
      textAlign: 'center',
    },
    bottomActions: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: 20,
      paddingBottom: insets.bottom + 20,
      backgroundColor: theme.colors.background,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    generateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      padding: 16,
      gap: 8,
    },
    generateButtonText: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: 'white',
    },
    characterCount: {
      position: 'absolute',
      right: 16,
      bottom: 16,
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: theme.colors.textSecondary,
    },
  });

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Mode Selector */}
          <View style={styles.modeSelector}>
            <TouchableOpacity
              style={[styles.modeButton, inputMode === 'text' && styles.modeButtonActive]}
              onPress={() => setInputMode('text')}
              activeOpacity={0.7}
            >
              <Text style={[styles.modeButtonText, inputMode === 'text' && styles.modeButtonTextActive]}>
                Write Dream
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeButton, inputMode === 'voice' && styles.modeButtonActive]}
              onPress={() => setInputMode('voice')}
              activeOpacity={0.7}
            >
              <Text style={[styles.modeButtonText, inputMode === 'voice' && styles.modeButtonTextActive]}>
                Voice Memo
              </Text>
            </TouchableOpacity>
          </View>

          {/* Title Input */}
          <TextInput
            style={styles.titleInput}
            placeholder="Dream title (optional)"
            placeholderTextColor={theme.colors.textSecondary}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />

          {/* Content Input */}
          {inputMode === 'text' ? (
            <View>
              <TextInput
                style={styles.textInput}
                placeholder="Describe your dream in detail..."
                placeholderTextColor={theme.colors.textSecondary}
                value={dreamText}
                onChangeText={setDreamText}
                multiline
                maxLength={5000}
              />
              <Text style={styles.characterCount}>
                {dreamText.length}/5000
              </Text>
            </View>
          ) : (
            <View style={styles.voiceContainer}>
              {!audioUri && !dreamText ? (
                <>
                  <TouchableOpacity
                    onPress={isRecording ? stopRecording : startRecording}
                    activeOpacity={0.8}
                  >
                    <Animated.View
                      style={[
                        styles.recordButton,
                        {
                          transform: [{ scale: pulseAnimation }],
                        },
                      ]}
                    >
                      <LinearGradient
                        colors={isRecording ? ['#ef4444', '#dc2626'] : [theme.colors.primary, theme.colors.secondary]}
                        style={styles.recordButtonInner}
                      >
                        <Ionicons
                          name={isRecording ? 'stop' : 'mic'}
                          size={40}
                          color="white"
                        />
                      </LinearGradient>
                    </Animated.View>
                  </TouchableOpacity>
                  <Text style={styles.recordingHint}>
                    {isRecording ? 'Tap to stop recording' : 'Tap to start recording your dream'}
                  </Text>
                </>
              ) : (
                <View style={styles.transcribedText}>
                  <Text style={styles.transcribedTextLabel}>Transcribed Dream:</Text>
                  <Text style={styles.transcribedTextContent}>{dreamText}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setAudioUri(null);
                      setDreamText('');
                    }}
                    style={{ marginTop: 12 }}
                  >
                    <Text style={{ color: theme.colors.primary, fontFamily: 'Inter-Medium' }}>
                      Re-record
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={styles.generateButton}
            onPress={() => setShowGenerationOptions(true)}
            disabled={!dreamText.trim()}
            activeOpacity={0.8}
          >
            <Ionicons name="sparkles" size={20} color="white" />
            <Text style={styles.generateButtonText}>Generate</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Modals */}
      <VoiceRecordingModal
        visible={showRecordingModal}
        isRecording={isRecording}
        onStop={stopRecording}
        onClose={() => setShowRecordingModal(false)}
      />

      <GenerationOptionsModal
        visible={showGenerationOptions}
        onClose={() => setShowGenerationOptions(false)}
        onGenerate={handleGenerate}
      />

      <LoadingModal
        visible={isGenerating || isTranscribing}
        message={generationProgress}
      />
    </View>
  );
}