/**
 * @file LearningManagementScreen.tsx
 * @domain ADMIN - Learning Management
 * @description Complete learning content management with test builder
 * @version v4.4.0 Phase 2 - Desktop + Mobile Responsive
 */

import { useState, lazy, Suspense, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Checkbox } from '../../components/ui/checkbox';
import { Label } from '../../components/ui/label';
import { 
  Play, 
  ClipboardList, 
  BookOpen, 
  Plus,
  Sparkles,
  Video,
  GraduationCap,
  Search,
  Book,
  Building2,
  MapPin,
  Award,
  Filter,
  Database,
  Globe,
  CheckCircle2
} from '../../components/icons/BrowoKoIcons';
import { Headphones } from 'lucide-react';
import { useLearningStore } from '../../stores/BrowoKo_learningStore';
import { useAuthStore } from '../../stores/BrowoKo_authStore';
import { useBrowoKo_TrainingCompliance } from '../../hooks/BrowoKo_useTrainingCompliance';
import { BrowoKo_TrainingProgressTable } from '../../components/admin/BrowoKo_TrainingProgressTable';
import { BrowoKo_ExternalTrainingsTable } from '../../components/admin/BrowoKo_ExternalTrainingsTable';
import { BrowoKo_AddExternalTrainingDialog } from '../../components/admin/BrowoKo_AddExternalTrainingDialog';
import CreateVideoDialog from '../../components/CreateVideoDialog';
import EditVideoDialog from '../../components/EditVideoDialog';
import DeleteVideoDialog from '../../components/DeleteVideoDialog';
import VideoListItem from '../../components/BrowoKo_VideoListItem';
import { LearningEmptyState } from '../../components/BrowoKo_LearningEmptyState';
import LoadingState from '../../components/LoadingState';
import { BrowoKo_CreateWikiArticleDialog } from '../../components/BrowoKo_CreateWikiArticleDialog';
import { BrowoKo_EditWikiArticleDialog } from '../../components/BrowoKo_EditWikiArticleDialog';
import { BrowoKo_WikiArticleCard } from '../../components/BrowoKo_WikiArticleCard';
import { BrowoKo_WikiArticleView } from '../../components/BrowoKo_WikiArticleView';
import { BrowoKo_WikiSearchResults } from '../../components/BrowoKo_WikiSearchResults';
import { BrowoKo_TestsList } from '../../components/BrowoKo_TestsList';
import { BrowoKo_TestSubmissionsList } from '../../components/BrowoKo_TestSubmissionsList';
import { 
  getWikiArticles, 
  deleteWikiArticle, 
  type WikiArticle,
  type RAGAccessType,
  getSpecializations 
} from '../../services/BrowoKo_wikiService';
import { supabase } from '../../utils/supabase/client';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';

// Lazy load AvatarSystemAdminScreen
const AvatarSystemAdminScreen = lazy(() => import('./AvatarSystemAdminScreen'));

