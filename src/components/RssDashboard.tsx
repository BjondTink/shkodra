import React, { useState, useEffect } from 'react';
import { AppStatus, NewsItem } from '../types';
import { db } from '../lib/firebase';
import { doc, updateDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { 
  Radio, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  Download, 
  Sliders, 
  Search,
  Newspaper,
  Layers,
  Sparkles
} from 'lucide-react';

interface Props {
  status: AppStatus | null;
  nextOrder: number;
}

export default function RssDashboard({ status, nextOrder }: Props) {
  const [rssItems, setRssItems] = useState<NewsItem[]>([]);
  const [sources, setSources] = useState<{ id: string; name: string; category: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filterSource, setFilterSource] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());

  const isRssEnabled = status?.rssEnabled !== false;
  const rssMode = status?.rssMode || 'mixed';

  const loadRssNews = async (force = false) => {
    try {
      if (force) setRefreshing(true);
      else setLoading(true);

      const res = await fetch(`/api/rss-news${force ? '?refresh=true' : ''}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        setRssItems(data.items);
      }

      const srcRes = await fetch('/api/rss-news/sources');
      const srcData = await srcRes.json();
      if (srcData.success && Array.isArray(srcData.sources)) {
        setSources(srcData.sources);
      }
    } catch (e) {
      console.error('Error loading RSS news in dashboard:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRssNews();
  }, []);

  const handleToggleRss = async () => {
    await updateDoc(doc(db, 'status', 'current'), {
      rssEnabled: !isRssEnabled,
      lastUpdated: serverTimestamp()
    });
  };

  const handleSetMode = async (mode: 'mixed' | 'rss_only' | 'manual_only') => {
    await updateDoc(doc(db, 'status', 'current'), {
      rssMode: mode,
      lastUpdated: serverTimestamp()
    });
  };

  const handleImportToManual = async (item: NewsItem) => {
    try {
      await addDoc(collection(db, 'newsItems'), {
        headline: item.headline,
        headlines: item.headlines || [item.headline],
        scrollingText: item.scrollingText || item.headline,
        mediaUrl: item.mediaUrl,
        mediaType: item.mediaType,
        duration: item.duration || 12,
        isBreakingNews: item.isBreakingNews || false,
        source: item.source || 'RSS',
        publishedTime: item.publishedTime || 'TANI',
        order: nextOrder,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setImportedIds(prev => new Set(prev).add(item.id));
    } catch (e) {
      console.error('Failed to import RSS item:', e);
      alert('Gabim gjatë importimit të lajmit në radhë.');
    }
  };

  const filteredItems = rssItems.filter(item => {
    const matchesSource = filterSource === 'all' || item.source?.toLowerCase() === filterSource.toLowerCase();
    const matchesSearch = !searchQuery || 
      item.headline.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (item.summary && item.summary.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSource && matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[radial-gradient(circle_at_50%_0%,rgba(204,0,0,0.06),transparent)]">
      {/* Top Header */}
      <header className="h-24 md:h-20 border-b border-white/5 flex items-center justify-between px-4 md:px-10 shrink-0 bg-black/20 backdrop-blur-sm pt-8 md:pt-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand-red/10 border border-brand-red/30 flex items-center justify-center">
            <Radio className="w-5 h-5 text-brand-red animate-pulse" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight flex items-center gap-2">
              Lajmet Non-Stop (RSS)
              <span className="text-[10px] bg-red-600/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-bold">
                LIVE PORTALET
              </span>
            </h2>
            <span className="text-[9px] md:text-[10px] opacity-40 font-bold uppercase tracking-widest">
              {rssItems.length} Lajme të freskëta nga webet kryesore shqiptare
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadRssNews(true)}
            disabled={refreshing}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/10 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-brand-red' : ''} />
            <span className="hidden sm:inline">Rifresko Tani</span>
          </button>

          <button
            onClick={handleToggleRss}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg ${
              isRssEnabled
                ? 'bg-brand-red text-white hover:bg-red-700 shadow-red-900/30'
                : 'bg-white/10 text-white/50 hover:bg-white/20'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isRssEnabled ? 'bg-white animate-ping' : 'bg-white/40'}`} />
            {isRssEnabled ? 'RSS AKTIV' : 'RSS I NDALUR'}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        {/* Controls Card */}
        <div className="bg-[#0e0e11] border border-white/10 rounded-2xl p-6 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex flex-col gap-1 max-w-xl">
              <span className="text-xs font-black uppercase tracking-widest text-brand-red flex items-center gap-2">
                <Sliders size={14} /> Mënyra e Transmetimit të Lajmeve
              </span>
              <p className="text-sm text-white/70">
                Përcaktoni se si transmetohen lajmet në TV. Me modalitetin e kombinuar, TV nuk mbetet asnjëherë pa lajme dhe transmeton lajmet e fundit pa ndërprerje.
              </p>
            </div>

            {/* Mode selection buttons */}
            <div className="flex flex-wrap items-center gap-2 bg-black/60 p-1.5 rounded-xl border border-white/10">
              <button
                onClick={() => handleSetMode('mixed')}
                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                  rssMode === 'mixed'
                    ? 'bg-brand-red text-white shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                I Kombinuar (Lokal + RSS)
              </button>
              <button
                onClick={() => handleSetMode('rss_only')}
                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                  rssMode === 'rss_only'
                    ? 'bg-brand-red text-white shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Vetëm RSS Non-Stop
              </button>
              <button
                onClick={() => handleSetMode('manual_only')}
                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                  rssMode === 'manual_only'
                    ? 'bg-brand-red text-white shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Vetëm Lokale
              </button>
            </div>
          </div>

          {/* Sources Pills */}
          <div className="mt-6 pt-5 border-t border-white/5 flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40 mr-2">
              PORTALET E LIDHURA:
            </span>
            {sources.map(src => (
              <div 
                key={src.id}
                className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1 rounded-full text-xs font-bold text-white/80"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {src.name}
              </div>
            ))}
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Kërko në titujt e lajmeve..."
              className="w-full bg-[#111] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-brand-red transition-all"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <button
              onClick={() => setFilterSource('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                filterSource === 'all'
                  ? 'bg-white text-black'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              Të Gjitha ({rssItems.length})
            </button>
            {sources.map(s => {
              const count = rssItems.filter(i => i.source?.toLowerCase() === s.name.toLowerCase()).length;
              return (
                <button
                  key={s.id}
                  onClick={() => setFilterSource(s.name)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                    filterSource.toLowerCase() === s.name.toLowerCase()
                      ? 'bg-brand-red text-white'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {s.name} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* News Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const isImported = importedIds.has(item.id);

            return (
              <div
                key={item.id}
                className="bg-[#111215] border border-white/10 rounded-2xl overflow-hidden flex flex-col hover:border-white/20 transition-all group"
              >
                {/* Image Banner */}
                <div className="relative aspect-video bg-black/60 overflow-hidden">
                  <img
                    src={item.mediaUrl}
                    alt={item.headline}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80';
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="bg-black/80 backdrop-blur-md border border-white/20 text-white text-[11px] font-black uppercase px-2.5 py-1 rounded-md shadow-lg">
                      {item.source}
                    </span>
                    {item.isBreakingNews && (
                      <span className="bg-amber-500 text-black text-[10px] font-black uppercase px-2 py-0.5 rounded shadow flex items-center gap-1 animate-pulse">
                        <AlertTriangle size={12} /> E Fundit
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-3 right-3 bg-black/80 border border-white/10 px-2 py-0.5 rounded text-[11px] font-black text-white/80">
                    {item.publishedTime}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                  <div className="space-y-2">
                    <h3 className="font-black text-sm text-white leading-snug line-clamp-2 uppercase tracking-wide group-hover:text-red-400 transition-colors">
                      {item.headline}
                    </h3>
                    {item.summary && (
                      <p className="text-white/50 text-xs line-clamp-2 leading-relaxed">
                        {item.summary}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                    {item.link ? (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-white/40 hover:text-white flex items-center gap-1 font-bold uppercase tracking-wider"
                      >
                        Lexo në Portal <ExternalLink size={12} />
                      </a>
                    ) : <div />}

                    <button
                      onClick={() => handleImportToManual(item)}
                      disabled={isImported}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        isImported
                          ? 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-400'
                          : 'bg-white/10 hover:bg-brand-red hover:text-white text-white/80 border border-white/10'
                      }`}
                    >
                      {isImported ? (
                        <>
                          <CheckCircle2 size={13} /> U Shtua
                        </>
                      ) : (
                        <>
                          <Download size={13} /> Shto në Radha
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredItems.length === 0 && !loading && (
          <div className="py-20 text-center flex flex-col items-center justify-center opacity-40 space-y-3">
            <Newspaper size={48} className="text-white/50" />
            <p className="font-black uppercase tracking-widest text-sm">Nuk u gjet asnjë lajm</p>
          </div>
        )}
      </main>
    </div>
  );
}
