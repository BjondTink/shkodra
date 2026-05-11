import React, { useState, useEffect, useRef } from 'react';
import ReactPlayer from 'react-player';
import { AlertTriangle, Radio } from 'lucide-react';

import { AppStatus } from '../types';
import Hls from 'hls.js';

interface VideoPlayerProps {
  status: AppStatus;
  onEnded: () => void;
  hideControls?: boolean;
  muted?: boolean;
}

export default function VideoPlayer({ status, onEnded, hideControls = false, muted: initialMuted = false }: VideoPlayerProps) {
  const [hasError, setHasError] = useState(false);
  const [isMuted, setIsMuted] = useState(initialMuted);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<ReactPlayer>(null);

  useEffect(() => {
    setIsMuted(initialMuted);
  }, [initialMuted]);

  // Key should only change when the SOURCE changes, not on every status update
  const videoKey = `${status.activeVideoUrl}-${status.embedCode}-${status.videoSource}`;

  // Handle HLS streams
  useEffect(() => {
    if (status.videoSource === 'hls' || (status.activeVideoUrl && status.activeVideoUrl.includes('.m3u8'))) {
      if (videoRef.current) {
        const video = videoRef.current;
        const source = status.activeVideoUrl || '';

        if (Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
          });
          hls.loadSource(source);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (status.isPlaying) {
              video.play().catch((err) => {
                if (err.name === 'AbortError') return;
                console.log("Autoplay blocked - attempting muted play for HLS");
                setIsMuted(true);
                video.muted = true;
                video.play().catch(e => {
                  if (e.name !== 'AbortError') console.error("Muted HLS autoplay failed", e);
                });
              });
            }
          });
          return () => {
            hls.destroy();
          };
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = source;
          video.addEventListener('loadedmetadata', () => {
            if (status.isPlaying) video.play().catch(() => {});
          });
        }
      }
    }
  }, [status.activeVideoUrl, status.videoSource, status.isPlaying]);

  // Handle Transport Actions
  useEffect(() => {
    if (!status.transportAction) return;

    const performAction = () => {
      if (status.transportAction === 'restart') {
        if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
          playerRef.current.seekTo(0);
        } else if (videoRef.current) {
          videoRef.current.currentTime = 0;
        }
      }
      if (status.transportAction === 'play') {
        if (videoRef.current) {
          const video = videoRef.current;
          video.play().catch((err) => {
            // Ignore interruption errors when media is removed
            if (err.name === 'AbortError') return;
            
            console.log("Autoplay blocked - attempting muted play for native video");
            setIsMuted(true);
            video.muted = true;
            video.play().catch(e => {
              if (e.name !== 'AbortError') console.error("Muted autoplay failed", e);
            });
          });
        }
      }
      if (status.transportAction === 'pause') {
        if (videoRef.current) {
          try {
            videoRef.current.pause();
          } catch (e) {
            // Ignore errors if video is already removed
          }
        }
      }
    };

    performAction();
  }, [status.transportAction, status.lastUpdated]);

  const url = status.activeVideoUrl || '';
  const volume = (status.volume ?? 100) / 100;

  const renderPlayer = () => {
    if (status.videoSource === 'embed') {
      return (
        <div 
          key={videoKey}
          className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full border-0 flex items-center justify-center bg-black overflow-hidden"
          dangerouslySetInnerHTML={{ __html: status.embedCode || '' }}
        />
      );
    }

    if (!url) {
      return (
        <div className="w-full h-full bg-[#080808] flex flex-col items-center justify-center gap-6 border-2 border-white/5 relative overflow-hidden">
          {/* Animated Background Static effect */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] animate-pulse" />
          
          <div className="relative group">
            <div className="absolute -inset-8 bg-brand-red/20 blur-[40px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <Radio size={100} className="text-white/5 relative z-10" />
            <div className="absolute inset-0 flex items-center justify-center relative z-20">
               <AlertTriangle size={40} className="text-brand-red/40 animate-bounce" />
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-4 relative z-10">
            <div className="flex flex-col items-center">
              <span className="text-[14px] font-black uppercase tracking-[0.5em] text-white/30">Nuk ka Burim Aktiv</span>
              <span className="text-[10px] font-bold text-white/10 uppercase tracking-widest mt-1">Sistemi është Gati për Transmetim</span>
            </div>
            
            <div className="px-6 py-2 bg-brand-red/10 border border-brand-red/20 rounded-full">
              <span className="text-[10px] font-black text-brand-red uppercase tracking-[0.2em]">Live Master Output</span>
            </div>
          </div>
        </div>
      );
    }

    if (status.videoSource === 'hls' || url.includes('.m3u8')) {
      return (
        <div className="w-full h-full bg-black relative flex items-center justify-center">
          <video 
            ref={videoRef}
            className="w-full max-h-full"
            muted={isMuted}
            playsInline
            controls={!hideControls}
            autoPlay={status.isPlaying}
            onEnded={onEnded}
            onError={() => setHasError(true)}
            style={{ objectFit: 'contain' }}
          />
          {hasError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black text-white/40 gap-4">
              <AlertTriangle size={48} />
              <p className="text-sm font-bold uppercase tracking-widest text-center px-6">Gabim në ngarkimin e stream-it HLS ose Burimit Live</p>
            </div>
          )}
        </div>
      );
    }

    return (
      <div key={videoKey} className="w-full h-full bg-black relative flex items-center justify-center">
        {hasError ? (
          <div className="flex flex-col items-center justify-center h-full text-white/40 gap-4">
            <AlertTriangle size={48} />
            <p className="text-sm font-bold uppercase tracking-widest">Gabim në ngarkimin e videos</p>
          </div>
        ) : (
          <ReactPlayer 
            ref={playerRef}
            url={url}
            playing={status.isPlaying}
            controls={!hideControls}
            width="100%"
            height="100%"
            muted={isMuted}
            playsinline={true}
            volume={volume}
            loop={status.loop}
            onEnded={onEnded}
            onError={() => setHasError(true)}
            config={{
              youtube: { playerVars: { modestbranding: 1, rel: 0 } },
              facebook: { appId: '12345' }
            }}
          />
        )}
      </div>
    );
  };

  return (
    <div className="relative w-full h-full group">
      {renderPlayer()}
      {isMuted && (
        <button 
          onClick={() => setIsMuted(false)}
          className="absolute bottom-6 right-6 bg-brand-red text-white p-4 rounded-full shadow-2xl animate-bounce z-[60] flex items-center gap-3 px-6 pointer-events-auto"
        >
          <Radio size={20} />
          <span className="text-xs font-black uppercase tracking-widest">AKTIVIZO AUDION</span>
        </button>
      )}
    </div>
  );
}
