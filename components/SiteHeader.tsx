'use client';
import Link from 'next/link';
import Image from 'next/image';

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
        {/* Logos */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 16, textDecoration: 'none' }}>
          <Image
            src="/futura-terram.png"
            alt="Futura Terram"
            height={36}
            width={120}
            style={{ height: 36, width: 'auto', objectFit: 'contain' }}
            priority
          />
          <div style={{ width: 1, height: 28, background: 'var(--rule)' }} />
          {/* Coop logo — colors adapted to site palette */}
          <svg
            viewBox="48.82 429.94 584.65 187.12"
            height={28}
            style={{ width: 'auto' }}
            aria-label="Coop"
          >
            <path d="M 280.8451,550.9571 C 260.81372,550.9571 244.66227,534.80954 244.66227,514.92451 C 244.66581,495.08482 260.81018,478.93726 280.8451,478.93726 C 300.73333,478.93726 316.86742,495.08482 316.86742,514.92451 C 316.86742,534.80954 300.72978,550.9571 280.8451,550.9571 M 341.81053,465.96167 C 324.94793,454.29037 302.02345,449.39919 280.8451,449.39919 C 241.1101,449.39565 194.55955,466.40813 194.55955,514.49222 C 194.55955,520.82659 195.56727,526.7425 196.57817,531.78356 C 188.07884,541.29025 174.14479,550.66088 156.8538,550.66088 C 134.07884,550.66088 117.94156,536.11313 117.94156,513.76726 C 117.94156,493.0701 133.92896,477.78321 154.78628,477.78321 C 165.30424,477.77966 173.08853,481.38462 177.41491,484.27455 L 194.13081,457.75892 C 185.76754,453.57923 169.53282,447.66297 147.91191,447.66297 C 106.98459,447.66297 66.534909,469.71651 66.534909,514.06348 C 66.538452,558.29884 102.95125,581.07734 146.6218,581.07734 C 174.24258,581.0738 196.42829,567.24108 208.97479,553.40447 C 225.25876,571.07565 252.74313,579.43891 280.8451,579.43891 C 301.40975,579.43891 324.65171,574.82659 341.80699,563.0575 L 341.81053,465.96167 Z" fill="#8C3B47" fillRule="evenodd" />
            <path d="M 549.05183,553.10825 L 548.61954,553.10825 C 528.43828,552.82584 512.0186,537.12084 512.0186,514.6421 C 512.0186,493.0701 528.87765,477.21522 548.616,477.06852 L 549.05183,477.06852 C 569.80816,477.06852 585.31474,493.59628 585.31474,514.34588 C 585.31793,534.37726 570.2369,553.10825 549.04828,553.10825 M 403.00734,550.37848 C 383.11876,550.37848 366.98502,534.23092 366.98502,514.34588 C 366.98502,494.31096 383.11876,478.22612 403.00734,478.22612 C 422.8573,478.22612 438.99104,494.31096 438.99104,514.34588 C 438.99104,534.23092 422.85376,550.37848 403.00734,550.37848 M 558.27257,451.99289 C 554.96419,451.99289 551.79187,452.27529 548.616,452.57152 C 533.77557,454.29037 522.10037,459.6312 513.02596,465.96522 L 513.02596,454.15785 L 473.14462,454.15785 L 473.14462,473.31758 C 456.28238,456.30864 426.45836,449.39919 403.10478,449.39919 L 403.00734,449.39565 C 381.829,449.39565 358.71919,454.24502 341.80805,466.06301 L 341.81159,562.81336 C 358.62175,574.54454 381.58132,579.43891 403.00734,579.43891 L 403.10478,579.43891 C 429.91663,579.43891 455.27466,570.99202 472.28006,556.57679 L 472.2836,617.06139 L 513.02596,617.06139 L 513.02596,563.3399 C 519.36033,569.2558 531.4749,576.61171 548.616,578.7625 C 552.07427,579.20541 555.67533,579.43891 559.42663,579.43891 C 591.51659,579.43891 633.46509,560.18139 633.46509,514.77462 C 633.46509,472.60289 599.59391,451.99289 558.27257,451.99289 Z" fill="#A6824A" fillRule="evenodd" />
            <path d="M 341.90833,562.91116 C 327.24896,552.82584 316.86742,537.12084 316.86742,514.49222 C 316.86742,492.06238 326.96301,476.34356 341.90478,465.96522 C 356.75195,476.34356 366.98396,492.06238 366.98396,514.49222 C 366.98396,537.12084 356.75195,552.6795 341.90833,562.91116 Z" fill="#6E2230" fillRule="evenodd" />
          </svg>
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
        <Image src="/futura-terram.png" alt="Futura Terram" height={22} width={74} style={{ height: 22, width: 'auto', objectFit: 'contain', opacity: 0.6 }} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <div style={{ fontFamily: 'var(--sans)', fontSize: 11, letterSpacing: '0.08em', color: '#8C7D5E' }}>
            © {new Date().getFullYear()} · Persönliche Botschaften mit Futura Terram
          </div>
          <div style={{ fontFamily: 'var(--sans)', fontSize: 10, letterSpacing: '0.08em', color: '#5C5040' }}>
            powered by{' '}
            <a href="https://wireon.ch" target="_blank" rel="noopener noreferrer"
              style={{ color: '#7A6A50', textDecoration: 'none', borderBottom: '1px solid #4A3E2E' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#C2AC85')}
              onMouseLeave={e => (e.currentTarget.style.color = '#7A6A50')}>
              wireon
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
