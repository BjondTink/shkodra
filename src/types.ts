export type MediaType = 'image' | 'video';

export interface NewsItem {
  id: string;
  headline: string;
  headlines?: string[];
  scrollingText: string;
  mediaUrl: string;
  mediaType: MediaType;
  duration: number; // in seconds
  isBreakingNews: boolean;
  breakingNewsStartedAt?: string;
  source?: string;
  publishedTime?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface AppStatus {
  activeItemId: string | null;
  isPlaying: boolean;
  lastUpdated: number; // timestamp
  mode: 'news' | 'video';
  activeVideoUrl?: string;
  videoSource?: 'youtube' | 'facebook' | 'direct' | 'embed';
  embedCode?: string;
  isPlaylistActive?: boolean;
  currentVideoId?: string;
  volume?: number;
}

export interface TVVideo {
  id: string;
  title: string;
  url: string;
  type: 'youtube' | 'facebook' | 'direct' | 'embed';
  embedCode?: string;
  order: number;
}

export interface TVAd {
  id: string;
  imageUrl: string;
  title: string;
  active: boolean;
}

export interface TVLowerThird {
  id: string;
  title: string;
  subtitle: string;
  active: boolean;
}
