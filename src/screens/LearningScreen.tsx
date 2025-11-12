import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import LoadingState from '../components/LoadingState';
import { LearningStatsGrid } from '../components/BrowoKo_LearningStatsGrid';
import { VideoCardWithProgress } from '../components/BrowoKo_VideoCardWithProgress';
import { QuizCard } from '../components/BrowoKo_QuizCard';
import { LearningEmptyState } from '../components/BrowoKo_LearningEmptyState';
import BrowoKo_LearningAvatarWidget from '../components/BrowoKo_LearningAvatarWidget';
import { useLearningScreen } from '../hooks/BrowoKo_useLearningScreen';
import { BrowoKo_WikiSearchBar } from '../components/BrowoKo_WikiSearchBar';
import { BrowoKo_WikiArticleCard } from '../components/BrowoKo_WikiArticleCard';
import { BrowoKo_WikiArticleView } from '../components/BrowoKo_WikiArticleView';
import { BrowoKo_WikiSearchResults } from '../components/BrowoKo_WikiSearchResults';
import { getWikiArticles, type WikiArticle } from '../services/BrowoKo_wikiService';
import { supabase } from '../utils/supabase/client';
import { toast } from 'sonner';
import { Building2, MapPin, Award, Book, Play, FileText } from '../components/icons/BrowoKoIcons';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';

type TabValue = 'all' | 'pflicht' | 'videos' | 'tests' | 'lerneinheiten' | 'wiki' | 'avatar';

