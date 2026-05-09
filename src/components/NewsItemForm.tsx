import React, { useState, useEffect } from 'react';
import { NewsItem, MediaType } from '../types';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { X, Image as ImageIcon, Video as VideoIcon, Save } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  initialData: NewsItem | null;
  nextOrder: number;
  onClose: () => void;
}

const MAX_CHARS = 1240;

export default function NewsItemForm({ initialData, nextOrder, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    headline: initialData?.headline || '',
    headlines: initialData?.headlines || [] as string[],
    scrollingText: initialData?.scrollingText || '',
    mediaUrl: initialData?.mediaUrl || 'https://picsum.photos/seed/' + Math.random() + '/1280/720',
    mediaType: (initialData?.mediaType || 'image') as MediaType,
    duration: initialData?.duration || 10,
    isBreakingNews: initialData?.isBreakingNews || false,
    publishedTime: initialData?.publishedTime || new Date().toLocaleTimeString('sq-AL', { hour: '2-digit', minute: '2-digit' }),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        ...formData,
        updatedAt: serverTimestamp(),
      };

      if (initialData) {
        await updateDoc(doc(db, 'newsItems', initialData.id), data);
      } else {
        await addDoc(collection(db, 'newsItems'), {
          ...data,
          order: nextOrder,
          createdAt: serverTimestamp(),
        });
      }
      onClose();
    } catch (error) {
      console.error('Error saving news item:', error);
      alert('Gabim gjatë ruajtjes së lajmit.');
    } finally {
      setLoading(false);
    }
  };

  const charsCount = formData.scrollingText.length;
  const isOverLimit = charsCount > MAX_CHARS;

  return (
    <div className="bg-[#111] border border-white/10 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <h3 className="text-xl font-black uppercase tracking-tight">
          {initialData ? 'Redakto Lajmin' : 'Shto Lajm të Ri'}
        </h3>
        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-6">
           <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/30 block">Titujt e Lajmit (Headlines Stack)</label>
                </div>
                
                <div className="space-y-3">
                  <input 
                    type="text" 
                    value={formData.headline}
                    onChange={e => {
                      const newH = [...(formData.headlines || [])];
                      if (newH.length === 0) newH.push(e.target.value);
                      else newH[0] = e.target.value;
                      setFormData({...formData, headline: e.target.value, headlines: newH});
                    }}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 placeholder:text-white/10 focus:outline-none focus:border-brand-red focus:bg-white/10 transition-all font-black text-lg"
                    placeholder="Titulli Kryesor..."
                  />

                  {(formData.headlines || []).slice(1).map((h, i) => (
                    <div key={i} className="flex gap-2 group animate-in slide-in-from-left-2 duration-200">
                      <input 
                        type="text"
                        value={h}
                        onChange={e => {
                          const newH = [...(formData.headlines || [])];
                          newH[i+1] = e.target.value;
                          setFormData({...formData, headlines: newH});
                        }}
                        className="flex-1 bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm font-bold text-white/80 focus:outline-none focus:border-white/20 transition-all"
                        placeholder={`Titulli i dytë...`}
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          const newH = (formData.headlines || []).filter((_, idx) => idx !== i + 1);
                          setFormData({...formData, headlines: newH});
                        }}
                        className="p-3 text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}

                  {(formData.headlines || []).length < 4 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newH = [...(formData.headlines || (formData.headline ? [formData.headline] : []))];
                        newH.push('');
                        setFormData({...formData, headlines: newH});
                      }}
                      className="w-full py-2 border border-dashed border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/30 hover:border-white/20 hover:text-white/50 transition-all"
                    >
                      + Shto Titull Shtesë
                    </button>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/30 block">Zorra/Teksti Rrëshqitës (Scrolling Text)</label>
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full",
                    isOverLimit ? "bg-red-500/20 text-red-500" : "bg-white/5 text-white/30"
                  )}>
                    {charsCount} / {MAX_CHARS}
                  </span>
                </div>
                <textarea 
                  rows={8}
                  value={formData.scrollingText}
                  onChange={e => setFormData({...formData, scrollingText: e.target.value})}
                  required
                  className={cn(
                    "w-full bg-white/5 border rounded-xl px-4 py-3 placeholder:text-white/10 focus:outline-none focus:bg-white/10 transition-all text-sm leading-relaxed",
                    isOverLimit ? "border-red-500/50" : "border-white/10 focus:border-brand-red"
                  )}
                  placeholder="Teksti i plotë i lajmit..."
                />
              </div>
           </div>

           <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 block mb-2">URL e Medias (Foto/Video)</label>
                <input 
                  type="url" 
                  value={formData.mediaUrl}
                  onChange={e => setFormData({...formData, mediaUrl: e.target.value})}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 placeholder:text-white/10 focus:outline-none focus:border-brand-red focus:bg-white/10 transition-all text-xs font-mono"
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                   <label className="text-[10px] font-black uppercase tracking-widest text-white/30 block mb-2">Ora (HH:MM)</label>
                   <input 
                     type="text" 
                     value={formData.publishedTime}
                     onChange={e => setFormData({...formData, publishedTime: e.target.value})}
                     className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-brand-red font-bold text-center"
                   />
                </div>
                <div>
                   <label className="text-[10px] font-black uppercase tracking-widest text-white/30 block mb-2">Lloji Media</label>
                   <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
                      <button 
                        type="button" 
                        onClick={() => setFormData({...formData, mediaType: 'image'})}
                        className={cn("flex-1 py-2 flex items-center justify-center gap-2 rounded-lg text-[10px] font-bold transition-all", formData.mediaType === 'image' ? 'bg-white text-black' : 'text-white/40')}
                      >
                        <ImageIcon size={12} /> Foto
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setFormData({...formData, mediaType: 'video'})}
                        className={cn("flex-1 py-2 flex items-center justify-center gap-2 rounded-lg text-[10px] font-bold transition-all", formData.mediaType === 'video' ? 'bg-white text-black' : 'text-white/40')}
                      >
                        <VideoIcon size={12} /> Video
                      </button>
                   </div>
                </div>
                <div>
                   <label className="text-[10px] font-black uppercase tracking-widest text-white/30 block mb-2">Zgjatja (Sek)</label>
                   <input 
                     type="number" 
                     min={3}
                     max={60}
                     value={formData.duration}
                     onChange={e => setFormData({...formData, duration: parseInt(e.target.value) || 1})}
                     className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-brand-red font-bold text-center"
                   />
                </div>
              </div>

              <div className="pt-2">
                 <label className="flex items-center gap-3 cursor-pointer group">
                    <div 
                      className={cn(
                        "w-12 h-6 rounded-full transition-all relative border border-white/10",
                        formData.isBreakingNews ? "bg-brand-red" : "bg-white/5"
                      )}
                      onClick={() => setFormData({...formData, isBreakingNews: !formData.isBreakingNews})}
                    >
                       <div className={cn(
                         "absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-md",
                         formData.isBreakingNews ? "left-7" : "left-1"
                       )} />
                    </div>
                    <span className="text-xs font-bold tracking-tight uppercase group-hover:text-brand-red transition-colors">
                      Marko si LAJM I FUNDIT (Breaking News)
                    </span>
                 </label>
              </div>
           </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-6 border-t border-white/5">
           <button 
             type="button"
             onClick={onClose}
             className="px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-white/40 hover:text-white transition-all"
           >
             Anulo
           </button>
           <button 
             type="submit"
             disabled={loading}
             className="bg-brand-red hover:bg-brand-red-dark text-white font-black px-10 py-3 rounded-xl uppercase tracking-widest text-xs flex items-center gap-2 shadow-2xl disabled:opacity-50 transition-all transform active:scale-95"
           >
             <Save size={16} /> {loading ? 'Duke ruajtur...' : 'Ruaj ndryshimet'}
           </button>
        </div>
      </form>
    </div>
  );
}
