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
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `API Error: ${response.status}`);
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
    // Map the frontend field names to what the backend expects
    const mappedData = {
      title: dreamData.title,
      dreamText: dreamData.originalDream, // Backend expects 'dreamText' not 'originalDream'
      story: dreamData.story,
      storyTone: dreamData.tone,
      storyLength: dreamData.length,
      hasAudio: dreamData.inputMode === 'voice',
      audioUrl: dreamData.audioUri,
      tags: dreamData.tags || [],
      mood: dreamData.mood,
      lucidity: dreamData.lucidity,
      images: dreamData.images || [],
      isFavorite: dreamData.isFavorite || false,
      date: dreamData.date
    };
    
    return this.makeRequest('POST', '/dreams', mappedData);
  }

  async updateDream(dreamId: string, updates: Partial<Dream>): Promise<ApiResponse<{ dream: Dream }>> {
    // Map the frontend field names to what the backend expects
    const mappedUpdates = {
      title: updates.title,
      dreamText: updates.originalDream,
      story: updates.story,
      storyTone: updates.tone,
      storyLength: updates.length,
      tags: updates.tags,
      mood: updates.mood,
      lucidity: updates.lucidity,
      images: updates.images
    };
    
    // Remove undefined values
    Object.keys(mappedUpdates).forEach(key => 
      mappedUpdates[key as keyof typeof mappedUpdates] === undefined && delete mappedUpdates[key as keyof typeof mappedUpdates]
    );
    
    return this.makeRequest('PUT', `/dreams/${dreamId}`, mappedUpdates);
  }

  async deleteDream(dreamId: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.makeRequest('DELETE', `/dreams/${dreamId}`);
  }

  async toggleFavorite(dreamId: string): Promise<ApiResponse<{ dream: Dream }>> {
    return this.makeRequest('PATCH', `/dreams/${dreamId}/favorite`);
  }

  // Test endpoint to verify backend is receiving files
  async testAudioUpload(audioUri: string): Promise<ApiResponse<{ received: boolean; details: any }>> {
    return new Promise(async (resolve) => {
      try {
        console.log('Testing audio upload with URI:', audioUri);
        
        const xhr = new XMLHttpRequest();
        const formData = new FormData();
        
        const file: any = {
          uri: audioUri,
          type: 'audio/wav',
          name: 'test.wav',
        };
        
        formData.append('audio', file);
        
        xhr.onload = () => {
          console.log('Test upload complete, status:', xhr.status);
          console.log('Test response:', xhr.responseText);
          
          try {
            const result = JSON.parse(xhr.responseText);
            resolve({ data: result });
          } catch (error) {
            resolve({ data: { received: xhr.status === 200, details: xhr.responseText } });
          }
        };
        
        xhr.onerror = () => {
          resolve({ error: 'Network request failed' });
        };
        
        // Use a test endpoint that just echoes what it receives
        xhr.open('POST', `${API_BASE_URL}/test-upload`);
        
        const token = auth?.currentUser ? await auth.currentUser.getIdToken() : null;
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
        
        xhr.send(formData);
      } catch (error: any) {
        resolve({ error: error.message });
      }
    });
  }

  // AI Generation - Using XMLHttpRequest with better error handling
  async transcribeAudio(audioUri: string | Blob): Promise<ApiResponse<{ text: string }>> {
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      return { error: 'No internet connection for transcription' };
    }
    
    return new Promise(async (resolve) => {
      try {
        if (typeof audioUri === 'string') {
          console.log('Starting audio upload with URI:', audioUri);
          
          // Use XMLHttpRequest for React Native file uploads
          const xhr = new XMLHttpRequest();
          const formData = new FormData();
          
          // Get file extension from URI
          const uriParts = audioUri.split('.');
          const fileExtension = uriParts[uriParts.length - 1]?.toLowerCase() || 'm4a';
          console.log('File extension:', fileExtension);
          
          // React Native FormData format
          // Try different MIME types based on what the recording actually produces
          const mimeType = fileExtension === 'wav' ? 'audio/wav' :
                          fileExtension === 'caf' ? 'audio/x-caf' :
                          fileExtension === 'm4a' ? 'audio/mp4' : // m4a is actually mp4
                          'audio/mpeg';
          
          const file: any = {
            uri: audioUri,
            type: mimeType,
            name: `recording.${fileExtension}`,
          };
          
          console.log('File object:', file);
          formData.append('audio', file);
          
          xhr.onload = () => {
            console.log('Upload complete, status:', xhr.status);
            console.log('Response:', xhr.responseText);
            
            if (xhr.status === 200) {
              try {
                const result = JSON.parse(xhr.responseText);
                if (result.text) {
                  console.log('Transcription successful!');
                  resolve({ data: result });
                } else {
                  resolve({ error: 'No transcription text received' });
                }
              } catch (error) {
                console.error('Failed to parse response:', error);
                resolve({ error: 'Invalid response from server' });
              }
            } else if (xhr.status === 500) {
              // Internal server error - log the details
              console.error('Server error (500):', xhr.responseText);
              
              // Try to parse error response
              let errorMessage = 'Server error during transcription.';
              try {
                if (xhr.responseText && xhr.responseText.trim()) {
                  const errorData = JSON.parse(xhr.responseText);
                  errorMessage = errorData.error || errorMessage;
                }
              } catch (e) {
                console.error('Could not parse error response');
              }
              
              resolve({ 
                error: `${errorMessage} The transcription service may be temporarily unavailable. Please try typing your dream instead.`
              });
            } else {
              try {
                const errorData = JSON.parse(xhr.responseText);
                resolve({ error: errorData.error || 'Transcription failed' });
              } catch {
                resolve({ error: xhr.responseText || 'Transcription failed' });
              }
            }
          };
          
          xhr.onerror = () => {
            console.error('Upload failed - network error');
            resolve({ error: 'Network request failed' });
          };
          
          xhr.open('POST', `${API_BASE_URL}/transcribe`);
          
          // Set auth header if available
          const token = auth?.currentUser ? await auth.currentUser.getIdToken() : null;
          if (token) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
          }
          
          console.log('Sending request to:', `${API_BASE_URL}/transcribe`);
          xhr.send(formData);
          
        } else if (audioUri instanceof Blob) {
          // Fallback to fetch for Blob
          const formData = new FormData();
          formData.append('audio', audioUri, 'recording.wav');
          
          const headers = await this.getAuthHeaders();
          delete (headers as any)['Content-Type'];
          
          const response = await fetch(`${API_BASE_URL}/transcribe`, {
            method: 'POST',
            headers,
            body: formData,
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            resolve({ error: errorText || 'Transcription failed' });
          } else {
            const result = await response.json();
            resolve({ data: result });
          }
        } else {
          resolve({ error: 'Invalid audio input' });
        }
      } catch (error: any) {
        console.error('Transcription error:', error);
        resolve({ error: error.message || 'Transcription failed' });
      }
    });
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