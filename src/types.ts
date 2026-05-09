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
  forceResetTime?: number;
}
