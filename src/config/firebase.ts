// src/config/firebase.ts

import { initializeApp as initializeFirebaseApp, getApps } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseConfig?.apiKey || process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'dummy-api-key',
  authDomain: Constants.expoConfig?.extra?.firebaseConfig?.authDomain || process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'dummy-auth-domain',
  projectId: Constants.expoConfig?.extra?.firebaseConfig?.projectId || process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'dummy-project-id',
  storageBucket: Constants.expoConfig?.extra?.firebaseConfig?.storageBucket || process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'dummy-storage-bucket',
  messagingSenderId: Constants.expoConfig?.extra?.firebaseConfig?.messagingSenderId || process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'dummy-sender-id',
  appId: Constants.expoConfig?.extra?.firebaseConfig?.appId || process.env.EXPO_PUBLIC_FIREBASE_APP_ID || 'dummy-app-id',
};

let app: any;
let auth: any;

// RENAMED: Changed from initializeApp to initializeFirebase to avoid conflict
export const initializeFirebase = async () => {
  try {
    if (getApps().length === 0) {
      app = initializeFirebaseApp(firebaseConfig); // Using the renamed import
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } else {
      app = getApps()[0];
      auth = getAuth(app);
    }
    console.log('Firebase initialized successfully');
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
};

export { app, auth };