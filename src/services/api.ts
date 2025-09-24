// src/services/api.ts

import Constants from 'expo-constants';
import { auth } from '../config/firebase';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'https://dream-journal-backend-production.up.railway.app/api';

// Types (reused from web app)
export interface Dream {
  id: string;
  originalDream: string;
  story?: string;
  analysis?: string;
  title: string;
  tone: string;
  length: string;
  date: string;
  images?: DreamImage[];
  audioBlob?: Blob;
  inputMode: 'text' | 'voice';
  userId?: string;
  userEmail?: string;
  mood?: string;
  lucidity?: number;
  tags?: string[];
  isFavorite?: boolean;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    analyses: number;
  };
}

export interface DreamImage {
  url: string;
  scene: string;
  description: string;
  prompt?: string;
}

export type StoryTone = 'whimsical' | 'mystical' | 'adventurous' | 'gentle' | 'mysterious' | 'comedy';
export type StoryLength = 'short' | 'medium' | 'long';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  offline?: boolean;
}

class ApiService {
  private offlineQueue: Array<{
    method: string;
    endpoint: string;
    data?: any;
    timestamp: number;
  }> = [];

  constructor() {
    // Load offline queue on initialization
    this.loadOfflineQueue();
    
    // Monitor network connectivity
    NetInfo.addEventListener(state => {
      if (state.isConnected && state.isInternetReachable) {
        this.processOfflineQueue();
      }
    });
  }

  private async loadOfflineQueue() {
    try {
      const queue = await AsyncStorage.getItem('offlineQueue');
      if (queue) {
        this.offlineQueue = JSON.parse(queue);
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
    }
  }

  private async saveOfflineQueue() {
    try {
      await AsyncStorage.setItem('offlineQueue', JSON.stringify(this.offlineQueue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  private async processOfflineQueue() {
    if (this.offlineQueue.length === 0) return;

    const queue = [...this.offlineQueue];
    this.offlineQueue = [];
    await this.saveOfflineQueue();

    for (const request of queue) {
      try {
        await this.makeRequest(request.method, request.endpoint, request.data);
      } catch (error) {
        console.error('Failed to process offline request:', error);
        // Re-add to queue if still failing
        this.offlineQueue.push(request);
      }
    }

    if (this.offlineQueue.length > 0) {
      await this.saveOfflineQueue();
    }
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    try {
      if (auth?.currentUser) {
        const token = await auth.currentUser.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Failed to get auth token:', error);
    }
    
    return headers;
  }

  private async makeRequest<T>(method: string, endpoint: string, data?: any): Promise<ApiResponse<T>> {
    // Check network connectivity
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected || !netInfo.isInternetReachable) {
      // Queue for later if it's a write operation
      if (method !== 'GET') {
        this.offlineQueue.push({
          method,
          endpoint,
          data,
          timestamp: Date.now(),
        });
        await this.saveOfflineQueue();
        
        return { offline: true, error: 'Request queued for offline sync' };
      }
      
      return { offline: true, error: 'No internet connection' };
    }

    try {
      const headers = await this.getAuthHeaders();
      const url = `${API_BASE_URL}${endpoint}`;
      
      const options: RequestInit = {
        method,
        headers,
      };
      
      if (data && method !== 'GET') {
        if (data instanceof FormData) {
          delete (headers as any)['Content-Type'];
          options.body = data;
        } else {
          options.body = JSON.stringify(data);
        }
      }
      
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const result = await response.json();
      return { data: result };
    } catch (error: any) {
      console.error('API Request failed:', error);
      
      // Queue for retry if it's a write operation
      if (method !== 'GET') {
        this.offlineQueue.push({
          method,
          endpoint,
          data,
          timestamp: Date.now(),
        });
        await this.saveOfflineQueue();
      }
      
      return { error: error.message };
    }
  }

  // Dream Management
  async getDreams(params?: {
    page?: number;
    limit?: number;
    search?: string;
    favoritesOnly?: boolean;
  }): Promise<ApiResponse<{ dreams: Dream[]; total: number; hasMore: boolean }>> {
    const queryParams = new URLSearchParams({
      page: String(params?.page || 1),
      limit: String(params?.limit || 20),
      ...(params?.search && { search: params.search }),
      ...(params?.favoritesOnly && { favoritesOnly: 'true' }),
    });
    
    return this.makeRequest('GET', `/dreams?${queryParams}`);
  }

  async createDream(dreamData: Partial<Dream>): Promise<ApiResponse<{ dream: Dream }>> {
    return this.makeRequest('POST', '/dreams', dreamData);
  }

  async updateDream(dreamId: string, updates: Partial<Dream>): Promise<ApiResponse<{ dream: Dream }>> {
    return this.makeRequest('PUT', `/dreams/${dreamId}`, updates);
  }

  async deleteDream(dreamId: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.makeRequest('DELETE', `/dreams/${dreamId}`);
  }

  async toggleFavorite(dreamId: string): Promise<ApiResponse<{ dream: Dream }>> {
    return this.makeRequest('PATCH', `/dreams/${dreamId}/favorite`);
  }

  // AI Generation
  async transcribeAudio(audioBlob: Blob): Promise<ApiResponse<{ text: string }>> {
    const formData = new FormData();
    formData.append('audio', audioBlob as any, 'recording.wav');
    
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      return { error: 'No internet connection for transcription' };
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/transcribe`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Transcription failed');
      }
      
      const result = await response.json();
      return { data: result };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  async generateTitle(dreamText: string): Promise<ApiResponse<{ title: string }>> {
    return this.makeRequest('POST', '/generate-title', { dreamText });
  }

  async generateStory(
    dreamText: string,
    tone: StoryTone,
    length: StoryLength
  ): Promise<ApiResponse<{ story: string }>> {
    return this.makeRequest('POST', '/generate-story', { dreamText, tone, length });
  }

  async generateImages(story: string, tone: StoryTone): Promise<ApiResponse<{ images: DreamImage[] }>> {
    return this.makeRequest('POST', '/generate-images', { story, tone });
  }

  async analyzeDream(dreamText: string, dreamId?: string): Promise<ApiResponse<{
    analysis: string;
    themes?: string[];
    emotions?: string[];
  }>> {
    return this.makeRequest('POST', '/analyze-dream', { dreamText, dreamId });
  }

  async textToSpeech(text: string, voice?: string, speed?: number): Promise<Blob | null> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/text-to-speech`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ text, voice: voice || 'alloy', speed: speed || 1.0 }),
      });
      
      if (!response.ok) {
        throw new Error('TTS failed');
      }
      
      return response.blob();
    } catch (error) {
      console.error('Text-to-speech error:', error);
      return null;
    }
  }

  // User Statistics
  async getUserStats(): Promise<ApiResponse<{
    totalDreams: number;
    dreamsThisMonth: number;
    favoriteDreams: number;
    mostCommonTags: Array<{ tag: string; count: number }>;
    moodDistribution: Array<{ mood: string; count: number }>;
    averageLucidity: number | null;
  }>> {
    return this.makeRequest('GET', '/stats');
  }
}

export const api = new ApiService();