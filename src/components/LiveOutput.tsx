import React, { useEffect, useState, useRef } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { NewsItem, AppStatus } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import MediaContainer from './MediaContainer';
import NewsTicker from './NewsTicker';
import ClockWidget from './ClockWidget';
import LowerThird from './LowerThird';
import BroadcastBackground from './BroadcastBackground';
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
  LucideIcon
} from 'lucide-react';

export default function LiveOutput() {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [status, setStatus] = useState<AppStatus | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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

  // Slideshow Logic
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

  // Handle Reset Signal
  useEffect(() => {
    if (status?.forceResetTime) {
      setCurrentIndex(0);
    }
  }, [status?.forceResetTime]);

  const activeItem = newsItems[currentIndex];
  const [tickerData, setTickerData] = useState<{ weather: React.ReactNode; rates: string[] }>({
    weather: "Moti Shkodër: --",
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

  // Fetch Ticker Info
  useEffect(() => {
    const fetchTickerInfo = async () => {
      try {
        // 1. Fetch Weather (Open-Meteo for Shkodra)
        const weatherRes = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=42.0683&longitude=19.5011&current=temperature_2m,weather_code"
        );
        const weatherJson = await weatherRes.json();
        const temp = Math.round(weatherJson.current.temperature_2m);
        const code = weatherJson.current.weather_code;
        const condition = weatherMap[code] || "I pastër";
        const WeatherIcon = weatherIconMap[code] || Cloud;

        const weatherNode = (
          <div className="flex items-center gap-3">
            <WeatherIcon size={32} className="text-brand-red" strokeWidth={3} />
            <span>Moti Shkodër: {temp}°C {condition}</span>
          </div>
        );

        // 2. Fetch Exchange Rates (Relative to LEK)
        // Using open.er-api.com for free latest rates
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
            weather: weatherNode,
            rates: [
              `EUR/LEK: ${getPriceInLek('EUR')}`,
              `USD/LEK: ${getPriceInLek('USD')}`,
              `CHF/LEK: ${getPriceInLek('CHF')}`,
              `GBP/LEK: ${getPriceInLek('GBP')}`,
              `Kursi Zyrtar (LEK)`
            ]
          });
        } else {
          setTickerData(prev => ({ ...prev, weather: weatherNode }));
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
    
    let hSize = "text-6xl";
    
    if (hLen > 100) {
      hSize = "text-4xl";
    } else if (hLen > 60) {
      hSize = "text-5xl";
    } else if (hLen < 30) {
      hSize = "text-7xl";
    }
    
    return { hSize };
  };

  const dynamicStyles = activeItem ? getDynamicStyles(activeItem.headline) : { hSize: "text-6xl" };

  return (
    <div className="relative w-screen h-screen bg-[#020202] overflow-hidden flex items-center justify-center select-none overflow-x-hidden">
      <BroadcastBackground />

      {/* Main Broadcast Container (16:9) */}
      <div 
        className="relative z-10 w-full h-full flex flex-col gap-2 md:gap-6 p-4 md:p-8 overflow-hidden"
        style={{
          height: 'min(100svh, 56.25vw)',
          width: 'min(100vw, 177.78svh)',
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-start shrink-0">
          <div className="flex items-center gap-3 md:gap-6 bg-black/60 backdrop-blur-md px-4 md:px-10 py-2 md:py-5 rounded-xl md:rounded-2xl border border-white/10 shadow-2xl">
            <div className="relative flex items-center gap-2">
              <div className="absolute -left-1 -top-1 w-full h-full bg-red-600/30 blur-xl rounded-full animate-ping" />
              <div className="bg-red-600 text-white text-[10px] md:text-sm font-black px-2 md:px-3 py-0.5 md:py-1 rounded-md flex items-center gap-1.5 md:gap-2 uppercase tracking-[0.1em] md:tracking-[0.2em] shadow-[0_0_15px_rgba(220,38,38,0.5)]">
                <div className="w-1.5 md:w-2 h-1.5 md:h-2 bg-white rounded-full animate-pulse shadow-[0_0_8px_white]" />
                Live
              </div>
            </div>
            <div className="h-6 md:h-10 w-px bg-white/20" />
            <h1 className="text-lg md:text-4xl font-black tracking-tighter uppercase italic drop-shadow-lg">
              Shkodra <span className="text-brand-red">Politike</span>
            </h1>
          </div>
          
          <ClockWidget />
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0 flex gap-3 md:gap-6">
          {/* Media Player - 62% per Editorial Design */}
          <div className="w-[62%] relative h-full">
            <AnimatePresence mode="wait">
              {activeItem && (
                <MediaContainer 
                  key={activeItem.id}
                  url={activeItem.mediaUrl}
                  type={activeItem.mediaType}
                  source={activeItem.source}
                  isBreakingNews={activeItem.isBreakingNews}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Vertical News Area - 38% per Editorial Design */}
          <div className="w-[38%] flex flex-col h-full">
             <div className="flex-1 glass-morphism rounded-xl md:rounded-2xl p-4 md:p-10 relative overflow-hidden flex flex-col">
                <div className="flex items-center justify-between mb-4 md:mb-8 shrink-0">
                  <span className="text-[8px] md:text-xs font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-brand-red">Lajmet Kryesore</span>
                  <div className="flex gap-1">
                    <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-white/40"></div>
                    <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-brand-red animate-pulse"></div>
                    <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-white/40"></div>
                  </div>
                </div>
                
                <div className="flex-1 relative min-h-0">
                   <AnimatePresence mode="wait">
                      {activeItem && (
                        <motion.div
                          key={activeItem.id}
                          initial={{ opacity: 0, x: 50 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -50 }}
                          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                          className="absolute inset-0 flex flex-col gap-4 md:gap-12 py-2 md:py-10"
                        >
                           <div className="border-l-4 md:border-l-8 border-brand-red pl-4 md:pl-10 flex flex-col gap-3 md:gap-6">
                             <div className="flex items-center gap-2 md:gap-4 mb-2 md:mb-4 shrink-0">
                               <div className="bg-brand-red px-2 md:px-5 py-0.5 md:py-2 rounded md:rounded-lg text-sm md:text-xl font-black italic text-white uppercase tracking-[0.1em] md:tracking-[0.2em] skew-x-[-15deg] shadow-[0_0_20px_rgba(220,38,38,0.4)]">
                                 <span className="skew-x-[15deg] block">
                                   {activeItem.publishedTime || 'TANI'}
                                 </span>
                               </div>
                               <div className="h-0.5 md:h-1 w-12 md:w-24 bg-white/10 rounded-full" />
                             </div>
                             <div className="overflow-hidden">
                               {(activeItem.headlines && activeItem.headlines.length > 0) ? (
                                 <div className="flex flex-col gap-2 md:gap-4">
                                   {activeItem.headlines.slice(0, 3).map((headline, idx) => (
                                     <motion.h2 
                                       key={idx}
                                       initial={{ opacity: 0, y: 10 }}
                                       animate={{ opacity: 1 - (idx * 0.35), y: 0 }}
                                       transition={{ delay: idx * 0.1, duration: 0.5 }}
                                       className={cn(
                                         "font-black leading-[1.1] md:leading-[1.02] text-white tracking-wider md:tracking-widest uppercase transition-all duration-500 line-clamp-2",
                                         idx === 0 ? "text-xl sm:text-2xl md:text-4xl lg:text-5xl xl:text-6xl opacity-100" : 
                                         idx === 1 ? "text-lg sm:text-xl md:text-3xl lg:text-4xl lg:text-5xl opacity-60" : 
                                         "text-base sm:text-lg md:text-2xl lg:text-3xl lg:text-4xl opacity-30"
                                       )}
                                     >
                                       {headline}
                                     </motion.h2>
                                   ))}
                                 </div>
                               ) : (
                                 <h2 className={cn(
                                   "font-black leading-[1.1] md:leading-[1.02] text-white tracking-wider md:tracking-widest uppercase transition-all duration-500 text-xl sm:text-2xl md:text-4xl lg:text-5xl xl:text-6xl",
                                 )}>
                                   {activeItem.headline}
                                 </h2>
                               )}
                             </div>
                           </div>
                           
                           {/* Decorative Ghost - Hidden on small heights */}
                           <div className="hidden lg:block space-y-8 opacity-5 pointer-events-none mt-auto">
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
             </div>
          </div>
        </div>

        {/* Lower Thirds & Ticker */}
        <div className="h-10 md:h-24 flex items-center bg-white text-black relative z-30 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] -mx-4 md:-mx-8 overflow-hidden shrink-0">
           <div className="bg-brand-red px-6 md:px-14 h-full flex items-center font-black italic text-sm md:text-3xl tracking-tighter uppercase whitespace-nowrap border-r-4 md:border-r-8 border-black/10 text-white skew-x-[-15deg] -translate-x-3 md:-translate-x-6 shrink-0">
             <span className="skew-x-[15deg] pr-2">Info Shërbime</span>
           </div>
           <NewsTicker items={[
             tickerData.weather,
             ...tickerData.rates,
             "Info Shërbime LIVE"
           ]} />
           <div className="h-full px-4 md:px-12 flex items-center bg-[#1877F2] text-white shrink-0 skew-x-[-15deg] translate-x-3 md:translate-x-6 border-l-4 md:border-l-8 border-white/20">
             <div className="skew-x-[15deg] flex flex-col items-start gap-0">
               <div className="flex items-center gap-1 md:gap-2">
                 <Facebook size={12} className="md:size-6" fill="white" />
                 <span className="text-[8px] md:text-[12px] font-black tracking-widest uppercase opacity-80 leading-none">Na ndiqni</span>
               </div>
               <span className="text-xs md:text-2xl font-black tracking-tighter uppercase leading-none">/shkodrapolitike</span>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
