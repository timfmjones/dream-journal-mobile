// src/screens/JournalScreen.tsx

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { format } from 'date-fns';
import LottieView from 'lottie-react-native';

import { useTheme } from '../contexts/ThemeContext';
import { useDreams } from '../hooks/useDreams';
import { RootStackParamList } from '../navigation/RootNavigator';
import DreamListItem from '../components/DreamListItem';
import FilterModal from '../components/FilterModal';
import SearchBar from '../components/SearchBar';

const { width: screenWidth } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface FilterOptions {
  showFavorites: boolean;
  sortBy: 'date' | 'title' | 'modified';
  sortOrder: 'asc' | 'desc';
  dateRange: 'all' | 'week' | 'month' | 'year';
}

export default function JournalScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { dreams, refreshDreams, loadMoreDreams, isLoading, hasMore } = useDreams();

  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    showFavorites: false,
    sortBy: 'date',
    sortOrder: 'desc',
    dateRange: 'all',
  });
  const [refreshing, setRefreshing] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;
  const searchBarHeight = 60;

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, searchBarHeight],
    outputRange: [0, -searchBarHeight],
    extrapolate: 'clamp',
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshDreams();
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      loadMoreDreams();
    }
  };

  const filteredDreams = dreams.filter(dream => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        dream.title.toLowerCase().includes(query) ||
        dream.originalDream.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Favorites filter
    if (filters.showFavorites && !dream.isFavorite) {
      return false;
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const dreamDate = new Date(dream.date);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - dreamDate.getTime()) / (1000 * 60 * 60 * 24));
      
      switch (filters.dateRange) {
        case 'week':
          if (daysDiff > 7) return false;
          break;
        case 'month':
          if (daysDiff > 30) return false;
          break;
        case 'year':
          if (daysDiff > 365) return false;
          break;
      }
    }

    return true;
  });

  // Sort dreams
  const sortedDreams = [...filteredDreams].sort((a, b) => {
    let comparison = 0;
    
    switch (filters.sortBy) {
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'modified':
        comparison = new Date(b.updatedAt || b.date).getTime() - new Date(a.updatedAt || a.date).getTime();
        break;
      case 'date':
      default:
        comparison = new Date(b.date).getTime() - new Date(a.date).getTime();
        break;
    }

    return filters.sortOrder === 'asc' ? -comparison : comparison;
  });

  const renderItem = useCallback(({ item }: { item: any }) => (
    <DreamListItem
      dream={item}
      onPress={() => navigation.navigate('DreamDetail', { dreamId: item.id })}
    />
  ), [navigation]);

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <LottieView
        source={require('../../assets/animations/empty-journal.json')}
        autoPlay
        loop
        style={{ width: 200, height: 200 }}
      />
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        {searchQuery ? 'No dreams found' : 'Your dream journal is empty'}
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
        {searchQuery 
          ? 'Try adjusting your search or filters'
          : 'Start recording your dreams to see them here'}
      </Text>
      {!searchQuery && (
        <TouchableOpacity
          style={[styles.emptyButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => navigation.navigate('CreateDream', {})}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.emptyButtonText}>Record First Dream</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    searchContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1,
      backgroundColor: theme.colors.background,
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    searchInput: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: theme.colors.text,
    },
    filterButton: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    filterButtonActive: {
      backgroundColor: theme.colors.primary,
    },
    list: {
      flex: 1,
      paddingTop: searchBarHeight + 16,
    },
    listContent: {
      paddingHorizontal: 16,
      paddingBottom: insets.bottom + 20,
    },
    statsBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.colors.surface,
      marginBottom: 8,
    },
    statsText: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: theme.colors.textSecondary,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
      paddingTop: 100,
    },
    emptyTitle: {
      fontSize: 20,
      fontFamily: 'Inter-SemiBold',
      marginTop: 16,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      marginTop: 8,
      textAlign: 'center',
      lineHeight: 24,
    },
    emptyButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 12,
      marginTop: 24,
    },
    emptyButtonText: {
      fontSize: 16,
      fontFamily: 'Inter-Medium',
      color: 'white',
    },
    footerLoader: {
      paddingVertical: 20,
      alignItems: 'center',
    },
  });

  const hasActiveFilters = filters.showFavorites || filters.dateRange !== 'all' || filters.sortBy !== 'date';

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.searchContainer,
          {
            transform: [{ translateY: headerTranslateY }],
          },
        ]}
      >
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search dreams..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity
            style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
            onPress={() => setShowFilters(true)}
          >
            <Ionicons
              name="filter"
              size={20}
              color={hasActiveFilters ? 'white' : theme.colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.FlatList
        data={sortedDreams}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={[
          styles.listContent,
          sortedDreams.length === 0 && { flex: 1 },
        ]}
        style={styles.list}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            progressViewOffset={searchBarHeight}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isLoading && sortedDreams.length > 0 ? (
            <View style={styles.footerLoader}>
              <Text style={[styles.statsText, { color: theme.colors.primary }]}>
                Loading more dreams...
              </Text>
            </View>
          ) : null
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          sortedDreams.length > 0 ? (
            <View style={styles.statsBar}>
              <Text style={styles.statsText}>
                {sortedDreams.length} {sortedDreams.length === 1 ? 'dream' : 'dreams'}
              </Text>
              <Text style={styles.statsText}>
                {filters.sortBy === 'date' ? 'Newest first' :
                 filters.sortBy === 'title' ? 'Alphabetical' : 'Recently modified'}
              </Text>
            </View>
          ) : null
        }
      />

      <FilterModal
        visible={showFilters}
        filters={filters}
        onClose={() => setShowFilters(false)}
        onApply={(newFilters) => {
          setFilters(newFilters);
          setShowFilters(false);
        }}
      />
    </View>
  );
}