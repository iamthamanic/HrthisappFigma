import { BrowoKo_WikiSearchResults } from '../components/BrowoKo_WikiSearchResults';
import { BrowoKo_WikiSearchBar } from '../components/BrowoKo_WikiSearchBar';
import { BrowoKo_WikiArticleView } from '../components/BrowoKo_WikiArticleView';
import { getWikiArticles, WikiArticle, getSpecializations, type RAGAccessType } from '../services/BrowoKo_wikiService';
import { supabase } from '../utils/supabase/client';
import { toast } from 'sonner';
import { Award, Play, FileText, Building2, MapPin, Filter, Database, Globe } from '../components/icons/BrowoKoIcons';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { Search, Headphones } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import LoadingState from '../components/LoadingState';
import { VideoCardWithProgress } from '../components/BrowoKo_VideoCardWithProgress';
import { QuizCard } from '../components/BrowoKo_QuizCard';
import { LearningEmptyState } from '../components/BrowoKo_LearningEmptyState';
import BrowoKo_LearningAvatarWidget from '../components/BrowoKo_LearningAvatarWidget';
import { useLearningScreen } from '../hooks/BrowoKo_useLearningScreen';
import { useAuthStore } from '../stores/BrowoKo_authStore';

type TabValue = 'videos' | 'tests' | 'lerneinheiten' | 'wiki' | 'avatar';
type TestSubTabValue = 'all' | 'started' | 'submitted' | 'passed';
type VideoSubTabValue = 'all' | 'started' | 'finished';
type LerneinheitenSubTabValue = 'all' | 'started' | 'submitted' | 'passed';

