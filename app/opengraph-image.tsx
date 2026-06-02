import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'augmentedreality.ch — QR-Code trifft AR-Erlebnis';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 80px',
          background: '#101319',
          color: '#F4F6FA',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Ambient gradient blobs */}
        <div
          style={{
            position: 'absolute', inset: 0,
            background:
              'radial-gradient(40% 35% at 20% 25%, rgba(77,107,255,0.45), transparent 65%),' +
              'radial-gradient(35% 30% at 85% 80%, rgba(124,146,255,0.30), transparent 65%)',
            display: 'flex',
          }}
        />

        {/* Top — four-tile glyph + wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, zIndex: 1 }}>
          <div
            style={{
              display: 'flex', flexWrap: 'wrap', width: 52, height: 52, gap: 6,
            }}
          >
            <div style={{ width: 23, height: 23, border: '3px solid #4D6BFF', borderRadius: 4, background: 'transparent', display: 'flex' }} />
            <div style={{ width: 23, height: 23, border: '3px solid #4D6BFF', borderRadius: 4, background: 'transparent', display: 'flex' }} />
            <div style={{ width: 23, height: 23, border: '3px solid #4D6BFF', borderRadius: 4, background: 'transparent', display: 'flex' }} />
            <div style={{ width: 23, height: 23, background: '#4D6BFF', borderRadius: 4, display: 'flex' }} />
          </div>
          <span
            style={{
              fontSize: 36, fontWeight: 600, letterSpacing: '-0.01em',
            }}
          >
            augmentedreality<span style={{ color: '#4D6BFF' }}>.</span>ch
          </span>
        </div>

        {/* Center — headline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, zIndex: 1, maxWidth: 900 }}>
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: 18,
              letterSpacing: 4,
              textTransform: 'uppercase',
              color: '#7C92FF',
            }}
          >
            QR · AR · Mixed Reality
          </span>
          <span
            style={{
              fontSize: 88,
              fontWeight: 800,
              lineHeight: 1.0,
              letterSpacing: '-0.025em',
              textTransform: 'uppercase',
            }}
          >
            Jedes Produkt erzählt deine{' '}
            <span style={{ color: '#4D6BFF', fontStyle: 'normal' }}>Geschichte.</span>
          </span>
          <span style={{ fontSize: 26, color: '#A8AEBC', lineHeight: 1.45, maxWidth: 880 }}>
            Ein QR-Code, ein AR-Layer, eine Videobotschaft — direkt im Browser, ohne App.
          </span>
        </div>

        {/* Bottom — tagline */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 36, zIndex: 1,
            fontFamily: 'monospace', fontSize: 22, color: '#F4F6FA',
            textTransform: 'uppercase', letterSpacing: 6, fontWeight: 600,
          }}
        >
          <span>Scan</span>
          <span style={{ width: 24, height: 2, background: '#4D6BFF', display: 'flex' }} />
          <span>Fill</span>
          <span style={{ width: 24, height: 2, background: '#4D6BFF', display: 'flex' }} />
          <span style={{ color: '#4D6BFF' }}>Feel.</span>
        </div>
      </div>
    ),
    size,
  );
}
