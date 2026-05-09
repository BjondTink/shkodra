import { ReactNode } from 'react';
import { motion } from 'motion/react';

interface Props {
  items: ReactNode[];
}

export default function NewsTicker({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <div className="flex-1 overflow-hidden h-full flex items-center">
      <div className="scrolling-ticker flex items-center gap-16">
        {items.map((node, idx) => (
          <div key={idx} className="text-3xl font-black text-black uppercase tracking-tight whitespace-nowrap flex items-center gap-4">
            {node}
          </div>
        ))}
        {/* Duplicate for seamless scroll */}
        {items.map((node, idx) => (
          <div key={`dup-${idx}`} className="text-3xl font-black text-black uppercase tracking-tight whitespace-nowrap flex items-center gap-4">
            {node}
          </div>
        ))}
        {/* Triple for longer queues to ensure no gaps */}
        {items.length < 5 && items.map((node, idx) => (
          <div key={`dup2-${idx}`} className="text-3xl font-black text-black uppercase tracking-tight whitespace-nowrap flex items-center gap-4">
            {node}
          </div>
        ))}
      </div>
    </div>
  );
}
