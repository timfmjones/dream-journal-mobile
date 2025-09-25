import React from 'react';
import DreamCard from './DreamCard';
import { Dream } from '../services/api';

interface DreamListItemProps {
  dream: Dream;
  onPress: () => void;
}

export default function DreamListItem({ dream, onPress }: DreamListItemProps) {
  return <DreamCard dream={dream} onPress={onPress} />;
}
