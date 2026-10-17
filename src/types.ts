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
  link?: string;
  isRss?: boolean;
  summary?: string;
  category?: string;
}

export interface NewsCategoryConfig {
  id: string;
  name: string;
  short: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  description: string;
}

export const ALL_NEWS_CATEGORIES: NewsCategoryConfig[] = [
  {
    id: 'shqiperi',
    name: 'Shqipëri & Vendi',
    short: 'SHQIPËRI',
    color: '#ef4444',
    badgeBg: 'bg-red-500/20',
    badgeText: 'text-red-400',
    badgeBorder: 'border-red-500/30',
    description: 'Ngjarje vendore, Tiranë, Shkodër dhe bashkitë'
  },
  {
    id: 'politike',
    name: 'Politikë',
    short: 'POLITIKË',
    color: '#3b82f6',
    badgeBg: 'bg-blue-500/20',
    badgeText: 'text-blue-400',
    badgeBorder: 'border-blue-500/30',
    description: 'Qeveria, Kuvendi, partitë politike dhe zgjedhjet'
  },
  {
    id: 'kronike',
    name: 'Kronikë & Drejtësi',
    short: 'KRONIKË',
    color: '#f59e0b',
    badgeBg: 'bg-amber-500/20',
    badgeText: 'text-amber-400',
    badgeBorder: 'border-amber-500/30',
    description: 'Policia, SPAK, drejtësia, ngjarje dhe siguria'
  },
  {
    id: 'ekonomi',
    name: 'Ekonomi & Biznes',
    short: 'EKONOMI',
    color: '#10b981',
    badgeBg: 'bg-emerald-500/20',
    badgeText: 'text-emerald-400',
    badgeBorder: 'border-emerald-500/30',
    description: 'Tregjet, çmimet, euro, financat dhe sipërmarrja'
  },
  {
    id: 'bota',
    name: 'Bota & Rajoni',
    short: 'BOTA',
    color: '#06b6d4',
    badgeBg: 'bg-cyan-500/20',
    badgeText: 'text-cyan-400',
    badgeBorder: 'border-cyan-500/30',
    description: 'Lajme ndërkombëtare, SHBA, BE dhe gjeopolitika'
  },
  {
    id: 'kosove',
    name: 'Kosovë',
    short: 'KOSOVË',
    color: '#a855f7',
    badgeBg: 'bg-purple-500/20',
    badgeText: 'text-purple-400',
    badgeBorder: 'border-purple-500/30',
    description: 'Zhvillime, politika dhe ngjarje nga Kosova'
  },
  {
    id: 'sport',
    name: 'Sport',
    short: 'SPORT',
    color: '#22c55e',
    badgeBg: 'bg-green-500/20',
    badgeText: 'text-green-400',
    badgeBorder: 'border-green-500/30',
    description: 'Futboll, kampionate kombëtare dhe ndërkombëtare'
  },
  {
    id: 'kulture',
    name: 'Showbiz & Kulturë',
    short: 'SHOWBIZ',
    color: '#ec4899',
    badgeBg: 'bg-pink-500/20',
    badgeText: 'text-pink-400',
    badgeBorder: 'border-pink-500/30',
    description: 'VIP, art, muzikë, showbiz dhe personazhe'
  },
  {
    id: 'teknologji',
    name: 'Teknologji & Shkencë',
    short: 'TEKNOLOGJI',
    color: '#6366f1',
    badgeBg: 'bg-indigo-500/20',
    badgeText: 'text-indigo-400',
    badgeBorder: 'border-indigo-500/30',
    description: 'Pajisje, inovacion, inteligjencë artificiale'
  }
];

export function getCategoryConfig(id?: string): NewsCategoryConfig {
  const found = ALL_NEWS_CATEGORIES.find(c => c.id === id);
  return found || {
    id: id || 'shqiperi',
    name: 'Lajme',
    short: 'LAJME',
    color: '#ef4444',
    badgeBg: 'bg-white/10',
    badgeText: 'text-white/80',
    badgeBorder: 'border-white/10',
    description: 'Informacion i përgjithshëm'
  };
}

export interface AppStatus {
  activeItemId: string | null;
  isPlaying: boolean;
  lastUpdated: any; // timestamp or number
  mode: 'news' | 'video';
  activeVideoUrl?: string;
  videoSource?: 'youtube' | 'facebook' | 'direct' | 'embed' | 'hls';
  embedCode?: string;
  isPlaylistActive?: boolean;
  currentVideoId?: string;
  volume?: number;
  isMuted?: boolean;
  loop?: boolean;
  isShuffle?: boolean;
  transportAction?: 'play' | 'pause' | 'stop' | 'restart' | 'next' | 'prev';
  stationName?: string;
  socialHandle?: string;
  rssEnabled?: boolean;
  rssMode?: 'mixed' | 'rss_only' | 'manual_only';
  allowedCategories?: string[]; // IDs of categories allowed to display on right side
}

export interface TVVideo {
  id: string;
  title: string;
  url: string;
  type: 'youtube' | 'facebook' | 'direct' | 'embed' | 'hls';
  embedCode?: string;
  order: number;
  ltTitle?: string;
  ltSubtitle?: string;
}

export interface TVAd {
  id: string;
  imageUrl: string;
  title: string;
  active: boolean;
  externalUrl?: string;
}

export interface TVLowerThird {
  id: string;
  title: string;
  subtitle: string;
  active: boolean;
}