export default function LearningScreen() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabValue>('videos');
  const [testSubTab, setTestSubTab] = useState<TestSubTabValue>('all');
  const [testSearchQuery, setTestSearchQuery] = useState('');
  const [videoSubTab, setVideoSubTab] = useState<VideoSubTabValue>('all');
  const [videoSearchQuery, setVideoSearchQuery] = useState('');
  const [lerneinheitenSubTab, setLerneinheitenSubTab] = useState<LerneinheitenSubTabValue>('all');
  const [lerneinheitenSearchQuery, setLerneinheitenSearchQuery] = useState('');
  
  // Wiki State
  const [wikiSearchQuery, setWikiSearchQuery] = useState('');
  const [wikiResults, setWikiResults] = useState<WikiArticle[]>([]);
  const [wikiLoading, setWikiLoading] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<WikiArticle | null>(null);
  
  // Wiki filter states
  const [wikiFilterTab, setWikiFilterTab] = useState<'all' | 'department' | 'location' | 'specialization' | 'advanced'>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>('');
  const [departments, setDepartments] = useState<Array<{id: string, name: string}>>([]);
  const [locations, setLocations] = useState<Array<{id: string, name: string}>>([]);
  const [specializations, setSpecializations] = useState<string[]>([]);
  
  // Advanced filter states
  const [selectedRagTypes, setSelectedRagTypes] = useState<string[]>([]);
  const [minCharacters, setMinCharacters] = useState<string>('');
  const [maxCharacters, setMaxCharacters] = useState<string>('');
  const [minStorage, setMinStorage] = useState<string>('');
  const [maxStorage, setMaxStorage] = useState<string>('');
  const [editedAfter, setEditedAfter] = useState<string>('');
  const [viewedAfter, setViewedAfter] = useState<string>('');
  const [createdAfter, setCreatedAfter] = useState<string>('');
  
  const {
    videos,
    quizzes,
    tests,
    categorizedQuizzes,
    coins,
    xp,
    isAdmin,
    getVideoProgressPercentage,
    isVideoCompleted,
    completedVideosCount,
    loading
  } = useLearningScreen();

  // Load all wiki articles initially when Wiki tab is opened
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
      if (wikiSearchQuery.trim()) {
        filters.search = wikiSearchQuery.trim();
      }
      
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
      
      const articles = await getWikiArticles(Object.keys(filters).length > 0 ? filters : undefined);
      filterWikiArticles(articles);
    } catch (error) {
      console.error('Error loading wiki articles:', error);
      toast.error('Fehler beim Laden der Wiki-Artikel');
      setWikiResults([]);
    } finally {
      setWikiLoading(false);
    }
  };
  
  const loadWikiFilters = async () => {
    try {
      const [deptResult, locResult, specs] = await Promise.all([
        supabase.from('departments').select('id, name').order('name'),
        supabase.from('locations').select('id, name').order('name'),
        getSpecializations()
      ]);
      
      if (deptResult.data) setDepartments(deptResult.data);
      if (locResult.data) setLocations(locResult.data);
      setSpecializations(specs);
    } catch (error) {
      console.error('Error loading wiki filters:', error);
    }
  };
  
  const filterWikiArticles = (articles: WikiArticle[]) => {
    let filtered = articles;
    
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
    
    setWikiResults(filtered);
  };
  
  useEffect(() => {
    // Reload articles when search changes (triggers PostgreSQL FTS)
    if (activeTab === 'wiki') {
      loadWikiArticles();
    }
  }, [wikiSearchQuery, selectedRagTypes, minCharacters, maxCharacters, minStorage, maxStorage, editedAfter, viewedAfter, createdAfter]);
  
  useEffect(() => {
    // Re-filter when filter tabs change (client-side)
    if (activeTab === 'wiki' && wikiResults.length > 0) {
      const allArticles = wikiResults;
      filterWikiArticles(allArticles);
    }
  }, [wikiFilterTab, selectedDepartment, selectedLocation, selectedSpecialization]);
  
  const handleWikiSearch = (query: string) => {
    setWikiSearchQuery(query);
  };
  
  const handleSelectArticle = (article: WikiArticle) => {
    setSelectedArticle(article);
  };

  // Early return AFTER all hooks
  if (loading) {
    return <LoadingState loading={true} type="skeleton" skeletonType="card" />;
  }

  // Total counts for stats
  const totalTests = tests.length;
  const totalQuizzes = quizzes.length;

  return (
    <div className="min-h-screen pt-20 md:pt-6 px-4 md:px-6">
      {/* ✅ MAX-WIDTH CONTAINER */}
      <div className="max-w-7xl mx-auto space-y-6">
      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Lernzentrum</h1>
          <p className="text-sm text-gray-500 mt-1">
            Erweitere dein Wissen und sammle Belohnungen
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Avatar Widget (v3.9.0) */}
          <BrowoKo_LearningAvatarWidget />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="tests">Tests</TabsTrigger>
          <TabsTrigger value="lerneinheiten">Lerneinheiten</TabsTrigger>
          <TabsTrigger value="wiki">Wiki</TabsTrigger>
          <TabsTrigger value="avatar">Avatar</TabsTrigger>
        </TabsList>

        {/* ========================================
            TAB: VIDEOS
        ======================================== */}
        <TabsContent value="videos" className="mt-6">
          <div className="space-y-4">
            {/* Subbar: Search + Sub-Tabs - IMMER SICHTBAR */}
            <div className="space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Videos durchsuchen..."
                  value={videoSearchQuery}
                  onChange={(e) => setVideoSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Sub-Tabs */}
              <Tabs value={videoSubTab} onValueChange={(value: any) => setVideoSubTab(value)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">Alle</TabsTrigger>
                  <TabsTrigger value="started">Angefangen</TabsTrigger>
                  <TabsTrigger value="finished">Abgeschlossen</TabsTrigger>
                </TabsList>

                {/* Sub-Tab: Alle */}
                <TabsContent value="all" className="mt-4">
                  {videos.length === 0 ? (
                    <LearningEmptyState type="videos" isAdmin={false} />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {videos
                        .filter((video) => 
                          video.title.toLowerCase().includes(videoSearchQuery.toLowerCase()) ||
                          video.description?.toLowerCase().includes(videoSearchQuery.toLowerCase())
                        )
                        .map((video) => (
                          <VideoCardWithProgress
                            key={video.id}
                            video={video}
                            progressPercentage={getVideoProgressPercentage(video.id)}
                            isCompleted={isVideoCompleted(video.id)}
                            showThumbnail={true}
                          />
                        ))}
                    </div>
                  )}
                </TabsContent>

                {/* Sub-Tab: Angefangen */}
                <TabsContent value="started" className="mt-4">
                  <div className="text-center text-gray-400 py-12">
                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">Keine angefangenen Videos</p>
                    <p className="text-sm">Videos, die du begonnen hast, werden hier angezeigt</p>
                  </div>
                </TabsContent>

                {/* Sub-Tab: Abgeschlossen */}
                <TabsContent value="finished" className="mt-4">
                  <div className="text-center text-gray-400 py-12">
                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">Keine abgeschlossenen Videos</p>
                    <p className="text-sm">Abgeschlossene Videos werden hier angezeigt</p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </TabsContent>

        {/* ========================================
            TAB: TESTS
        ======================================== */}
        <TabsContent value="tests" className="mt-6">
          <div className="space-y-4">
            {/* Subbar: Search + Sub-Tabs - IMMER SICHTBAR */}
            <div className="space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Tests durchsuchen..."
                  value={testSearchQuery}
                  onChange={(e) => setTestSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Sub-Tabs */}
              <Tabs value={testSubTab} onValueChange={(value: any) => setTestSubTab(value)}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all">Alle</TabsTrigger>
                  <TabsTrigger value="started">Angefangen</TabsTrigger>
                  <TabsTrigger value="submitted">Abgegeben/In Review</TabsTrigger>
                  <TabsTrigger value="passed">Bestanden</TabsTrigger>
                </TabsList>

                {/* Sub-Tab: Alle */}
                <TabsContent value="all" className="mt-4">
                  {tests.length === 0 ? (
                    <div className="text-center text-gray-400 py-12">
                      <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">Noch keine Tests</p>
                      <p className="text-sm">Tests werden von Admins erstellt</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {tests
                        .filter((test) => 
                          test.title.toLowerCase().includes(testSearchQuery.toLowerCase()) ||
                          test.description?.toLowerCase().includes(testSearchQuery.toLowerCase())
                        )
                        .map((test) => (
                          <UserTestCard key={test.id} test={test} />
                        ))}
                    </div>
                  )}
                </TabsContent>

                {/* Sub-Tab: Angefangen */}
                <TabsContent value="started" className="mt-4">
                  <div className="text-center text-gray-400 py-12">
                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">Keine angefangenen Tests</p>
                    <p className="text-sm">Tests, die du begonnen hast, werden hier angezeigt</p>
                  </div>
                </TabsContent>

                {/* Sub-Tab: Abgegeben/In Review */}
                <TabsContent value="submitted" className="mt-4">
                  <div className="text-center text-gray-400 py-12">
                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">Keine abgegebenen Tests</p>
                    <p className="text-sm">Abgegebene Tests werden hier angezeigt</p>
                  </div>
                </TabsContent>

                {/* Sub-Tab: Bestanden */}
                <TabsContent value="passed" className="mt-4">
                  <div className="text-center text-gray-400 py-12">
                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">Keine bestandenen Tests</p>
                    <p className="text-sm">Erfolgreich abgeschlossene Tests werden hier angezeigt</p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </TabsContent>

        {/* ========================================
            TAB: LERNEINHEITEN
        ======================================== */}
        <TabsContent value="lerneinheiten" className="mt-6">
          <div className="space-y-4">
            {/* Subbar: Search + Sub-Tabs - IMMER SICHTBAR */}
            <div className="space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Lerneinheiten durchsuchen..."
                  value={lerneinheitenSearchQuery}
                  onChange={(e) => setLerneinheitenSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Sub-Tabs */}
              <Tabs value={lerneinheitenSubTab} onValueChange={(value: any) => setLerneinheitenSubTab(value)}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all">Alle</TabsTrigger>
                  <TabsTrigger value="started">Angefangen</TabsTrigger>
                  <TabsTrigger value="submitted">Abgegeben/In Review</TabsTrigger>
                  <TabsTrigger value="passed">Bestanden</TabsTrigger>
                </TabsList>

                {/* Sub-Tab: Alle */}
                <TabsContent value="all" className="mt-4">
                  {quizzes.length === 0 ? (
                    <div className="text-center text-gray-400 py-12">
                      <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">Noch keine Lerneinheiten</p>
                      <p className="text-sm">Lerneinheiten werden von Admins erstellt</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {quizzes
                        .filter((quiz) => 
                          quiz.title.toLowerCase().includes(lerneinheitenSearchQuery.toLowerCase()) ||
                          quiz.description?.toLowerCase().includes(lerneinheitenSearchQuery.toLowerCase())
                        )
                        .map((quiz) => (
                          <QuizCard key={quiz.id} quiz={quiz} variant={quiz.category?.toLowerCase() as any || 'skills'} />
                        ))}
                    </div>
                  )}
                </TabsContent>

                {/* Sub-Tab: Angefangen */}
                <TabsContent value="started" className="mt-4">
                  <div className="text-center text-gray-400 py-12">
                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">Keine angefangenen Lerneinheiten</p>
                    <p className="text-sm">Lerneinheiten, die du begonnen hast, werden hier angezeigt</p>
                  </div>
                </TabsContent>

                {/* Sub-Tab: Abgegeben/In Review */}
                <TabsContent value="submitted" className="mt-4">
                  <div className="text-center text-gray-400 py-12">
                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">Keine abgegebenen Lerneinheiten</p>
                    <p className="text-sm">Abgegebene Lerneinheiten werden hier angezeigt</p>
                  </div>
                </TabsContent>

                {/* Sub-Tab: Bestanden */}
                <TabsContent value="passed" className="mt-4">
                  <div className="text-center text-gray-400 py-12">
                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">Keine bestandenen Lerneinheiten</p>
                    <p className="text-sm">Erfolgreich abgeschlossene Lerneinheiten werden hier angezeigt</p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </TabsContent>

        {/* ========================================
            TAB: WIKI
        ======================================== */}
        <TabsContent value="wiki" className="mt-6">
          <div className="space-y-4">
            <BrowoKo_WikiSearchBar
              onSearch={handleWikiSearch}
            />
            
            {/* Filter Tabs */}
            <Card>
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
            
            <BrowoKo_WikiSearchResults
              results={wikiResults}
              searchQuery={wikiSearchQuery}
              loading={wikiLoading}
              onSelectArticle={handleSelectArticle}
            />
            <BrowoKo_WikiArticleView
              article={selectedArticle}
              open={selectedArticle !== null}
              onOpenChange={(open) => !open && setSelectedArticle(null)}
            />
          </div>
        </TabsContent>

        {/* ========================================
            TAB: AVATAR
        ======================================== */}
        <TabsContent value="avatar" className="mt-6">
          <div className="text-center text-gray-400 py-12">
            <Award className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Avatar-System</p>
            <p className="text-sm">Avatar-Verwaltung kommt bald</p>
          </div>
        </TabsContent>
      </Tabs>
      </div> {/* ✅ Close max-width container */}
    </div>
  );
}

