import React, { useState } from 'react';
import ReactPlayer from 'react-player';
import { AlertTriangle } from 'lucide-react';
import { AppStatus } from '../types';

interface VideoPlayerProps {
  status: AppStatus;
  onEnded: () => void;
}

export default function VideoPlayer({ status, onEnded }: VideoPlayerProps) {
  const [hasError, setHasError] = useState(false);
  const videoKey = `${status.activeVideoUrl}-${status.embedCode}`;

  if (status.videoSource === 'embed') {
    return (
      <div 
        key={videoKey}
        className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full border-0 flex items-center justify-center bg-black"
        dangerouslySetInnerHTML={{ __html: status.embedCode || '' }}
      />
    );
  }

  const url = status.activeVideoUrl || '';
  const isMuted = (status.volume ?? 100) === 0;

  // Custom YouTube Handler
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/user\/\S+|\/ytscreeningroom\?v=))([\w\-]{11})/);
  if (status.videoSource === 'youtube' || ytMatch) {
    const videoId = ytMatch ? ytMatch[1] : url;
    return (
      <iframe
        key={videoKey}
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${isMuted ? 1 : 0}&rel=0&modestbranding=1&enablejsapi=1&playsinline=1`}
        className="w-full h-full border-0 shadow-2xl"
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
        allowFullScreen
      />
    );
  }

  // Custom Facebook Handler
  const isFacebook = status.videoSource === 'facebook' || 
                     url.includes('facebook.com') || 
                     url.includes('fb.watch') || 
                     url.includes('fb.com');

  if (isFacebook) {
    return (
      <iframe 
        key={videoKey}
        src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0&width=500&autoplay=true&mute=${isMuted ? 'true' : 'false'}&appId=123456789`} 
        className="w-full h-full border-0 absolute inset-0" 
        style={{ width: '100%', height: '100%' }}
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" 
        allowFullScreen
      />
    );
  }

  return (
    <div key={videoKey} className="w-full h-full bg-black relative">
      {hasError ? (
        <div className="flex flex-col items-center justify-center h-full text-white/40 gap-4">
          <AlertTriangle size={48} />
          <p className="text-sm font-bold uppercase tracking-widest">Gabim në ngarkimin e videos</p>
        </div>
      ) : (
        <ReactPlayer 
          {...({
            url: url,
            playing: true,
            controls: true,
            width: "100%",
            height: "100%",
            muted: isMuted,
            playsinline: true,
            volume: (status.volume ?? 100) / 100,
            onEnded: onEnded,
            onError: () => setHasError(true),
            config: {
              youtube: { playerVars: { autoplay: 1, mute: isMuted ? 1 : 0, modestbranding: 1 } },
              facebook: { appId: '12345' }
            }
          } as any)}
        />
      )}
    </div>
  );
}
