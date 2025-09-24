// src/theme/index.ts

import { DefaultTheme, MD3Theme } from 'react-native-paper';

export const lightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6B46C1',
    secondary: '#7C3AED',
    accent: '#F59E0B',
    background: '#FFFFFF',
    surface: '#F9FAFB',
    text: '#1F2937',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    error: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    info: '#3B82F6',
    disabled: '#D1D5DB',
    placeholder: '#9CA3AF',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    notification: '#6B46C1',
    
    // Gradients
    gradientStart: '#6B46C1',
    gradientEnd: '#7C3AED',
    
    // Specific colors
    dreamCard: '#F3F4F6',
    dreamCardBorder: '#E5E7EB',
    favoriteActive: '#F59E0B',
    favoriteInactive: '#D1D5DB',
  },
};

export const darkTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#7C3AED',
    secondary: '#8B5CF6',
    accent: '#FCD34D',
    background: '#0F172A',
    surface: '#1E293B',
    text: '#F1F5F9',
    textSecondary: '#94A3B8',
    border: '#334155',
    error: '#F87171',
    success: '#34D399',
    warning: '#FBBF24',
    info: '#60A5FA',
    disabled: '#475569',
    placeholder: '#64748B',
    backdrop: 'rgba(0, 0, 0, 0.8)',
    notification: '#7C3AED',
    
    // Gradients
    gradientStart: '#7C3AED',
    gradientEnd: '#8B5CF6',
    
    // Specific colors
    dreamCard: '#1E293B',
    dreamCardBorder: '#334155',
    favoriteActive: '#FCD34D',
    favoriteInactive: '#475569',
  },
  dark: true,
};

export const theme = lightTheme;

export type ThemeType = typeof lightTheme;

// Typography
export const typography = {
  largeTitle: {
    fontFamily: 'Playfair-Bold',
    fontSize: 34,
    lineHeight: 41,
    letterSpacing: 0.37,
  },
  title1: {
    fontFamily: 'Playfair-Bold',
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: 0.36,
  },
  title2: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: 0.35,
  },
  title3: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
    lineHeight: 25,
    letterSpacing: 0.38,
  },
  headline: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.41,
  },
  body: {
    fontFamily: 'Inter-Regular',
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.41,
  },
  bodyMedium: {
    fontFamily: 'Inter-Medium',
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.41,
  },
  callout: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    lineHeight: 21,
    letterSpacing: -0.32,
  },
  subhead: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.24,
  },
  footnote: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: -0.08,
  },
  caption1: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
  },
  caption2: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    lineHeight: 13,
    letterSpacing: 0.07,
  },
};

// Shadows
export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  xlarge: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 16,
  },
};

// Spacing
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// Border Radius
export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};