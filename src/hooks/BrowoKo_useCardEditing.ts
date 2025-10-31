/**
 * @file BrowoKo_useCardEditing.ts
 * @version v4.8.0
 * @description Hook to manage card-level editing state (only 1 card editable at a time)
 */

import { useState } from 'react';

export type CardId = 
  | 'profile_picture'
  | 'personal_info' 
  | 'address' 
  | 'bank_info' 
  | 'clothing_sizes' 
  | 'emergency_contact' 
  | 'language_skills'
  | 'employment_info'
  | null;

interface UseCardEditingReturn {
  editingCard: CardId;
  isEditing: (cardId: CardId) => boolean;
  canEdit: (cardId: CardId) => boolean;
  startEditing: (cardId: CardId) => boolean;
  stopEditing: () => void;
  currentCardName: string;
}

const CARD_NAMES: Record<Exclude<CardId, null>, string> = {
  profile_picture: 'Profilbild',
  personal_info: 'Persönliche Daten',
  address: 'Adresse',
  bank_info: 'Bankverbindung',
  clothing_sizes: 'Kleidergrößen',
  emergency_contact: 'Notfallkontakt',
  language_skills: 'Sprachkenntnisse',
  employment_info: 'Arbeitsinformationen',
};

export function useCardEditing(): UseCardEditingReturn {
  const [editingCard, setEditingCard] = useState<CardId>(null);

  const isEditing = (cardId: CardId): boolean => {
    return editingCard === cardId;
  };

  const canEdit = (cardId: CardId): boolean => {
    return editingCard === null || editingCard === cardId;
  };

  const startEditing = (cardId: CardId): boolean => {
    if (editingCard !== null && editingCard !== cardId) {
      // Another card is being edited
      return false;
    }
    setEditingCard(cardId);
    return true;
  };

  const stopEditing = () => {
    setEditingCard(null);
  };

  const currentCardName = editingCard ? CARD_NAMES[editingCard] : '';

  return {
    editingCard,
    isEditing,
    canEdit,
    startEditing,
    stopEditing,
    currentCardName,
  };
}
