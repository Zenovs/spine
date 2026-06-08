'use client';
import Link from 'next/link';
import { useEffect } from 'react';
import { ArrowRight } from '@carbon/icons-react';
import { useT } from '@/lib/i18n-client';
import { LanguageSwitcher } from './LanguageSwitcher';

export function SiteHeader({ showAdmin = false }: { showAdmin?: boolean }) {
  const t = useT();
  useEffect(() => {
    const header = document.getElementById('site-header');
    if (!header) return;
    const onScroll = () => {
      header.dataset.stuck = window.scrollY > 8 ? 'true' : 'false';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header id="site-header" className="site-header">
      <div className="site-header__inner">
        {/* Wordmark */}
        <Link href="/" className="wordmark" style={{ textDecoration: 'none' }}>
          {/* QR glyph: 3 corner squares + accent fill dot */}
          <div className="glyph">
            <span />
            <span />
            <span />
            <span />
          </div>
          <span>augmentedreality<span className="dot">.</span>ch</span>
        </Link>

        {/* Nav */}
        <nav aria-label="Hauptnavigation" style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <ul className="nav" style={{ display: 'none' }} id="main-nav">
            <li><Link href="/#how">{t('nav.howItWorks')}</Link></li>
            <li><Link href="/#cats">{t('nav.products')}</Link></li>
            <li><Link href="/#ar">{t('nav.arMixed')}</Link></li>
          </ul>
          <LanguageSwitcher />
          {showAdmin && (
            <Link href="/admin/dashboard" style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.68rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--ink-3)',
              textDecoration: 'none',
            }}>
              {t('nav.admin')}
            </Link>
          )}
          <Link href="/admin" className="btn btn--primary btn-sm">
            {t('common.demo')} <ArrowRight size={12} />
          </Link>
        </nav>
      </div>

      {/* Inline styles to show nav on wider screens */}
      <style>{`
        @media (min-width: 768px) {
          #main-nav { display: flex !important; }
        }
      `}</style>
    </header>
  );
}

export function SiteFooter() {
  const t = useT();
  return (
    <footer className="footer">
      <div className="footer__inner">
        {/* Top row: wordmark + links */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap', marginBottom: 24 }}>
          <div className="wordmark">
            <div className="glyph">
              <span />
              <span />
              <span />
              <span />
            </div>
            <span>augmentedreality<span className="dot">.</span>ch</span>
          </div>
          <ul className="footer__links">
            <li><Link href="/#how">{t('nav.howItWorks')}</Link></li>
            <li><Link href="/#cats">{t('nav.products')}</Link></li>
            <li><Link href="/#ar">{t('nav.arMixed')}</Link></li>
          </ul>
        </div>
        {/* Bottom row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', borderTop: '1px solid var(--line)', paddingTop: 20 }}>
          <span className="footer-copy">{t('footer.copy')}</span>
          <span className="footer__powered">
            {t('footer.poweredBy')}{' '}
            <a href="https://wireon.ch" target="_blank" rel="noopener noreferrer">
              wireon
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
