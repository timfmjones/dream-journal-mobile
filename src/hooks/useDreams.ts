// src/hooks/useDreams.ts

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { api, Dream } from '../services/api';
import Toast from 'react-native-toast-message';

const DREAMS_STORAGE_KEY = 'dreamsprout_local_dreams';

export function useDreams() {
  const { user, isGuest } = useAuth();
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [recentDreams, setRecentDreams] = useState<Dream[]>([]);
  const [favoriteDreams, setFavoriteDreams] = useState<Dream[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadDreams();
  }, [user, isGuest]);

  const loadDreams = async (reset = true) => {
    setIsLoading(true);
    try {
      if (isGuest) {
        // Load from local storage
        const localData = await AsyncStorage.getItem(DREAMS_STORAGE_KEY);
        const localDreams = localData ? JSON.parse(localData) : [];
        setDreams(localDreams);
        setRecentDreams(localDreams.slice(0, 5));
        setFavoriteDreams(localDreams.filter((d: Dream) => d.isFavorite));
        setHasMore(false);
      } else if (user) {
        // Load from API
        const response = await api.getDreams({ page: reset ? 1 : page, limit: 20 });
        if (response.data) {
          if (reset) {
            setDreams(response.data.dreams);
            setPage(1);
          } else {
            setDreams(prev => [...prev, ...response.data!.dreams]);
          }
          setRecentDreams(response.data.dreams.slice(0, 5));
          setFavoriteDreams(response.data.dreams.filter(d => d.isFavorite));
          setHasMore(response.data.hasMore);
        }
      }
    } catch (error) {
      console.error('Error loading dreams:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load dreams',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshDreams = useCallback(async () => {
    await loadDreams(true);
  }, [user, isGuest]);

  const loadMoreDreams = useCallback(async () => {
    if (!hasMore || isLoading || isGuest) return;
    setPage(prev => prev + 1);
    await loadDreams(false);
  }, [hasMore, isLoading, isGuest, page]);

  const createDream = async (dreamData: Partial<Dream>): Promise<Dream> => {
    try {
      if (isGuest) {
        // Save locally
        const newDream: Dream = {
          ...dreamData as Dream,
          id: `local_${Date.now()}`,
          date: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        const localData = await AsyncStorage.getItem(DREAMS_STORAGE_KEY);
        const localDreams = localData ? JSON.parse(localData) : [];
        const updatedDreams = [newDream, ...localDreams];
        
        await AsyncStorage.setItem(DREAMS_STORAGE_KEY, JSON.stringify(updatedDreams));
        setDreams(updatedDreams);
        
        Toast.show({
          type: 'success',
          text1: 'Dream Saved',
          text2: 'Your dream has been saved locally',
        });
        
        return newDream;
      } else {
        // Save to API
        const response = await api.createDream(dreamData);
        if (response.data) {
          setDreams(prev => [response.data!.dream, ...prev]);
          
          Toast.show({
            type: 'success',
            text1: 'Dream Saved',
            text2: 'Your dream has been saved to the cloud',
          });
          
          return response.data.dream;
        }
        throw new Error(response.error || 'Failed to save dream');
      }
    } catch (error) {
      console.error('Error creating dream:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to save dream',
      });
      throw error;
    }
  };

  const updateDream = async (dreamId: string, updates: Partial<Dream>): Promise<Dream> => {
    try {
      if (isGuest) {
        // Update locally
        const localData = await AsyncStorage.getItem(DREAMS_STORAGE_KEY);
        const localDreams = localData ? JSON.parse(localData) : [];
        const index = localDreams.findIndex((d: Dream) => d.id === dreamId);
        
        if (index !== -1) {
          localDreams[index] = {
            ...localDreams[index],
            ...updates,
            updatedAt: new Date().toISOString(),
          };
          
          await AsyncStorage.setItem(DREAMS_STORAGE_KEY, JSON.stringify(localDreams));
          setDreams(localDreams);
          
          return localDreams[index];
        }
        throw new Error('Dream not found');
      } else {
        // Update via API
        const response = await api.updateDream(dreamId, updates);
        if (response.data) {
          setDreams(prev => prev.map(d => d.id === dreamId ? response.data!.dream : d));
          return response.data.dream;
        }
        throw new Error(response.error || 'Failed to update dream');
      }
    } catch (error) {
      console.error('Error updating dream:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update dream',
      });
      throw error;
    }
  };

  const deleteDream = async (dreamId: string) => {
    try {
      if (isGuest) {
        // Delete locally
        const localData = await AsyncStorage.getItem(DREAMS_STORAGE_KEY);
        const localDreams = localData ? JSON.parse(localData) : [];
        const filteredDreams = localDreams.filter((d: Dream) => d.id !== dreamId);
        
        await AsyncStorage.setItem(DREAMS_STORAGE_KEY, JSON.stringify(filteredDreams));
        setDreams(filteredDreams);
      } else {
        // Delete via API
        const response = await api.deleteDream(dreamId);
        if (response.data?.success) {
          setDreams(prev => prev.filter(d => d.id !== dreamId));
        } else {
          throw new Error(response.error || 'Failed to delete dream');
        }
      }
      
      Toast.show({
        type: 'success',
        text1: 'Dream Deleted',
        text2: 'The dream has been removed',
      });
    } catch (error) {
      console.error('Error deleting dream:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to delete dream',
      });
      throw error;
    }
  };

  const toggleFavorite = async (dreamId: string) => {
    try {
      if (isGuest) {
        // Toggle locally
        const localData = await AsyncStorage.getItem(DREAMS_STORAGE_KEY);
        const localDreams = localData ? JSON.parse(localData) : [];
        const index = localDreams.findIndex((d: Dream) => d.id === dreamId);
        
        if (index !== -1) {
          localDreams[index].isFavorite = !localDreams[index].isFavorite;
          await AsyncStorage.setItem(DREAMS_STORAGE_KEY, JSON.stringify(localDreams));
          setDreams(localDreams);
          setFavoriteDreams(localDreams.filter((d: Dream) => d.isFavorite));
        }
      } else {
        // Toggle via API
        const response = await api.toggleFavorite(dreamId);
        if (response.data) {
          setDreams(prev => prev.map(d => 
            d.id === dreamId ? { ...d, isFavorite: !d.isFavorite } : d
          ));
          setFavoriteDreams(prev => {
            const dream = dreams.find(d => d.id === dreamId);
            if (dream?.isFavorite) {
              return prev.filter(d => d.id !== dreamId);
            } else if (dream) {
              return [...prev, { ...dream, isFavorite: true }];
            }
            return prev;
          });
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update favorite status',
      });
    }
  };

  const getDreamById = (dreamId: string): Dream | undefined => {
    return dreams.find(d => d.id === dreamId);
  };

  return {
    dreams,
    recentDreams,
    favoriteDreams,
    isLoading,
    hasMore,
    refreshDreams,
    loadMoreDreams,
    createDream,
    updateDream,
    deleteDream,
    toggleFavorite,
    getDreamById,
  };
}