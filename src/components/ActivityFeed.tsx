import { useEffect, useState } from 'react';
import { Activity, Clock, Trophy, Video, HelpCircle, Award, Coins, User, TrendingUp } from './icons/BrowoKoIcons';
import { useAuthStore } from '../stores/BrowoKo_authStore';
import { supabase } from '../utils/supabase/client';
import { getServices } from '../services';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import AvatarDisplay from './AvatarDisplay';

interface ActivityEvent {
  id: string;
  user_id: string;
  type: 'VIDEO_COMPLETED' | 'QUIZ_PASSED' | 'ACHIEVEMENT_UNLOCKED' | 'LEVEL_UP' | 'COINS_EARNED' | 'TIME_TRACKED';
  title: string;
  description: string;
  metadata?: any;
  created_at: string;
  user?: {
    first_name: string;
    last_name: string;
  };
  avatar?: {
    emoji?: string;
  };
}

interface ActivityFeedProps {
  userId?: string;
  teamOnly?: boolean;
  limit?: number;
  showHeader?: boolean;
}

export default function ActivityFeed({
  userId,
  teamOnly = false,
  limit = 20,
  showHeader = true
}: ActivityFeedProps) {
  const { user, profile } = useAuthStore();
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
    
    // Subscribe to real-time updates via RealtimeService
    const services = getServices();
    const unsubscribe = services.realtime.subscribeToTable(
      'activity_feed',
      null, // No filter - all activities
      ['INSERT'],
      (payload) => {
        const newActivity = payload.new as ActivityEvent;
        setActivities(prev => [newActivity, ...prev].slice(0, limit));
      }
    );

    return () => {
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, teamOnly, limit]); // loadActivities is stable but causes re-renders

  const loadActivities = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('activity_feed')
        .select(`
          *,
          user:users!activity_feed_user_id_fkey (
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        // If table doesn't exist, just log and continue
        if (error.code === 'PGRST205' || error.message.includes('not find the table')) {
          console.log('Activity feed table not yet created. Skipping...');
          setActivities([]);
          return;
        }
        // If column doesn't exist, just log and continue
        if (error.code === '42703') {
          console.log('Column issue in activity feed. Skipping problematic columns...');
          setActivities([]);
          return;
        }
        throw error;
      }

      // Load avatar data for each user
      const activitiesWithAvatars = await Promise.all(
        (data || []).map(async (activity) => {
          try {
            const { data: avatarData } = await supabase
              .from('user_avatars')
              .select('emoji')
              .eq('user_id', activity.user_id)
              .single();
            
            return {
              ...activity,
              avatar: avatarData || undefined
            };
          } catch {
            // If avatar fetch fails, return activity without avatar
            return activity;
          }
        })
      );

      setActivities(activitiesWithAvatars);
    } catch (error) {
      console.error('Load activities error:', error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'VIDEO_COMPLETED':
        return <Video className="w-4 h-4 text-blue-600" />;
      case 'QUIZ_PASSED':
        return <HelpCircle className="w-4 h-4 text-purple-600" />;
      case 'ACHIEVEMENT_UNLOCKED':
        return <Trophy className="w-4 h-4 text-yellow-600" />;
      case 'LEVEL_UP':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'COINS_EARNED':
        return <Coins className="w-4 h-4 text-orange-600" />;
      case 'TIME_TRACKED':
        return <Clock className="w-4 h-4 text-gray-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'VIDEO_COMPLETED':
        return 'bg-blue-50 border-blue-200';
      case 'QUIZ_PASSED':
        return 'bg-purple-50 border-purple-200';
      case 'ACHIEVEMENT_UNLOCKED':
        return 'bg-yellow-50 border-yellow-200';
      case 'LEVEL_UP':
        return 'bg-green-50 border-green-200';
      case 'COINS_EARNED':
        return 'bg-orange-50 border-orange-200';
      case 'TIME_TRACKED':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <Card>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Aktivitäten
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className="p-8 text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Wird geladen...</p>
        </CardContent>
      </Card>
    );
  }

  // Show info message if no activities (could be because table doesn't exist)
  const isEmpty = activities.length === 0;

  return (
    <Card>
      {showHeader && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Aktivitäten
            {activities.length > 0 && (
              <Badge variant="outline" className="ml-auto">
                {activities.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={showHeader ? '' : 'p-0'}>
        <ScrollArea className="h-[400px]">
          {isEmpty ? (
            <div className="p-8 text-center text-gray-400">
              <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm mb-2">Keine Aktivitäten vorhanden</p>
              <p className="text-xs text-gray-400">
                💡 Tipp: Schließe Videos ab oder erreiche Achievements um Aktivitäten zu sehen
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className={`p-3 rounded-lg border transition-all hover:shadow-sm ${getActivityColor(activity.type)}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="text-sm font-medium text-gray-900">
                          {activity.title}
                        </h4>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {formatDistanceToNow(new Date(activity.created_at), {
                            addSuffix: true,
                            locale: de
                          })}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        {activity.description}
                      </p>

                      {/* User Info (if available and not own activity) */}
                      {activity.user && activity.user_id !== user?.id && (
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200">
                          <AvatarDisplay
                            emoji={activity.avatar?.emoji || '👤'}
                            level={1}
                            size="xs"
                            showLevel={false}
                          />
                          <span className="text-xs text-gray-500">
                            {activity.user.first_name} {activity.user.last_name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}