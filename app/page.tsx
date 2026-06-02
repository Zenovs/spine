'use client';
import { useEffect, useState, useRef } from 'react';
import { SiteHeader, SiteFooter } from '@/components/SiteHeader';
import {
  QrCode,
  AugmentedReality,
  Cube,
  ArrowRight,
  Checkmark,
  Star,
  Play,
  Bottles_01 as BottlesIcon,
  Gift,
  Watch,
  Package,
  PaintBrush,
  Tree,
  Home as HomeIcon,
  Book,
  DiamondOutline,
} from '@carbon/icons-react';

/* ─── Scroll-reveal observer ─── */
function useReveal() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const els = document.querySelectorAll('[data-reveal]');
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/* ─── ScanStage interactive demo ─── */
function ScanStage() {
  const [state, setState] = useState(0); // 0=scan 1=content 2=ar
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setState(s => (s + 1) % 3);
    }, 3000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  function goTo(n: number) {
    if (timerRef.current) clearInterval(timerRef.current);
    setState(n);
    timerRef.current = setInterval(() => setState(s => (s + 1) % 3), 3000);
  }

  const hudLabels = ['Scannen', 'Erlebnis', 'AR aktiv'];

  return (
    <div className="how__demo">
      <div className="scanstage">
        {/* Glow backdrop for AR state */}
        <div className={`scanstage__glow${state === 2 ? ' visible' : ''}`} />

        {/* HUD */}
        <div className="hud">
          <div className="hud__dot" />
          {hudLabels[state]}
        </div>

        {/* Screen content */}
        <div className="scanstage__screen">

          {/* State 0: Scan */}
          {state === 0 && (
            <>
              {/* Simple QR grid */}
              <div className="bigqr" style={{ position: 'relative' }}>
                {/* 7×7 = 49 cells, approximate QR pattern */}
                {Array.from({ length: 49 }, (_, i) => {
                  const row = Math.floor(i / 7);
                  const col = i % 7;
                  // Corner finders
                  const inCorner =
                    (row < 3 && col < 3) ||
                    (row < 3 && col > 3) ||
                    (row > 3 && col < 3);
                  const isOff = !inCorner && Math.random() > 0.5;
                  return <span key={i} className={isOff ? 'off' : ''} />;
                })}
                <div className="beam" style={{ top: '30%' }} />
                <div className="reticle" style={{ top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
              </div>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.1em', color: 'var(--ink-3)', textTransform: 'uppercase', textAlign: 'center' }}>
                QR-Code wird erkannt
              </p>
            </>
          )}

          {/* State 1: Content */}
          {state === 1 && (
            <>
              <div className="play">
                <Play size={24} fill="white" />
              </div>
              <p className="cap">
                &ldquo;Alles Gute zum Geburtstag, liebe Anna!&rdquo;
              </p>
              <div className="lines">
                <span />
                <span />
                <span />
              </div>
            </>
          )}

          {/* State 2: AR */}
          {state === 2 && (
            <>
              {/* Spinning rings */}
              <div style={{ position: 'relative', width: 160, height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{
                  position: 'absolute', width: 160, height: 160, borderRadius: '50%',
                  border: '2px solid rgba(77,107,255,0.5)',
                  animation: 'spinC1 4s linear infinite',
                  top: '50%', left: '50%',
                }} />
                <div style={{
                  position: 'absolute', width: 120, height: 120, borderRadius: '50%',
                  border: '1.5px solid rgba(124,146,255,0.4)',
                  animation: 'spinC2 3s linear infinite',
                  top: '50%', left: '50%',
                }} />
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: 'radial-gradient(circle, var(--accent) 0%, var(--accent-tint) 70%)',
                  boxShadow: '0 0 32px var(--glow)',
                  animation: 'pulseRing 2s ease-in-out infinite',
                }} />
                {/* 3 orbiting dots */}
                {[0, 120, 240].map((deg, i) => (
                  <div key={i} style={{
                    position: 'absolute', top: '50%', left: '50%',
                    width: 8, height: 8, borderRadius: '50%',
                    background: i === 0 ? 'var(--accent)' : i === 1 ? 'var(--accent-strong)' : '#A8AEBC',
                    animation: `orbitS ${2.5 + i * 0.4}s linear infinite`,
                    animationDelay: `${i * 0.3}s`,
                    transform: `rotate(${deg}deg) translateX(60px)`,
                  }} />
                ))}
              </div>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', letterSpacing: '0.12em', color: 'var(--accent-strong)', textTransform: 'uppercase' }}>
                AR-Modus aktiv
              </p>
            </>
          )}
        </div>
      </div>

      {/* Rail buttons */}
      <div className="scanstage__rail">
        {['Scannen', 'Erlebnis', 'AR'].map((label, i) => (
          <button key={i} className={`rail__step${state === i ? ' active' : ''}`} onClick={() => goTo(i)}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Main page ─── */
export default function Home() {
  useReveal();

  return (
    <>
      <SiteHeader />
      <main style={{ flex: 1 }}>

        {/* ═══════════════════════════════════
            HERO
        ═══════════════════════════════════ */}
        <section className="hero">
          <div className="container">
            <div className="hero__grid">
              <div className="hero__copy">
                <div className="hero__top" data-reveal>
                  <span className="eyebrow">QR · AR · Mixed Reality</span>
                  <h1 className="display">
                    Jedes Produkt erzählt deine <em>Geschichte.</em>
                  </h1>
                </div>
                <p className="hero__sub" data-reveal data-reveal-delay="2">
                  Verbinde physische Produkte mit digitalen Erlebnissen. Ein QR-Code — unendliche
                  Möglichkeiten: Video, AR-Overlays, 3D-Inhalte und persönliche Botschaften.
                </p>
                <div className="hero__actions" data-reveal data-reveal-delay="3">
                  <a href="#how" className="btn btn--primary">Demo starten <ArrowRight size={14} /></a>
                  <a href="#ar" className="btn btn--ghost">AR entdecken</a>
                </div>
                <div className="hero__meta" data-reveal data-reveal-delay="4">
                  <span className="tag"><QrCode size={14} /> QR</span>
                  <span className="sep" />
                  <span className="tag"><AugmentedReality size={14} /> AR</span>
                  <span className="sep" />
                  <span className="tag"><Cube size={14} /> Mixed Reality</span>
                </div>
              </div>

              {/* Hero visual: ScanStage preview */}
              <div data-reveal data-reveal-delay="2" style={{ display: 'flex', justifyContent: 'center' }}>
                <ScanStage />
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════
            HOW IT WORKS
        ═══════════════════════════════════ */}
        <section id="how" className="section section--band">
          <div className="container">
            <div className="section-head" data-reveal>
              <span className="eyebrow">So funktioniert es</span>
              <h2 className="h2">Drei Schritte.<br /><em>Ein Erlebnis.</em></h2>
            </div>

            <div className="steps">
              {[
                {
                  num: '01',
                  title: 'QR-Code scannen',
                  body: 'Der QR-Code befindet sich bereits auf dem Produkt. Einfach scannen — beim ersten Mal gelangt man zur Eingabe der persönlichen Botschaft.',
                },
                {
                  num: '02',
                  title: 'Inhalt hinterlegen',
                  body: 'Video hochladen, Grussworte verfassen, Bild wählen — oder direkt ein AR-Erlebnis konfigurieren. Einmalig, für immer gespeichert.',
                },
                {
                  num: '03',
                  title: 'Erlebnis empfangen',
                  body: 'Jeder weitere Scan zeigt das Erlebnis direkt: Video, AR-Overlay, 3D-Modell. Unveränderlich mit dem Produkt verbunden.',
                },
              ].map((step, i) => (
                <div key={i} className="step" data-reveal data-reveal-delay={String(i + 2) as '2' | '3' | '4'}>
                  <span className="step__num">{step.num}</span>
                  <h3 className="h3" style={{ marginBottom: 12, fontSize: '1.1rem' }}>{step.title}</h3>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: 15, lineHeight: 1.65, color: 'var(--ink-2)' }}>{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════
            CATEGORIES
        ═══════════════════════════════════ */}
        <section id="cats" className="section">
          <div className="container">
            <div className="cats-head" data-reveal>
              <span className="eyebrow">Produkte</span>
              <h2 className="h2">Für jeden <em>Anlass.</em></h2>
              <p className="lead" style={{ maxWidth: 480, margin: '16px auto 0' }}>
                Verbinde jedes physische Produkt mit einer digitalen Erlebniswelt.
              </p>
            </div>
            <div className="cats-grid">
              {[
                { Icon: BottlesIcon,    name: 'Wein & Spirituosen' },
                { Icon: Gift,           name: 'Geschenkartikel' },
                { Icon: Watch,          name: 'Schmuck & Uhren' },
                { Icon: Package,        name: 'Verpackungen' },
                { Icon: PaintBrush,     name: 'Kunstobjekte' },
                { Icon: Tree,           name: 'Naturprodukte' },
                { Icon: HomeIcon,       name: 'Immobilien' },
                { Icon: Book,           name: 'Bücher & Medien' },
                { Icon: DiamondOutline, name: 'Luxusgüter' },
              ].map((cat, i) => (
                <div key={i} className="cat" data-reveal data-reveal-delay={String((i % 3) + 2) as '2' | '3' | '4'}>
                  <div className="cat__icon" aria-hidden="true">
                    <cat.Icon size={20} />
                  </div>
                  <span className="cat__name">{cat.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════
            AR & MIXED REALITY
        ═══════════════════════════════════ */}
        <section id="ar" className="section section--band">
          <div className="container">
            <div className="ar__grid">
              {/* Copy column */}
              <div className="ar__copy">
                <div data-reveal>
                  <span className="eyebrow">AR & Mixed Reality</span>
                  <h2 className="h2">Die Zukunft<br />in <em>deinen Händen.</em></h2>
                </div>
                <div className="ar__tags" data-reveal data-reveal-delay="2">
                  <span className="pill">WebAR</span>
                  <span className="pill">3D-Overlays</span>
                  <span className="pill">Mixed Reality</span>
                </div>
                <ul className="ar__list" data-reveal data-reveal-delay="2">
                  <li>
                    <span className="tick"><Checkmark size={14} /></span>
                    Kein App-Download — direkt im Browser
                  </li>
                  <li>
                    <span className="tick"><Checkmark size={14} /></span>
                    3D-Modelle und Animationen auf jedem Gerät
                  </li>
                  <li>
                    <span className="tick"><Checkmark size={14} /></span>
                    Videobotschaften mit AR-Overlay überlagern
                  </li>
                  <li>
                    <span className="tick"><Checkmark size={14} /></span>
                    Produktdemos in Echtzeit-3D
                  </li>
                </ul>
                <div className="ar__note" data-reveal data-reveal-delay="3">
                  &ldquo;Physisch und digital verschmelzen zu einem einzigen, unvergesslichen Erlebnis.&rdquo;
                </div>
              </div>

              {/* Phone mockup with AR animations */}
              <div className="phone-wrap" data-reveal data-reveal-delay="2">
                {/* Ambient glow */}
                <div className="glow" style={{ width: 280, height: 280, top: '50%', left: '50%', transform: 'translate(-50%,-50%)', animation: 'pulseRing 3s ease-in-out infinite' }} />

                {/* Spinning orbit rings behind phone */}
                <div style={{
                  position: 'absolute', width: 320, height: 320,
                  top: '50%', left: '50%',
                  border: '1px solid rgba(77,107,255,0.18)',
                  borderRadius: '50%',
                  animation: 'spinC1 12s linear infinite',
                  transform: 'translate(-50%,-50%)',
                  zIndex: 1,
                }} />
                <div style={{
                  position: 'absolute', width: 380, height: 380,
                  top: '50%', left: '50%',
                  border: '1px dashed rgba(77,107,255,0.1)',
                  borderRadius: '50%',
                  animation: 'spinC2 18s linear infinite',
                  transform: 'translate(-50%,-50%)',
                  zIndex: 1,
                }} />

                {/* Phone */}
                <div className="phone">
                  <div className="phone__screen">
                    <div className="phone__notch" />
                    <div className="phone__photo" />
                    <div className="phone__scrim" />
                    {/* Grid overlay */}
                    <div className="screen__grid" />
                    {/* Sweep */}
                    <div className="scan-sweep" />
                    {/* AR ring overlays */}
                    <div style={{
                      position: 'absolute', width: 100, height: 100, borderRadius: '50%',
                      border: '1.5px solid rgba(77,107,255,0.6)',
                      top: '38%', left: '50%', transform: 'translate(-50%,-50%)',
                      animation: 'pulseRing 2.2s ease-in-out infinite',
                    }} />
                    <div style={{
                      position: 'absolute', width: 70, height: 70, borderRadius: '50%',
                      border: '1px solid rgba(124,146,255,0.4)',
                      top: '38%', left: '50%', transform: 'translate(-50%,-50%)',
                      animation: 'pulseRing 2.2s ease-in-out infinite',
                      animationDelay: '-1.1s',
                    }} />
                    {/* Central orb */}
                    <div style={{
                      position: 'absolute', width: 22, height: 22, borderRadius: '50%',
                      background: 'radial-gradient(circle, #7C92FF, #4D6BFF)',
                      boxShadow: '0 0 20px rgba(77,107,255,0.8)',
                      top: '38%', left: '50%', transform: 'translate(-50%,-50%)',
                    }} />
                    {/* Bottom scrim content */}
                    <div style={{ position: 'absolute', bottom: 20, left: 14, right: 14 }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(124,146,255,0.8)', marginBottom: 6 }}>
                        AR aktiv
                      </div>
                      <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'rgba(244,246,250,0.8)', lineHeight: 1.4 }}>
                        Jahrgang 2023 · Pinot Noir
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating AR chips */}
                <div className="ar-chip" style={{ top: '18%', right: '-12%', animation: 'floatA 4s ease-in-out infinite' }}>
                  Videobotschaft
                </div>
                <div className="ar-chip" style={{ top: '52%', left: '-16%', animation: 'floatB 5s ease-in-out infinite', animationDelay: '0.8s' }}>
                  Grussworte
                </div>
                <div className="ar-chip" style={{ bottom: '22%', right: '-10%', animation: 'floatA 4.5s ease-in-out infinite', animationDelay: '1.6s' }}>
                  3D-Element
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════
            PERMANENCE
        ═══════════════════════════════════ */}
        <section className="section permanence">
          <div className="container">
            <div className="permanence__inner">
              <div data-reveal>
                <div className="seal">
                  <Star size={28} />
                </div>
                <span className="eyebrow">Dauerhaftigkeit</span>
                <h2 className="h2">Einmal gespeichert.<br /><em>Für immer.</em></h2>
                <p className="lead" style={{ maxWidth: 480, margin: '16px auto 0' }}>
                  Jede Botschaft ist unveränderlich mit dem physischen Objekt verknüpft.
                  Kein Login, keine App — nur scannen.
                </p>
              </div>
              <div className="permanence__row">
                {[
                  { label: 'Unveränderlich', desc: 'Nach dem Sperren kann kein Inhalt überschrieben werden.' },
                  { label: 'App-frei', desc: 'Funktioniert auf jedem Smartphone, direkt im Browser.' },
                  { label: 'Für immer', desc: 'Hosted auf redundanter Infrastruktur — kein Ablaufdatum.' },
                ].map((cell, i) => (
                  <div key={i} className="permanence__cell" data-reveal data-reveal-delay={String(i + 2) as '2' | '3' | '4'}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', textTransform: 'uppercase', color: 'var(--ink)', letterSpacing: '-0.01em' }}>
                      {cell.label}
                    </div>
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, lineHeight: 1.6, color: 'var(--ink-3)' }}>{cell.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════
            CLOSING CTA
        ═══════════════════════════════════ */}
        <section className="closing section--band">
          <div className="container">
            <div className="closing__inner">
              {/* Ambient glow */}
              <div style={{
                position: 'absolute', width: 400, height: 400,
                top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                background: 'var(--glow)', filter: 'blur(80px)', opacity: 0.15,
                borderRadius: '50%', pointerEvents: 'none',
              }} />
              <div data-reveal>
                <span className="eyebrow">Jetzt starten</span>
                <h2 className="h2">Hinterlasse etwas<br /><em>Bleibendes.</em></h2>
                <p className="lead" style={{ maxWidth: 420, margin: '16px auto 0' }}>
                  Der QR-Code ist bereits auf dem Produkt. Scanne ihn und starte dein persönliches Erlebnis.
                </p>
              </div>
              <div className="closing__actions" data-reveal data-reveal-delay="2">
                <a href="#how" className="btn btn--primary">Demo starten <ArrowRight size={14} /></a>
                <a href="mailto:info@augmentedreality.ch" className="btn btn--ghost">Kontakt aufnehmen</a>
              </div>
            </div>
          </div>
        </section>

      </main>
      <SiteFooter />
    </>
  );
}
