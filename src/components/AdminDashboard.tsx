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
  User,
  Menu,
  X as CloseIcon
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
    <div className="h-screen bg-[#050505] text-white flex flex-col md:flex-row overflow-hidden">
      {/* Mobile Top Bar */}
      <div className="md:hidden h-24 border-b border-white/5 bg-black/40 flex items-center justify-between px-4 pt-6 shrink-0">
        <h1 className="text-3xl font-black uppercase tracking-tighter italic leading-none">
          Shkodra <span className="text-brand-red">Politike</span>
        </h1>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2.5 bg-white/5 rounded-lg border border-white/10"
        >
          {isSidebarOpen ? <CloseIcon size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-0 z-[60] md:relative md:inset-auto md:flex w-80 border-r border-white/5 bg-black/40 flex flex-col p-6 overflow-y-auto transition-transform duration-300 md:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        {/* Mobile Close Button */}
        <button 
          onClick={() => setIsSidebarOpen(false)}
          className="md:hidden absolute top-6 right-6 p-2 bg-white/5 rounded-lg border border-white/10"
        >
          <CloseIcon size={20} />
        </button>

        <div className="mb-8 hidden md:block">
           <h1 className="text-3xl font-black uppercase tracking-tighter italic leading-none">
             Shkodra <span className="text-brand-red">Politike</span>
           </h1>
           <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1">Status: LIVE DASHBOARD</p>
        </div>

        <div className="flex flex-col gap-2 mb-8 mt-12 md:mt-0">
           <button 
             onClick={() => { togglePlayback(); setIsSidebarOpen(false); }}
             className={cn(
               "flex items-center justify-between px-4 py-4 rounded-xl font-bold transition-all",
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
             className="flex items-center gap-2 px-4 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold transition-all"
           >
             <ExternalLink size={18} />
             Hap Live Output (OBS)
           </a>
        </div>

        <div className="flex-1">
           <div className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em] mb-4">Mjetet e Adminit</div>
           <nav className="flex flex-col gap-1">
             <button onClick={() => {setShowAddForm(true); setEditingItem(null); setIsSidebarOpen(false); }} className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium hover:bg-white/5 transition-all text-white/80">
               <Plus size={18} className="text-brand-red" /> Shto Lajm të Ri
             </button>
             <div className="h-px bg-white/5 my-2" />
             <div className="flex items-center gap-3 px-3 py-2 text-[10px] text-white/20 font-bold uppercase tracking-widest">
               Kontrolli i Përdoruesit
             </div>
             <div className="px-3 py-2 flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full border border-brand-red flex items-center justify-center bg-brand-red/10">
                  <User size={16} className="text-brand-red" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold truncate max-w-[140px]">Super Admin</span>
                  <span className="text-[10px] opacity-40 truncate max-w-[140px]">admin@shkodrapolitike.tv</span>
                </div>
             </div>
             <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-3 rounded-lg text-xs font-bold text-red-400 hover:bg-red-400/10 transition-all">
               <LogOut size={18} /> Dil nga Dashboard
             </button>
           </nav>
        </div>
      </div>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-24 md:h-20 border-b border-white/5 flex items-center justify-between px-4 md:px-10 shrink-0 bg-black/20 backdrop-blur-sm pt-8 md:pt-0">
           <div className="flex flex-col">
             <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight">Radha</h2>
             <span className="text-[9px] md:text-[10px] opacity-30 font-bold uppercase tracking-widest">{items.length} Lajme</span>
           </div>
           
           <button 
             onClick={() => {setShowAddForm(true); setEditingItem(null)}}
             className="bg-white text-black font-black px-5 md:px-6 py-2.5 md:py-2.5 rounded-full text-[11px] md:text-xs uppercase tracking-widest hover:bg-brand-red hover:text-white transition-all shadow-xl flex items-center gap-2"
           >
             <Plus size={16} /> <span className="hidden sm:inline">Lajm i Ri</span><span className="sm:hidden">SHTO</span>
           </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-10 bg-[radial-gradient(circle_at_50%_0%,rgba(204,0,0,0.05),transparent)]">
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
                  <div className="py-20 md:py-32 flex flex-col items-center justify-center opacity-20 border-2 border-dashed border-white/10 rounded-3xl">
                     <AlertCircle size={40} className="mb-4" />
                     <p className="font-bold uppercase tracking-widest text-center text-sm">Nuk ka lajme në radhë</p>
                  </div>
                )}
              </div>
            </SortableContext>
          </DndContext>
        </main>

        {/* Modal Overlay for Add/Edit Form */}
        {showAddForm && (
          <div className="fixed inset-0 z-[100] flex md:items-center justify-center p-0 md:p-8 bg-black/90 backdrop-blur-2xl overflow-y-auto">
             <div className="max-w-2xl w-full h-full md:h-auto">
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
        "glass-morphism h-auto md:h-28 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-6 p-4 md:pr-6 group transition-all",
        isDragging ? "shadow-2xl border-brand-red opacity-80" : "hover:border-white/20",
        item.isBreakingNews && "border-brand-red/40"
      )}
    >
      <div className="flex items-center justify-between md:justify-start gap-4">
        <div {...attributes} {...listeners} className="h-full py-2 flex items-center cursor-grab active:cursor-grabbing text-white/20 hover:text-white/60 transition-colors">
          <GripVertical size={20} />
        </div>

        <div className="w-24 md:w-32 h-16 md:h-20 rounded-xl overflow-hidden bg-white/5 shrink-0 border border-white/5 relative">
          {item.mediaType === 'video' ? (
            <div className="w-full h-full flex items-center justify-center bg-blue-900/20">
               <VideoIcon size={20} className="text-blue-500" />
            </div>
          ) : (
            <img src={item.mediaUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          )}
          {item.isBreakingNews && (
            <div className="absolute top-1 right-1 w-2 h-2 bg-brand-red rounded-full animate-pulse" />
          )}
        </div>

        <div className="md:hidden flex items-center gap-2">
           <button onClick={onEdit} className="p-2.5 rounded-xl bg-white/5 text-white/60">
             REDAKTO
           </button>
           <button onClick={onDelete} className="p-2.5 rounded-xl bg-red-900/10 text-red-500/60">
             <Trash2 size={18} />
           </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
           <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/5 text-white/40">
             #{item.order + 1}
           </span>
           {item.isBreakingNews && (
             <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-brand-red/20 text-brand-red border border-brand-red/20">
               LAJMI I FUNDIT
             </span>
           )}
           <span className="text-[8px] md:text-[9px] font-bold opacity-30">{item.duration}s</span>
           {item.source && (
             <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/10 text-white/80 border border-white/10 truncate max-w-[120px]">
               Burimi: {item.source}
             </span>
           )}
           {item.publishedTime && (
             <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/10">
               {item.publishedTime}
             </span>
           )}
        </div>
        <h3 className="text-base md:text-lg font-bold truncate leading-tight">{item.headline}</h3>
      </div>

      <div className="hidden md:flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-[10px] font-black uppercase tracking-widest">
          Redakto
        </button>
        <button onClick={onDelete} className="p-2.5 rounded-xl bg-red-900/10 hover:bg-red-900/30 text-red-500/60 hover:text-red-500">
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}
