import { useEffect, useState } from 'react';
import { Users } from './icons/BrowoKoIcons';
import { supabase } from '../utils/supabase/client';
import { getServices } from '../services';
import { useAuthStore } from '../stores/BrowoKo_authStore';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import AvatarDisplay from './AvatarDisplay';

interface OnlineUser {
  user_id: string;
  first_name: string;
  last_name: string;
  avatar?: any;
  level?: number;
}

export default function OnlineUsers() {
  const { user } = useAuthStore();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [presence, setPresence] = useState<any>(null);

  useEffect(() => {
    if (!user?.id) return;

    // Load user metadata for presence
    const loadUserMetadata = async () => {
      const { data: profile } = await supabase
        .from('users')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single();

      const { data: avatar } = await supabase
        .from('user_avatars')
        .select('emoji, level')
        .eq('user_id', user.id)
        .single();

      return {
        first_name: profile?.first_name || 'User',
        last_name: profile?.last_name || '',
        avatar: avatar,
        level: avatar?.level || 1,
      };
    };

    // Subscribe to presence via RealtimeService
    const setupPresence = async () => {
      const metadata = await loadUserMetadata();
      
      const services = getServices();
      const unsubscribe = services.realtime.subscribeToPresence(
        'online-users',
        user.id,
        (onlineUser) => {
          // User joined
          setOnlineUsers(prev => {
            // Don't add current user or duplicates
            if (onlineUser.userId === user.id) return prev;
            const exists = prev.some(u => u.user_id === onlineUser.userId);
            if (exists) return prev;
            
            return [...prev, {
              user_id: onlineUser.userId,
              first_name: onlineUser.metadata?.first_name || 'User',
              last_name: onlineUser.metadata?.last_name || '',
              avatar: onlineUser.metadata?.avatar,
              level: onlineUser.metadata?.level || 1,
            }];
          });
        },
        (onlineUser) => {
          // User left
          setOnlineUsers(prev => prev.filter(u => u.user_id !== onlineUser.userId));
        },
        metadata
      );

      return unsubscribe;
    };

    const unsubscribePromise = setupPresence();

    return () => {
      unsubscribePromise.then(unsubscribe => unsubscribe());
    };
  }, [user?.id]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Online
          <Badge variant="outline" className="ml-auto bg-green-100 text-green-700">
            {onlineUsers.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {onlineUsers.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Niemand sonst online</p>
          </div>
        ) : (
          <div className="space-y-3">
            {onlineUsers.map((onlineUser) => (
              <div
                key={onlineUser.user_id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="relative">
                  <AvatarDisplay
                    emoji={onlineUser.avatar?.emoji || '👤'}
                    level={onlineUser.level || 1}
                    size="sm"
                    showLevel={false}
                  />
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {onlineUser.first_name} {onlineUser.last_name}
                  </p>
                  <p className="text-xs text-green-600">Online</p>
                </div>
                <Badge variant="outline" className="shrink-0">
                  Level {onlineUser.level || 1}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}