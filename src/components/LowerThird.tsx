import { motion } from 'motion/react';
import { NewsItem } from '../types';
import { cn } from '../lib/utils';
import { Zap } from 'lucide-react';

interface Props {
  item: NewsItem;
}

export default function LowerThird({ item }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, scaleX: 0 }}
      animate={{ opacity: 1, scaleX: 1 }}
      exit={{ opacity: 0, scaleX: 0 }}
      transition={{ duration: 0.5, ease: 'circOut' }}
      className="relative origin-left flex items-center min-h-16"
    >
      {/* Label Area */}
      <div className={cn(
        "h-full px-8 flex items-center justify-center font-black uppercase tracking-widest text-sm z-20 skew-x-[-12deg] -translate-x-2",
        item.isBreakingNews ? "breaking-news-gradient text-white" : "bg-white text-black"
      )}>
        <span className="skew-x-[12deg] flex items-center gap-2">
          {item.isBreakingNews && <Zap size={16} fill="currentColor" className="animate-bounce" />}
          {item.isBreakingNews ? 'Lajm i Fundit' : 'Detaje'}
        </span>
      </div>

      {/* Content Area */}
      <div className="flex-1 h-full bg-black/80 backdrop-blur-md border border-white/10 flex items-center px-12 skew-x-[-12deg] -translate-x-6 z-10 overflow-hidden">
        <motion.p 
          className="text-2xl font-black uppercase tracking-tight skew-x-[12deg]"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          {item.headline}
        </motion.p>
      </div>
      
      {/* Decorative pulse for breaking news */}
      {item.isBreakingNews && (
        <div className="absolute inset-0 bg-brand-red/20 blur-xl animate-pulse z-0" />
      )}
    </motion.div>
  );
}
