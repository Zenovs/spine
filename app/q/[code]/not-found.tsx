import Link from 'next/link';
import { SiteHeader, SiteFooter } from '@/components/SiteHeader';
import { getLocale } from '@/lib/i18n-server';
import { t } from '@/lib/i18n';

export default async function NotFound() {
  const locale = await getLocale();
  return (
    <>
      <SiteHeader />
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 128, paddingBottom: 64, paddingLeft: 32, paddingRight: 32 }}>
        <div style={{ textAlign: 'center', maxWidth: 480 }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 80, color: 'var(--line)', lineHeight: 1, marginBottom: 24 }}>404</div>
          <h1 className="section-title" style={{ marginBottom: 16 }}>{t(locale, 'notFound.title')}</h1>
          <p className="lede" style={{ marginBottom: 36 }}>
            {t(locale, 'notFound.body')}
          </p>
          <Link href="/" className="btn btn-ghost">{t(locale, 'notFound.cta')}</Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
