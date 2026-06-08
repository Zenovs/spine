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
        vx: (Math.random() - 0.5) * 1.0,
        vy: (Math.random() - 0.5) * 1.0,
      }));
    }

    const LINE_DIST = 140;
    const POINTER_DIST = 200;

    function frame() {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);

      // advance
      const MAX_SPEED = 1.4;
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
            const f = (1 - d / POINTER_DIST) * 0.05;
            p.vx += (dx / (d || 1)) * f;
            p.vy += (dy / (d || 1)) * f;
          }
        }

        // Brownian drift + very light damping — strong enough to keep the
        // network in perpetual motion (steady-state ~0.5–0.7 px/frame, i.e.
        // 30–40 px/sec at 60fps), while still letting pointer attraction
        // perturb it temporarily before re-settling.
        p.vx = p.vx * 0.997 + (Math.random() - 0.5) * 0.05;
        p.vy = p.vy * 0.997 + (Math.random() - 0.5) * 0.05;

        // cap to prevent runaway acceleration after pointer attraction
        const sp = Math.hypot(p.vx, p.vy);
        if (sp > MAX_SPEED) {
          p.vx = (p.vx / sp) * MAX_SPEED;
          p.vy = (p.vy / sp) * MAX_SPEED;
        }
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
                Ein QR-Code auf dem Produkt — ein digitales Erlebnis dahinter.
                Video, AR-Layer, 3D-Modell oder persönliche Botschaft. Du entscheidest.
              </p>
              <div className="hero__actions" data-reveal data-reveal-delay="3">
                <a href="/admin" className="btn btn--primary">Demo starten <ArrowRight size={14} /></a>
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
                  verb: 'Scan',
                  title: 'QR-Code scannen',
                  body: 'Mit der Smartphone-Kamera erfassen. Kein App-Download, keine Anmeldung — direkt im Browser.',
                },
                {
                  num: '02',
                  verb: 'Fill',
                  title: 'Inhalt hinterlegen',
                  body: 'Video, persönliche Botschaft, Bild oder AR-Layer. Einmal gesetzt, fest mit dem Produkt verknüpft.',
                },
                {
                  num: '03',
                  verb: 'Feel',
                  title: 'Erlebnis empfangen',
                  body: 'Jeder weitere Scan öffnet den Inhalt sofort. Persönlich, dauerhaft, ohne Umweg.',
                },
              ].map((step, i) => (
                <div key={i} className="step" data-reveal data-reveal-delay={String(i + 2) as '2' | '3' | '4'}>
                  <span className="step__num">{step.num}</span>
                  <h3 className="step__verb">{step.verb}<span className="step__verb-dot">.</span><span className="step__verb-it"> it.</span></h3>
                  <h4 className="step__title">{step.title}</h4>
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
                Jedes Produkt wird Träger einer Geschichte — vom Hochzeitswein bis zur Erbstücks-Uhr.
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
                    WebAR direkt im Browser — ohne Download
                  </li>
                  <li>
                    <span className="tick"><Checkmark size={14} /></span>
                    3D-Modelle und Animationen auf jedem Smartphone
                  </li>
                  <li>
                    <span className="tick"><Checkmark size={14} /></span>
                    Video und Botschaft mit AR-Layer kombinieren
                  </li>
                  <li>
                    <span className="tick"><Checkmark size={14} /></span>
                    Produktdetails in Echtzeit-3D zeigen
                  </li>
                </ul>
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
                    {/* Bottom scrim — minimal AR status indicator only */}
                    <div style={{ position: 'absolute', bottom: 20, left: 14, right: 14 }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(124,146,255,0.8)' }}>
                        AR aktiv
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating AR chips — placed directly over the phone screen
                    as if they were AR UI elements rendered on top of the
                    camera view, not labels next to it. */}
                <div className="ar-chip" style={{ top: '14%', right: '8%', animation: 'floatA 4s ease-in-out infinite' }}>
                  Videobotschaft
                </div>
                <div className="ar-chip" style={{ top: '46%', left: '14%', animation: 'floatB 5s ease-in-out infinite', animationDelay: '0.8s' }}>
                  Grussworte
                </div>
                <div className="ar-chip" style={{ bottom: '20%', right: '12%', animation: 'floatA 4.5s ease-in-out infinite', animationDelay: '1.6s' }}>
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
                  Inhalt einmal eingerichtet, unveränderlich mit dem Produkt verknüpft. Kein Login, keine App.
                </p>
              </div>
              <div className="permanence__row">
                {[
                  { label: 'Unveränderlich', desc: 'Nach dem Sperren bleibt der Inhalt fix — kein Überschreiben.' },
                  { label: 'App-frei', desc: 'Funktioniert auf jedem Smartphone, direkt im Browser.' },
                  { label: 'Für immer', desc: 'Redundant gehostet — kein Ablaufdatum, kein Abo.' },
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
                <p className="lead" style={{ maxWidth: 460, margin: '16px auto 0' }}>
                  Wir kleben den QR-Code aufs Produkt — du füllst ihn mit deinem Inhalt. Einmal eingerichtet, dauerhaft verbunden.
                </p>
              </div>
              <div className="closing__actions" data-reveal data-reveal-delay="2">
                <a href="/admin" className="btn btn--primary">Demo starten <ArrowRight size={14} /></a>
                <a href="mailto:info@wireon.ch" className="btn btn--ghost">Kontakt aufnehmen</a>
              </div>
            </div>
          </div>
        </section>

      </main>
      <SiteFooter />
    </>
  );
}
