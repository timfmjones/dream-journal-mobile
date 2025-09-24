// src/components/FilterModal.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface FilterOptions {
  showFavorites: boolean;
  sortBy: 'date' | 'title' | 'modified';
  sortOrder: 'asc' | 'desc';
  dateRange: 'all' | 'week' | 'month' | 'year';
}

interface FilterModalProps {
  visible: boolean;
  filters: FilterOptions;
  onClose: () => void;
  onApply: (filters: FilterOptions) => void;
}

export default function FilterModal({ visible, filters, onClose, onApply }: FilterModalProps) {
  const { theme } = useTheme();
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters);

  const handleApply = () => {
    onApply(localFilters);
  };

  const handleReset = () => {
    const resetFilters: FilterOptions = {
      showFavorites: false,
      sortBy: 'date',
      sortOrder: 'desc',
      dateRange: 'all',
    };
    setLocalFilters(resetFilters);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    content: {
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 20,
      paddingBottom: 40,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
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
    section: {
      paddingHorizontal: 20,
      marginBottom: 24,
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
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
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
      paddingVertical: 12,
    },
    toggleLabel: {
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: theme.colors.text,
    },
    footer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      gap: 12,
      marginTop: 20,
    },
    button: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
    },
    resetButton: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    applyButton: {
      backgroundColor: theme.colors.primary,
    },
    buttonText: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.container} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <View style={styles.content} onStartShouldSetResponder={() => true}>
          <View style={styles.header}>
            <Text style={styles.title}>Filter Dreams</Text>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={onClose}
            >
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sort By</Text>
            <View style={styles.optionRow}>
              {(['date', 'title', 'modified'] as const).map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.optionButton,
                    localFilters.sortBy === option && styles.optionButtonActive,
                  ]}
                  onPress={() => setLocalFilters({ ...localFilters, sortBy: option })}
                >
                  <Text
                    style={[
                      styles.optionText,
                      localFilters.sortBy === option && styles.optionTextActive,
                    ]}
                  >
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Date Range</Text>
            <View style={styles.optionRow}>
              {(['all', 'week', 'month', 'year'] as const).map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.optionButton,
                    localFilters.dateRange === option && styles.optionButtonActive,
                  ]}
                  onPress={() => setLocalFilters({ ...localFilters, dateRange: option })}
                >
                  <Text
                    style={[
                      styles.optionText,
                      localFilters.dateRange === option && styles.optionTextActive,
                    ]}
                  >
                    {option === 'all' ? 'All Time' : 
                     `Last ${option.charAt(0).toUpperCase() + option.slice(1)}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Favorites Only</Text>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  localFilters.showFavorites && styles.optionButtonActive,
                ]}
                onPress={() => setLocalFilters({ ...localFilters, showFavorites: !localFilters.showFavorites })}
              >
                <Ionicons 
                  name={localFilters.showFavorites ? "star" : "star-outline"} 
                  size={16} 
                  color={localFilters.showFavorites ? 'white' : theme.colors.text}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity 
              style={[styles.button, styles.resetButton]} 
              onPress={handleReset}
            >
              <Text style={[styles.buttonText, { color: theme.colors.text }]}>
                Reset
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.applyButton]} 
              onPress={handleApply}
            >
              <Text style={[styles.buttonText, { color: 'white' }]}>
                Apply
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}