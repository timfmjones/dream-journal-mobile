// src/components/VoiceRecordingModal.tsx

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

interface VoiceRecordingModalProps {
  visible: boolean;
  isRecording: boolean;
  onStop: () => void;
  onClose: () => void;
}

export default function VoiceRecordingModal({ 
  visible, 
  isRecording, 
  onStop, 
  onClose 
}: VoiceRecordingModalProps) {
  const { theme } = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isRecording) {
      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Rotation animation
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 8000,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [isRecording]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
    },
    content: {
      alignItems: 'center',
      padding: 40,
    },
    recordButton: {
      width: 160,
      height: 160,
      borderRadius: 80,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 40,
    },
    recordButtonInner: {
      width: 140,
      height: 140,
      borderRadius: 70,
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      fontSize: 24,
      fontFamily: 'Inter-SemiBold',
      color: 'white',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: 'rgba(255, 255, 255, 0.8)',
      textAlign: 'center',
    },
    waveContainer: {
      position: 'absolute',
      width: 200,
      height: 200,
      borderRadius: 100,
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView intensity={80} style={styles.container}>
        <View style={styles.content}>
          <TouchableOpacity onPress={onStop} activeOpacity={0.8}>
            <Animated.View 
              style={[
                styles.waveContainer,
                {
                  transform: [{ scale: pulseAnim }, { rotate: rotation }],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.recordButton,
                {
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              <LinearGradient
                colors={['#ef4444', '#dc2626']}
                style={styles.recordButtonInner}
              >
                <Ionicons name="stop" size={60} color="white" />
              </LinearGradient>
            </Animated.View>
          </TouchableOpacity>

          <Text style={styles.title}>Recording Dream...</Text>
          <Text style={styles.subtitle}>
            Tap the button to stop recording
          </Text>
        </View>
      </BlurView>
    </Modal>
  );
}