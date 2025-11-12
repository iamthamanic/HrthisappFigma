/**
 * YOUTUBE PLAYER (Simple)
 * =======================
 * Einfacher YouTube Player für den Test Builder
 */

import { useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';

interface YouTubePlayerProps {
  videoId: string;
  autoplay?: boolean;
}

// Load YouTube IFrame API
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export function YouTubePlayer({ videoId, autoplay = false }: YouTubePlayerProps) {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [playerLoaded, setPlayerLoaded] = useState(false);
  const playerId = useRef(`youtube-player-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    // Load YouTube IFrame API
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        console.log('✅ YouTube API ready');
        setIsReady(true);
      };
    } else if (window.YT && window.YT.Player) {
      console.log('✅ YouTube API already loaded');
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    if (!isReady || !videoId || playerLoaded) return;

    console.log('🎬 Creating YouTube player for videoId:', videoId);

    // Wait a bit for DOM to be ready
    const timer = setTimeout(() => {
      try {
        playerRef.current = new window.YT.Player(playerId.current, {
          videoId: videoId,
          width: '100%',
          height: '100%',
          playerVars: {
            autoplay: autoplay ? 1 : 0,
            modestbranding: 1,
            rel: 0,
            controls: 1,
          },
          events: {
            onReady: () => {
              console.log('✅ YouTube player ready');
              setPlayerLoaded(true);
            },
            onError: (event: any) => {
              console.error('❌ YouTube player error:', event);
            }
          }
        });
      } catch (error) {
        console.error('❌ Error creating YouTube player:', error);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (playerRef.current && playerRef.current.destroy) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          console.error('Error destroying player:', e);
        }
      }
    };
  }, [isReady, videoId, autoplay, playerLoaded]);

  return (
    <div className="relative bg-black aspect-video w-full">
      <div id={playerId.current} className="w-full h-full" />
      
      {!playerLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
          <div className="text-center">
            <Play className="w-12 h-12 text-white mx-auto mb-2 animate-pulse" />
            <p className="text-white text-sm">Lade Player...</p>
          </div>
        </div>
      )}
    </div>
  );
}