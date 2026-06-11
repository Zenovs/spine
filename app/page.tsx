'use client';
import { useEffect, useRef } from 'react';
import { SiteHeader, SiteFooter } from '@/components/SiteHeader';
import { HLSVideoLoop } from '@/components/HLSVideoLoop';
import { useT } from '@/lib/i18n-client';
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
  const t = useT();

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
                <span className="eyebrow eyebrow--solo">{t('hero.eyebrow')}</span>
                <h1 className="display">
                  {t('hero.headlinePre')} <em>{t('hero.headlineEm')}</em>
                </h1>
              </div>
              <p className="hero__sub" data-reveal data-reveal-delay="2">
                {t('hero.sub')}
              </p>
              <div className="hero__actions" data-reveal data-reveal-delay="3">
                <a href="/admin" className="btn btn--primary">{t('hero.cta.demo')} <ArrowRight size={14} /></a>
                <a href="#ar" className="btn btn--ghost">{t('hero.cta.ar')}</a>
              </div>
              <div className="hero__meta" data-reveal data-reveal-delay="4">
                <span className="tag"><QrCode size={14} /> QR</span>
                <span className="sep" />
                <span className="tag"><AugmentedReality size={14} /> AR</span>
                <span className="sep" />
                <span className="tag"><Cube size={14} /> {t('hero.tag.mixed')}</span>
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
              <span className="eyebrow">{t('steps.eyebrow')}</span>
              <h2 className="h2">{t('steps.titlePre')}<br /><em>{t('steps.titleEm')}</em></h2>
            </div>

            <div className="steps">
              {[
                { num: '01', verb: t('steps.01.verb'), title: t('steps.01.title'), body: t('steps.01.body') },
                { num: '02', verb: t('steps.02.verb'), title: t('steps.02.title'), body: t('steps.02.body') },
                { num: '03', verb: t('steps.03.verb'), title: t('steps.03.title'), body: t('steps.03.body') },
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
              <span className="eyebrow">{t('cats.eyebrow')}</span>
              <h2 className="h2">{t('cats.titlePre')} <em>{t('cats.titleEm')}</em></h2>
              <p className="lead" style={{ maxWidth: 480, margin: '16px auto 0' }}>
                {t('cats.lead')}
              </p>
            </div>
            <div className="cats-grid">
              {[
                { Icon: BottlesIcon,    name: t('cats.wine') },
                { Icon: Gift,           name: t('cats.gift') },
                { Icon: Watch,          name: t('cats.jewelry') },
                { Icon: Package,        name: t('cats.packaging') },
                { Icon: PaintBrush,     name: t('cats.art') },
                { Icon: Tree,           name: t('cats.nature') },
                { Icon: HomeIcon,       name: t('cats.realestate') },
                { Icon: Book,           name: t('cats.books') },
                { Icon: DiamondOutline, name: t('cats.luxury') },
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
                  <span className="eyebrow">{t('ar.eyebrow')}</span>
                  <h2 className="h2">{t('ar.titlePre')}<br /><em>{t('ar.titleEm')}</em></h2>
                </div>
                <div className="ar__tags" data-reveal data-reveal-delay="2">
                  <span className="pill">{t('ar.pills.webar')}</span>
                  <span className="pill">{t('ar.pills.3d')}</span>
                  <span className="pill">{t('ar.pills.mixed')}</span>
                </div>
                <ul className="ar__list" data-reveal data-reveal-delay="2">
                  <li><span className="tick"><Checkmark size={14} /></span>{t('ar.list.1')}</li>
                  <li><span className="tick"><Checkmark size={14} /></span>{t('ar.list.2')}</li>
                  <li><span className="tick"><Checkmark size={14} /></span>{t('ar.list.3')}</li>
                  <li><span className="tick"><Checkmark size={14} /></span>{t('ar.list.4')}</li>
                </ul>
              </div>

              {/* HLS loop video */}
              <div className="ar__video-wrap" data-reveal data-reveal-delay="2">
                <HLSVideoLoop
                  src="https://storage.googleapis.com/wireon/qr%20code%20presentation/master.m3u8"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: 'inherit',
                    display: 'block',
                  }}
                />
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
                <span className="eyebrow">{t('perm.eyebrow')}</span>
                <h2 className="h2">{t('perm.titlePre')}<br /><em>{t('perm.titleEm')}</em></h2>
                <p className="lead" style={{ maxWidth: 480, margin: '16px auto 0' }}>
                  {t('perm.lead')}
                </p>
              </div>
              <div className="permanence__row">
                {[
                  { label: t('perm.cell1.label'), desc: t('perm.cell1.desc') },
                  { label: t('perm.cell2.label'), desc: t('perm.cell2.desc') },
                  { label: t('perm.cell3.label'), desc: t('perm.cell3.desc') },
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
                <span className="eyebrow">{t('closing.eyebrow')}</span>
                <h2 className="h2">{t('closing.titlePre')}<br /><em>{t('closing.titleEm')}</em></h2>
                <p className="lead" style={{ maxWidth: 460, margin: '16px auto 0' }}>
                  {t('closing.lead')}
                </p>
              </div>
              <div className="closing__actions" data-reveal data-reveal-delay="2">
                <a href="/admin" className="btn btn--primary">{t('hero.cta.demo')} <ArrowRight size={14} /></a>
                <a href="mailto:info@wireon.ch" className="btn btn--ghost">{t('closing.cta.contact')}</a>
              </div>
            </div>
          </div>
        </section>

      </main>
      <SiteFooter />
    </>
  );
}
