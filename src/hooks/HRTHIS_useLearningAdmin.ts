/**
 * @file HRTHIS_useLearningAdmin.ts
 * @domain HRTHIS - Learning Management
 * @description Custom hook for learning admin (video CRUD, dialog state)
 * @created Phase 3D - Hooks Migration
 */

import { useState, useEffect } from 'react';
import { useLearningStore } from '../stores/HRTHIS_learningStore';

export function useLearningAdmin() {
  const { videos, loadVideos, createVideo, updateVideo, deleteVideo, loading } = useLearningStore();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);

  // Load videos on mount
  useEffect(() => {
    loadVideos();
  }, []);

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

  // Handlers
  const handleCreateVideo = async (videoData: any) => {
    await createVideo(videoData);
    loadVideos(); // Reload videos
  };

  const handleUpdateVideo = async (videoId: string, updates: any) => {
    await updateVideo(videoId, updates);
  };

  const handleDeleteVideo = async (videoId: string) => {
    await deleteVideo(videoId);
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
