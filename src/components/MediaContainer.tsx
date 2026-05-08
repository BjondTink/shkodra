import React from 'react';
import { motion } from 'motion/react';
import { MediaType } from '../types';

interface Props {
  url: string;
  type: MediaType;
  key?: React.Key;
}

export default function MediaContainer({ url, type }: Props) {
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
      
      <div className="absolute top-6 left-6 z-20 flex flex-col gap-2">
        <span className="bg-black/80 backdrop-blur-xl border border-white/20 px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest text-white">
          Burimi: Lajme Live
        </span>
      </div>

      <div className="absolute bottom-6 left-6 z-20">
         <div className="inline-block bg-brand-red text-white px-4 py-1 mb-2 font-black uppercase text-[10px] tracking-widest shadow-lg">
           Mbulim Special
         </div>
      </div>

      {/* Viewport Corners */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-white/10 z-20" />
      <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-white/10 z-20" />
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-white/10 z-20" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-white/10 z-20" />
    </motion.div>
  );
}