export default function LearningManagementScreen() {
  const [activeTab, setActiveTab] = useState<'overview' | 'videos' | 'tests' | 'units' | 'avatar' | 'wiki'>('overview');
  const [overviewSubTab, setOverviewSubTab] = useState<'videos' | 'tests' | 'units' | 'other'>('videos');
  const [isCreateVideoOpen, setIsCreateVideoOpen] = useState(false);
  const [isEditVideoOpen, setIsEditVideoOpen] = useState(false);
  const [isDeleteVideoOpen, setIsDeleteVideoOpen] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  
  // Training Compliance states
  const [isAddExternalTrainingOpen, setIsAddExternalTrainingOpen] = useState(false);
  const [editingExternalTraining, setEditingExternalTraining] = useState<any>(null);
  
  // Search states
  const [videoSearch, setVideoSearch] = useState('');
  const [testSearch, setTestSearch] = useState('');
  const [unitSearch, setUnitSearch] = useState('');
  const [wikiSearch, setWikiSearch] = useState('');
  
  // Wiki states
  const [isCreateWikiOpen, setIsCreateWikiOpen] = useState(false);
  const [isEditWikiOpen, setIsEditWikiOpen] = useState(false);
  const [wikiArticles, setWikiArticles] = useState<WikiArticle[]>([]);
  const [filteredWikiArticles, setFilteredWikiArticles] = useState<WikiArticle[]>([]);
  const [selectedWikiArticle, setSelectedWikiArticle] = useState<WikiArticle | null>(null);
  const [isViewWikiOpen, setIsViewWikiOpen] = useState(false);
  const [isDeleteWikiOpen, setIsDeleteWikiOpen] = useState(false);
  const [wikiArticleToDelete, setWikiArticleToDelete] = useState<WikiArticle | null>(null);
  const [wikiLoading, setWikiLoading] = useState(false);
  
  // Wiki filter states
  const [wikiFilterTab, setWikiFilterTab] = useState<'all' | 'department' | 'location' | 'specialization' | 'advanced'>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>('');
  const [departments, setDepartments] = useState<Array<{id: string, name: string}>>([]);
  const [locations, setLocations] = useState<Array<{id: string, name: string}>>([]);
  const [specializations, setSpecializations] = useState<string[]>([]);
  
  // NEW: Advanced filter states
  const [selectedRagTypes, setSelectedRagTypes] = useState<string[]>([]);
  const [minCharacters, setMinCharacters] = useState<string>('');
  const [maxCharacters, setMaxCharacters] = useState<string>('');
  const [minStorage, setMinStorage] = useState<string>('');
  const [maxStorage, setMaxStorage] = useState<string>('');
  const [editedAfter, setEditedAfter] = useState<string>('');
  const [viewedAfter, setViewedAfter] = useState<string>('');
  const [createdAfter, setCreatedAfter] = useState<string>('');
  const [editedBy, setEditedBy] = useState<string>('');
  const [createdBy, setCreatedBy] = useState<string>('');
  const [employees, setEmployees] = useState<Array<{id: string, full_name: string}>>([]);
  const [employeeSearchEditedBy, setEmployeeSearchEditedBy] = useState<string>('');
  const [employeeSearchCreatedBy, setEmployeeSearchCreatedBy] = useState<string>('');

  // Test sub-tab states
  const [testSubTab, setTestSubTab] = useState<'created' | 'submissions' | 'templates'>('created');
  
  // Get videos, tests and auth from stores
  const { videos, tests, loadVideos, loadTests, createVideo, updateVideo, deleteVideo } = useLearningStore();
  const { profile } = useAuthStore();
  const isAdmin = profile?.role === 'HR' || profile?.role === 'ADMIN' || profile?.role === 'SUPERADMIN';
  
  // Training Compliance hook
  const {
    videosProgress,
    testsProgress,
    externalTrainings,
    loadingVideos,
    loadingTests,
    loadingExternal,
    fetchVideosProgress,
    fetchTestsProgress,
    fetchExternalTrainings,
    deleteExternalTraining,
  } = useBrowoKo_TrainingCompliance();

  // Load videos and tests on component mount
  useEffect(() => {
    console.log('🔄 [LearningManagementScreen] Loading videos and tests...');
    loadVideos();
    loadTests();
  }, []);
  
  // Load training compliance data when overview tab is active
  useEffect(() => {
    if (activeTab === 'overview') {
      if (overviewSubTab === 'videos') {
        fetchVideosProgress();
      } else if (overviewSubTab === 'tests') {
        fetchTestsProgress();
      } else if (overviewSubTab === 'other') {
        fetchExternalTrainings();
      }
    }
  }, [activeTab, overviewSubTab]);

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
      organization_id: profile?.organization_id, // ✅ FIXED: Add organization_id!
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
  
  // Load wiki articles
  useEffect(() => {
    if (activeTab === 'wiki') {
      loadWikiArticles();
      loadWikiFilters();
    }
  }, [activeTab]);
  
  const loadWikiArticles = async () => {
    setWikiLoading(true);
    try {
      // Build filter object with all active filters
      const filters: any = {};
      
      // Full-text search
      if (wikiSearch.trim()) {
        filters.search = wikiSearch.trim();
      }
      
      // Department/Location/Specialization (handled client-side in filterWikiArticles)
      
      // Advanced filters
      if (selectedRagTypes.length > 0) {
        filters.rag_types = selectedRagTypes as RAGAccessType[];
      }
      if (minCharacters) {
        filters.min_characters = parseInt(minCharacters);
      }
      if (maxCharacters) {
        filters.max_characters = parseInt(maxCharacters);
      }
      if (minStorage) {
        filters.min_storage = parseInt(minStorage) * 1024; // Convert KB to bytes
      }
      if (maxStorage) {
        filters.max_storage = parseInt(maxStorage) * 1024; // Convert KB to bytes
      }
      if (editedAfter) {
        filters.edited_after = new Date(editedAfter).toISOString();
      }
      if (viewedAfter) {
        filters.viewed_after = new Date(viewedAfter).toISOString();
      }
      if (createdAfter) {
        filters.created_after = new Date(createdAfter).toISOString();
      }
      if (editedBy) {
        filters.edited_by = editedBy;
      }
      if (createdBy) {
        filters.created_by = createdBy;
      }
      
      const articles = await getWikiArticles(Object.keys(filters).length > 0 ? filters : undefined);
      setWikiArticles(articles);
      filterWikiArticles(articles);
    } catch (error) {
      console.error('Error loading wiki articles:', error);
      toast.error('Fehler beim Laden der Wiki-Artikel');
    } finally {
      setWikiLoading(false);
    }
  };
  
  const loadWikiFilters = async () => {
    try {
      const [deptResult, locResult, specs, employeesResult] = await Promise.all([
        supabase.from('departments').select('id, name').order('name'),
        supabase.from('locations').select('id, name').order('name'),
        getSpecializations(),
        supabase.from('users').select('id, first_name, last_name').order('last_name')
      ]);
      
      if (deptResult.data) setDepartments(deptResult.data);
      if (locResult.data) setLocations(locResult.data);
      setSpecializations(specs);
      if (employeesResult.data) {
        setEmployees(employeesResult.data.map(emp => ({
          id: emp.id,
          full_name: `${emp.first_name} ${emp.last_name}`
        })));
      }
    } catch (error) {
      console.error('Error loading wiki filters:', error);
    }
  };
  
  const filterWikiArticles = (articles: WikiArticle[]) => {
    let filtered = articles;
    
    // NOTE: Search is now handled by PostgreSQL Full-Text Search in loadWikiArticles()
    // No need for client-side search filtering anymore
    
    // Department filter
    if (wikiFilterTab === 'department' && selectedDepartment) {
      filtered = filtered.filter(article =>
        article.departments?.some(d => d.id === selectedDepartment)
      );
    }
    
    // Location filter
    if (wikiFilterTab === 'location' && selectedLocation) {
      filtered = filtered.filter(article =>
        article.locations?.some(l => l.id === selectedLocation)
      );
    }
    
    // Specialization filter
    if (wikiFilterTab === 'specialization' && selectedSpecialization) {
      filtered = filtered.filter(article =>
        article.specializations?.includes(selectedSpecialization)
      );
    }
    
    setFilteredWikiArticles(filtered);
  };
  
  useEffect(() => {
    // Reload articles when search changes (triggers PostgreSQL FTS)
    if (activeTab === 'wiki') {
      loadWikiArticles();
    }
  }, [wikiSearch]);
  
  useEffect(() => {
    // Re-filter when filters change (client-side)
    filterWikiArticles(wikiArticles);
  }, [wikiFilterTab, selectedDepartment, selectedLocation, selectedSpecialization, wikiArticles]);
  
  useEffect(() => {
    // Reload articles when advanced filters change
    if (activeTab === 'wiki') {
      loadWikiArticles();
    }
  }, [selectedRagTypes, minCharacters, maxCharacters, minStorage, maxStorage, editedAfter, viewedAfter, createdAfter]);
  
  const handleViewWikiArticle = (article: WikiArticle) => {
    setSelectedWikiArticle(article);
    setIsViewWikiOpen(true);
  };
  
  const handleEditWikiArticle = (article: WikiArticle) => {
    setSelectedWikiArticle(article);
    setIsEditWikiOpen(true);
  };
  
  const handleDeleteWikiArticle = (article: WikiArticle) => {
    setWikiArticleToDelete(article);
    setIsDeleteWikiOpen(true);
  };
  
  const confirmDeleteWikiArticle = async () => {
    if (!wikiArticleToDelete) return;
    
    try {
      await deleteWikiArticle(wikiArticleToDelete.id);
      toast.success('Wiki-Artikel gelöscht');
      setIsDeleteWikiOpen(false);
      setWikiArticleToDelete(null);
      loadWikiArticles();
    } catch (error) {
      console.error('Error deleting wiki article:', error);
      toast.error('Fehler beim Löschen');
    }
  };

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
            {activeTab === 'wiki' && (
              <Button 
                className="w-full md:w-auto btn-touch"
                onClick={() => setIsCreateWikiOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Wiki-Artikel erstellen</span>
                <span className="sm:hidden">Artikel</span>
              </Button>
            )}
          </div>
        </div>

        {/* Tabs - Mobile Responsive */}
        <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="w-full">
          {/* Mobile: Scrollable, Desktop: 1 Row */}
          <TabsList className="grid grid-cols-3 md:grid-cols-6 h-auto w-full">
            <TabsTrigger value="overview" className="flex items-center justify-center gap-2 py-3 px-2 text-xs sm:text-sm">
              <Database className="w-4 h-4 flex-shrink-0" />
              <span>Übersicht</span>
            </TabsTrigger>
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
            <TabsTrigger value="wiki" className="flex items-center justify-center gap-2 py-3 px-2 text-xs sm:text-sm">
              <Book className="w-4 h-4 flex-shrink-0" />
              <span>Wiki</span>
            </TabsTrigger>
            <TabsTrigger value="avatar" className="flex items-center justify-center gap-2 py-3 px-2 text-xs sm:text-sm">
              <Sparkles className="w-4 h-4 flex-shrink-0" />
              <span>Avatar</span>
            </TabsTrigger>
          </TabsList>

          {/* Übersicht Tab - NEW! */}
          <TabsContent value="overview" className="space-y-4 md:space-y-6 mt-6">
            {/* Overview Sub-Tabs */}
            <Tabs value={overviewSubTab} onValueChange={(value: any) => setOverviewSubTab(value)} className="w-full">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
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
                <TabsTrigger value="other" className="flex items-center justify-center gap-2 py-3 px-2 text-xs sm:text-sm">
                  <BookOpen className="w-4 h-4 flex-shrink-0" />
                  <span>Sonstige</span>
                </TabsTrigger>
              </TabsList>

              {/* Videos Overview - Training Compliance */}
              <TabsContent value="videos" className="mt-6">
                <BrowoKo_TrainingProgressTable 
                  type="videos"
                  data={videosProgress}
                  loading={loadingVideos}
                />
              </TabsContent>

              {/* Tests Overview - Training Compliance */}
              <TabsContent value="tests" className="mt-6">
                <BrowoKo_TrainingProgressTable 
                  type="tests"
                  data={testsProgress}
                  loading={loadingTests}
                />
              </TabsContent>

              {/* Lerneinheiten Overview */}
              <TabsContent value="units" className="mt-6">
                <Card className="mobile-card md:desktop-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-blue-600" />
                      Lerneinheiten Übersicht
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center text-gray-400 py-12">
                      <GraduationCap className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">Lerneinheiten</p>
                      <p className="text-sm">Hier werden Statistiken zu Lerneinheiten angezeigt</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Sonstige Overview - External Trainings */}
              <TabsContent value="other" className="mt-6">
                <BrowoKo_ExternalTrainingsTable
                  data={externalTrainings}
                  loading={loadingExternal}
                  onAdd={() => {
                    setEditingExternalTraining(null);
                    setIsAddExternalTrainingOpen(true);
                  }}
                  onEdit={(training) => {
                    setEditingExternalTraining(training);
                    setIsAddExternalTrainingOpen(true);
                  }}
                  onDelete={deleteExternalTraining}
                />
              </TabsContent>
            </Tabs>
          </TabsContent>

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
            <Tabs value={testSubTab} onValueChange={(value: any) => setTestSubTab(value)} className="w-full">
              <TabsList className="grid w-full max-w-2xl grid-cols-3">
                <TabsTrigger value="created">
                  <ClipboardList className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Erstellte Tests</span>
                  <span className="sm:hidden">Tests</span>
                </TabsTrigger>
                <TabsTrigger value="submissions">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Abgegebene Tests</span>
                  <span className="sm:hidden">Abgegeben</span>
                </TabsTrigger>
                <TabsTrigger value="templates">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Templates
                </TabsTrigger>
              </TabsList>

              <TabsContent value="created" className="mt-6">
                <BrowoKo_TestsList />
              </TabsContent>

              <TabsContent value="submissions" className="mt-6">
                <BrowoKo_TestSubmissionsList isActive={testSubTab === 'submissions'} />
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
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-blue-600" />
                  Lerneinheiten
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-gray-400 py-12">
                  <GraduationCap className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Noch keine Lerneinheiten erstellt</p>
                  <p className="text-sm">Organisiere Videos und Tests in strukturierten Lerneinheiten</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Avatar System Tab */}
          <TabsContent value="avatar" className="space-y-4 md:space-y-6 mt-6">
            <Suspense fallback={<LoadingState message="Lade Avatar-System..." />}>
              <AvatarSystemAdminScreen />
            </Suspense>
          </TabsContent>

          {/* Wiki Tab */}
          <TabsContent value="wiki" className="space-y-4 md:space-y-6 mt-6">
            {/* Wiki Search Bar */}
            <Card className="mobile-card md:desktop-card">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <CardTitle className="flex items-center gap-2">
                    <Book className="w-5 h-5 text-blue-600" />
                    Wiki-Verwaltung
                  </CardTitle>
                  
                  {/* Search Bar */}
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Wiki durchsuchen..."
                      value={wikiSearch}
                      onChange={(e) => setWikiSearch(e.target.value)}
                      className="pl-10 w-full"
                    />
                  </div>
                </div>
              </CardHeader>
            </Card>
            
            {/* Filter Tabs */}
            <Card className="mobile-card md:desktop-card">
              <CardHeader className="py-2 pb-3">
                <CardTitle className="text-base">Filter</CardTitle>
              </CardHeader>
              <CardContent className="py-0 pb-3">
                <Tabs value={wikiFilterTab} onValueChange={(value: any) => setWikiFilterTab(value)}>
                  <TabsList className="grid w-full grid-cols-5 h-8 mb-2">
                    <TabsTrigger value="all" className="text-xs py-1">Alle</TabsTrigger>
                    <TabsTrigger value="department" className="text-xs py-1">
                      <Building2 className="w-3 h-3 mr-1" />
                      <span className="hidden sm:inline">Abt.</span>
                    </TabsTrigger>
                    <TabsTrigger value="location" className="text-xs py-1">
                      <MapPin className="w-3 h-3 mr-1" />
                      <span className="hidden sm:inline">Ort</span>
                    </TabsTrigger>
                    <TabsTrigger value="specialization" className="text-xs py-1">
                      <Award className="w-3 h-3 mr-1" />
                      <span className="hidden sm:inline">Spez.</span>
                    </TabsTrigger>
                    <TabsTrigger value="advanced" className="text-xs py-1">
                      <Filter className="w-3 h-3 mr-1" />
                      <span className="hidden sm:inline">Mehr</span>
                    </TabsTrigger>
                  </TabsList>
                  
                  {/* Filter Selects */}
                  <div>
                    {wikiFilterTab === 'department' && (
                      <select
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs"
                      >
                        <option value="">Alle Abteilungen</option>
                        {departments.map(dept => (
                          <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                      </select>
                    )}
                    {wikiFilterTab === 'location' && (
                      <select
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs"
                      >
                        <option value="">Alle Standorte</option>
                        {locations.map(loc => (
                          <option key={loc.id} value={loc.id}>{loc.name}</option>
                        ))}
                      </select>
                    )}
                    {wikiFilterTab === 'specialization' && (
                      <select
                        value={selectedSpecialization}
                        onChange={(e) => setSelectedSpecialization(e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs"
                      >
                        <option value="">Alle Spezialisierungen</option>
                        {specializations.map(spec => (
                          <option key={spec} value={spec}>{spec}</option>
                        ))}
                      </select>
                    )}
                    
                    {/* Advanced Filters */}
                    {wikiFilterTab === 'advanced' && (
                      <div className="space-y-2">
                        {/* Two Column Grid: RAG Types + Zeichen/Größe */}
                        <div className="grid grid-cols-2 gap-3">
                          {/* Left Column: RAG Types */}
                          <div className="space-y-1">
                            <Label className="flex items-center gap-1 text-xs">
                              <Database className="w-3 h-3" />
                              RAG Typen
                            </Label>
                            <div className="space-y-1 pl-2">
                              <div className="flex items-center gap-1.5">
                                <Checkbox
                                  id="rag-intern"
                                  className="h-3 w-3"
                                  checked={selectedRagTypes.includes('INTERN_WIKI')}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedRagTypes([...selectedRagTypes, 'INTERN_WIKI']);
                                    } else {
                                      setSelectedRagTypes(selectedRagTypes.filter(t => t !== 'INTERN_WIKI'));
                                    }
                                  }}
                                />
                                <Label htmlFor="rag-intern" className="flex items-center gap-1 cursor-pointer text-xs">
                                  <Database className="w-2.5 h-2.5 text-blue-600" />
                                  Intern
                                </Label>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Checkbox
                                  id="rag-website"
                                  className="h-3 w-3"
                                  checked={selectedRagTypes.includes('WEBSITE_RAG')}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedRagTypes([...selectedRagTypes, 'WEBSITE_RAG']);
                                    } else {
                                      setSelectedRagTypes(selectedRagTypes.filter(t => t !== 'WEBSITE_RAG'));
                                    }
                                  }}
                                />
                                <Label htmlFor="rag-website" className="flex items-center gap-1 cursor-pointer text-xs">
                                  <Globe className="w-2.5 h-2.5 text-green-600" />
                                  Website
                                </Label>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Checkbox
                                  id="rag-hotline"
                                  className="h-3 w-3"
                                  checked={selectedRagTypes.includes('HOTLINE_RAG')}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedRagTypes([...selectedRagTypes, 'HOTLINE_RAG']);
                                    } else {
                                      setSelectedRagTypes(selectedRagTypes.filter(t => t !== 'HOTLINE_RAG'));
                                    }
                                  }}
                                />
                                <Label htmlFor="rag-hotline" className="flex items-center gap-1 cursor-pointer text-xs">
                                  <Headphones className="w-2.5 h-2.5 text-purple-600" />
                                  Hotline
                                </Label>
                              </div>
                            </div>
                          </div>
                          
                          {/* Right Column: Zeichen + Größe */}
                          <div className="space-y-2">
                            {/* Character Count Range */}
                            <div className="space-y-1">
                              <Label className="text-xs">Zeichen</Label>
                              <div className="grid grid-cols-2 gap-1">
                                <Input
                                  type="number"
                                  placeholder="Min"
                                  className="h-7 text-xs px-2"
                                  value={minCharacters}
                                  onChange={(e) => setMinCharacters(e.target.value)}
                                />
                                <Input
                                  type="number"
                                  placeholder="Max"
                                  className="h-7 text-xs px-2"
                                  value={maxCharacters}
                                  onChange={(e) => setMaxCharacters(e.target.value)}
                                />
                              </div>
                            </div>
                            
                            {/* Storage Size Range (in KB) */}
                            <div className="space-y-1">
                              <Label className="text-xs">Größe (KB)</Label>
                              <div className="grid grid-cols-2 gap-1">
                                <Input
                                  type="number"
                                  placeholder="Min"
                                  className="h-7 text-xs px-2"
                                  value={minStorage}
                                  onChange={(e) => setMinStorage(e.target.value)}
                                />
                                <Input
                                  type="number"
                                  placeholder="Max"
                                  className="h-7 text-xs px-2"
                                  value={maxStorage}
                                  onChange={(e) => setMaxStorage(e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Three Date Filters in One Row */}
                        <div className="grid grid-cols-3 gap-1.5">
                          <div className="space-y-0.5">
                            <Label className="text-[10px]">Bearbeitet nach</Label>
                            <Input
                              type="date"
                              className="h-7 text-xs px-1.5"
                              value={editedAfter}
                              onChange={(e) => setEditedAfter(e.target.value)}
                            />
                          </div>
                          <div className="space-y-0.5">
                            <Label className="text-[10px]">Angesehen nach</Label>
                            <Input
                              type="date"
                              className="h-7 text-xs px-1.5"
                              value={viewedAfter}
                              onChange={(e) => setViewedAfter(e.target.value)}
                            />
                          </div>
                          <div className="space-y-0.5">
                            <Label className="text-[10px]">Erstellt nach</Label>
                            <Input
                              type="date"
                              className="h-7 text-xs px-1.5"
                              value={createdAfter}
                              onChange={(e) => setCreatedAfter(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </Tabs>
              </CardContent>
            </Card>
            
            {/* Articles Grid or Search Results */}
            <Card className="mobile-card md:desktop-card">
              <CardContent className="py-6">
                {wikiLoading ? (
                  <LoadingState message="Lade Wiki-Artikel..." />
                ) : wikiSearch.trim() ? (
                  /* Show Search Results */
                  <BrowoKo_WikiSearchResults
                    articles={filteredWikiArticles}
                    searchQuery={wikiSearch}
                    onView={handleViewWikiArticle}
                    onEdit={handleEditWikiArticle}
                    onDelete={handleDeleteWikiArticle}
                    isAdmin={true}
                  />
                ) : (filteredWikiArticles?.length || 0) === 0 ? (
                  <div className="text-center text-gray-400 py-12">
                    <Book className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">
                      {(wikiArticles?.length || 0) === 0 ? 'Noch keine Wiki-Artikel' : 'Keine Artikel gefunden'}
                    </p>
                    <p className="text-sm">
                      {(wikiArticles?.length || 0) === 0 
                        ? 'Erstelle deinen ersten Wiki-Artikel'
                        : 'Versuche einen anderen Filter oder Suchbegriff'
                      }
                    </p>
                  </div>
                ) : (
                  /* Show Card Grid (no search) */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredWikiArticles.map(article => (
                      <BrowoKo_WikiArticleCard
                        key={article.id}
                        article={article}
                        onView={handleViewWikiArticle}
                        onEdit={handleEditWikiArticle}
                        onDelete={handleDeleteWikiArticle}
                        isAdmin={true}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
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
      
      {/* Wiki Dialogs */}
      <BrowoKo_CreateWikiArticleDialog
        open={isCreateWikiOpen}
        onOpenChange={setIsCreateWikiOpen}
        onSuccess={loadWikiArticles}
      />
      
      <BrowoKo_EditWikiArticleDialog
        open={isEditWikiOpen}
        onOpenChange={setIsEditWikiOpen}
        onSuccess={loadWikiArticles}
        article={selectedWikiArticle}
      />
      
      <BrowoKo_WikiArticleView
        article={selectedWikiArticle}
        open={isViewWikiOpen}
        onOpenChange={setIsViewWikiOpen}
      />
      
      <AlertDialog open={isDeleteWikiOpen} onOpenChange={setIsDeleteWikiOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Wiki-Artikel löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie den Artikel "{wikiArticleToDelete?.title}" wirklich löschen? 
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteWikiArticle} className="bg-red-600 hover:bg-red-700">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* External Training Dialog */}
      <BrowoKo_AddExternalTrainingDialog
        open={isAddExternalTrainingOpen}
        onOpenChange={setIsAddExternalTrainingOpen}
        onSuccess={() => {
          fetchExternalTrainings();
          setEditingExternalTraining(null);
        }}
        editData={editingExternalTraining}
      />
    </div>
  );
}