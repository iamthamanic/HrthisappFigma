/**
 * YouTube Helper Functions
 * 
 * Extract YouTube video IDs, thumbnails, and metadata from URLs
 */

/**
 * Extract YouTube Video ID from URL
 */
export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

/**
 * YouTube Video Metadata Interface
 */
export interface YouTubeVideoMetadata {
  title: string;
  duration: number; // in seconds
  thumbnail: string;
  channelTitle: string;
  description: string;
}

/**
 * Parse ISO 8601 duration (YouTube format) to seconds
 * Example: "PT4M13S" -> 253 seconds
 * Example: "PT1H2M30S" -> 3750 seconds
 */
function parseYouTubeDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Fetch YouTube Video Metadata using YouTube Data API v3
 * 
 * REQUIRES: YOUTUBE_API_KEY environment variable
 * Get your API key: https://console.cloud.google.com/apis/credentials
 * Enable YouTube Data API v3: https://console.cloud.google.com/apis/library/youtube.googleapis.com
 * 
 * @param url - YouTube video URL
 * @returns Video metadata including duration, title, thumbnail
 * @throws Error if API key is missing or API call fails
 */
export async function fetchYouTubeMetadata(url: string): Promise<YouTubeVideoMetadata> {
  const videoId = extractYouTubeId(url);
  if (!videoId) {
    throw new Error('Invalid YouTube URL - could not extract video ID');
  }

  // Check if we're in browser environment
  if (typeof window === 'undefined') {
    throw new Error('YouTube metadata fetching only works in browser environment');
  }

  // Get API key from environment
  // Note: In production, this should be handled via backend to keep API key secure
  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
  
  if (!apiKey) {
    throw new Error('YouTube API key not configured. Please set VITE_YOUTUBE_API_KEY environment variable.');
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,contentDetails&key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      throw new Error('Video not found or not accessible');
    }

    const video = data.items[0];
    const snippet = video.snippet;
    const contentDetails = video.contentDetails;

    return {
      title: snippet.title,
      duration: parseYouTubeDuration(contentDetails.duration),
      thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || '',
      channelTitle: snippet.channelTitle,
      description: snippet.description,
    };
  } catch (error) {
    console.error('Error fetching YouTube metadata:', error);
    throw error;
  }
}

/**
 * Get YouTube Thumbnail URL
 * @param url - YouTube video URL
 * @param quality - Thumbnail quality (default, mqdefault, hqdefault, sddefault, maxresdefault)
 */
export function getYouTubeThumbnail(url: string, quality: 'default' | 'mq' | 'hq' | 'sd' | 'max' = 'hq'): string | null {
  const videoId = extractYouTubeId(url);
  if (!videoId) return null;

  const qualityMap = {
    default: 'default',
    mq: 'mqdefault',
    hq: 'hqdefault',
    sd: 'sddefault',
    max: 'maxresdefault',
  };

  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
}

/**
 * Check if URL is a YouTube video
 */
export function isYouTubeVideo(url: string): boolean {
  return url.includes('youtube.com') || url.includes('youtu.be');
}

/**
 * Get YouTube Embed URL
 */
export function getYouTubeEmbedUrl(url: string): string | null {
  const videoId = extractYouTubeId(url);
  if (!videoId) return null;
  return `https://www.youtube.com/embed/${videoId}`;
}

/**
 * Format duration in seconds to MM:SS or HH:MM:SS format
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}
