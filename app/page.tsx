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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'clamp(16px,3vw,40px)' }}>
              {[
                { num: '01', title: 'QR-Code scannen', body: 'Der QR-Code ist bereits auf der Flasche. Scanne ihn — beim ersten Mal gelangst du zur Eingabe deiner persönlichen Botschaft.' },
                { num: '02', title: 'Botschaft hinterlegen', body: 'Verifiziere deine E-Mail, lade ein Video hoch, schreibe deine Grussworte und wähle ein Bild — einmalig und für immer gespeichert.' },
                { num: '03', title: 'Erlebnis empfangen', body: 'Jeder weitere Scan zeigt direkt die hinterlegte Botschaft — Video, Text und Bild. Unveränderlich, für immer mit der Flasche verbunden.' },
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
              Der QR-Code ist bereits auf der Flasche. Scanne ihn und hinterlasse deine Botschaft —
              beim nächsten Scan sieht der Empfänger genau das, was du hinterlegt hast.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
