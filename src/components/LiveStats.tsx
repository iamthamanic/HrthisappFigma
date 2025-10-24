import { useEffect, useState } from 'react';
import { TrendingUp, Users, Award, Zap } from './icons/HRTHISIcons';
import { supabase } from '../utils/supabase/client';
import { getServices } from '../services';
import { Card, CardContent } from './ui/card';

interface LiveStatsData {
  totalUsers: number;
  onlineUsers: number;
  videosWatchedToday: number;
  achievementsUnlockedToday: number;
}

export default function LiveStats() {
  const [stats, setStats] = useState<LiveStatsData>({
    totalUsers: 0,
    onlineUsers: 0,
    videosWatchedToday: 0,
    achievementsUnlockedToday: 0,
  });

  useEffect(() => {
    loadStats();

    // Subscribe to real-time updates via RealtimeService
    const services = getServices();
    
    // Subscribe to learning_progress changes
    const unsubscribe1 = services.realtime.subscribeToTable(
      'learning_progress',
      null,
      ['INSERT', 'UPDATE', 'DELETE'],
      () => {
        loadStats();
      }
    );
    
    // Subscribe to user_achievements changes
    const unsubscribe2 = services.realtime.subscribeToTable(
      'user_achievements',
      null,
      ['INSERT', 'UPDATE', 'DELETE'],
      () => {
        loadStats();
      }
    );

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const loadStats = async () => {
    try {
      // Total users
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Videos watched today
      const today = new Date().toISOString().split('T')[0];
      const { count: videosWatchedToday } = await supabase
        .from('learning_progress')
        .select('*', { count: 'exact', head: true })
        .eq('completed', true)
        .gte('completed_at', today);

      // Achievements unlocked today
      const { count: achievementsUnlockedToday } = await supabase
        .from('user_achievements')
        .select('*', { count: 'exact', head: true })
        .gte('earned_at', today);

      setStats({
        totalUsers: totalUsers || 0,
        onlineUsers: 0, // Will be updated from presence
        videosWatchedToday: videosWatchedToday || 0,
        achievementsUnlockedToday: achievementsUnlockedToday || 0,
      });
    } catch (error) {
      console.error('Load stats error:', error);
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers}</p>
              <p className="text-xs text-gray-500">Mitarbeiter</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.onlineUsers}</p>
              <p className="text-xs text-gray-500">Online jetzt</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.videosWatchedToday}</p>
              <p className="text-xs text-gray-500">Videos heute</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.achievementsUnlockedToday}</p>
              <p className="text-xs text-gray-500">Erfolge heute</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}