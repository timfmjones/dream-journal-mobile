// src/hooks/useDreams.ts

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { api, Dream } from '../services/api';
import Toast from 'react-native-toast-message';

const DREAMS_STORAGE_KEY = 'dreamsprout_local_dreams';

// Helper function to map backend dream to frontend format
function mapBackendDream(backendDream: any): Dream {
  return {
    id: backendDream.id,
    title: backendDream.title || 'Untitled Dream',
    originalDream: backendDream.dreamText || backendDream.originalDream || '', // Backend uses 'dreamText'
    story: backendDream.story,
    analysis: backendDream.analysisText || backendDream.analysis,
    tone: backendDream.storyTone || 'whimsical',
    length: backendDream.storyLength || 'medium',
    date: backendDream.date || backendDream.createdAt,
    images: backendDream.images,
    inputMode: backendDream.hasAudio ? 'voice' : 'text',
    userId: backendDream.userId,
    userEmail: backendDream.userEmail,
    mood: backendDream.mood,
    lucidity: backendDream.lucidity,
    tags: backendDream.tags || [],
    isFavorite: backendDream.isFavorite || false,
    createdAt: backendDream.createdAt,
    updatedAt: backendDream.updatedAt,
    _count: backendDream._count
  };
}

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
            // Map backend dreams to frontend format
            const mappedDreams = response.data.dreams.map(mapBackendDream);
            
            if (reset) {
              setDreams(mappedDreams);
              setPage(1);
            } else {
              setDreams(prev => [...prev, ...mappedDreams]);
            }
            setRecentDreams(mappedDreams.slice(0, 5));
            setFavoriteDreams(mappedDreams.filter(d => d.isFavorite));
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
      if (isGuest) {
        // Create the new dream object for local storage
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
        
        console.log('Created new dream object (guest):', newDream);
        
        // Update state
        setDreams(prevDreams => [newDream, ...prevDreams]);
        setRecentDreams(prev => [newDream, ...prev.slice(0, 4)]);
        if (newDream.isFavorite) {
          setFavoriteDreams(prev => [newDream, ...prev]);
        }
        
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
        
        Toast.show({
          type: 'success',
          text1: 'Dream Saved',
          text2: 'Your dream has been saved locally',
        });
        
        return newDream;
      } else if (user) {
        // Save to API
        const response = await api.createDream(dreamData);
        
        if (response.data?.dream) {
          // Map the backend response to frontend format
          const mappedDream = mapBackendDream(response.data.dream);
          console.log('Created dream (API):', mappedDream);
          
          // Update state with the server's version
          setDreams(prevDreams => [mappedDream, ...prevDreams]);
          setRecentDreams(prev => [mappedDream, ...prev.slice(0, 4)]);
          if (mappedDream.isFavorite) {
            setFavoriteDreams(prev => [mappedDream, ...prev]);
          }
          
          // Also save to local storage as backup
          try {
            const localData = await AsyncStorage.getItem(DREAMS_STORAGE_KEY);
            const localDreams = localData ? JSON.parse(localData) : [];
            const updatedDreams = [mappedDream, ...localDreams];
            await AsyncStorage.setItem(DREAMS_STORAGE_KEY, JSON.stringify(updatedDreams));
          } catch (error) {
            console.error('Failed to backup to local storage:', error);
          }
          
          Toast.show({
            type: 'success',
            text1: 'Dream Saved',
            text2: 'Your dream has been saved successfully',
          });
          
          return mappedDream;
        } else if (response.data?.success) {
          // Handle the case where backend returns success but different format
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
          
          setDreams(prevDreams => [newDream, ...prevDreams]);
          setRecentDreams(prev => [newDream, ...prev.slice(0, 4)]);
          
          Toast.show({
            type: 'success',
            text1: 'Dream Saved',
            text2: 'Your dream has been saved successfully',
          });
          
          return newDream;
        } else {
          throw new Error('Invalid API response');
        }
      } else {
        throw new Error('No user context');
      }
    } catch (error) {
      console.error('Error creating dream:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to save dream. Please try again.',
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
      
      // Update in recent dreams and favorites as well
      setRecentDreams(prev => prev.map(d => 
        d.id === dreamId ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d
      ));
      
      setFavoriteDreams(prev => prev.map(d => 
        d.id === dreamId ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d
      ));
      
      if (isGuest) {
        await AsyncStorage.setItem(DREAMS_STORAGE_KEY, JSON.stringify(updatedDreams));
      } else if (user) {
        // Try to update via API
        try {
          const response = await api.updateDream(dreamId, updates);
          if (response.data?.dream) {
            const mappedDream = mapBackendDream(response.data.dream);
            setDreams(prevDreams => 
              prevDreams.map(d => d.id === dreamId ? mappedDream : d)
            );
            setRecentDreams(prev => prev.map(d => 
              d.id === dreamId ? mappedDream : d
            ));
            setFavoriteDreams(prev => prev.map(d => 
              d.id === dreamId ? mappedDream : d
            ));
            return mappedDream;
          }
        } catch (error) {
          console.error('API update error:', error);
          // If API fails, still return the local update
        }
      }
      
      const updatedDream = updatedDreams.find(d => d.id === dreamId)!;
      
      Toast.show({
        type: 'success',
        text1: 'Dream Updated',
        text2: 'Your changes have been saved.',
      });
      
      return updatedDream;
    } catch (error) {
      console.error('Error updating dream:', error);
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: 'Failed to update dream. Please try again.',
      });
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
      if (isGuest) {
        const updatedDreams = dreams.map(d => 
          d.id === dreamId ? { ...d, isFavorite: !d.isFavorite } : d
        );
        
        setDreams(updatedDreams);
        setFavoriteDreams(updatedDreams.filter(d => d.isFavorite));
        await AsyncStorage.setItem(DREAMS_STORAGE_KEY, JSON.stringify(updatedDreams));
      } else if (user) {
        // Try to update on API
        try {
          const response = await api.toggleFavorite(dreamId);
          if (response.data?.dream) {
            const mappedDream = mapBackendDream(response.data.dream);
            setDreams(prevDreams => 
              prevDreams.map(d => d.id === dreamId ? mappedDream : d)
            );
            setFavoriteDreams(prevDreams => {
              if (mappedDream.isFavorite) {
                return [...prevDreams.filter(d => d.id !== dreamId), mappedDream];
              } else {
                return prevDreams.filter(d => d.id !== dreamId);
              }
            });
          }
        } catch (error) {
          console.error('API favorite error:', error);
          // Fall back to local toggle
          const updatedDreams = dreams.map(d => 
            d.id === dreamId ? { ...d, isFavorite: !d.isFavorite } : d
          );
          setDreams(updatedDreams);
          setFavoriteDreams(updatedDreams.filter(d => d.isFavorite));
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