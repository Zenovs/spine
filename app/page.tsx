'use client';
import { useEffect, useRef } from 'react';
import { SiteHeader, SiteFooter } from '@/components/SiteHeader';
import {
  QrCode,
  AugmentedReality,
  Cube,
  ArrowRight,
  Checkmark,
  Star,
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

/* ─── Interactive particle network for the hero background ───
   Canvas-based animation: ~80 points drift slowly, lines are drawn
   between any two points within THRESHOLD px (opacity proportional
   to closeness). The pointer attracts/connects too. Pure 2D canvas,
   no external dependency. Respects prefers-reduced-motion. */
function HeroParticles() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0;
    let pointer = { x: -9999, y: -9999, active: false };
    let raf = 0;

    type Pt = { x: number; y: number; vx: number; vy: number };
    let pts: Pt[] = [];

    function resize() {
      if (!wrap || !canvas || !ctx) return;
      w = wrap.clientWidth;
      h = wrap.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // density scales with area, capped for perf
      const count = Math.min(110, Math.max(40, Math.floor((w * h) / 14000)));
      pts = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
      }));
    }

    const LINE_DIST = 140;
    const POINTER_DIST = 200;

    function frame() {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);

      // advance
      for (const p of pts) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) { p.x = 0; p.vx *= -1; }
        if (p.x > w) { p.x = w; p.vx *= -1; }
        if (p.y < 0) { p.y = 0; p.vy *= -1; }
        if (p.y > h) { p.y = h; p.vy *= -1; }

        // gentle pull toward pointer
        if (pointer.active) {
          const dx = pointer.x - p.x;
          const dy = pointer.y - p.y;
          const d = Math.hypot(dx, dy);
          if (d < POINTER_DIST) {
            const f = (1 - d / POINTER_DIST) * 0.04;
            p.vx += (dx / (d || 1)) * f;
            p.vy += (dy / (d || 1)) * f;
          }
        }
        // damping
        p.vx *= 0.99;
        p.vy *= 0.99;
      }

      // lines between points
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const d = Math.hypot(dx, dy);
          if (d < LINE_DIST) {
            const a = 0.32 * (1 - d / LINE_DIST);
            ctx.strokeStyle = `rgba(124,146,255,${a})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.stroke();
          }
        }
      }

      // lines to pointer
      if (pointer.active) {
        for (const p of pts) {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const d = Math.hypot(dx, dy);
          if (d < POINTER_DIST) {
            const a = 0.6 * (1 - d / POINTER_DIST);
            ctx.strokeStyle = `rgba(124,146,255,${a})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(pointer.x, pointer.y);
            ctx.stroke();
          }
        }
        // pointer node
        ctx.fillStyle = 'rgba(124,146,255,0.9)';
        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // nodes
      for (const p of pts) {
        ctx.fillStyle = 'rgba(124,146,255,0.85)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(frame);
    }

    function onPointerMove(e: PointerEvent) {
      if (!wrap) return;
      const rect = wrap.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.active = true;
    }
    function onPointerLeave() { pointer.active = false; }

    resize();
    window.addEventListener('resize', resize);
    wrap.addEventListener('pointermove', onPointerMove);
    wrap.addEventListener('pointerleave', onPointerLeave);
    if (!reduceMotion) raf = requestAnimationFrame(frame);
    else frame(); // single static frame

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      wrap.removeEventListener('pointermove', onPointerMove);
      wrap.removeEventListener('pointerleave', onPointerLeave);
    };
  }, []);

  return (
    <div ref={wrapRef} className="hero-particles" aria-hidden="true">
      <canvas ref={canvasRef} />
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
            HERO  — interactive particle-network background
        ═══════════════════════════════════ */}
        <section className="hero hero--center">
          <HeroParticles />
          <div className="container">
            <div className="hero__inner">
              <div className="hero__top" data-reveal>
                <span className="eyebrow eyebrow--solo">QR · AR · Mixed Reality</span>
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
          </div>
        </section>

        {/* ═══════════════════════════════════
            HOW IT WORKS
        ═══════════════════════════════════ */}
        <section id="how" className="section section--light">
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
        <section id="ar" className="section section--light">
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
