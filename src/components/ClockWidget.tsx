import { useEffect, useState } from 'react';
import { format } from 'date-fns';

export default function ClockWidget() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-8">
      <div className="text-right">
        <div className="text-xl font-mono leading-none tracking-tight tabular-nums">
          {format(now, 'HH:mm')}<span className="text-brand-red animate-pulse">:</span>{format(now, 'ss')}
        </div>
        <div className="text-[10px] uppercase tracking-widest text-white/40 font-black">
          {format(now, 'd MMMM yyyy').toUpperCase()}
        </div>
      </div>
      
      <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-lg border border-white/10">
        <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Shkodër</span>
        <span className="text-lg font-bold">12°C</span>
      </div>
    </div>
  );
}
