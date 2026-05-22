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
        padding: '0 32px',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 24,
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'var(--ink)' }}>
          <svg viewBox="0 0 32 32" width={24} height={24} fill="none" stroke="var(--accent)" strokeWidth="1.4">
            <path d="M16 4 C 9 12, 9 22, 16 28 C 23 22, 23 12, 16 4 Z" />
            <path d="M16 4 L 16 28" />
          </svg>
          <div>
            <div style={{ fontFamily: 'var(--sans)', fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
              Wein
            </div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 18, letterSpacing: '0.1em', lineHeight: 1, color: 'var(--ink)' }}>
              Botschaft
            </div>
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
    <footer style={{ background: 'var(--ink)', color: '#D9CDB1', padding: '32px 0', marginTop: 'auto' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 15, color: '#C2AC85', letterSpacing: '0.1em' }}>
          Weinbotschaft
        </div>
        <div style={{ fontFamily: 'var(--sans)', fontSize: 11, letterSpacing: '0.08em', color: '#8C7D5E' }}>
          © {new Date().getFullYear()} · Persönliche QR-Erlebnisse für besondere Flaschen
        </div>
      </div>
    </footer>
  );
}
