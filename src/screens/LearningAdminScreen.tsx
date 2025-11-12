/**
 * @file LearningAdminScreen.tsx
 * @domain HR - Learning Management
 * @description Admin screen for managing learning content (videos, tests, analytics)
 * @refactored Phase 2.2 - Priority 3: Split into modular components
 * Original: ~240 lines → Refactored: ~100 lines (58% reduction)
 */

import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/BrowoKo_authStore';
import { useLearningStore } from '../stores/BrowoKo_learningStore';
import { getServices } from '../services';
import { Video, Plus, Play, Clock } from '../components/icons/BrowoKoIcons';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Navigate } from 'react-router-dom';
import LoadingState from '../components/LoadingState';
import CreateVideoDialog from '../components/CreateVideoDialog';
import EditVideoDialog from '../components/EditVideoDialog';
import DeleteVideoDialog from '../components/DeleteVideoDialog';
import VideosListTab from '../components/BrowoKo_VideosListTab';

/**
 * LearningAdminScreen - v4.13.2-SCREEN-DIRECT-LOAD
 * Videos werden DIREKT geladen (nicht vom Hook)
 */
export default function LearningAdminScreen() {
  console.log('🎬 [LearningAdminScreen] Component mounted - v4.13.2-DIRECT-LOAD');
  
  const { profile } = useAuthStore();
  const { createVideo, updateVideo, deleteVideo } = useLearningStore();

  // Local state for videos (DIRECT LOAD - NOT from hook!)
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);

  // Load videos directly on mount (v4.13.2-SCREEN-DIRECT-LOAD)
  useEffect(() => {
    const loadVideos = async () => {
      if (!profile?.organization_id) {
        console.log('⏳ [LearningAdminScreen] Waiting for organization_id...');
        return;
      }

      setLoading(true);
      try {
        console.log('🔍 [LearningAdminScreen] Loading videos for org:', profile.organization_id);
        const services = getServices();
        const loadedVideos = await services.learning.getAllVideos({
          organization_id: profile.organization_id
        });
        console.log('✅ [LearningAdminScreen] Videos loaded:', loadedVideos.length, loadedVideos);
        setVideos(loadedVideos);
      } catch (error) {
        console.error('❌ [LearningAdminScreen] Error loading videos:', error);
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
      console.error('❌ [LearningAdminScreen] Error reloading videos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  const handleCreateVideo = async (videoData: any) => {
    await createVideo(videoData);
    await reloadVideos();
  };

  const handleUpdateVideo = async (videoId: string, updates: any) => {
    await updateVideo(videoId, updates);
    await reloadVideos();
  };

  const handleDeleteVideo = async (videoId: string) => {
    await deleteVideo(videoId);
    await reloadVideos();
  };

  const handleEditClick = (video: any) => {
    setSelectedVideo(video);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (video: any) => {
    setSelectedVideo(video);
    setDeleteDialogOpen(true);
  };

  // Admin check - HR and TEAMLEAD now have admin rights
  const isAdmin = profile?.role === 'HR' ||
    profile?.role === 'TEAMLEAD' ||
    profile?.role === 'ADMIN' ||
    profile?.role === 'SUPERADMIN';

  if (!isAdmin) {
    return <Navigate to="/learning" replace />;
  }

  if (loading) {
    return <LoadingState loading={true} type="spinner" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Lern-Verwaltung</h1>
          <p className="text-sm text-gray-500 mt-1">
            Schulungsvideos und Tests verwalten
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Neues Video
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="videos" className="w-full">
        <TabsList>
          <TabsTrigger value="videos">
            <Video className="w-4 h-4 mr-2" />
            Videos
          </TabsTrigger>
          <TabsTrigger value="tests">
            <Play className="w-4 h-4 mr-2" />
            Tests
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <Clock className="w-4 h-4 mr-2" />
            Statistiken
          </TabsTrigger>
        </TabsList>

        {/* Videos Tab */}
        <TabsContent value="videos">
          <VideosListTab
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            filteredVideos={filteredVideos}
            onEditClick={handleEditClick}
            onDeleteClick={handleDeleteClick}
          />
        </TabsContent>

        {/* Tests Tab */}
        <TabsContent value="tests">
          <Card>
            <CardContent className="p-12 text-center text-gray-400">
              <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Tests-Verwaltung</p>
              <p className="text-sm">Erstelle und verwalte Tests für Schulungsvideos</p>
              <Button className="mt-6">
                <Plus className="w-4 h-4 mr-2" />
                Ersten Test erstellen
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <Card>
            <CardContent className="p-12 text-center text-gray-400">
              <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Lern-Statistiken</p>
              <p className="text-sm">Übersicht über Fortschritte und Teilnahmen</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CreateVideoDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreateVideo={handleCreateVideo}
      />

      <EditVideoDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        video={selectedVideo}
        onUpdateVideo={handleUpdateVideo}
      />

      <DeleteVideoDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        video={selectedVideo}
        onDeleteVideo={handleDeleteVideo}
      />
    </div>
  );
}
