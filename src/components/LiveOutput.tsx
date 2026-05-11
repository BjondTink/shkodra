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
  useEffect(() => {
    const isPlaying = status ? status.isPlaying : true;

    if (newsItems.length === 0 || !isPlaying) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    // BREAKING NEWS FILTERING (Expiration handled by dedicated useEffect)
    const breakingItems = newsItems.filter(item => item.isBreakingNews);
    const itemsToCycle = breakingItems.length > 0 ? breakingItems : newsItems;
    
    // Find correctly mapped index in the target cycle
    const currentItemOriginal = newsItems[currentIndex];
    let activeInCycleIndex = itemsToCycle.findIndex(i => i.id === currentItemOriginal?.id);
    
    // If current item is not in the cycle (e.g. we just switched to breaking-priority)
    if (activeInCycleIndex === -1) {
      activeInCycleIndex = 0;
      const targetIndex = newsItems.findIndex(i => i.id === itemsToCycle[0].id);
      if (targetIndex !== -1) {
        setCurrentIndex(targetIndex);
      }
      return;
    }

    const currentItem = itemsToCycle[activeInCycleIndex];
    // Breaking News stays 20s, Normal stay user-defined duration
    const duration = (currentItem?.isBreakingNews ? 20 : (currentItem?.duration || 10)) * 1000;

    timerRef.current = setTimeout(() => {
      const nextInCycle = (activeInCycleIndex + 1) % itemsToCycle.length;
      const nextOriginalIndex = newsItems.findIndex(i => i.id === itemsToCycle[nextInCycle].id);
      if (nextOriginalIndex !== -1) {
        setCurrentIndex(nextOriginalIndex);
      }
    }, duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex, newsItems, status]);

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

  const activeItem = newsItems[currentIndex];
  const [tickerData, setTickerData] = useState<{ weatherItems: React.ReactNode[]; rates: string[] }>({
    weatherItems: [],
    rates: ["EUR/LEK: --", "USD/LEK: --", "CHF/LEK: --", "GBP/LEK: --"]
  });

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

  const cities = [
    { name: "Tiranë", lat: 41.3275, lon: 19.8187 },
    { name: "Shkodër", lat: 42.0683, lon: 19.5011 },
    { name: "Durrës", lat: 41.3236, lon: 19.4559 },
    { name: "Vlorë", lat: 40.4661, lon: 19.4897 },
    { name: "Elbasan", lat: 41.1125, lon: 20.0822 },
    { name: "Korçë", lat: 40.6159, lon: 20.7778 },
    { name: "Fier", lat: 40.7239, lon: 19.5561 },
    { name: "Gjirokastër", lat: 40.0758, lon: 20.1389 },
    { name: "Sarandë", lat: 39.8755, lon: 20.0056 },
    { name: "Lezhë", lat: 41.7836, lon: 19.6425 },
    { name: "Berat", lat: 40.7058, lon: 19.9522 },
    { name: "Kukës", lat: 42.0767, lon: 20.42 }
  ];

  // Fetch Ticker Info
  useEffect(() => {
    const fetchTickerInfo = async () => {
      try {
        // 1. Fetch Weather for all cities
        const weatherPromises = cities.map(city => 
          fetch(`https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,weather_code`)
          .then(res => res.json())
          .then(json => ({
            name: city.name,
            temp: Math.round(json.current.temperature_2m),
            code: json.current.weather_code
          }))
        );

        const weatherResults = await Promise.all(weatherPromises);
        const weatherNodes = weatherResults.map(res => {
          const condition = weatherMap[res.code] || "I pastër";
          const WeatherIcon = weatherIconMap[res.code] || Cloud;
          return (
            <div key={res.name} className="flex items-center gap-3">
              <WeatherIcon size={32} className="text-brand-red" strokeWidth={3} />
              <span>Moti {res.name}: {res.temp}°C {condition}</span>
            </div>
          );
        });

        // 2. Fetch Exchange Rates
        const rateRes = await fetch("https://open.er-api.com/v6/latest/ALL");
        const rateJson = await rateRes.json();
        
        if (rateJson.result === "success") {
          const rates = rateJson.rates;
          const getPriceInLek = (code: string) => {
            const rate = rates[code];
            if (!rate) return "--";
            return (1 / rate).toFixed(2);
          };

          setTickerData({
            weatherItems: weatherNodes,
            rates: [
              `EUR/LEK: ${getPriceInLek('EUR')}`,
              `USD/LEK: ${getPriceInLek('USD')}`,
              `CHF/LEK: ${getPriceInLek('CHF')}`,
              `GBP/LEK: ${getPriceInLek('GBP')}`,
              `Kursi Zyrtar (LEK)`
            ]
          });
        } else {
          setTickerData(prev => ({ ...prev, weatherItems: weatherNodes }));
        }
      } catch (error) {
        console.error('Ticker fetch error:', error);
      }
    };

    fetchTickerInfo();
    const interval = setInterval(fetchTickerInfo, 600000); 
    return () => clearInterval(interval);
  }, []);

  // Sync news items
  const getDynamicStyles = (headline: string) => {
    const hLen = headline.length;
    
    let hSize = "text-7xl";
    
    if (hLen > 100) {
      hSize = "text-5xl";
    } else if (hLen > 60) {
      hSize = "text-6xl";
    } else if (hLen < 30) {
      hSize = "text-9xl";
    }
    
    return { hSize };
  };

  const dynamicStyles = activeItem ? getDynamicStyles(activeItem.headline) : { hSize: "text-6xl" };

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
             <div className="flex-1 glass-morphism rounded-2xl p-10 relative overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                  <span className="text-xs font-black uppercase tracking-[0.3em] text-brand-red">Lajmet Kryesore</span>
                  <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/40"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-red animate-pulse"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-white/40"></div>
                  </div>
                </div>
                
                <div className="h-full relative">
                   <AnimatePresence mode="wait">
                      {activeItem && (
                        <motion.div
                          key={activeItem.id}
                          initial={{ opacity: 0, x: 50 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -50 }}
                          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                          className="flex flex-col gap-12 py-10"
                        >
                           <div className="border-l-8 border-brand-red pl-10 flex flex-col gap-6">
                             <div className="flex items-center gap-4 mb-4">
                               <div className="bg-brand-red px-5 py-2 rounded-lg text-xl font-black italic text-white uppercase tracking-[0.2em] skew-x-[-15deg] shadow-[0_0_20px_rgba(220,38,38,0.4)]">
                                 <span className="skew-x-[15deg] block">
                                   {activeItem.publishedTime || (() => {
                                      if (!activeItem.createdAt) return 'TANI';
                                      const date = (activeItem.createdAt as any).toDate ? (activeItem.createdAt as any).toDate() : new Date(activeItem.createdAt);
                                      return date.toLocaleTimeString('sq-AL', { hour: '2-digit', minute: '2-digit' });
                                   })()}
                                 </span>
                               </div>
                               <div className="h-1 w-24 bg-white/10 rounded-full" />
                             </div>
                             {(activeItem.headlines && activeItem.headlines.length > 0) ? (
                               activeItem.headlines.map((headline, idx) => (
                                 <motion.h2 
                                   key={idx}
                                   initial={{ opacity: 0, y: 20 }}
                                   animate={{ opacity: 1 - (idx * 0.35), y: 0 }}
                                   transition={{ delay: idx * 0.2, duration: 0.8 }}
                                   className={cn(
                                     "font-black leading-[1.02] text-white tracking-widest uppercase transition-all duration-500",
                                     dynamicStyles.hSize,
                                     idx === 0 ? "opacity-100" : 
                                     idx === 1 ? "opacity-60" : 
                                     idx === 2 ? "opacity-30" : "opacity-10"
                                   )}
                                 >
                                   {headline}
                                 </motion.h2>
                               ))
                             ) : (
                               <h2 className={cn(
                                 "font-black leading-[1.02] text-white tracking-widest uppercase transition-all duration-500",
                                 dynamicStyles.hSize
                               )}>
                                 {activeItem.headline}
                               </h2>
                             )}
                           </div>
                           
                           {/* Decorative Ghost Items for Depth */}
                           <div className="space-y-8 opacity-5 pointer-events-none">
                              {newsItems.filter(i => i.id !== activeItem.id).slice(0, 1).map(item => (
                                <div key={`ghost-${item.id}`} className="border-l-4 border-white/20 pl-8 py-4">
                                  <h3 className="font-black text-3xl leading-tight mb-2 uppercase tracking-wide opacity-20">{item.headline}</h3>
                                </div>
                              ))}
                           </div>
                        </motion.div>
                      )}
                   </AnimatePresence>
                </div>

                <div className="mt-auto" />
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
