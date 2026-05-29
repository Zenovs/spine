'use client';
import Link from 'next/link';

export function SiteHeader({ showAdmin = false }: { showAdmin?: boolean }) {
  return (
    <header style={{
      borderBottom: '1px solid var(--rule)',
      background: 'var(--bg)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '0 clamp(16px,3vw,32px)',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 24,
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'var(--ink)' }}>
          <svg viewBox="0 0 32 32" width={22} height={22} fill="none" stroke="var(--accent)" strokeWidth="1.4">
            <path d="M16 4 C 9 12, 9 22, 16 28 C 23 22, 23 12, 16 4 Z" />
            <path d="M16 4 L 16 28" />
          </svg>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 17, letterSpacing: '0.08em', color: 'var(--ink)' }}>
            Weinbotschaft
          </div>
        </Link>

        {showAdmin && (
          <Link href="/admin/dashboard" style={{
            fontFamily: 'var(--sans)',
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--ink-muted)',
          }}>
            Admin
          </Link>
        )}
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer style={{ background: 'var(--ink)', padding: '20px 0', marginTop: 'auto' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 clamp(16px,3vw,32px)', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--sans)', fontSize: 10, letterSpacing: '0.1em', color: '#5C5040' }}>
          powered by{' '}
          <a href="https://wireon.ch" target="_blank" rel="noopener noreferrer"
            style={{ color: '#7A6A50', textDecoration: 'none', borderBottom: '1px solid #3A3028' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#A08060')}
            onMouseLeave={e => (e.currentTarget.style.color = '#7A6A50')}>
            wireon
          </a>
        </div>
      </div>
    </footer>
  );
}
