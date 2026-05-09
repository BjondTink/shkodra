import React, { useState, useEffect } from 'react';
import { NewsItem, MediaType } from '../types';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { X, Image as ImageIcon, Video as VideoIcon, Save, Upload } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  initialData: NewsItem | null;
  nextOrder: number;
  onClose: () => void;
}

const MAX_CHARS = 1240;

export default function NewsItemForm({ initialData, nextOrder, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    headline: initialData?.headline || '',
    headlines: initialData?.headlines || [] as string[],
    mediaUrl: initialData?.mediaUrl || 'https://picsum.photos/seed/' + Math.random() + '/1280/720',
    mediaType: (initialData?.mediaType || 'image') as MediaType,
    duration: initialData?.duration || 10,
    isBreakingNews: initialData?.isBreakingNews || false,
    breakingNewsStartedAt: initialData?.breakingNewsStartedAt || '',
    publishedTime: initialData?.publishedTime || new Date().toLocaleTimeString('sq-AL', { hour: '2-digit', minute: '2-digit' }),
    source: initialData?.source || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        ...formData,
        scrollingText: formData.headline, // default scrolling text to headline if needed by background logic
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const storageRef = ref(storage, `news-media/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        null,
        (error) => {
          console.error('Upload error:', error);
          alert('Gabim gjatë ngarkimit të skedarit.');
          setUploading(false);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setFormData(prev => ({
            ...prev,
            mediaUrl: downloadURL,
            mediaType: file.type.startsWith('video/') ? 'video' : 'image'
          }));
          setUploading(false);
        }
      );
    } catch (error) {
      console.error('Upload error:', error);
      alert('Gabim gjatë ngarkimit.');
      setUploading(false);
    }
  };

  return (
    <div className="bg-[#111] md:border md:border-white/10 md:rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 h-full md:h-auto flex flex-col">
      <div className="h-24 md:h-auto p-4 md:p-6 md:pb-6 pt-10 md:pt-6 border-b border-white/5 flex items-center justify-between sticky top-0 bg-[#111] z-10">
        <h3 className="text-lg md:text-xl font-black uppercase tracking-tight">
          {initialData ? 'Redakto Lajmin' : 'Shto Lajm të Ri'}
        </h3>
        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-4 md:p-8 flex-1 overflow-y-auto flex flex-col gap-8 pb-32 md:pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/30 block">Titujt e Lajmit (Headlines Stack)</label>
                </div>
                
                <div className="space-y-4">
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
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 placeholder:text-white/10 focus:outline-none focus:border-brand-red focus:bg-white/10 transition-all font-black text-xl"
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
                        className="flex-1 bg-white/5 border border-white/5 rounded-xl px-4 py-4 text-sm font-bold text-white/80 focus:outline-none focus:border-white/20 transition-all"
                        placeholder={`Titulli i dytë...`}
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          const newH = (formData.headlines || []).filter((_, idx) => idx !== i + 1);
                          setFormData({...formData, headlines: newH});
                        }}
                        className="p-3 text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                      >
                        <X size={18} />
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
                      className="w-full py-3 border border-dashed border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/30 hover:border-white/20 hover:text-white/50 transition-all"
                    >
                      + Shto Titull Shtesë
                    </button>
                  )}
                </div>
              </div>
           </div>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 block mb-3">Media (URL ose Ngarko)</label>
                <div className="flex gap-2">
                  <input 
                    type="url" 
                    value={formData.mediaUrl}
                    onChange={e => setFormData({...formData, mediaUrl: e.target.value})}
                    required
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-4 placeholder:text-white/10 focus:outline-none focus:border-brand-red focus:bg-white/10 transition-all text-xs font-mono"
                    placeholder="https://..."
                  />
                  <div className="relative">
                    <input 
                      type="file" 
                      onChange={handleFileUpload}
                      className="hidden" 
                      id="file-upload"
                      accept="image/*,video/*"
                    />
                    <label 
                      htmlFor="file-upload"
                      className={cn(
                        "h-full px-5 rounded-xl flex items-center justify-center cursor-pointer transition-all border border-white/10",
                        uploading ? "bg-white/5 opacity-50" : "bg-white/5 hover:bg-white/10"
                      )}
                    >
                      {uploading ? (
                        <div className="w-6 h-6 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Upload size={20} />
                      )}
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/30 block mb-2">BURIMI (Opcionale)</label>
                  <input 
                    type="text" 
                    value={formData.source}
                    onChange={e => setFormData({...formData, source: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 placeholder:text-white/10 focus:outline-none focus:border-brand-red focus:bg-white/10 transition-all text-xs font-bold"
                    placeholder="Psh: LAJME LIVE..."
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/30 block mb-2">Ora (HH:MM)</label>
                  <input 
                    type="text" 
                    value={formData.publishedTime}
                    onChange={e => setFormData({...formData, publishedTime: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 focus:outline-none focus:border-brand-red font-bold text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                   <label className="text-[10px] font-black uppercase tracking-widest text-white/30 block mb-2">Lloji Media</label>
                   <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
                      <button 
                        type="button" 
                        onClick={() => setFormData({...formData, mediaType: 'image'})}
                        className={cn("flex-1 py-3 flex items-center justify-center gap-2 rounded-lg text-[10px] font-bold transition-all", formData.mediaType === 'image' ? 'bg-white text-black' : 'text-white/40')}
                      >
                        <ImageIcon size={14} /> Foto
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setFormData({...formData, mediaType: 'video'})}
                        className={cn("flex-1 py-3 flex items-center justify-center gap-2 rounded-lg text-[10px] font-bold transition-all", formData.mediaType === 'video' ? 'bg-white text-black' : 'text-white/40')}
                      >
                        <VideoIcon size={14} /> Video
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
                     className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-red font-bold text-center"
                   />
                </div>
              </div>

              <div className="pt-2">
                 <label className="flex items-center gap-4 cursor-pointer group">
                    <div 
                      className={cn(
                        "w-12 h-6 rounded-full transition-all relative border border-white/10 shrink-0",
                        formData.isBreakingNews ? "bg-brand-red" : "bg-white/5"
                      )}
                      onClick={() => {
                        const newVal = !formData.isBreakingNews;
                        setFormData({
                          ...formData, 
                          isBreakingNews: newVal,
                          breakingNewsStartedAt: newVal ? new Date().toISOString() : ''
                        });
                      }}
                    >
                       <div className={cn(
                         "absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-md",
                         formData.isBreakingNews ? "left-7" : "left-1"
                       )} />
                    </div>
                    <span className="text-xs font-bold tracking-tight uppercase group-hover:text-brand-red transition-colors leading-tight">
                      Marko si LAJM I FUNDIT (Breaking News)
                    </span>
                 </label>
              </div>
            </div>
        </div>

        <div className="fixed md:static bottom-0 left-0 right-0 p-4 md:p-0 bg-[#111] md:bg-transparent border-t border-white/5 md:border-none flex items-center justify-end gap-3 pt-4 md:pt-6 z-20">
           <button 
             type="button"
             onClick={onClose}
             className="flex-1 md:flex-none px-6 py-4 rounded-xl text-xs font-black uppercase tracking-widest text-white/40 hover:text-white transition-all border border-transparent md:border-none"
           >
             Anulo
           </button>
           <button 
             type="submit"
             disabled={loading}
             className="flex-1 md:flex-none bg-brand-red hover:bg-brand-red-dark text-white font-black px-10 py-4 rounded-xl uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-2xl disabled:opacity-50 transition-all transform active:scale-95"
           >
             <Save size={18} /> {loading ? 'Ruaj...' : 'Ruaj'}
           </button>
        </div>
      </form>
    </div>
  );
}
