import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { TVVideo, TVAd, TVLowerThird, AppStatus } from '../types';
import { 
  Plus, 
  Trash2, 
  Play, 
  Pause,
  Monitor,
  Layout,
  Type,
  Eye,
  EyeOff,
  Radio,
  Link as LinkIcon,
  Video,
  RefreshCcw,
  Square
} from 'lucide-react';
import { cn } from '../lib/utils';
import VideoPlayer from './VideoPlayer';

interface TVDashboardProps {
  inheritedStatus?: AppStatus | null;
  inheritedVideos?: TVVideo[];
  inheritedAds?: TVAd[];
  inheritedLowerThirds?: TVLowerThird[];
}

export default function TVDashboard({ 
  inheritedStatus, 
  inheritedVideos, 
  inheritedAds, 
  inheritedLowerThirds 
}: TVDashboardProps) {
  const [videos, setVideos] = useState<TVVideo[]>(inheritedVideos || []);
  const [ads, setAds] = useState<TVAd[]>(inheritedAds || []);
  const [lowerThirds, setLowerThirds] = useState<TVLowerThird[]>(inheritedLowerThirds || []);
  const [status, setStatus] = useState<AppStatus | null>(inheritedStatus || null);
  
  const [addMethod, setAddMethod] = useState<'url' | 'embed'>('url');
  const [newVideo, setNewVideo] = useState({ title: '', url: '', type: 'youtube', embedCode: '' });
  const [newAd, setNewAd] = useState({ title: '', imageUrl: '' });
  const [newLT, setNewLT] = useState({ title: '', subtitle: '' });

  useEffect(() => {
    if (inheritedStatus) setStatus(inheritedStatus);
  }, [inheritedStatus]);

  useEffect(() => {
    if (inheritedVideos) setVideos(inheritedVideos);
  }, [inheritedVideos]);

  useEffect(() => {
    if (inheritedAds) setAds(inheritedAds);
  }, [inheritedAds]);

  useEffect(() => {
    if (inheritedLowerThirds) setLowerThirds(inheritedLowerThirds);
  }, [inheritedLowerThirds]);

  const updateStatus = async (updates: Partial<AppStatus>) => {
    await updateDoc(doc(db, 'status', 'current'), {
      ...updates,
      lastUpdated: Date.now()
    });
  };

  const handlePlayVideo = async (video: TVVideo) => {
    await updateStatus({
      mode: 'video',
      activeVideoUrl: video.url || '',
      videoSource: video.type as any,
      embedCode: video.embedCode || '',
      currentVideoId: video.id,
      isPlaying: true,
      transportAction: 'play'
    });
  };

  const handleStopBroadcast = async () => {
    await updateStatus({
      mode: 'news',
      isPlaying: false,
      transportAction: 'stop'
    });
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVideo.title) return;
    
    let type: TVVideo['type'] = 'youtube';
    const url = newVideo.url.toLowerCase();
    if (url.includes('facebook.com') || url.includes('fb.watch')) type = 'facebook';
    else if (url.includes('.m3u8')) type = 'hls';
    else if (addMethod === 'embed') type = 'embed';
    else type = 'direct';

    await addDoc(collection(db, 'tvVideos'), {
      ...newVideo,
      type,
      order: videos.length
    });
    setNewVideo({ title: '', url: '', type: 'youtube', embedCode: '' });
  };

  const handleAddAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAd.title || !newAd.imageUrl) return;
    await addDoc(collection(db, 'tvAds'), { ...newAd, active: false });
    setNewAd({ title: '', imageUrl: '' });
  };

  const handleAddLT = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLT.title) return;
    await addDoc(collection(db, 'tvLowerThirds'), { ...newLT, active: false });
    setNewLT({ title: '', subtitle: '' });
  };

  if (!status) return null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#050505]">
      {/* Header Area */}
      <header className="h-20 border-b border-white/5 flex items-center justify-between px-10 shrink-0 bg-black/40">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <h2 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
              TV PRO CONTROL <Monitor className="text-brand-red" size={24} />
            </h2>
            <span className="text-[10px] text-white/30 font-bold uppercase tracking-[0.3em]">BROADCASTING SYSTEM</span>
          </div>
        </div>

        <button className="bg-brand-red text-white px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-brand-red/20">
          <Radio size={16} /> VIDEO LIVE
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-10 flex flex-col gap-10 bg-[radial-gradient(circle_at_50%_0%,rgba(204,0,0,0.05),transparent)]">
        
        {/* Main Video Section */}
        <div className="glass-morphism rounded-3xl p-8 flex flex-col gap-6 border-brand-red/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-red/5 blur-[120px] pointer-events-none" />
          
          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-brand-red flex items-center justify-center shadow-lg shadow-brand-red/20">
                <Play className="text-white ml-1" fill="currentColor" size={32} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-red mb-1">DUKE TRANSMETUAR LIVE</span>
                <h3 className="text-3xl font-black tracking-tight">{status.currentVideoId ? (videos.find(v => v.id === status.currentVideoId)?.title || "Burim i Jashtëm (Embed)") : "Asnjë video aktive"}</h3>
              </div>
            </div>

            <div className="flex items-center gap-4">
               <button 
                 onClick={() => updateStatus({ transportAction: 'restart' })}
                 className="bg-white/5 hover:bg-white/10 text-white/60 font-black px-8 py-3.5 rounded-xl text-[11px] uppercase tracking-[0.2em] transition-all border border-white/10 shadow-lg"
               >
                 RINFRËSKO PLAYERIN
               </button>
               <button 
                 onClick={handleStopBroadcast}
                 className="bg-white text-black hover:bg-brand-red hover:text-white font-black px-8 py-3.5 rounded-xl text-[11px] uppercase tracking-[0.2em] transition-all shadow-2xl"
               >
                 NDALO TRANSMETIMIN
               </button>
            </div>
          </div>

          <div className="w-full aspect-video rounded-[2rem] bg-black overflow-hidden border-4 border-white/5 shadow-[0_0_100px_rgba(0,0,0,0.5)] relative">
             <VideoPlayer status={status} onEnded={() => {}} />
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-6 flex-1 max-w-md">
              <span className="text-[10px] font-black uppercase text-white/20 tracking-[0.4em]">VOLUMI</span>
              <div className="flex-1 relative h-1.5 bg-white/5 rounded-full">
                <input 
                  type="range" 
                  min="0" max="100" 
                  value={status.volume ?? 100} 
                  onChange={e => updateStatus({ volume: parseInt(e.target.value) })}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                />
                <div 
                  className="absolute left-0 top-0 h-full bg-brand-red rounded-full shadow-[0_0_15px_rgba(204,0,0,0.5)]" 
                  style={{ width: `${status.volume ?? 100}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full border-2 border-brand-red" />
                </div>
              </div>
              <span className="text-xs font-black text-white/60 min-w-[35px] tabular-nums">{status.volume ?? 100}%</span>
            </div>

            <button 
              onClick={() => updateStatus({ isPlaylistActive: !status.isPlaylistActive })}
              className={cn(
                "px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 transition-all shadow-xl",
                status.isPlaylistActive ? "bg-green-500 text-white shadow-green-500/20" : "bg-white/5 text-white/30 border border-white/5"
              )}
            >
              <RefreshCcw size={16} className={status.isPlaylistActive ? "animate-spin" : ""} /> AUTOPLAY PLAYLIST
            </button>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-start">
          
          {/* PLAYLIST SECTION - left column, 7/12 width */}
          <section className="xl:col-span-7 flex flex-col gap-6">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-xl bg-brand-red/10 border border-brand-red/20 flex items-center justify-center">
                 <Layout className="text-brand-red" size={20} />
               </div>
               <h3 className="text-xl font-black uppercase tracking-widest">PLAYLIST</h3>
            </div>

            <div className="bg-black/60 rounded-[2rem] p-8 border border-white/5 flex flex-col gap-8 shadow-2xl relative overflow-hidden">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setAddMethod('url')}
                  className={cn("px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all", addMethod === 'url' ? "bg-white/5 text-white/40 border border-white/5" : "text-white/20")}
                >
                  LINK VIDEO
                </button>
                <button 
                  onClick={() => setAddMethod('embed')}
                  className={cn("px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg", addMethod === 'embed' ? "bg-brand-red text-white" : "text-white/20")}
                >
                  KODI EMBED
                </button>
              </div>

              <form onSubmit={handleAddVideo} className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] ml-2">Titulli i Videos / Transmetimit</span>
                  <input 
                    type="text" 
                    placeholder="Titull..." 
                    className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-brand-red/40 transition-all font-bold placeholder:text-white/10"
                    value={newVideo.title}
                    onChange={e => setNewVideo({...newVideo, title: e.target.value})}
                  />
                </div>
                
                <div className="flex flex-col gap-2">
                  <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] ml-2">
                    {addMethod === 'url' ? 'URL e Media-s (YT, FB, HLS...)' : 'Ngjit këtu kodin <iframe...> ose <script...>'}
                  </span>
                  {addMethod === 'url' ? (
                    <input 
                      type="text" 
                      placeholder="Linku..." 
                      className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-brand-red/40 transition-all font-mono placeholder:text-white/10"
                      value={newVideo.url}
                      onChange={e => setNewVideo({...newVideo, url: e.target.value})}
                    />
                  ) : (
                    <div className="relative group/textarea">
                      <textarea 
                        placeholder="Kodi..." 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-brand-red/40 transition-all min-h-[140px] font-mono text-[11px] placeholder:text-white/10"
                        value={newVideo.embedCode}
                        onChange={e => setNewVideo({...newVideo, embedCode: e.target.value})}
                      />
                      <div className="absolute bottom-4 right-4 pointer-events-none opacity-20 group-focus-within/textarea:opacity-50 transition-opacity">
                        <Video size={32} />
                      </div>
                    </div>
                  )}
                </div>

                <button type="submit" className="bg-white text-black hover:bg-brand-red hover:text-white font-black py-5 rounded-2xl text-[11px] uppercase tracking-[0.3em] transition-all shadow-2xl active:scale-95">
                  SHTO NË PLAYLIST
                </button>
              </form>
            </div>

            <div className="flex flex-col gap-3">
              {videos.map(video => (
                <div 
                  key={video.id}
                  className={cn(
                    "group p-4 rounded-[1.5rem] border flex items-center justify-between transition-all cursor-pointer relative overflow-hidden",
                    status.currentVideoId === video.id && status.mode === 'video'
                    ? "bg-brand-red/10 border-brand-red/50 shadow-[0_0_30px_rgba(204,0,0,0.1)]" 
                    : "bg-black/40 border-white/5 hover:border-white/20"
                  )}
                  onClick={() => handlePlayVideo(video)}
                >
                  <div className="flex items-center gap-5 relative z-10">
                    <div className="flex flex-col gap-1 items-center justify-center text-white/5 group-hover:text-white/20 transition-colors">
                      <div className="w-1 h-1 rounded-full bg-current" />
                      <div className="w-1 h-1 rounded-full bg-current" />
                      <div className="w-1 h-1 rounded-full bg-current" />
                    </div>
                    
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center shadow-lg",
                      status.currentVideoId === video.id && status.mode === 'video' ? "bg-brand-red text-white" : "bg-white/5 text-white/20"
                    )}>
                      {video.type === 'embed' ? <Monitor size={20} /> : <Play size={20} fill="currentColor" />}
                    </div>
                    
                    <div className="flex flex-col">
                      <div className="flex items-center gap-3">
                        <span className="text-base font-black uppercase tracking-[0.02em]">{video.title}</span>
                        {status.currentVideoId === video.id && status.mode === 'video' && (
                           <span className="bg-brand-red text-[8px] font-black px-2 py-0.5 rounded-full text-white animate-pulse">ON AIR</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                         <span className="text-[9px] font-black uppercase text-brand-red bg-brand-red/10 px-2 py-0.5 rounded-md border border-brand-red/10">{video.type}</span>
                         <span className="text-[10px] text-white/20 truncate max-w-[250px] font-mono">{video.url || 'Embed Source'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 relative z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteDoc(doc(db, 'tvVideos', video.id)); }}
                      className="p-3 text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SIDE TOOLS - right column, 5/12 width */}
          <div className="xl:col-span-5 flex flex-col gap-10">
            
            {/* LOWER THIRDS */}
            <section className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-xl bg-brand-red/10 border border-brand-red/20 flex items-center justify-center">
                   <Type className="text-brand-red" size={20} />
                 </div>
                 <h3 className="text-xl font-black uppercase tracking-widest">LOWER THIRDS</h3>
              </div>

              <div className="flex flex-col gap-3">
                {lowerThirds.map(lt => (
                  <div key={lt.id} className="bg-black/40 rounded-[1.5rem] p-6 border border-white/5 flex items-center justify-between group/lt hover:border-white/10 transition-all">
                    <div className="flex flex-col">
                      <span className="text-base font-black uppercase tracking-tight">{lt.title}</span>
                      <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em] mt-1 line-clamp-1">{lt.subtitle}</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <button 
                        onClick={() => updateDoc(doc(db, 'tvLowerThirds', lt.id), { active: !lt.active })}
                        className={cn("transition-all", lt.active ? "text-brand-red" : "text-white/5 group-hover/lt:text-white/20")}
                      >
                        {lt.active ? <Eye size={22} /> : <EyeOff size={22} />}
                      </button>
                      <button 
                        onClick={() => deleteDoc(doc(db, 'tvLowerThirds', lt.id))} 
                        className="text-[9px] font-black text-red-500/40 hover:text-red-500 uppercase tracking-widest transition-colors"
                      >
                        FSHI
                      </button>
                    </div>
                  </div>
                ))}

                <form onSubmit={handleAddLT} className="bg-black/20 rounded-[1.5rem] p-8 border border-dashed border-white/10 flex flex-col gap-6 mt-4 relative overflow-hidden group/form">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-brand-red/5 blur-[50px] pointer-events-none group-hover/form:bg-brand-red/10 transition-all" />
                   
                   <div className="flex flex-col gap-2">
                     <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] ml-1">Titulli</span>
                     <input 
                      type="text" 
                      placeholder="Emri..." 
                      className="bg-transparent border-b border-white/10 px-1 py-3 text-sm focus:outline-none focus:border-brand-red transition-all font-bold"
                      value={newLT.title}
                      onChange={e => setNewLT({...newLT, title: e.target.value})}
                    />
                   </div>
                   
                   <div className="flex flex-col gap-2">
                     <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] ml-1">Nëntitulli</span>
                     <input 
                      type="text" 
                      placeholder="Pozicioni / Pershkrimi..." 
                      className="bg-transparent border-b border-white/10 px-1 py-3 text-sm focus:outline-none focus:border-brand-red transition-all font-bold"
                      value={newLT.subtitle}
                      onChange={e => setNewLT({...newLT, subtitle: e.target.value})}
                    />
                   </div>
                   
                   <button type="submit" className="bg-white/5 hover:bg-white/10 text-white/40 hover:text-white font-black py-4 rounded-xl text-[11px] uppercase tracking-[0.3em] transition-all shadow-xl border border-white/5">
                    KRIJO TEMPLATE
                  </button>
                </form>
              </div>
            </section>

            {/* REKLAMAT & ADS */}
            <section className="flex flex-col gap-6">
               <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-xl bg-brand-red/10 border border-brand-red/20 flex items-center justify-center">
                   <LinkIcon className="text-brand-red" size={20} />
                 </div>
                 <h3 className="text-xl font-black uppercase tracking-widest">REKLAMAT & ADS</h3>
              </div>

              <div className="flex flex-col gap-6">
                {ads.map(ad => (
                  <div key={ad.id} className="relative group rounded-[2rem] overflow-hidden border-4 border-brand-red shadow-2xl shadow-brand-red/30 transform hover:scale-[1.02] transition-all duration-500">
                    <img src={ad.imageUrl} className="w-full aspect-video object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent p-6 flex flex-col justify-between">
                       <span className="self-start bg-brand-red text-[8px] font-black px-3 py-1 rounded-md text-white tracking-[0.3em]">REKLAM</span>
                       
                       <div className="flex items-center justify-between">
                         <h4 className="text-sm font-black text-white uppercase tracking-tighter opacity-80">{ad.title}</h4>
                         <div className="flex items-center gap-4">
                           <button onClick={() => updateDoc(doc(db, 'tvAds', ad.id), { active: !ad.active })} className="p-2 bg-black/60 rounded-full border border-white/10 text-white">
                              {ad.active ? <Eye size={18} /> : <EyeOff size={18} className="opacity-40" />}
                           </button>
                           <button onClick={() => deleteDoc(doc(db, 'tvAds', ad.id))} className="p-2 bg-brand-red/80 rounded-full text-white">
                              <Trash2 size={18} />
                           </button>
                         </div>
                       </div>
                    </div>
                  </div>
                ))}

                <form onSubmit={handleAddAd} className="bg-black/20 rounded-[1.5rem] p-8 border border-dashed border-white/10 flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                     <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] ml-1">Ad Title</span>
                     <input 
                      type="text" 
                      placeholder="Titulli..." 
                      className="bg-transparent border-b border-white/10 px-1 py-3 text-sm focus:outline-none focus:border-brand-red transition-all font-bold"
                      value={newAd.title}
                      onChange={e => setNewAd({...newAd, title: e.target.value})}
                    />
                  </div>
                   
                  <div className="flex flex-col gap-2">
                     <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] ml-1">Image URL</span>
                     <input 
                      type="text" 
                      placeholder="Linku i fotos..." 
                      className="bg-transparent border-b border-white/10 px-1 py-3 text-sm focus:outline-none focus:border-brand-red transition-all font-bold"
                      value={newAd.imageUrl}
                      onChange={e => setNewAd({...newAd, imageUrl: e.target.value})}
                    />
                  </div>
                  
                  <button type="submit" className="bg-white text-black hover:bg-brand-red hover:text-white font-black py-4 rounded-xl text-[11px] uppercase tracking-[0.3em] transition-all shadow-2xl active:scale-95">
                    SHTO AD
                  </button>
                </form>
              </div>
            </section>

          </div>

        </div>

      </main>
    </div>
  );
}
