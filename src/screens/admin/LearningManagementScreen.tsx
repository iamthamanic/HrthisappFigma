/**
 * @file LearningManagementScreen.tsx
 * @domain ADMIN - Learning Management
 * @description Complete learning content management with test builder
 * @version v4.4.0 Phase 2 - Desktop + Mobile Responsive
 */

import { useState, lazy, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { 
  Play, 
  ClipboardList, 
  BookOpen, 
  Plus,
  Sparkles,
  Video,
  GraduationCap,
  Search
} from '../../components/icons/HRTHISIcons';
import { useLearningStore } from '../../stores/HRTHIS_learningStore';
import { useAuthStore } from '../../stores/HRTHIS_authStore';
import CreateVideoDialog from '../../components/CreateVideoDialog';
import EditVideoDialog from '../../components/EditVideoDialog';
import DeleteVideoDialog from '../../components/DeleteVideoDialog';
import VideoListItem from '../../components/HRTHIS_VideoListItem';
import { LearningEmptyState } from '../../components/HRTHIS_LearningEmptyState';
import LoadingState from '../../components/LoadingState';

// Lazy load AvatarSystemAdminScreen
const AvatarSystemAdminScreen = lazy(() => import('./AvatarSystemAdminScreen'));

export default function LearningManagementScreen() {
  const [activeTab, setActiveTab] = useState<'videos' | 'tests' | 'units' | 'avatar'>('videos');
  const [isCreateVideoOpen, setIsCreateVideoOpen] = useState(false);
  const [isEditVideoOpen, setIsEditVideoOpen] = useState(false);
  const [isDeleteVideoOpen, setIsDeleteVideoOpen] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  
  // Search states
  const [videoSearch, setVideoSearch] = useState('');
  const [testSearch, setTestSearch] = useState('');
  const [unitSearch, setUnitSearch] = useState('');

  // Get videos and auth from stores
  const { videos, createVideo, updateVideo, deleteVideo } = useLearningStore();
  const { profile } = useAuthStore();
  const isAdmin = profile?.role === 'HR' || profile?.role === 'ADMIN' || profile?.role === 'SUPERADMIN';

  const handleEditVideo = (videoId: string) => {
    setSelectedVideoId(videoId);
    setIsEditVideoOpen(true);
  };

  const handleDeleteVideo = (videoId: string) => {
    setSelectedVideoId(videoId);
    setIsDeleteVideoOpen(true);
  };

  // Get selected video object
  const selectedVideo = selectedVideoId ? videos.find(v => v.id === selectedVideoId) : null;

  // Adapter functions for dialogs
  const handleCreateVideo = async (data: {
    title: string;
    description: string;
    video_url: string;
    category: string;
    duration_seconds: number;
  }) => {
    await createVideo({
      title: data.title,
      description: data.description,
      youtube_url: data.video_url,
      duration_minutes: Math.ceil(data.duration_seconds / 60),
      category: data.category,
      xp_reward: 50, // Default XP
      coin_reward: 10, // Default coins
    });
  };

  const handleUpdateVideo = async (videoId: string, updates: {
    title?: string;
    description?: string;
    video_url?: string;
    category?: string;
    duration_seconds?: number;
  }) => {
    await updateVideo(videoId, {
      title: updates.title,
      description: updates.description,
      youtube_url: updates.video_url,
      duration_minutes: updates.duration_seconds ? Math.ceil(updates.duration_seconds / 60) : undefined,
      category: updates.category,
    });
  };

  // Filter videos by search
  const filteredVideos = videos.filter(video =>
    video.title.toLowerCase().includes(videoSearch.toLowerCase()) ||
    video.description?.toLowerCase().includes(videoSearch.toLowerCase()) ||
    video.category?.toLowerCase().includes(videoSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* Desktop + Mobile Optimized Container */}
      <div className="container-responsive section-spacing pt-6 md:pt-8 pb-20 md:pb-8">
        
        {/* Header - Optimized Spacing */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-gray-900">Lernverwaltung</h1>
            <p className="text-sm text-gray-500 mt-1">
              Videos, Tests und Lerneinheiten verwalten
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            {activeTab === 'videos' && (
              <Button 
                className="w-full md:w-auto btn-touch"
                onClick={() => setIsCreateVideoOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Video hinzufügen</span>
                <span className="sm:hidden">Video</span>
              </Button>
            )}
            {activeTab === 'tests' && (
              <Button 
                className="w-full md:w-auto btn-touch"
                onClick={() => {
                  alert('Test Builder kommt in Phase 2! 🎓\n\n10 Block-Typen:\n- Multiple Choice\n- True/False\n- Text Input\n- Number Input\n- Date\n- Single Choice\n- Checkboxes\n- Dropdown\n- Slider\n- File Upload');
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Test erstellen</span>
                <span className="sm:hidden">Test</span>
              </Button>
            )}
          </div>
        </div>

        {/* Tabs - Mobile Responsive */}
        <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="w-full">
          {/* Mobile: 2x2 Grid, Desktop: 1 Row */}
          <TabsList className="grid grid-cols-2 md:grid-cols-4 h-auto w-full">
            <TabsTrigger value="videos" className="flex items-center justify-center gap-2 py-3 px-2 text-xs sm:text-sm">
              <Video className="w-4 h-4 flex-shrink-0" />
              <span>Videos</span>
            </TabsTrigger>
            <TabsTrigger value="tests" className="flex items-center justify-center gap-2 py-3 px-2 text-xs sm:text-sm">
              <ClipboardList className="w-4 h-4 flex-shrink-0" />
              <span>Tests</span>
            </TabsTrigger>
            <TabsTrigger value="units" className="flex items-center justify-center gap-2 py-3 px-2 text-xs sm:text-sm">
              <GraduationCap className="w-4 h-4 flex-shrink-0" />
              <span>Lerneinheiten</span>
            </TabsTrigger>
            <TabsTrigger value="avatar" className="flex items-center justify-center gap-2 py-3 px-2 text-xs sm:text-sm">
              <Sparkles className="w-4 h-4 flex-shrink-0" />
              <span>Avatar</span>
            </TabsTrigger>
          </TabsList>

          {/* Videos Tab */}
          <TabsContent value="videos" className="space-y-4 md:space-y-6 mt-6">
            <Card className="mobile-card md:desktop-card">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <CardTitle className="flex items-center gap-2">
                    <Play className="w-5 h-5 text-blue-600" />
                    Video-Verwaltung
                  </CardTitle>
                  
                  {/* Video Search */}
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Videos durchsuchen..."
                      value={videoSearch}
                      onChange={(e) => setVideoSearch(e.target.value)}
                      className="pl-10 w-full"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredVideos.length === 0 && videoSearch === '' ? (
                  <LearningEmptyState 
                    type="videos"
                    isAdmin={isAdmin}
                  />
                ) : filteredVideos.length === 0 ? (
                  <div className="text-center text-gray-400 py-12">
                    <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">Keine Videos gefunden</p>
                    <p className="text-sm">Versuche einen anderen Suchbegriff</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredVideos.map((video) => (
                      <VideoListItem
                        key={video.id}
                        video={video}
                        onEditClick={() => handleEditVideo(video.id)}
                        onDeleteClick={() => handleDeleteVideo(video.id)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tests Tab */}
          <TabsContent value="tests" className="space-y-4 md:space-y-6 mt-6">
            {/* Test Sub-Tabs */}
            <Tabs defaultValue="created" className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="created">
                  <ClipboardList className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Erstellte Tests</span>
                  <span className="sm:hidden">Tests</span>
                </TabsTrigger>
                <TabsTrigger value="templates">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Templates
                </TabsTrigger>
              </TabsList>

              <TabsContent value="created" className="mt-6">
                <Card className="mobile-card md:desktop-card">
                  <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <CardTitle className="flex items-center gap-2">
                        <ClipboardList className="w-5 h-5 text-blue-600" />
                        Meine Tests
                      </CardTitle>
                      
                      {/* Test Search */}
                      <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          type="text"
                          placeholder="Tests durchsuchen..."
                          value={testSearch}
                          onChange={(e) => setTestSearch(e.target.value)}
                          className="pl-10 w-full"
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center text-gray-400 py-12">
                      <ClipboardList className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">Noch keine Tests erstellt</p>
                      <p className="text-sm mb-4">Erstelle deinen ersten Test mit dem Test-Builder</p>
                      <Button
                        onClick={() => {
                          alert('Test Builder kommt in Phase 2! 🎓\n\n10 Block-Typen:\n- Multiple Choice\n- True/False\n- Text Input\n- Number Input\n- Date\n- Single Choice\n- Checkboxes\n- Dropdown\n- Slider\n- File Upload');
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Test erstellen
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="templates" className="mt-6">
                <Card className="mobile-card md:desktop-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                      Test-Templates
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center text-gray-400 py-12">
                      <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">Noch keine Templates gespeichert</p>
                      <p className="text-sm">Speichere häufig genutzte Test-Strukturen als Template</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Learning Units Tab */}
          <TabsContent value="units" className="space-y-4 md:space-y-6 mt-6">
            <Card className="mobile-card md:desktop-card">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-blue-600" />
                    Lerneinheiten
                  </CardTitle>
                  
                  {/* Unit Search */}
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Lerneinheiten durchsuchen..."
                      value={unitSearch}
                      onChange={(e) => setUnitSearch(e.target.value)}
                      className="pl-10 w-full"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center text-gray-400 py-12">
                  <GraduationCap className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Noch keine Lerneinheiten</p>
                  <p className="text-sm">
                    Lerneinheiten werden automatisch erstellt, wenn ein Video einen Test hat
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Avatar Tab - EMBED AvatarSystemAdminScreen */}
          <TabsContent value="avatar" className="mt-6">
            <Suspense fallback={
              <Card className="mobile-card md:desktop-card">
                <CardContent className="py-12">
                  <LoadingState loading={true} type="spinner" />
                </CardContent>
              </Card>
            }>
              <AvatarSystemAdminScreen />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <CreateVideoDialog 
        open={isCreateVideoOpen}
        onOpenChange={setIsCreateVideoOpen}
        onCreateVideo={handleCreateVideo}
      />
      
      {selectedVideo && (
        <>
          <EditVideoDialog
            open={isEditVideoOpen}
            onOpenChange={setIsEditVideoOpen}
            video={{
              id: selectedVideo.id,
              title: selectedVideo.title,
              description: selectedVideo.description || '',
              video_url: selectedVideo.youtube_url || '',
              category: selectedVideo.category || 'SKILLS',
              duration_seconds: (selectedVideo.duration_minutes || 0) * 60,
            }}
            onUpdateVideo={handleUpdateVideo}
          />
          <DeleteVideoDialog
            open={isDeleteVideoOpen}
            onOpenChange={setIsDeleteVideoOpen}
            videoId={selectedVideo.id}
          />
        </>
      )}
    </div>
  );
}
