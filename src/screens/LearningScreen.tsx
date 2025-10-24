import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import LoadingState from '../components/LoadingState';
import { LearningStatsGrid } from '../components/HRTHIS_LearningStatsGrid';
import { VideoCardWithProgress } from '../components/HRTHIS_VideoCardWithProgress';
import { QuizCard } from '../components/HRTHIS_QuizCard';
import { LearningEmptyState } from '../components/HRTHIS_LearningEmptyState';
import HRTHIS_LearningAvatarWidget from '../components/HRTHIS_LearningAvatarWidget';
import { useLearningScreen } from '../hooks/HRTHIS_useLearningScreen';

export default function LearningScreen() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  
  const {
    videos,
    categorizedQuizzes,
    coins,
    xp,
    isAdmin,
    getVideoProgressPercentage,
    isVideoCompleted,
    completedVideosCount,
    loading
  } = useLearningScreen();

  if (loading) {
    return <LoadingState loading={true} type="skeleton" skeletonType="card" />;
  }

  const hasNoContent = videos.length === 0 && categorizedQuizzes.mandatory.length === 0 
    && categorizedQuizzes.skills.length === 0 && categorizedQuizzes.compliance.length === 0;

  return (
    <div className="space-y-6">
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
          <HRTHIS_LearningAvatarWidget />
        </div>
      </div>

      {/* Stats */}
      <LearningStatsGrid
        videosCount={videos.length}
        quizzesCount={categorizedQuizzes.mandatory.length + categorizedQuizzes.skills.length + categorizedQuizzes.compliance.length}
        xp={xp || 0}
        completedVideosCount={completedVideosCount}
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Alle</TabsTrigger>
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="mandatory">Pflicht</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
        </TabsList>

        {/* All Tab */}
        <TabsContent value="all" className="space-y-6 mt-6">
          {hasNoContent && (
            <LearningEmptyState type="all" isAdmin={isAdmin} />
          )}

          {/* Mandatory Section */}
          {categorizedQuizzes.mandatory.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Pflicht-Schulungen
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categorizedQuizzes.mandatory.map((quiz) => (
                  <QuizCard key={quiz.id} quiz={quiz} variant="mandatory" />
                ))}
              </div>
            </div>
          )}

          {/* Videos Section */}
          {videos.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Video-Kurse
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

          {/* Skills Section */}
          {categorizedQuizzes.skills.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Skills & Entwicklung
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categorizedQuizzes.skills.map((quiz) => (
                  <QuizCard key={quiz.id} quiz={quiz} variant="skills" />
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Videos Tab */}
        <TabsContent value="videos" className="mt-6">
          {videos.length === 0 ? (
            <LearningEmptyState type="videos" isAdmin={isAdmin} />
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

        {/* Mandatory Tab */}
        <TabsContent value="mandatory" className="mt-6">
          {categorizedQuizzes.mandatory.length === 0 ? (
            <LearningEmptyState type="mandatory" isAdmin={isAdmin} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categorizedQuizzes.mandatory.map((quiz) => (
                <QuizCard key={quiz.id} quiz={quiz} variant="mandatory" />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Skills Tab */}
        <TabsContent value="skills" className="mt-6">
          {categorizedQuizzes.skills.length === 0 ? (
            <LearningEmptyState type="skills" isAdmin={isAdmin} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categorizedQuizzes.skills.map((quiz) => (
                <QuizCard key={quiz.id} quiz={quiz} variant="skills" />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
