// src/contexts/NotificationContext.tsx

import React, { createContext, useContext, useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface NotificationContextType {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  scheduleDreamReminder: (hour: number, minute: number) => Promise<void>;
  cancelDreamReminder: () => Promise<void>;
  requestPermissions: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      if (token) setExpoPushToken(token);
    });

    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      // Handle notification tap here
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);

  const registerForPushNotificationsAsync = async () => {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6B46C1',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }
      
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: 'your-project-id', // Replace with your project ID
      })).data;
      
      console.log('Push token:', token);
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    return token;
  };

  const requestPermissions = async (): Promise<boolean> => {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  };

  const scheduleDreamReminder = async (hour: number, minute: number) => {
    await Notifications.cancelAllScheduledNotificationsAsync();

    const trigger = {
      hour,
      minute,
      repeats: true,
    };

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🌙 Time to Record Your Dreams',
        body: 'Take a moment to capture your dreams before they fade away.',
        data: { type: 'dream_reminder' },
        sound: true,
      },
      trigger,
    });

    // Save reminder settings
    await AsyncStorage.setItem('dream_reminder', JSON.stringify({ hour, minute, enabled: true }));
  };

  const cancelDreamReminder = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await AsyncStorage.setItem('dream_reminder', JSON.stringify({ enabled: false }));
  };

  const value = {
    expoPushToken,
    notification,
    scheduleDreamReminder,
    cancelDreamReminder,
    requestPermissions,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};