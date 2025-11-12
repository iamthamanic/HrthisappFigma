/**
 * @file BrowoKo_useLearningAdmin.ts
 * @domain BrowoKo - Learning Management
 * @description Custom hook for learning admin (video CRUD, dialog state)
 * @created Phase 3D - Hooks Migration
 * @updated v4.13.2 - Direct video loading (bypassing store)
 */

import { useState, useEffect } from 'react';
import { useLearningStore } from '../stores/BrowoKo_learningStore';
import { useAuthStore } from '../stores/BrowoKo_authStore';
import { getServices } from '../services';

/**
 * useLearningAdmin Hook
 * VERSION: v4.13.2-FINAL
 * CHANGE: Direct video loading (bypassing store for reliability)
 */
export function useLearningAdmin() {
  // Store methods for CRUD operations
  const { createVideo, updateVideo, deleteVideo } = useLearningStore();
  const { profile } = useAuthStore();

  // Local state for videos (NOT from store!)
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Dialog state
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);

  // Load videos on mount (DIRECT LOAD - bypassing store)
  useEffect(() => {
    const loadVideos = async () => {
      if (!profile?.organization_id) {
        console.log('⏳ [useLearningAdmin] Waiting for organization_id...');
        return;
      }

      setLoading(true);
      try {
        console.log('🔍 [useLearningAdmin] Loading videos for org:', profile.organization_id);
        const services = getServices();
        const loadedVideos = await services.learning.getAllVideos({
          organization_id: profile.organization_id
        });
        console.log('✅ [useLearningAdmin] Videos loaded:', loadedVideos.length, loadedVideos);
        setVideos(loadedVideos);
      } catch (error) {
        console.error('❌ [useLearningAdmin] Error loading videos:', error);
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };

    loadVideos();
  }, [profile?.organization_id]);

  // Filter videos by category
  const filteredVideos = selectedCategory === 'all'
    ? videos
    : videos.filter(v => v.category === selectedCategory);

  // Category counts
  const categories = [
    { id: 'all', label: 'Alle Videos', count: videos.length },
    { id: 'MANDATORY', label: 'Pflicht', count: videos.filter(v => v.category === 'MANDATORY').length },
    { id: 'COMPLIANCE', label: 'Compliance', count: videos.filter(v => v.category === 'COMPLIANCE').length },
    { id: 'SKILLS', label: 'Skills', count: videos.filter(v => v.category === 'SKILLS').length },
    { id: 'ONBOARDING', label: 'Onboarding', count: videos.filter(v => v.category === 'ONBOARDING').length },
    { id: 'BONUS', label: 'Bonus', count: videos.filter(v => v.category === 'BONUS').length },
  ];

  // Reload videos helper
  const reloadVideos = async () => {
    if (!profile?.organization_id) return;
    
    setLoading(true);
    try {
      const services = getServices();
      const loadedVideos = await services.learning.getAllVideos({
        organization_id: profile.organization_id
      });
      setVideos(loadedVideos);
    } catch (error) {
      console.error('❌ [useLearningAdmin] Error reloading videos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  const handleCreateVideo = async (videoData: any) => {
    await createVideo(videoData);
    await reloadVideos(); // Reload videos
  };

  const handleUpdateVideo = async (videoId: string, updates: any) => {
    await updateVideo(videoId, updates);
    await reloadVideos(); // Reload videos
  };

  const handleDeleteVideo = async (videoId: string) => {
    await deleteVideo(videoId);
    await reloadVideos(); // Reload videos
  };

  const handleEditClick = (video: any) => {
    setSelectedVideo(video);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (video: any) => {
    setSelectedVideo(video);
    setDeleteDialogOpen(true);
  };

  return {
    // Data
    videos,
    filteredVideos,
    categories,
    selectedCategory,
    loading,

    // Dialog state
    createDialogOpen,
    editDialogOpen,
    deleteDialogOpen,
    selectedVideo,

    // Setters
    setSelectedCategory,
    setCreateDialogOpen,
    setEditDialogOpen,
    setDeleteDialogOpen,

    // Handlers
    handleCreateVideo,
    handleUpdateVideo,
    handleDeleteVideo,
    handleEditClick,
    handleDeleteClick,
  };
}