/**
 * USER TEST CARD (Read-Only)
 * No edit/delete buttons - only view/start
 */
function UserTestCard({ test }: { test: any }) {
  const navigate = useNavigate();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base truncate">{test.title}</CardTitle>
            {test.description && (
              <CardDescription className="line-clamp-2 mt-1">
                {test.description}
              </CardDescription>
            )}
          </div>
          
          {test.is_mandatory && (
            <Badge variant="destructive" className="shrink-0">
              Pflicht
            </Badge>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-gray-600">
            <FileText className="w-3.5 h-3.5" />
            <span>{test.test_blocks?.length || 0} Fragen</span>
          </div>
          
          {test.pass_percentage && (
            <div className="flex items-center gap-1.5 text-gray-600">
              <Award className="w-3.5 h-3.5" />
              <span>{test.pass_percentage}% Bestehen</span>
            </div>
          )}
          
          {test.reward_coins > 0 && (
            <div className="flex items-center gap-1.5 text-gray-600">
              <Award className="w-3.5 h-3.5" />
              <span>{test.reward_coins} Coins</span>
            </div>
          )}
          
          {test.time_limit_minutes && (
            <div className="flex items-center gap-1.5 text-gray-600">
              <Play className="w-3.5 h-3.5" />
              <span>{test.time_limit_minutes} Min.</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <Button
          variant="default"
          size="sm"
          className="w-full"
          onClick={() => {
            // TODO: Navigate to test taking screen
            toast.info('Test-Durchführung kommt bald');
          }}
        >
          <Play className="w-3.5 h-3.5 mr-1.5" />
          Test starten
        </Button>
      </CardContent>
    </Card>
  );
}