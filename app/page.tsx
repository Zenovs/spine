import { SiteHeader, SiteFooter } from '@/components/SiteHeader';

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main style={{ flex: 1 }}>
        {/* Hero */}
        <section style={{ padding: 'clamp(64px,8vw,120px) 0' }}>
          <div className="container" style={{ maxWidth: 900, textAlign: 'center' }}>
            <p className="eyebrow" style={{ textAlign: 'center' }}>— QR-Erlebnisse für besondere Flaschen —</p>
            <h1 className="display" style={{ textAlign: 'center', marginBottom: 28 }}>
              Jede Flasche erzählt <em>deine Geschichte</em>.
            </h1>
            <p className="lede" style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto 40px' }}>
              Klebe einen individuellen QR-Code auf eine Weinflasche. Der Empfänger scannt den Code
              und empfängt deine persönliche Videobotschaft, Grussworte und ein Bild — für immer hinterlegt.
            </p>
          </div>
        </section>

        {/* How it works */}
        <section style={{ borderTop: '1px solid var(--rule)', borderBottom: '1px solid var(--rule)', padding: 'clamp(56px,7vw,100px) 0', background: 'var(--bg-deep)' }}>
          <div className="container">
            <p className="eyebrow" style={{ textAlign: 'center' }}>— So funktioniert es —</p>
            <h2 className="section-title" style={{ textAlign: 'center', marginBottom: 56 }}>
              Drei Schritte, eine <em>Erinnerung.</em>
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'clamp(20px,3vw,48px)' }}>
              {[
                { num: '01', title: 'QR-Code erhalten', body: 'Bestelle einen individuellen QR-Code für deine Flasche. Jeder Code ist einmalig und unveränderbar nach dem Speichern.' },
                { num: '02', title: 'Botschaft hinterlegen', body: 'Verifiziere deine E-Mail, dann lade dein Video hoch, schreibe deine Grussworte und wähle ein Bild — einmalig, permanent.' },
                { num: '03', title: 'Erlebnis teilen', body: 'Klebe den QR-Code auf die Flasche. Der Empfänger scannt ihn und erlebt deine persönliche Botschaft direkt auf dem Smartphone.' },
              ].map((step, i) => (
                <div key={i} style={{ background: 'var(--bg-paper)', border: '1px solid var(--rule)', padding: 'clamp(28px,3vw,40px)', position: 'relative' }}>
                  <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 16, color: 'var(--ink-muted)', marginBottom: 20 }}>{step.num}</div>
                  <h3 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(22px,2.2vw,30px)', fontWeight: 500, marginBottom: 12 }}>{step.title}</h3>
                  <p style={{ fontFamily: 'var(--sans)', fontSize: 15, lineHeight: 1.65, color: 'var(--ink-soft)' }}>{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding: 'clamp(64px,8vw,100px) 0', textAlign: 'center' }}>
          <div className="container" style={{ maxWidth: 600 }}>
            <p className="eyebrow" style={{ textAlign: 'center' }}>— Bereit? —</p>
            <h2 className="section-title" style={{ textAlign: 'center', marginBottom: 20 }}>
              Hinterlasse etwas <em>Bleibendes.</em>
            </h2>
            <p className="lede" style={{ textAlign: 'center', marginBottom: 36 }}>
              QR-Codes werden über die Admin-Konsole erstellt und können an beliebige Flaschen angebracht werden.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
