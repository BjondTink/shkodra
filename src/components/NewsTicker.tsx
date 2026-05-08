import { motion } from 'motion/react';
import { NewsItem } from '../types';

interface Props {
  items: NewsItem[];
}

export default function NewsTicker({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <div className="flex-1 overflow-hidden">
      <div className="scrolling-ticker">
        {items.map(item => (
          <span key={item.id} className="text-sm font-medium opacity-80 uppercase tracking-wide">
            {item.headline} •
          </span>
        ))}
        {/* Duplicate for seamless scroll */}
        {items.map(item => (
          <span key={`dup-${item.id}`} className="text-sm font-medium opacity-80 uppercase tracking-wide">
            {item.headline} •
          </span>
        ))}
        {/* Triple for longer queues to ensure no gaps */}
        {items.length < 5 && items.map(item => (
          <span key={`dup2-${item.id}`} className="text-sm font-medium opacity-80 uppercase tracking-wide">
            {item.headline} •
          </span>
        ))}
      </div>
    </div>
  );
}
