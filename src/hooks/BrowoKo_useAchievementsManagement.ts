/**
 * ============================================
 * ACHIEVEMENTS MANAGEMENT HOOK (v3.9.1)
 * ============================================
 * Description: Hook für Admin Achievement Management
 * ============================================
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner@2.0.3';
import {
  getAllCoinAchievements,
  createCoinAchievement,
  updateCoinAchievement,
  deleteCoinAchievement,
} from '../services/BrowoKo_coinAchievementsService';
import type { CoinAchievement } from '../types/database';
import type { AchievementFormData } from '../components/admin/BrowoKo_AchievementDialog';

export function useAchievementsManagement() {
  const [achievements, setAchievements] = useState<CoinAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<CoinAchievement | null>(null);
  const [formData, setFormData] = useState<AchievementFormData>(getEmptyFormData());

  // Load achievements
  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      const data = await getAllCoinAchievements();
      setAchievements(data);
    } catch (error) {
      console.error('Error loading achievements:', error);
      toast.error('Fehler beim Laden der Achievements');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (achievement?: CoinAchievement) => {
    if (achievement) {
      // Edit mode
      setEditingAchievement(achievement);
      setFormData({
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        required_coins: achievement.required_coins,
        unlock_type: achievement.unlock_type as any,
        unlock_description: achievement.unlock_description,
        category: achievement.category as any,
        badge_color: achievement.badge_color as any,
        sort_order: achievement.sort_order,
        is_active: achievement.is_active,
      });
    } else {
      // Create mode
      setEditingAchievement(null);
      setFormData(getEmptyFormData());
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingAchievement(null);
    setFormData(getEmptyFormData());
  };

  const handleSubmit = async () => {
    try {
      if (editingAchievement) {
        // Update
        await updateCoinAchievement(editingAchievement.id, formData);
        toast.success('✅ Achievement erfolgreich aktualisiert!');
      } else {
        // Create
        await createCoinAchievement(formData);
        toast.success('🎉 Achievement erfolgreich erstellt!');
      }

      // Close dialog first (better UX)
      handleCloseDialog();
      
      // Reload achievements (will show in list immediately)
      await loadAchievements();
    } catch (error) {
      console.error('Error saving achievement:', error);
      toast.error(
        editingAchievement
          ? '❌ Fehler beim Aktualisieren des Achievements'
          : '❌ Fehler beim Erstellen des Achievements'
      );
    }
  };

  const handleDelete = async (achievementId: string) => {
    // Find achievement name for confirmation
    const achievement = achievements.find(a => a.id === achievementId);
    const achievementName = achievement?.title || 'dieses Achievement';
    
    if (!confirm(`Achievement "${achievementName}" wirklich löschen?\n\nDiese Aktion kann nicht rückgängig gemacht werden!`)) {
      return;
    }

    try {
      await deleteCoinAchievement(achievementId);
      toast.success('🗑️ Achievement erfolgreich gelöscht!');
      await loadAchievements();
    } catch (error) {
      console.error('Error deleting achievement:', error);
      toast.error('❌ Fehler beim Löschen des Achievements');
    }
  };

  return {
    achievements,
    loading,
    isDialogOpen,
    setIsDialogOpen,
    editingAchievement,
    formData,
    handleOpenDialog,
    handleCloseDialog,
    handleSubmit,
    handleDelete,
    setFormData,
  };
}

// Helper function
function getEmptyFormData(): AchievementFormData {
  return {
    title: '',
    description: '',
    icon: 'Trophy',
    required_coins: 100,
    unlock_type: 'PRIVILEGE',
    unlock_description: '',
    category: 'MILESTONE',
    badge_color: 'bronze',
    sort_order: 0,
    is_active: true,
  };
}
