import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MediaType } from '../types';
import { Newspaper, Radio, Globe } from 'lucide-react';

interface Props {
  url: string;
  type: MediaType;
  source?: string;
  isBreakingNews?: boolean;
  headline?: string;
  key?: React.Key;
}

export default function MediaContainer({ url, type, source, isBreakingNews, headline }: Props) {
  const [imgError, setImgError] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="w-full h-full rounded-2xl overflow-hidden border border-white/10 bg-black relative shadow-2xl"
    >
      {type === 'video' ? (
        <motion.video
          initial={{ scale: 1 }}
          animate={{ scale: 1.12 }}
          transition={{ duration: 12, ease: "linear", repeat: Infinity, repeatType: "reverse" }}
          src={url}
          autoPlay
          muted
          loop
          className="w-full h-full object-cover"
        />
      ) : (!imgError && url) ? (
        <motion.img
          initial={{ scale: 1 }}
          animate={{ scale: 1.14 }}
          transition={{ duration: 15, ease: "linear", repeat: Infinity, repeatType: "reverse" }}
          src={url}
          alt={headline || "News Media"}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        /* Thematic News Studio Graphic Fallback when Image is missing or fails to load */
        <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-[#120505] via-[#09090c] to-[#040405]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-950/20 via-transparent to-black" />
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-brand-red/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-900/10 rounded-full blur-3xl" />
          
          <div className="relative z-10 flex flex-col items-center text-center p-8 max-w-lg">
            <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(220,38,38,0.25)]">
              {source ? (
                <Radio className="w-10 h-10 text-brand-red animate-pulse" />
              ) : (
                <Newspaper className="w-10 h-10 text-brand-red" />
              )}
            </div>

            {source && (
              <div className="bg-brand-red px-6 py-2 rounded-lg text-white font-black text-xl uppercase tracking-widest skew-x-[-15deg] shadow-lg mb-4">
                <span className="skew-x-[15deg] block">{source}</span>
              </div>
            )}

            <div className="text-white/60 text-xs font-black uppercase tracking-[0.3em] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-red animate-ping" />
              Transmetim Live i Lajmeve
            </div>
          </div>
        </div>
      )}

      {/* Vignette & Gradient Overlays for High-Contrast TV Readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/60 pointer-events-none" />

      {/* Top Left: Source & Live TV watermark */}
      <div className="absolute top-6 left-6 z-20 flex items-center gap-3">
        {source && (
          <div className="flex items-center gap-2 bg-black/85 backdrop-blur-xl border border-white/20 px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest text-white shadow-2xl">
            <span className="w-2 h-2 rounded-full bg-brand-red animate-pulse" />
            {source}
          </div>
        )}
        <div className="bg-white/10 backdrop-blur-md border border-white/15 px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest text-white/80">
          HD LIVE
        </div>
      </div>

      {/* Breaking News Banner at bottom */}
      {isBreakingNews && (
        <div className="absolute bottom-0 left-0 right-0 z-30">
          <div className="bg-brand-red py-4 px-10 flex items-center justify-between border-t-4 border-white/20 shadow-[0_-20px_50px_rgba(220,38,38,0.6)]">
            <div className="flex items-center gap-6 overflow-hidden">
              <span className="text-4xl font-black italic uppercase tracking-tighter text-white whitespace-nowrap animate-pulse">
                LAJMI I FUNDIT
              </span>
              <div className="h-2 w-32 bg-white/30 rounded-full shrink-0" />
              <span className="text-4xl font-black italic uppercase tracking-tighter text-white whitespace-nowrap opacity-40">
                LAJMI I FUNDIT
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-white rounded-full animate-ping" />
              <div className="w-3 h-3 bg-white rounded-full" />
            </div>
          </div>
        </div>
      )}

      {/* Viewport TV Studio Corners */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white/30 z-20 pointer-events-none" />
      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white/30 z-20 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white/30 z-20 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white/30 z-20 pointer-events-none" />
    </motion.div>
  );
}
