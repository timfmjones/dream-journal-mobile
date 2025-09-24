// src/components/GenerationOptionsModal.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface GenerationOptions {
  mode: 'story' | 'analysis' | 'save';
  tone?: 'whimsical' | 'mystical' | 'adventurous' | 'gentle' | 'mysterious' | 'comedy';
  length?: 'short' | 'medium' | 'long';
  generateImages?: boolean;
}

interface GenerationOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  onGenerate: (options: GenerationOptions) => void;
}

const toneOptions = [
  { value: 'whimsical', label: 'Whimsical', icon: 'sparkles' },
  { value: 'mystical', label: 'Mystical', icon: 'moon' },
  { value: 'adventurous', label: 'Adventurous', icon: 'compass' },
  { value: 'gentle', label: 'Gentle', icon: 'heart' },
  { value: 'mysterious', label: 'Mysterious', icon: 'eye' },
  { value: 'comedy', label: 'Comedy', icon: 'happy' },
];

const lengthOptions = [
  { value: 'short', label: 'Short', description: '150-250 words' },
  { value: 'medium', label: 'Medium', description: '300-500 words' },
  { value: 'long', label: 'Long', description: '600-800 words' },
];

export default function GenerationOptionsModal({ visible, onClose, onGenerate }: GenerationOptionsModalProps) {
  const { theme } = useTheme();
  const [mode, setMode] = useState<'story' | 'analysis' | 'save'>('story');
  const [tone, setTone] = useState<typeof toneOptions[0]['value']>('whimsical');
  const [length, setLength] = useState<typeof lengthOptions[0]['value']>('medium');
  const [generateImages, setGenerateImages] = useState(true);

  const handleGenerate = () => {
    onGenerate({
      mode,
      tone: mode === 'story' ? tone : undefined,
      length: mode === 'story' ? length : undefined,
      generateImages: mode === 'story' ? generateImages : undefined,
    });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      padding: 20,
    },
    content: {
      backgroundColor: theme.colors.background,
      borderRadius: 24,
      padding: 20,
      maxHeight: '80%',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    title: {
      fontSize: 20,
      fontFamily: 'Inter-SemiBold',
      color: theme.colors.text,
    },
    closeButton: {
      padding: 4,
    },
    modeSelector: {
      marginBottom: 24,
    },
    modeCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
      backgroundColor: theme.colors.surface,
      borderWidth: 2,
      borderColor: theme.colors.border,
      marginBottom: 12,
    },
    modeCardActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '10',
    },
    modeIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    modeContent: {
      flex: 1,
    },
    modeTitle: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: theme.colors.text,
    },
    modeDescription: {
      fontSize: 13,
      fontFamily: 'Inter-Regular',
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    section: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 14,
      fontFamily: 'Inter-SemiBold',
      color: theme.colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 12,
    },
    optionRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    optionButton: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    optionButtonActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    optionText: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: theme.colors.text,
    },
    optionTextActive: {
      color: 'white',
    },
    toggleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 12,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
    },
    toggleLabel: {
      fontSize: 15,
      fontFamily: 'Inter-Regular',
      color: theme.colors.text,
    },
    generateButton: {
      backgroundColor: theme.colors.primary,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 20,
    },
    generateButtonText: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: 'white',
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Generation Options</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.modeSelector}>
              <TouchableOpacity 
                style={[styles.modeCard, mode === 'story' && styles.modeCardActive]}
                onPress={() => setMode('story')}
              >
                <View style={styles.modeIcon}>
                  <Ionicons name="sparkles" size={20} color={theme.colors.primary} />
                </View>
                <View style={styles.modeContent}>
                  <Text style={styles.modeTitle}>Fairy Tale</Text>
                  <Text style={styles.modeDescription}>Transform into a magical story</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.modeCard, mode === 'analysis' && styles.modeCardActive]}
                onPress={() => setMode('analysis')}
              >
                <View style={styles.modeIcon}>
                  <Ionicons name="bulb" size={20} color={theme.colors.primary} />
                </View>
                <View style={styles.modeContent}>
                  <Text style={styles.modeTitle}>Analysis</Text>
                  <Text style={styles.modeDescription}>Get insights and interpretations</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.modeCard, mode === 'save' && styles.modeCardActive]}
                onPress={() => setMode('save')}
              >
                <View style={styles.modeIcon}>
                  <Ionicons name="save" size={20} color={theme.colors.primary} />
                </View>
                <View style={styles.modeContent}>
                  <Text style={styles.modeTitle}>Just Save</Text>
                  <Text style={styles.modeDescription}>Save dream without processing</Text>
                </View>
              </TouchableOpacity>
            </View>

            {mode === 'story' && (
              <>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Story Tone</Text>
                  <View style={styles.optionRow}>
                    {toneOptions.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.optionButton,
                          tone === option.value && styles.optionButtonActive,
                        ]}
                        onPress={() => setTone(option.value as any)}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            tone === option.value && styles.optionTextActive,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Story Length</Text>
                  <View style={styles.optionRow}>
                    {lengthOptions.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.optionButton,
                          length === option.value && styles.optionButtonActive,
                        ]}
                        onPress={() => setLength(option.value as any)}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            length === option.value && styles.optionTextActive,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.section}>
                  <TouchableOpacity 
                    style={styles.toggleRow}
                    onPress={() => setGenerateImages(!generateImages)}
                  >
                    <Text style={styles.toggleLabel}>Generate Illustrations</Text>
                    <Ionicons 
                      name={generateImages ? "checkbox" : "square-outline"} 
                      size={24} 
                      color={generateImages ? theme.colors.primary : theme.colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>

          <TouchableOpacity style={styles.generateButton} onPress={handleGenerate}>
            <Text style={styles.generateButtonText}>
              {mode === 'story' ? 'Generate Fairy Tale' :
               mode === 'analysis' ? 'Analyze Dream' : 'Save Dream'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}