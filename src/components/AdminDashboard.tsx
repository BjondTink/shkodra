import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { NewsItem, AppStatus } from '../types';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Play, 
  Pause, 
  ExternalLink, 
  LogOut, 
  Image as ImageIcon, 
  Video as VideoIcon,
  AlertCircle,
  User
} from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import NewsItemForm from './NewsItemForm';
import { cn } from '../lib/utils';

export default function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [status, setStatus] = useState<AppStatus | null>(null);
  const [editingItem, setEditingItem] = useState<NewsItem | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'newsItems'), orderBy('order', 'asc'));
    return onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NewsItem)));
    });
  }, []);

  useEffect(() => {
    return onSnapshot(doc(db, 'status', 'current'), (snapshot) => {
      if (snapshot.exists()) setStatus(snapshot.data() as AppStatus);
    });
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex(i => i.id === active.id);
      const newIndex = items.findIndex(i => i.id === over.id);
      const newItems = arrayMove(items, oldIndex, newIndex);
      
      setItems(newItems);

      // Update order in Firestore
      newItems.forEach((item: NewsItem, index: number) => {
        updateDoc(doc(db, 'newsItems', item.id), { order: index });
      });
    }
  };

  const togglePlayback = () => {
    if (!status) return;
    updateDoc(doc(db, 'status', 'current'), {
      isPlaying: !status.isPlaying,
      lastUpdated: serverTimestamp()
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('sp_admin_token');
    onLogout();
  };

  return (
    <div className="h-screen bg-[#050505] text-white flex overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 border-r border-white/5 bg-black/40 flex flex-col p-6 overflow-y-auto">
        <div className="mb-8">
           <h1 className="text-2xl font-black uppercase tracking-tighter italic leading-none">
             Shkodra <span className="text-brand-red">Politike</span>
           </h1>
           <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1">Status: LIVE DASHBOARD</p>
        </div>

        <div className="flex flex-col gap-2 mb-8">
           <button 
             onClick={togglePlayback}
             className={cn(
               "flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all",
               status?.isPlaying ? "bg-brand-red text-white" : "bg-white/5 text-white/60 hover:bg-white/10"
             )}
           >
             <span className="flex items-center gap-2">
               {status?.isPlaying ? <Play size={18} fill="currentColor" /> : <Pause size={18} fill="currentColor" />}
               {status?.isPlaying ? 'Duke luajtur' : 'Ndalur'}
             </span>
             <div className={cn("w-2 h-2 rounded-full", status?.isPlaying ? "bg-white animate-pulse" : "bg-white/20")} />
           </button>
           
           <a 
             href="?mode=live" 
             target="_blank"
             rel="noreferrer"
             className="flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold transition-all"
           >
             <ExternalLink size={18} />
             Hap Live Output (OBS)
           </a>
        </div>

        <div className="flex-1">
           <div className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em] mb-4">Mjetet e Adminit</div>
           <nav className="flex flex-col gap-1">
             <button onClick={() => {setShowAddForm(true); setEditingItem(null)}} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/5 transition-all text-white/80">
               <Plus size={16} className="text-brand-red" /> Shto Lajm të Ri
             </button>
             <div className="h-px bg-white/5 my-2" />
             <div className="flex items-center gap-3 px-3 py-2 text-[10px] text-white/20 font-bold uppercase tracking-widest">
               Kontrolli i Përdoruesit
             </div>
             <div className="px-3 py-2 flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full border border-brand-red flex items-center justify-center bg-brand-red/10">
                  <User size={14} className="text-brand-red" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold truncate max-w-[120px]">Super Admin</span>
                  <span className="text-[9px] opacity-40 truncate max-w-[120px]">admin@shkodrapolitike.tv</span>
                </div>
             </div>
             <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold text-red-400 hover:bg-red-400/10 transition-all">
               <LogOut size={16} /> Dil nga Dashboard
             </button>
           </nav>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-10 shrink-0 bg-black/20 backdrop-blur-sm">
           <div className="flex flex-col">
             <h2 className="text-xl font-black uppercase tracking-tight">Radha e Transmetimit</h2>
             <span className="text-[10px] opacity-30 font-bold uppercase tracking-widest">{items.length} Lajme në total</span>
           </div>
           
           <button 
             onClick={() => {setShowAddForm(true); setEditingItem(null)}}
             className="bg-white text-black font-black px-6 py-2.5 rounded-full text-xs uppercase tracking-widest hover:bg-brand-red hover:text-white transition-all shadow-xl flex items-center gap-2"
           >
             <Plus size={16} /> Lajm i Ri
           </button>
        </header>

        <main className="flex-1 overflow-y-auto p-10 bg-[radial-gradient(circle_at_50%_0%,rgba(204,0,0,0.05),transparent)]">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items} strategy={verticalListSortingStrategy}>
              <div className="max-w-4xl mx-auto flex flex-col gap-3">
                {items.map((item) => (
                  <SortableItem 
                    key={item.id} 
                    item={item} 
                    onEdit={() => {setEditingItem(item); setShowAddForm(true)}}
                    onDelete={async () => {
                      if (confirm('A jeni të sigurt?')) {
                        await deleteDoc(doc(db, 'newsItems', item.id));
                      }
                    }}
                  />
                ))}
                {items.length === 0 && (
                  <div className="py-32 flex flex-col items-center justify-center opacity-20 border-2 border-dashed border-white/10 rounded-3xl">
                     <AlertCircle size={48} className="mb-4" />
                     <p className="font-bold uppercase tracking-widest">Nuk ka lajme në radhë</p>
                  </div>
                )}
              </div>
            </SortableContext>
          </DndContext>
        </main>

        {/* Modal Overlay for Add/Edit Form */}
        {showAddForm && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-8 bg-black/80 backdrop-blur-xl">
             <div className="max-w-2xl w-full">
                <NewsItemForm 
                  initialData={editingItem} 
                  nextOrder={items.length} 
                  onClose={() => setShowAddForm(false)} 
                />
             </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SortableItem({ item, onEdit, onDelete }: { item: NewsItem; onEdit: () => void; onDelete: () => void | Promise<void>; key?: React.Key }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : 1
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={cn(
        "glass-morphism h-28 rounded-2xl flex items-center gap-6 pr-6 group transition-all",
        isDragging ? "shadow-2xl border-brand-red opacity-80" : "hover:border-white/20",
        item.isBreakingNews && "border-brand-red/40"
      )}
    >
      <div {...attributes} {...listeners} className="h-full px-4 flex items-center cursor-grab active:cursor-grabbing text-white/20 hover:text-white/60 transition-colors">
        <GripVertical size={20} />
      </div>

      <div className="w-32 h-20 rounded-xl overflow-hidden bg-white/5 shrink-0 border border-white/5 relative">
        {item.mediaType === 'video' ? (
          <div className="w-full h-full flex items-center justify-center bg-blue-900/20">
             <VideoIcon size={24} className="text-blue-500" />
          </div>
        ) : (
          <img src={item.mediaUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        )}
        {item.isBreakingNews && (
          <div className="absolute top-1 right-1 w-2 h-2 bg-brand-red rounded-full animate-pulse" />
        )}
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-2 mb-1">
           <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/5 text-white/40">
             #{item.order + 1}
           </span>
           {item.isBreakingNews && (
             <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-brand-red/20 text-brand-red border border-brand-red/20">
               Lajm i Fundit
             </span>
           )}
           <span className="text-[9px] font-bold opacity-30">{item.duration}s</span>
           {item.publishedTime && (
             <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/10">
               {item.publishedTime}
             </span>
           )}
        </div>
        <h3 className="text-lg font-bold truncate leading-tight">{item.headline}</h3>
        <p className="text-xs text-white/40 truncate italic">{item.scrollingText}</p>
      </div>

      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white">
          Shtypni për të redaktuar
        </button>
        <button onClick={onDelete} className="p-2.5 rounded-xl bg-red-900/10 hover:bg-red-900/30 text-red-500/60 hover:text-red-500">
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}
