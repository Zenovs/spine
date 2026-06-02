import Link from 'next/link';
import { SiteHeader, SiteFooter } from '@/components/SiteHeader';

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 128, paddingBottom: 64, paddingLeft: 32, paddingRight: 32 }}>
        <div style={{ textAlign: 'center', maxWidth: 480 }}>
          <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 80, color: 'var(--rule)', lineHeight: 1, marginBottom: 24 }}>404</div>
          <h1 className="section-title" style={{ marginBottom: 16 }}>QR-Code nicht gefunden</h1>
          <p className="lede" style={{ marginBottom: 36 }}>
            Dieser QR-Code existiert nicht oder wurde deaktiviert. Bitte prüfe ob der Code korrekt ist.
          </p>
          <Link href="/" className="btn btn-ghost">Zur Startseite</Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
