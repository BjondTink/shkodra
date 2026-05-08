import React, { useState } from 'react';
import { Lock, User, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  onLogin: (success: boolean) => void;
}

export default function LoginForm({ onLogin }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Hardcoded credentials as requested
    if (username === 'admin' && password === 'Perla123ShkodraP.') {
      // Simulate network delay for a premium feel
      setTimeout(() => {
        localStorage.setItem('sp_admin_token', 'authenticated_' + Date.now());
        onLogin(true);
      }, 1000);
    } else {
      setTimeout(() => {
        setError('Përdoruesi ose fjalëkalimi i gabuar.');
        setIsLoading(false);
      }, 800);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#050505] p-6">
      {/* Background Accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-brand-red/5 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-900/5 blur-[150px] rounded-full" />
      </div>

      <div className="max-w-md w-full glass-morphism p-10 rounded-[2.5rem] relative z-10 border-white/5 shadow-2xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-2">
            Shkodra <span className="text-brand-red">Politike</span>
          </h1>
          <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em]">Dashboardi i Transmetimit</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Përdoruesi</label>
            <div className="relative">
              <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
              <input 
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-brand-red focus:bg-white/10 transition-all font-bold"
                placeholder="admin"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Fjalëkalimi</label>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-brand-red focus:bg-white/10 transition-all font-bold"
                placeholder="••••••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold p-4 rounded-xl animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={isLoading}
            className={cn(
              "w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl flex items-center justify-center gap-3",
              isLoading ? "bg-white/10 text-white/40" : "bg-brand-red hover:bg-brand-red-dark text-white active:scale-95"
            )}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              'Kyçu në Sistem'
            )}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-white/5 text-center">
            <p className="text-[9px] text-white/20 uppercase font-black tracking-widest italic">Prona e Shkodra Politike • 2026</p>
        </div>
      </div>
    </div>
  );
}