export default function LearningScreen() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabValue>('all');
  
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
  
  // Wiki States
  const [wikiArticles, setWikiArticles] = useState<WikiArticle[]>([]);
  const [filteredWikiArticles, setFilteredWikiArticles] = useState<WikiArticle[]>([]);
  const [selectedWikiArticle, setSelectedWikiArticle] = useState<WikiArticle | null>(null);
  const [isViewWikiOpen, setIsViewWikiOpen] = useState(false);
  const [wikiLoading, setWikiLoading] = useState(false);
  const [wikiSearch, setWikiSearch] = useState('');
  
  // Filter states
  const [wikiFilterTab, setWikiFilterTab] = useState<'all' | 'department' | 'location' | 'specialization'>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>('');
  const [departments, setDepartments] = useState<Array<{id: string, name: string}>>([]);
  const [locations, setLocations] = useState<Array<{id: string, name: string}>>([]);
  const [specializations, setSpecializations] = useState<string[]>([]);

  // Load wiki articles when wiki tab is active
  useEffect(() => {
    if (activeTab === 'wiki') {
      loadWikiArticles();
      loadWikiFilters();
    }
  }, [activeTab]);
  
  const loadWikiArticles = async () => {
    setWikiLoading(true);
    try {
      // Use full-text search if search query exists, otherwise get all
      const filters = wikiSearch.trim() ? { search: wikiSearch.trim() } : undefined;
      const articles = await getWikiArticles(filters);
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
      const [deptResult, locResult] = await Promise.all([
        supabase.from('departments').select('id, name').order('name'),
        supabase.from('locations').select('id, name').order('name')
      ]);
      
      if (deptResult.data) setDepartments(deptResult.data);
      if (locResult.data) setLocations(locResult.data);
      
      // Get unique specializations from loaded articles
      const uniqueSpecs = new Set<string>();
      wikiArticles.forEach(article => {
        article.specializations?.forEach(spec => uniqueSpecs.add(spec));
      });
      setSpecializations(Array.from(uniqueSpecs).sort());
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
  
  const handleViewWikiArticle = (article: WikiArticle) => {
    setSelectedWikiArticle(article);
    setIsViewWikiOpen(true);
  };
  
  const handleWikiSearch = (query: string) => {
    setWikiSearch(query);
  };

  // Helper: Get mandatory content (videos, tests, lerneinheiten with is_mandatory=true)
  const getMandatoryContent = () => {
    const mandatoryVideos = videos.filter(v => v.is_mandatory);
    const mandatoryTests = tests.filter(t => t.is_mandatory);
    const mandatoryQuizzes = categorizedQuizzes.mandatory;
    
    return { videos: mandatoryVideos, tests: mandatoryTests, quizzes: mandatoryQuizzes };
  };

  // Helper: Mix all content for "Alle" tab
  const getAllMixedContent = () => {
    return {
      videos,
      tests,
      quizzes
    };
  };

  const hasNoContent = videos.length === 0 && tests.length === 0 && quizzes.length === 0;

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

      {/* Stats */}
      <LearningStatsGrid
        videosCount={videos.length}
        quizzesCount={totalTests + totalQuizzes}
        xp={xp || 0}
        completedVideosCount={completedVideosCount}
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
        <TabsList className="grid w-full grid-cols-7 lg:w-auto lg:inline-grid">
          <TabsTrigger value="all">Alle</TabsTrigger>
          <TabsTrigger value="pflicht">Pflicht</TabsTrigger>
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="tests">Tests</TabsTrigger>
          <TabsTrigger value="lerneinheiten">Lerneinheiten</TabsTrigger>
          <TabsTrigger value="wiki">Wiki</TabsTrigger>
          <TabsTrigger value="avatar">Avatar</TabsTrigger>
        </TabsList>

        {/* ========================================
            TAB: ALLE (Mixed Content)
        ======================================== */}
        <TabsContent value="all" className="space-y-6 mt-6">
          {hasNoContent && (
            <LearningEmptyState type="all" isAdmin={false} />
          )}

          {/* Videos Section */}
          {videos.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Videos
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {videos.map((video) => (
                  <VideoCardWithProgress
                    key={video.id}
                    video={video}
                    progressPercentage={getVideoProgressPercentage(video.id)}
                    isCompleted={isVideoCompleted(video.id)}
                    showThumbnail={true}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Tests Section */}
          {tests.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Tests
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tests.map((test) => (
                  <UserTestCard key={test.id} test={test} />
                ))}
              </div>
            </div>
          )}

          {/* Lerneinheiten Section */}
          {quizzes.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Lerneinheiten
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {quizzes.map((quiz) => (
                  <QuizCard key={quiz.id} quiz={quiz} variant={quiz.category?.toLowerCase() as any || 'skills'} />
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ========================================
            TAB: PFLICHT (Mandatory Content Only)
        ======================================== */}
        <TabsContent value="pflicht" className="space-y-6 mt-6">
          {(() => {
            const mandatory = getMandatoryContent();
            const hasMandatory = mandatory.videos.length > 0 || mandatory.tests.length > 0 || mandatory.quizzes.length > 0;
            
            if (!hasMandatory) {
              return (
                <div className="text-center text-gray-400 py-12">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Keine Pflichtinhalte</p>
                  <p className="text-sm">Es gibt aktuell keine Pflicht-Schulungen</p>
                </div>
              );
            }
            
            return (
              <>
                {/* Mandatory Videos */}
                {mandatory.videos.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      Pflicht-Videos
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {mandatory.videos.map((video) => (
                        <VideoCardWithProgress
                          key={video.id}
                          video={video}
                          progressPercentage={getVideoProgressPercentage(video.id)}
                          isCompleted={isVideoCompleted(video.id)}
                          showThumbnail={true}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Mandatory Tests */}
                {mandatory.tests.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      Pflicht-Tests
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {mandatory.tests.map((test) => (
                        <UserTestCard key={test.id} test={test} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Mandatory Lerneinheiten */}
                {mandatory.quizzes.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      Pflicht-Schulungen
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {mandatory.quizzes.map((quiz) => (
                        <QuizCard key={quiz.id} quiz={quiz} variant="mandatory" />
                      ))}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </TabsContent>

        {/* ========================================
            TAB: VIDEOS
        ======================================== */}
        <TabsContent value="videos" className="mt-6">
          {videos.length === 0 ? (
            <LearningEmptyState type="videos" isAdmin={false} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.map((video) => (
                <VideoCardWithProgress
                  key={video.id}
                  video={video}
                  progressPercentage={getVideoProgressPercentage(video.id)}
                  isCompleted={isVideoCompleted(video.id)}
                  showThumbnail={false}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ========================================
            TAB: TESTS
        ======================================== */}
        <TabsContent value="tests" className="mt-6">
          {tests.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Noch keine Tests</p>
              <p className="text-sm">Tests werden von Admins erstellt</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tests.map((test) => (
                <UserTestCard key={test.id} test={test} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ========================================
            TAB: LERNEINHEITEN
        ======================================== */}
        <TabsContent value="lerneinheiten" className="mt-6">
          {quizzes.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Noch keine Lerneinheiten</p>
              <p className="text-sm">Lerneinheiten werden von Admins erstellt</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quizzes.map((quiz) => (
                <QuizCard key={quiz.id} quiz={quiz} variant={quiz.category?.toLowerCase() as any || 'skills'} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ========================================
            TAB: WIKI
        ======================================== */}
        <TabsContent value="wiki" className="space-y-6 mt-6">
          {/* Search Bar */}
          <BrowoKo_WikiSearchBar
            onSearch={handleWikiSearch}
            placeholder="Wiki durchsuchen..."
          />
          
          {/* Filter Tabs */}
          <Tabs value={wikiFilterTab} onValueChange={(value: any) => setWikiFilterTab(value)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">Alle</TabsTrigger>
              <TabsTrigger value="department">
                <Building2 className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Abteilung</span>
              </TabsTrigger>
              <TabsTrigger value="location">
                <MapPin className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Standort</span>
              </TabsTrigger>
              <TabsTrigger value="specialization">
                <Award className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Spezialisierung</span>
              </TabsTrigger>
            </TabsList>
            
            {/* Filter Selects */}
            <div className="mt-4">
              {wikiFilterTab === 'department' && (
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
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
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
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
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">Alle Spezialisierungen</option>
                  {specializations.map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              )}
            </div>
          </Tabs>
          
          {/* Articles Grid or Search Results */}
          {wikiLoading ? (
            <LoadingState loading={true} type="spinner" />
          ) : wikiSearch.trim() ? (
            /* Show Search Results with Highlighting */
            <BrowoKo_WikiSearchResults
              results={filteredWikiArticles}
              searchQuery={wikiSearch}
              onSelectArticle={handleViewWikiArticle}
              loading={wikiLoading}
            />
          ) : filteredWikiArticles.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              <Book className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">
                {wikiArticles.length === 0 ? 'Noch keine Wiki-Artikel' : 'Keine Artikel gefunden'}
              </p>
              <p className="text-sm">
                {wikiArticles.length === 0 
                  ? 'Wiki-Artikel werden von Admins erstellt'
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
                  isAdmin={false}
                />
              ))}
            </div>
          )}
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
      
      {/* Wiki View Dialog */}
      <BrowoKo_WikiArticleView
        article={selectedWikiArticle}
        open={isViewWikiOpen}
        onOpenChange={setIsViewWikiOpen}
      />
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
