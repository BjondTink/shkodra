import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { TVVideo, TVAd, TVLowerThird, AppStatus } from '../types';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Play, 
  Youtube, 
  Facebook, 
  Link as LinkIcon,
  Monitor,
  Layout,
  Type,
  ToggleLeft,
  ToggleRight,
  Eye,
  EyeOff
} from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '../lib/utils';
import VideoPlayer from './VideoPlayer';

export default function TVDashboard() {
  const [videos, setVideos] = useState<TVVideo[]>([]);
  const [ads, setAds] = useState<TVAd[]>([]);
  const [lowerThirds, setLowerThirds] = useState<TVLowerThird[]>([]);
  const [status, setStatus] = useState<AppStatus | null>(null);
  
  const [newVideo, setNewVideo] = useState({ title: '', url: '', type: 'youtube' as const, embedCode: '' });
  const [newAd, setNewAd] = useState({ title: '', imageUrl: '' });
  const [addMethod, setAddMethod] = useState<'url' | 'embed'>('url');
  const [newLT, setNewLT] = useState({ title: '', subtitle: '' });

  useEffect(() => {
    const qV = query(collection(db, 'tvVideos'), orderBy('order', 'asc'));
    const unsubV = onSnapshot(qV, (snapshot) => {
      setVideos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TVVideo)));
    });

    const unsubAds = onSnapshot(collection(db, 'tvAds'), (snapshot) => {
      setAds(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TVAd)));
    });

    const unsubLT = onSnapshot(collection(db, 'tvLowerThirds'), (snapshot) => {
      setLowerThirds(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TVLowerThird)));
    });

    const unsubStatus = onSnapshot(doc(db, 'status', 'current'), (snapshot) => {
      if (snapshot.exists()) setStatus(snapshot.data() as AppStatus);
    });

    return () => {
      unsubV();
      unsubAds();
      unsubLT();
      unsubStatus();
    };
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleModeToggle = async () => {
    if (!status) return;
    await updateDoc(doc(db, 'status', 'current'), {
      mode: status.mode === 'news' ? 'video' : 'news',
      lastUpdated: serverTimestamp()
    });
  };

  const handlePlayVideo = async (video: TVVideo) => {
    await updateDoc(doc(db, 'status', 'current'), {
      mode: 'video',
      activeVideoUrl: video.url || '',
      videoSource: video.type,
      embedCode: video.embedCode || '',
      currentVideoId: video.id,
      lastUpdated: serverTimestamp()
    });
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVideo.title) return;
    if (addMethod === 'url' && !newVideo.url) return;
    if (addMethod === 'embed' && !newVideo.embedCode) return;

    let finalType: 'youtube' | 'facebook' | 'direct' | 'embed' = newVideo.type;
    const url = newVideo.url.toLowerCase();
    
    if (addMethod === 'url') {
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        finalType = 'youtube';
      } else if (url.includes('facebook.com') || url.includes('fb.watch')) {
        finalType = 'facebook';
      } else if (url.endsWith('.mp4') || url.endsWith('.m3u8') || url.includes('cloudinary.com')) {
        finalType = 'direct';
      }
    } else {
      finalType = 'embed';
    }

    await addDoc(collection(db, 'tvVideos'), {
      ...newVideo,
      type: finalType,
      order: videos.length
    });
    setNewVideo({ title: '', url: '', type: 'youtube', embedCode: '' });
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = videos.findIndex(v => v.id === active.id);
      const newIndex = videos.findIndex(v => v.id === over.id);
      const newVideos = arrayMove(videos, oldIndex, newIndex);
      
      setVideos(newVideos);
      newVideos.forEach((video, index) => {
        updateDoc(doc(db, 'tvVideos', video.id), { order: index });
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <header className="h-24 md:h-20 border-b border-white/5 flex items-center justify-between px-4 md:px-10 shrink-0 bg-black/20 backdrop-blur-sm pt-8 md:pt-0">
        <div className="flex flex-col">
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight flex items-center gap-3">
            TV PRO CONTROL <Monitor className="text-brand-red" />
          </h2>
          <span className="text-[9px] md:text-[10px] opacity-30 font-bold uppercase tracking-widest">Broadcasting System</span>
        </div>

        <button 
          onClick={handleModeToggle}
          className={cn(
            "px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2",
            status?.mode === 'video' 
              ? "bg-brand-red text-white shadow-[0_0_20px_rgba(204,0,0,0.4)]" 
              : "bg-white/5 text-white/40 hover:bg-white/10"
          )}
        >
          {status?.mode === 'video' ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
          {status?.mode === 'video' ? "Video Live" : "News Cycle"}
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-10 flex flex-col gap-10 bg-[radial-gradient(circle_at_50%_0%,rgba(204,0,0,0.05),transparent)]">
        
        {/* Active Source Card */}
        {status?.mode === 'video' && (
          <div className="bg-brand-red/10 border border-brand-red/20 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col gap-6 flex-1 w-full">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-brand-red flex items-center justify-center animate-pulse shrink-0">
                  <Play fill="white" size={20} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-widest text-brand-red">Duke transmetuar live</span>
                  <h3 className="text-xl font-bold truncate max-w-md">{status.activeVideoUrl || 'Burim i Jashtëm (Embed)'}</h3>
                </div>
              </div>

              {/* Real-time Preview & Control in Dashboard */}
              <div className="w-full flex flex-col gap-3">
                <div className="w-full aspect-video rounded-2xl bg-black overflow-hidden border border-white/10 shadow-2xl relative group">
                   <div className="absolute top-4 right-4 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[9px] font-black text-white bg-brand-red px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">Live Preview</span>
                   </div>
                   
                   {/* This area is interactive so the admin can click play/pause themselves */}
                   <div className="w-full h-full pointer-events-auto">
                      <VideoPlayer status={status} onEnded={() => {}} />
                   </div>
                </div>
                <p className="text-[10px] text-white/40 italic">
                  * Këtu mund të klikoni Play/Pause direkt nëse videoja nuk nis automatikisht. Kjo do të sinkronizohet në broadcast.
                </p>
              </div>
              
              <div className="flex items-center gap-6">
                 <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-white/40 uppercase">Volumi</span>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={status.volume ?? 100} 
                      onChange={(e) => updateDoc(doc(db, 'status', 'current'), { volume: parseInt(e.target.value) })}
                      className="w-32 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-brand-red"
                    />
                    <span className="text-[10px] font-mono text-white/60">{status.volume ?? 100}%</span>
                 </div>

                 <button 
                  onClick={() => updateDoc(doc(db, 'status', 'current'), { isPlaylistActive: !status.isPlaylistActive })}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1 rounded-md text-[9px] font-black uppercase transition-all",
                    status.isPlaylistActive ? "bg-green-500 text-white" : "bg-white/5 text-white/40"
                  )}
                 >
                   {status.isPlaylistActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                   Autoplay Playlist
                 </button>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button 
                onClick={() => {
                  const currentUrl = status.activeVideoUrl;
                  updateDoc(doc(db, 'status', 'current'), { activeVideoUrl: '', lastUpdated: serverTimestamp() }).then(() => {
                    setTimeout(() => {
                      updateDoc(doc(db, 'status', 'current'), { activeVideoUrl: currentUrl, lastUpdated: serverTimestamp() });
                    }, 500);
                  });
                }}
                className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-bold uppercase tracking-widest text-[9px] rounded-xl transition-all"
              >
                Rinfresko Playerin
              </button>
              <button 
                onClick={() => updateDoc(doc(db, 'status', 'current'), { mode: 'news' })}
                className="px-6 py-3 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-brand-red hover:text-white transition-all shadow-lg"
              >
                Ndalo Transmetimin
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Playlist Section */}
          <section className="flex flex-col gap-4">
             <div className="flex items-center justify-between">
                <h3 className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                  <Layout size={20} className="text-brand-red" /> Playlist
                </h3>
             </div>

             <form onSubmit={handleAddVideo} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2 mb-2 p-1 bg-black/40 rounded-lg self-start">
                  <button 
                    type="button"
                    onClick={() => setAddMethod('url')}
                    className={cn("px-3 py-1 text-[9px] font-black uppercase rounded-md transition-all", addMethod === 'url' ? "bg-white text-black" : "text-white/40")}
                  >
                    LINK VIDEO
                  </button>
                  <button 
                    type="button"
                    onClick={() => setAddMethod('embed')}
                    className={cn("px-3 py-1 text-[9px] font-black uppercase rounded-md transition-all", addMethod === 'embed' ? "bg-brand-red text-white" : "text-white/40")}
                  >
                    KODI EMBED
                  </button>
                </div>

                <div className="flex flex-col gap-3">
                  <input 
                    type="text" 
                    placeholder="Titulli i Videos / Transmetimit" 
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-red transition-all"
                    value={newVideo.title}
                    onChange={e => setNewVideo({...newVideo, title: e.target.value})}
                  />
                  
                  {addMethod === 'url' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <select 
                        className="bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-red transition-all"
                        value={newVideo.type}
                        onChange={e => setNewVideo({...newVideo, type: e.target.value as any})}
                      >
                        <option value="youtube">YouTube</option>
                        <option value="facebook">Facebook</option>
                        <option value="direct">Direct Link (MP4)</option>
                      </select>
                      <input 
                        type="text" 
                        placeholder="Video URL" 
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-red transition-all"
                        value={newVideo.url}
                        onChange={e => setNewVideo({...newVideo, url: e.target.value})}
                      />
                    </div>
                  ) : (
                    <textarea 
                      placeholder="Ngjit këtu kodin <iframe...> ose <script...> nga Facebook/YouTube" 
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-red transition-all min-h-[100px] font-mono text-[10px]"
                      value={newVideo.embedCode}
                      onChange={e => setNewVideo({...newVideo, embedCode: e.target.value})}
                    />
                  )}
                </div>
                <button type="submit" className="bg-white text-black font-black py-2.5 rounded-lg text-[10px] uppercase tracking-widest hover:bg-brand-red hover:text-white transition-all mt-2">
                  Shto në Playlist
                </button>
             </form>

             <div className="flex flex-col gap-2">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={videos} strategy={verticalListSortingStrategy}>
                    {videos.map(video => (
                      <SortableVideoItem 
                        key={video.id} 
                        video={video} 
                        onPlay={() => handlePlayVideo(video)} 
                        onDelete={() => deleteDoc(doc(db, 'tvVideos', video.id))}
                        isActive={status?.currentVideoId === video.id && status?.mode === 'video'}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
             </div>
          </section>

          {/* Overlays Section */}
          <div className="flex flex-col gap-8">
             
             {/* Lower Thirds */}
             <section className="flex flex-col gap-4">
               <h3 className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                 <Type size={20} className="text-brand-red" /> Lower Thirds
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                 {lowerThirds.map(lt => (
                   <div key={lt.id} className={cn(
                     "p-4 rounded-2xl border transition-all flex flex-col gap-2",
                     lt.active ? "bg-brand-red/20 border-brand-red" : "bg-white/5 border-white/10"
                   )}>
                     <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase">{lt.title}</span>
                        <button onClick={() => updateDoc(doc(db, 'tvLowerThirds', lt.id), { active: !lt.active })}>
                          {lt.active ? <Eye className="text-brand-red" size={18} /> : <EyeOff size={18} className="opacity-20" />}
                        </button>
                     </div>
                     <p className="text-[10px] opacity-40">{lt.subtitle}</p>
                     <button onClick={() => deleteDoc(doc(db, 'tvLowerThirds', lt.id))} className="text-[9px] text-red-500 font-bold uppercase self-end mt-2">Fshi</button>
                   </div>
                 ))}
                 <div className="p-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] flex flex-col gap-3">
                    <input 
                      type="text" 
                      placeholder="Titulli" 
                      className="bg-transparent border-b border-white/10 text-xs py-1 focus:outline-none focus:border-brand-red"
                      value={newLT.title}
                      onChange={e => setNewLT({...newLT, title: e.target.value})}
                    />
                    <input 
                      type="text" 
                      placeholder="Nëntitulli" 
                      className="bg-transparent border-b border-white/10 text-xs py-1 focus:outline-none focus:border-brand-red"
                      value={newLT.subtitle}
                      onChange={e => setNewLT({...newLT, subtitle: e.target.value})}
                    />
                    <button 
                      onClick={async () => {
                        if (!newLT.title) return;
                        await addDoc(collection(db, 'tvLowerThirds'), { ...newLT, active: false });
                        setNewLT({ title: '', subtitle: '' });
                      }}
                      className="text-[9px] font-black uppercase tracking-widest bg-white/10 py-2 rounded-lg"
                    >
                      Krijo Template
                    </button>
                 </div>
               </div>
             </section>

             {/* Ads Section */}
             <section className="flex flex-col gap-4">
               <h3 className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                 <LinkIcon size={20} className="text-brand-red" /> Reklamat & Ads
               </h3>
               <div className="grid grid-cols-2 gap-3">
                 {ads.map(ad => (
                   <div key={ad.id} className={cn(
                     "relative rounded-xl overflow-hidden aspect-video border transition-all",
                     ad.active ? "border-brand-red border-4" : "border-white/10"
                   )}>
                      <img src={ad.imageUrl} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] font-black uppercase truncate">{ad.title}</span>
                          <div className="flex items-center gap-2">
                             <button onClick={() => updateDoc(doc(db, 'tvAds', ad.id), { active: !ad.active })} className="p-1 bg-black/40 rounded-lg">
                               {ad.active ? <Eye className="text-brand-red" size={14} /> : <EyeOff size={14} />}
                             </button>
                             <button onClick={() => deleteDoc(doc(db, 'tvAds', ad.id))} className="p-1 bg-red-500/20 rounded-lg">
                               <Trash2 size={14} className="text-red-500" />
                             </button>
                          </div>
                        </div>
                      </div>
                   </div>
                 ))}
                 <div className="aspect-video rounded-xl border border-dashed border-white/10 flex flex-col items-center justify-center p-4 text-center">
                    <input 
                      type="text" 
                      placeholder="Ad Title" 
                      className="w-full bg-transparent border-b border-white/10 text-[10px] mb-2 focus:outline-none"
                      value={newAd.title}
                      onChange={e => setNewAd({...newAd, title: e.target.value})}
                    />
                    <input 
                      type="text" 
                      placeholder="Image URL" 
                      className="w-full bg-transparent border-b border-white/10 text-[10px] mb-3 focus:outline-none"
                      value={newAd.imageUrl}
                      onChange={e => setNewAd({...newAd, imageUrl: e.target.value})}
                    />
                    <button 
                      onClick={async () => {
                        if (!newAd.imageUrl) return;
                        await addDoc(collection(db, 'tvAds'), { ...newAd, active: false });
                        setNewAd({ title: '', imageUrl: '' });
                      }}
                      className="text-[9px] font-black bg-white text-black px-4 py-1.5 rounded-full uppercase tracking-widest"
                    >
                      Shto Ad
                    </button>
                 </div>
               </div>
             </section>

          </div>
        </div>
      </main>
    </div>
  );
}

function SortableVideoItem({ video, onPlay, onDelete, isActive }: { video: TVVideo, onPlay: () => void, onDelete: () => void, isActive: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: video.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className={cn(
      "border rounded-xl p-3 flex items-center gap-4 group transition-all",
      isActive ? "bg-brand-red/10 border-brand-red" : "bg-white/5 border-white/5"
    )}>
      <div {...attributes} {...listeners} className="cursor-grab text-white/20 hover:text-white/60">
        <GripVertical size={18} />
      </div>
      <div className={cn(
        "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
        isActive ? "bg-brand-red shadow-[0_0_15px_rgba(204,0,0,0.3)]" : "bg-black/40"
      )}>
        {video.type === 'youtube' && <Youtube className={isActive ? "text-white" : "text-red-500"} size={16} />}
        {video.type === 'facebook' && <Facebook className={isActive ? "text-white" : "text-blue-500"} size={16} />}
        {video.type === 'direct' && <LinkIcon className={isActive ? "text-white" : "text-white/40"} size={16} />}
        {video.type === 'embed' && <Monitor className={isActive ? "text-white" : "text-brand-red"} size={16} />}
      </div>
      <div className="flex-1 min-w-0">
         <div className="flex items-center gap-2">
           <h4 className={cn("text-sm font-bold truncate", isActive ? "text-white" : "text-white/80")}>{video.title}</h4>
           {isActive && <span className="bg-brand-red text-white text-[7px] font-black px-1 py-0.5 rounded animate-pulse uppercase">On Air</span>}
         </div>
         <div className="flex items-center gap-2">
           <span className="text-[8px] font-black uppercase px-1.5 rounded bg-white/5 text-white/30">{video.type}</span>
           <span className="text-[10px] opacity-20 truncate">{video.url || 'Embed'}</span>
         </div>
      </div>
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
         <button onClick={onPlay} className="p-2 bg-brand-red rounded-lg text-white">
           <Play fill="white" size={14} />
         </button>
         <button onClick={onDelete} className="p-2 bg-white/5 rounded-lg text-white/40 hover:text-red-500">
           <Trash2 size={14} />
         </button>
      </div>
    </div>
  );
}
