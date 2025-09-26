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
    console.log('Loading dreams...');
    setIsLoading(true);
    try {
      if (isGuest) {
        // Load from local storage
        const localData = await AsyncStorage.getItem(DREAMS_STORAGE_KEY);
        const localDreams = localData ? JSON.parse(localData) : [];
        console.log('Loaded local dreams:', localDreams.length);
        setDreams(localDreams);
        setRecentDreams(localDreams.slice(0, 5));
        setFavoriteDreams(localDreams.filter((d: Dream) => d.isFavorite));
        setHasMore(false);
      } else if (user) {
        // Load from API
        try {
          const response = await api.getDreams({ page: reset ? 1 : page, limit: 20 });
          console.log('API Response:', response);
          
          if (response.data && response.data.dreams) {
            if (reset) {
              setDreams(response.data.dreams);
              setPage(1);
            } else {
              setDreams(prev => [...prev, ...response.data!.dreams]);
            }
            setRecentDreams(response.data.dreams.slice(0, 5));
            setFavoriteDreams(response.data.dreams.filter(d => d.isFavorite));
            setHasMore(response.data.hasMore);
          } else {
            // No dreams from API
            console.log('No dreams from API');
            setDreams([]);
            setRecentDreams([]);
            setFavoriteDreams([]);
          }
        } catch (error) {
          console.error('API error:', error);
          // On API error, try to load from local storage as fallback
          const localData = await AsyncStorage.getItem(DREAMS_STORAGE_KEY);
          const localDreams = localData ? JSON.parse(localData) : [];
          setDreams(localDreams);
          setRecentDreams(localDreams.slice(0, 5));
          setFavoriteDreams(localDreams.filter((d: Dream) => d.isFavorite));
        }
      } else {
        // No user
        setDreams([]);
        setRecentDreams([]);
        setFavoriteDreams([]);
      }
    } catch (error) {
      console.error('Error loading dreams:', error);
      setDreams([]);
      setRecentDreams([]);
      setFavoriteDreams([]);
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
    console.log('Creating dream with data:', dreamData);
    
    try {
      // Create the new dream object with a guaranteed unique ID
      const newDream: Dream = {
        ...dreamData as Dream,
        id: dreamData.id || `dream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        date: dreamData.date || new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isFavorite: false,
        tone: dreamData.tone || 'whimsical',
        length: dreamData.length || 'medium',
        inputMode: dreamData.inputMode || 'text',
      };
      
      console.log('Created new dream object:', newDream);
      
      // Immediately add to state BEFORE any API calls
      setDreams(prevDreams => {
        const updated = [newDream, ...prevDreams];
        console.log('Updated dreams array, total dreams:', updated.length);
        return updated;
      });
      
      // Update other state
      setRecentDreams(prev => [newDream, ...prev.slice(0, 4)]);
      if (newDream.isFavorite) {
        setFavoriteDreams(prev => [newDream, ...prev]);
      }
      
      // Try to save to storage/API in the background
      if (isGuest) {
        // Save to local storage
        try {
          const localData = await AsyncStorage.getItem(DREAMS_STORAGE_KEY);
          const localDreams = localData ? JSON.parse(localData) : [];
          const updatedDreams = [newDream, ...localDreams];
          await AsyncStorage.setItem(DREAMS_STORAGE_KEY, JSON.stringify(updatedDreams));
          console.log('Saved to local storage');
        } catch (error) {
          console.error('Failed to save to local storage:', error);
        }
      } else if (user) {
        // Try to save to API in background
        try {
          const response = await api.createDream(newDream);
          if (response.data) {
            // Update the dream with the server's version if needed
            const serverDream = response.data.dream;
            setDreams(prevDreams => 
              prevDreams.map(d => d.id === newDream.id ? serverDream : d)
            );
            console.log('Saved to API, updated with server version');
          }
        } catch (error) {
          console.error('API save failed, keeping local version:', error);
        }
      }
      
      Toast.show({
        type: 'success',
        text1: 'Dream Saved',
        text2: 'Your dream has been saved successfully',
      });
      
      return newDream;
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
      const updatedDreams = dreams.map(d => 
        d.id === dreamId 
          ? { ...d, ...updates, updatedAt: new Date().toISOString() }
          : d
      );
      
      setDreams(updatedDreams);
      
      if (isGuest) {
        await AsyncStorage.setItem(DREAMS_STORAGE_KEY, JSON.stringify(updatedDreams));
      } else if (user) {
        // Try to update via API
        try {
          await api.updateDream(dreamId, updates);
        } catch (error) {
          console.error('API update error:', error);
        }
      }
      
      const updatedDream = updatedDreams.find(d => d.id === dreamId)!;
      return updatedDream;
    } catch (error) {
      console.error('Error updating dream:', error);
      throw error;
    }
  };

  const deleteDream = async (dreamId: string) => {
    try {
      const filteredDreams = dreams.filter(d => d.id !== dreamId);
      setDreams(filteredDreams);
      setRecentDreams(prev => prev.filter(d => d.id !== dreamId));
      setFavoriteDreams(prev => prev.filter(d => d.id !== dreamId));
      
      if (isGuest) {
        await AsyncStorage.setItem(DREAMS_STORAGE_KEY, JSON.stringify(filteredDreams));
      } else if (user) {
        // Try to delete from API
        try {
          await api.deleteDream(dreamId);
        } catch (error) {
          console.error('API delete error:', error);
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
      const updatedDreams = dreams.map(d => 
        d.id === dreamId ? { ...d, isFavorite: !d.isFavorite } : d
      );
      
      setDreams(updatedDreams);
      setFavoriteDreams(updatedDreams.filter(d => d.isFavorite));
      
      if (isGuest) {
        await AsyncStorage.setItem(DREAMS_STORAGE_KEY, JSON.stringify(updatedDreams));
      } else if (user) {
        // Try to update on API
        try {
          await api.toggleFavorite(dreamId);
        } catch (error) {
          console.error('API favorite error:', error);
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
    console.log('getDreamById called with:', dreamId);
    const dream = dreams.find(d => d.id === dreamId);
    console.log('Found dream:', dream ? 'YES' : 'NO');
    return dream;
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