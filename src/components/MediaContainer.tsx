import React from 'react';
import { motion } from 'motion/react';
import { MediaType } from '../types';

interface Props {
  url: string;
  type: MediaType;
  source?: string;
  isBreakingNews?: boolean;
  key?: React.Key;
}

export default function MediaContainer({ url, type, source, isBreakingNews }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      className="w-full h-full rounded-2xl overflow-hidden border border-white/5 bg-black relative"
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
      ) : (
        <motion.img
          initial={{ scale: 1 }}
          animate={{ scale: 1.15 }}
          transition={{ duration: 15, ease: "linear", repeat: Infinity, repeatType: "reverse" }}
          src={url}
          alt="News Media"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
      )}
      
      {source && (
        <div className="absolute top-3 md:top-6 left-3 md:left-6 z-20 flex flex-col gap-2">
          <span className="bg-black/80 backdrop-blur-xl border border-white/20 px-2 md:px-3 py-0.5 md:py-1 rounded text-[8px] md:text-[10px] font-black uppercase tracking-widest text-white shadow-xl">
            {source}
          </span>
        </div>
      )}

      {isBreakingNews && (
        <div className="absolute bottom-0 left-0 right-0 z-30">
          <div className="bg-brand-red py-2 md:py-4 px-4 md:px-10 flex items-center justify-between border-t-2 md:border-t-4 border-white/10 shadow-[0_-20px_50px_rgba(220,38,38,0.5)]">
            <div className="flex items-center gap-3 md:gap-6 overflow-hidden">
              <span className="text-xl md:text-4xl font-black italic uppercase tracking-tighter text-white whitespace-nowrap animate-pulse">
                LAJMI I FUNDIT
              </span>
              <div className="hidden sm:block h-1 md:h-2 w-16 md:w-32 bg-white/30 rounded-full shrink-0" />
              <span className="hidden sm:block text-xl md:text-4xl font-black italic uppercase tracking-tighter text-white whitespace-nowrap opacity-40">
                LAJMI I FUNDIT
              </span>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2">
              <div className="w-1.5 h-1.5 md:w-3 md:h-3 bg-white rounded-full animate-ping" />
              <div className="w-1.5 h-1.5 md:w-3 md:h-3 bg-white rounded-full" />
            </div>
          </div>
        </div>
      )}

      {/* Viewport Corners */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-white/10 z-20" />
      <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-white/10 z-20" />
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-white/10 z-20" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-white/10 z-20" />
    </motion.div>
  );
}
