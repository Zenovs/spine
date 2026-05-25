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
    <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', background: '#1a1510' }}>
      <video
        ref={videoRef}
        src={url}
        // preload=metadata makes the browser fetch enough of the file to render
        // the first frame as the natural poster — no separate thumbnail needed.
        preload="metadata"
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
        <div
          onClick={play}
          style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14,
            cursor: 'pointer',
            // Subtle dark vignette so the play button stays legible over any first frame
            background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.45) 100%)',
          }}
        >
          <div style={{ fontFamily: 'var(--sans)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(245,239,224,0.9)', textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>
            — Persönliche Videobotschaft —
          </div>
          <button
            className="video-play-btn"
            style={{ width: 64, height: 64, borderRadius: '50%', border: '1.5px solid rgba(245,239,224,0.85)', background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)', color: '#F5EFE0', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingLeft: 4, cursor: 'pointer' }}
            onClick={play}
            aria-label="Video abspielen"
          >
            <svg viewBox="0 0 26 26" width={24} height={24} fill="currentColor">
              <polygon points="8,5 22,13 8,21" />
            </svg>
          </button>
          {senderName && (
            <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 16, color: 'rgba(245,239,224,0.95)', textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>
              {senderName}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
