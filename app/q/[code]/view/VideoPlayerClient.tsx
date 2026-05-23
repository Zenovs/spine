'use client';
import { useState, useRef } from 'react';

type Props = {
  url: string;
  senderName: string;
  fit?: 'contain' | 'cover';
  objX?: number;
  objY?: number;
};

export function VideoPlayerClient({ url, senderName, fit = 'contain', objX = 50, objY = 50 }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  const play = () => {
    videoRef.current?.play();
    setPlaying(true);
  };

  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#1a1510' }}>
      <video
        ref={videoRef}
        src={url}
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: fit,
          objectPosition: `${objX}% ${objY}%`,
        }}
        controls={playing}
        playsInline
        onEnded={() => setPlaying(false)}
      />
      {!playing && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 80% 60% at 50% 40%, #6a5538 0%, #3d3122 50%, #1f1a14 100%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
          cursor: 'pointer',
        }} onClick={play}>
          {/* grain */}
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.2, mixBlendMode: 'overlay',
            backgroundImage: 'radial-gradient(circle at 30% 40%, rgba(255,255,255,0.4) 0.5px, transparent 0.8px), radial-gradient(circle at 70% 60%, rgba(0,0,0,0.4) 0.5px, transparent 0.8px)',
            backgroundSize: '3px 3px, 4px 4px',
          }} />
          {/* vignette */}
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)' }} />

          <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <div style={{ fontFamily: 'var(--sans)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(245,239,224,0.8)' }}>
              — Persönliche Videobotschaft —
            </div>
            <button
              className="video-play-btn"
              style={{ width: 64, height: 64, borderRadius: '50%', border: '1.5px solid rgba(245,239,224,0.6)', background: 'rgba(245,239,224,0.12)', backdropFilter: 'blur(8px)', color: '#F5EFE0', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingLeft: 4, cursor: 'pointer' }}
              onClick={play}
              aria-label="Video abspielen"
            >
              <svg viewBox="0 0 26 26" width={24} height={24} fill="currentColor">
                <polygon points="8,5 22,13 8,21" />
              </svg>
            </button>
            {senderName && (
              <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 16, color: 'rgba(245,239,224,0.9)' }}>
                {senderName}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
