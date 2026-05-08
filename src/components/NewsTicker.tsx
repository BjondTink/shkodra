import { motion } from 'motion/react';
import { NewsItem } from '../types';

interface Props {
  items: string[];
}

export default function NewsTicker({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <div className="flex-1 overflow-hidden h-full flex items-center">
      <div className="scrolling-ticker flex items-center gap-12">
        {items.map((text, idx) => (
          <span key={idx} className="text-2xl font-black text-black uppercase tracking-tight whitespace-nowrap">
            {text}
          </span>
        ))}
        {/* Duplicate for seamless scroll */}
        {items.map((text, idx) => (
          <span key={`dup-${idx}`} className="text-2xl font-black text-black uppercase tracking-tight whitespace-nowrap">
            {text}
          </span>
        ))}
        {/* Triple for longer queues to ensure no gaps */}
        {items.length < 5 && items.map((text, idx) => (
          <span key={`dup2-${idx}`} className="text-xl font-extrabold text-black uppercase tracking-tight whitespace-nowrap">
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}
