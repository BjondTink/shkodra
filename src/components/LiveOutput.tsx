import React, { useEffect, useState, useRef } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { NewsItem, AppStatus, TVVideo, TVAd, TVLowerThird } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import MediaContainer from './MediaContainer';
import VideoPlayer from './VideoPlayer';
import NewsTicker from './NewsTicker';
import ClockWidget from './ClockWidget';
import LowerThird from './LowerThird';
import BroadcastBackground from './BroadcastBackground';
import ReactPlayer from 'react-player';
import { 
  Circle, 
  Radio, 
  Facebook,
  Sun, 
  Cloud, 
  CloudSun, 
  CloudFog, 
  CloudDrizzle, 
  CloudRain, 
  Snowflake, 
  CloudLightning, 
  SunDim,
  AlertTriangle,
  LucideIcon
} from 'lucide-react';


export default function LiveOutput() {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [videos, setVideos] = useState<TVVideo[]>([]);
  const [status, setStatus] = useState<AppStatus | null>(null);
  const [activeAds, setActiveAds] = useState<TVAd[]>([]);
  const [activeLT, setActiveLT] = useState<TVLowerThird[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [needsInteraction, setNeedsInteraction] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [activeAdId, setActiveAdId] = useState<string | null>(null);
  const [autoLT, setAutoLT] = useState<{ title: string; subtitle: string } | null>(null);
  const [rssNews, setRssNews] = useState<NewsItem[]>([]);
  const [rssLoading, setRssLoading] = useState(false);

  // Fetch live Albanian RSS news
  const fetchRss = async (force = false) => {
    try {
      setRssLoading(true);
      const res = await fetch(`/api/rss-news${force ? '?refresh=true' : ''}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        setRssNews(data.items);
      }
    } catch (e) {
      console.error('Failed to load RSS news:', e);
    } finally {
      setRssLoading(false);
    }
  };

  useEffect(() => {
    fetchRss();
    const interval = setInterval(() => fetchRss(), 150000); // 2.5 minutes
    return () => clearInterval(interval);
  }, []);

  // Sync videos
  useEffect(() => {
    const q = query(collection(db, 'tvVideos'), orderBy('order', 'asc'));
    return onSnapshot(q, (snapshot) => {
      setVideos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TVVideo)));
    });
  }, []);

  // Sync news items
  useEffect(() => {
    const q = query(collection(db, 'newsItems'), orderBy('order', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NewsItem));
      setNewsItems(items);
    });
  }, []);

  // Sync status
  useEffect(() => {
    return onSnapshot(doc(db, 'status', 'current'), (snapshot) => {
      if (snapshot.exists()) {
        setStatus(snapshot.data() as AppStatus);
      }
    });
  }, []);

  // Automatic Lower Third for Playlist Videos
  useEffect(() => {
    setAutoLT(null);
    if (status?.mode === 'video' && status.currentVideoId) {
      const currentVideo = videos.find(v => v.id === status.currentVideoId);
      if (currentVideo && (currentVideo.ltTitle || currentVideo.ltSubtitle)) {
        const timer = setTimeout(() => {
          setAutoLT({
            title: currentVideo.ltTitle || '',
            subtitle: currentVideo.ltSubtitle || ''
          });
        }, 10000); // 10 seconds delay
        return () => clearTimeout(timer);
      }
    }
  }, [status?.mode, status?.currentVideoId, videos]);

  // Sync TV Overlays
  useEffect(() => {
    const unsubAds = onSnapshot(collection(db, 'tvAds'), (snapshot) => {
      setActiveAds(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TVAd)).filter(ad => ad.active));
    });
    const unsubLT = onSnapshot(collection(db, 'tvLowerThirds'), (snapshot) => {
      setActiveLT(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TVLowerThird)).filter(lt => lt.active));
    });
    return () => { unsubAds(); unsubLT(); };
  }, []);

  const handleVideoEnd = async () => {
    // If playlist is active, try to go to next video
    if (status?.isPlaylistActive && videos.length > 0) {
      const currentIndex = videos.findIndex(v => v.id === status.currentVideoId);
      const nextIndex = (currentIndex + 1) % videos.length;
      const nextVideo = videos[nextIndex];

      if (nextVideo) {
        await updateDoc(doc(db, 'status', 'current'), {
          activeVideoUrl: nextVideo.url || '',
          videoSource: nextVideo.type,
          embedCode: nextVideo.embedCode || '',
          currentVideoId: nextVideo.id,
          lastUpdated: serverTimestamp()
        });
        return;
      }
    }

    // Default: Switch back to news mode when video ends
    await updateDoc(doc(db, 'status', 'current'), {
      mode: 'news',
      isPlaying: true, // Start news cycle automatically
      lastUpdated: serverTimestamp()
    });
  };
  // Combine manual news items with automatic nonstop RSS news items
  const displayNews = React.useMemo(() => {
    // If RSS is explicitly turned off
    if (status?.rssEnabled === false || status?.rssMode === 'manual_only') {
      return newsItems;
    }
    // If RSS-only mode
    if (status?.rssMode === 'rss_only') {
      return rssNews.length > 0 ? rssNews : newsItems;
    }
    // Mixed mode: manual news items first, followed by nonstop RSS news
    if (newsItems.length > 0 && rssNews.length > 0) {
      return [...newsItems, ...rssNews];
    }
    if (rssNews.length > 0) return rssNews;
    return newsItems;
  }, [newsItems, rssNews, status?.rssEnabled, status?.rssMode]);

  const safeIndex = displayNews.length > 0 ? currentIndex % displayNews.length : 0;
  const activeItem = displayNews[safeIndex] || null;
  const nextItem = displayNews.length > 1 ? displayNews[(safeIndex + 1) % displayNews.length] : null;

  // News Rotation Logic
  useEffect(() => {
    // Basic safety check: must have news items to cycle
    if (displayNews.length === 0) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    // Respect pause state if status is loaded
    if (status && status.isPlaying === false) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    const currentItem = displayNews[safeIndex];
    if (!currentItem) return;

    // Use current item's duration or default to 12s (18s for breaking news)
    const duration = (currentItem.isBreakingNews ? 18 : (currentItem.duration || 12)) * 1000;

    timerRef.current = setTimeout(() => {
      setCurrentIndex((prev) => {
        if (displayNews.length === 0) return 0;
        return (prev + 1) % displayNews.length;
      });
    }, duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex, displayNews.length, safeIndex, status?.isPlaying]);

  // Dedicated Auto-Expiration Checker
  useEffect(() => {
    const checkExpiration = () => {
      const now = new Date();
      newsItems.forEach(item => {
        if (item.isBreakingNews) {
          // If for some reason it doesn't have a start time, set it now to start the 5-min clock
          if (!item.breakingNewsStartedAt) {
            updateDoc(doc(db, 'newsItems', item.id), {
              breakingNewsStartedAt: new Date().toISOString()
            }).catch(err => console.error("Set timestamp error:", err));
            return;
          }

          const startTime = new Date(item.breakingNewsStartedAt).getTime();
          const diffMinutes = (now.getTime() - startTime) / 60000;
          
          if (diffMinutes >= 5) {
            console.log(`Auto-expiring breaking news: ${item.headline}`);
            updateDoc(doc(db, 'newsItems', item.id), {
              isBreakingNews: false,
              breakingNewsStartedAt: ''
            }).catch(err => console.error("Auto-expire error:", err));
          }
        }
      });
    };

    const interval = setInterval(checkExpiration, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [newsItems]);
  // Weather code mapping (WMO codes to Albanian)
  const weatherMap: Record<number, string> = {
    0: "Kthjellët", 1: "Kthjellët", 2: "Me re", 3: "Vrenjtur",
    45: "Mjegull", 48: "Mjegull", 51: "Drizë", 53: "Drizë", 55: "Drizë",
    61: "Shi", 63: "Shi", 65: "Shi i dendur", 71: "Borë", 73: "Borë", 75: "Borë",
    80: "Rrebesh", 81: "Rrebesh", 82: "Rrebesh", 95: "Stuhi",
  };

  const weatherIconMap: Record<number, LucideIcon> = {
    0: Sun, 1: SunDim, 2: CloudSun, 3: Cloud,
    45: CloudFog, 48: CloudFog, 51: CloudDrizzle, 53: CloudDrizzle, 55: CloudDrizzle,
    61: CloudRain, 63: CloudRain, 65: CloudRain, 71: Snowflake, 73: Snowflake, 75: Snowflake,
    80: CloudRain, 81: CloudRain, 82: CloudRain, 95: CloudLightning,
  };

  // Initial placeholder ticker items
  const initialCities = [
    { name: "Tiranë", temp: 16, code: 0 },
    { name: "Shkodër", temp: 15, code: 1 },
    { name: "Durrës", temp: 17, code: 0 },
    { name: "Vlorë", temp: 18, code: 0 },
    { name: "Elbasan", temp: 16, code: 1 },
    { name: "Korçë", temp: 12, code: 2 },
    { name: "Fier", temp: 17, code: 0 },
    { name: "Sarandë", temp: 19, code: 0 },
    { name: "Berat", temp: 17, code: 0 },
    { name: "Kukës", temp: 11, code: 2 }
  ];

  const buildWeatherNodes = (items: Array<{ name: string; temp: number; code: number }>) => {
    return items.map(res => {
      const condition = weatherMap[res.code] || "I pastër";
      const WeatherIcon = weatherIconMap[res.code] || Cloud;
      return (
        <div key={res.name} className="flex items-center gap-3">
          <WeatherIcon size={32} className="text-brand-red" strokeWidth={3} />
          <span>Moti {res.name}: {res.temp}°C {condition}</span>
        </div>
      );
    });
  };

  const [tickerData, setTickerData] = useState<{ weatherItems: React.ReactNode[]; rates: string[] }>({
    weatherItems: buildWeatherNodes(initialCities),
    rates: [
      "EUR/LEK: 100.25",
      "USD/LEK: 92.40",
      "CHF/LEK: 104.20",
      "GBP/LEK: 118.50",
      "Kursi Zyrtar (LEK)"
    ]
  });

  // Fetch Ticker Info from backend service
  useEffect(() => {
    let isMounted = true;
    const fetchTickerInfo = async () => {
      try {
        const res = await fetch("/api/ticker-data");
        if (!res.ok) return;
        const json = await res.json();
        
        if (json && isMounted) {
          let weatherNodes = tickerData.weatherItems;
          if (Array.isArray(json.weather) && json.weather.length > 0) {
            weatherNodes = buildWeatherNodes(json.weather);
          }

          const rates = Array.isArray(json.rates) && json.rates.length > 0
            ? json.rates
            : tickerData.rates;

          setTickerData({
            weatherItems: weatherNodes,
            rates
          });
        }
      } catch {
        // Fall back seamlessly without logging error to console
      }
    };

    fetchTickerInfo();
    const interval = setInterval(fetchTickerInfo, 300000); // 5 minutes
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Dynamic typography for headline length
  const getDynamicStyles = (headline: string) => {
    const hLen = headline ? headline.length : 0;
    let hSize = "text-4xl xl:text-5xl";
    let leading = "leading-[1.12]";
    if (hLen > 220) {
      hSize = "text-xl xl:text-2xl";
      leading = "leading-snug";
    } else if (hLen > 120) {
      hSize = "text-2xl xl:text-3xl";
      leading = "leading-snug";
    } else if (hLen > 60) {
      hSize = "text-3xl xl:text-4xl";
      leading = "leading-[1.15]";
    } else {
      hSize = "text-4xl xl:text-5xl";
      leading = "leading-[1.1]";
    }
    return { hSize, leading };
  };

  const dynamicStyles = activeItem ? getDynamicStyles(activeItem.headline) : { hSize: "text-4xl xl:text-5xl", leading: "leading-[1.1]" };

  return (
    <div 
      className="relative w-screen h-screen bg-[#020202] overflow-hidden flex items-center justify-center p-8 aspect-video select-none"
      onClick={() => {
        if (needsInteraction) setNeedsInteraction(false);
      }}
    >
      <BroadcastBackground />

      {/* interaction overlay */}
      <AnimatePresence>
        {needsInteraction && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center cursor-pointer"
          >
            <div className="flex flex-col items-center gap-6">
              <div className="w-24 h-24 rounded-full border-4 border-brand-red flex items-center justify-center animate-pulse">
                <Radio size={48} className="text-brand-red" />
              </div>
              <div className="flex flex-col items-center gap-2">
                <h2 className="text-4xl font-black uppercase tracking-tighter">KLIKO PËR TË NISUR</h2>
                <p className="text-white/40 font-bold uppercase tracking-widest text-sm">AKTIVIZO AUDIO & VIDEO TRANSMETIMIN</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Broadcast Container (16:9) */}
      <div className="relative z-10 w-full h-full flex flex-col gap-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-6 bg-black/60 backdrop-blur-md px-10 py-5 rounded-2xl border border-white/10 shadow-2xl">
            <div className="relative flex items-center gap-3">
              <div className="absolute -left-2 -top-2 w-full h-full bg-red-600/30 blur-xl rounded-full animate-ping" />
              <div className="bg-red-600 text-white text-sm font-black px-3 py-1 rounded-md flex items-center gap-2 uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(220,38,38,0.5)]">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_8px_white]" />
                Live
              </div>
            </div>
            <div className="h-10 w-px bg-white/20" />
            <h1 className="text-4xl font-black tracking-tighter uppercase italic drop-shadow-lg flex gap-3">
              {status?.stationName ? (
                <>
                  {status.stationName.split(' ')[0]}
                  {status.stationName.split(' ')[1] && (
                    <span className="text-brand-red">{status.stationName.split(' ')[1]}</span>
                  )}
                  {status.stationName.split(' ').slice(2).join(' ')}
                </>
              ) : (
                <>Shkodra <span className="text-brand-red">Politike</span></>
              )}
            </h1>
          </div>
          
          <ClockWidget />
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0 flex gap-6">
          {/* Media Player - 62% per Editorial Design */}
          <div className={cn(
            "w-[62%] relative h-full rounded-2xl overflow-hidden shadow-2xl isolate",
            status?.mode === 'video' ? "pointer-events-auto" : "pointer-events-none"
          )}>
            <AnimatePresence mode="wait">
              {status?.mode === 'video' ? (
                <motion.div
                  key={`video-container`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full bg-black flex items-center justify-center relative overflow-hidden"
                >
                  <VideoPlayer status={status} onEnded={handleVideoEnd} muted={needsInteraction} />
                  
                  {/* Watermark/Overlay for Video Mode */}
                  <div className="absolute top-4 left-4 bg-brand-red/90 text-white text-[10px] font-black px-3 py-1 rounded-md uppercase tracking-widest shadow-lg z-10 pointer-events-none">
                    Transmetim i Drejtpërdrejtë
                  </div>
                </motion.div>
              ) : (
                activeItem && (
                  <MediaContainer 
                    key={activeItem.id}
                    url={activeItem.mediaUrl}
                    type={activeItem.mediaType}
                    source={activeItem.source}
                    isBreakingNews={activeItem.isBreakingNews}
                    headline={activeItem.headline}
                  />
                )
              )}
            </AnimatePresence>

            {/* Overlays / Ads inside Media Container */}
            <div className="absolute top-0 right-0 p-4 flex flex-col gap-4 pointer-events-none z-20">
               <AnimatePresence>
                 {activeAds.map(ad => (
                   <motion.div
                     key={ad.id}
                     initial={{ opacity: 0, scale: 0.8, x: 50 }}
                     animate={{ opacity: 1, scale: 1, x: 0 }}
                     exit={{ opacity: 0, scale: 0.8, x: 50 }}
                     className="w-48 aspect-video rounded-xl bg-black border border-white/20 overflow-hidden shadow-2xl"
                   >
                     <img src={ad.imageUrl} className="w-full h-full object-cover" />
                   </motion.div>
                 ))}
               </AnimatePresence>
            </div>

            {/* Lower Thirds inside Media Container */}
            <div className="absolute bottom-10 left-10 pointer-events-none z-20 w-full pr-20">
               <AnimatePresence>
                 {autoLT && (
                   <motion.div
                     key="auto-lt"
                     initial={{ opacity: 0, x: -100 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: -100 }}
                     className="flex flex-col gap-0 mb-4"
                   >
                     <div className="bg-brand-red px-10 py-3 shadow-2xl inline-block skew-x-[-15deg] -translate-x-4 border-l-8 border-white">
                        <span className="skew-x-[15deg] block text-4xl font-black text-white uppercase tracking-tighter">
                          {autoLT.title}
                        </span>
                     </div>
                     <div className="bg-black/90 px-8 py-2 shadow-xl inline-block skew-x-[-15deg] border-l-4 border-brand-red">
                        <span className="skew-x-[15deg] block text-lg font-bold text-white/80 uppercase tracking-widest">
                          {autoLT.subtitle}
                        </span>
                     </div>
                   </motion.div>
                 )}
                 {activeLT.map(lt => (
                   <motion.div
                     key={lt.id}
                     initial={{ opacity: 0, x: -100 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: -100 }}
                     className="flex flex-col gap-0"
                   >
                     <div className="bg-brand-red px-10 py-3 shadow-2xl inline-block skew-x-[-15deg] -translate-x-4 border-l-8 border-white">
                        <span className="skew-x-[15deg] block text-4xl font-black text-white uppercase tracking-tighter">
                          {lt.title}
                        </span>
                     </div>
                     <div className="bg-black/90 px-8 py-2 shadow-xl inline-block skew-x-[-15deg] border-l-4 border-brand-red">
                        <span className="skew-x-[15deg] block text-lg font-bold text-white/80 uppercase tracking-widest">
                          {lt.subtitle}
                        </span>
                     </div>
                   </motion.div>
                 ))}
               </AnimatePresence>
            </div>
          </div>

          {/* Vertical News Area - 38% per Editorial Design */}
          <div className="w-[38%] flex flex-col h-full">
             <div className="flex-1 glass-morphism rounded-2xl p-8 relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black uppercase tracking-[0.3em] text-brand-red flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-brand-red animate-ping" />
                        Lajmet Kryesore
                      </span>
                      {activeItem?.isRss && (
                        <span className="bg-red-500/15 border border-red-500/30 text-red-400 text-[10px] font-black uppercase px-2.5 py-0.5 rounded tracking-widest shadow-sm">
                          NON-STOP LIVE
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-white/50 uppercase tracking-widest">
                        {displayNews.length > 0 ? `${safeIndex + 1} / ${displayNews.length}` : '0/0'}
                      </span>
                      <div className="flex gap-1.5 ml-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-white/40"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-red animate-pulse"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-white/40"></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="relative">
                     <AnimatePresence mode="wait">
                        {activeItem && (
                          <motion.div
                            key={activeItem.id}
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -40 }}
                            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                            className="flex flex-col gap-5 py-2"
                          >
                             <div className="border-l-8 border-brand-red pl-6 flex flex-col gap-4">
                               <div className="flex flex-wrap items-center gap-2.5">
                                 <div className="bg-brand-red px-4 py-1.5 rounded-lg text-lg font-black italic text-white uppercase tracking-[0.15em] skew-x-[-15deg] shadow-[0_0_20px_rgba(220,38,38,0.4)]">
                                   <span className="skew-x-[15deg] block">
                                     {activeItem.publishedTime || (() => {
                                        if (!activeItem.createdAt) return 'TANI';
                                        const date = (activeItem.createdAt as any).toDate ? (activeItem.createdAt as any).toDate() : new Date(activeItem.createdAt);
                                        return date.toLocaleTimeString('sq-AL', { hour: '2-digit', minute: '2-digit', hour12: false });
                                     })()}
                                   </span>
                                 </div>
                                 {activeItem.source && (
                                   <div className="bg-white/10 backdrop-blur-md border border-white/20 px-3.5 py-1.5 rounded-lg text-sm font-black text-white uppercase tracking-wider shadow-lg flex items-center gap-1.5">
                                     <span className="w-1.5 h-1.5 rounded-full bg-brand-red animate-pulse" />
                                     {activeItem.source}
                                   </div>
                                 )}
                                 {activeItem.isBreakingNews && (
                                   <div className="bg-amber-500 text-black px-3 py-1 rounded-md text-xs font-black uppercase tracking-widest animate-pulse flex items-center gap-1.5">
                                     <AlertTriangle size={14} /> E Fundit
                                   </div>
                                 )}
                                 <div className="h-1 flex-1 bg-white/10 rounded-full min-w-[20px]" />
                               </div>

                               <h2 
                                 className={cn(
                                   "font-black text-white tracking-wide uppercase transition-all duration-300 drop-shadow-md",
                                   dynamicStyles.hSize,
                                   dynamicStyles.leading
                                 )}
                                 style={{
                                   display: '-webkit-box',
                                   WebkitLineClamp: 8,
                                   WebkitBoxOrient: 'vertical',
                                   overflow: 'hidden'
                                 }}
                               >
                                 {activeItem.headline}
                               </h2>
                             </div>
                          </motion.div>
                        )}
                     </AnimatePresence>
                  </div>
                </div>

                {/* Bottom of Right Panel: Next Up Story */}
                {nextItem && (
                  <div className="border-t border-white/10 pt-4 mt-auto">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Tjetra në radhë:</span>
                      {nextItem.source && (
                        <span className="text-[10px] font-black text-brand-red uppercase">{nextItem.source}</span>
                      )}
                    </div>
                    <p className="text-white/60 text-xs md:text-sm font-bold line-clamp-1 uppercase tracking-wide">
                      {nextItem.headline}
                    </p>
                  </div>
                )}
             </div>
          </div>
        </div>

        {/* Lower Thirds & Ticker */}
        <div className="h-24 flex items-center bg-white text-black relative z-30 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] -mx-8 overflow-hidden">
           <div className="bg-brand-red px-14 h-full flex items-center font-black italic text-3xl tracking-tighter uppercase whitespace-nowrap border-r-8 border-black/10 text-white skew-x-[-15deg] -translate-x-6">
             <span className="skew-x-[15deg]">Info Shërbime</span>
           </div>
            <NewsTicker items={[
              ...tickerData.weatherItems,
              ...tickerData.rates,
              "Info Shërbime LIVE"
            ]} />
           <div className="h-full px-12 flex items-center bg-[#1877F2] text-white shrink-0 skew-x-[-15deg] translate-x-6 border-l-8 border-white/20">
             <div className="skew-x-[15deg] flex flex-col items-start gap-0">
               <div className="flex items-center gap-2">
                 <Facebook size={24} fill="white" />
                 <span className="text-[12px] font-black tracking-widest uppercase opacity-80">Na ndiqni</span>
               </div>
               <span className="text-2xl font-black tracking-tighter uppercase">{status?.socialHandle || "/shkodrapolitike"}</span>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
