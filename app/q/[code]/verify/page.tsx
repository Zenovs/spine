'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SiteHeader, SiteFooter } from '@/components/SiteHeader';

type Step = 'email' | 'code';

export default function VerifyPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [demoCode, setDemoCode] = useState('');

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/verify/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fehler beim Senden');
      if (data.demoCode) {
        setDemoCode(data.demoCode);
        setVerifyCode(data.demoCode);
      }
      setStep('code');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  }

  async function confirmCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/verify/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, email, verifyCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falscher Code');
      router.push(`/q/${code}/create`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <SiteHeader />
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(40px,6vw,80px) 20px' }}>
        <div style={{ width: '100%', maxWidth: 480 }}>
          {/* Steps */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 40 }}>
            <StepDot num={1} label="E-Mail" active={step === 'email'} done={step === 'code'} />
            <div style={{ flex: 1, height: 1, background: 'var(--rule)', margin: '0 12px' }} />
            <StepDot num={2} label="Code" active={step === 'code'} done={false} />
            <div style={{ flex: 1, height: 1, background: 'var(--rule)', margin: '0 12px' }} />
            <StepDot num={3} label="Botschaft" active={false} done={false} />
          </div>

          <div className="card">
            {step === 'email' ? (
              <form onSubmit={sendCode}>
                <p className="eyebrow">— Schritt 1 von 2 —</p>
                <h1 className="section-title" style={{ marginBottom: 12 }}>
                  Deine <em>E-Mail</em>
                </h1>
                <p style={{ fontFamily: 'var(--sans)', fontSize: 15, color: 'var(--ink-soft)', lineHeight: 1.65, marginBottom: 28 }}>
                  Gib deine E-Mail-Adresse ein. Wir senden dir einen Verifizierungscode —
                  damit dein Name für immer mit dieser Flasche verbunden ist.
                </p>

                <div style={{ marginBottom: 20 }}>
                  <label className="input-label" htmlFor="email">E-Mail-Adresse</label>
                  <input
                    id="email"
                    type="email"
                    required
                    className="input-field"
                    placeholder="deine@email.ch"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>

                {error && <ErrorBox msg={error} />}

                <button type="submit" className="btn btn-accent" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                  {loading ? 'Sende Code…' : 'Code anfordern →'}
                </button>
              </form>
            ) : (
              <form onSubmit={confirmCode}>
                <p className="eyebrow">— Schritt 2 von 2 —</p>
                <h1 className="section-title" style={{ marginBottom: 12 }}>
                  Code <em>eingeben</em>
                </h1>
                {demoCode ? (
                  <div style={{ background: 'rgba(91,94,62,0.08)', border: '1px solid rgba(91,94,62,0.25)', padding: '12px 16px', marginBottom: 24, borderRadius: 2 }}>
                    <p style={{ fontFamily: 'var(--sans)', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--olive)', marginBottom: 6 }}>Demo-Modus — kein E-Mail-Versand konfiguriert</p>
                    <p style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink-soft)' }}>Dein Code wurde automatisch eingetragen:</p>
                  </div>
                ) : (
                  <p style={{ fontFamily: 'var(--sans)', fontSize: 15, color: 'var(--ink-soft)', lineHeight: 1.65, marginBottom: 28 }}>
                    Wir haben einen 6-stelligen Code an <strong style={{ color: 'var(--ink)' }}>{email}</strong> gesendet.
                    Gültig für 15 Minuten.
                  </p>
                )}

                <div style={{ marginBottom: 20 }}>
                  <label className="input-label" htmlFor="vcode">Verifizierungscode</label>
                  <input
                    id="vcode"
                    type="text"
                    required
                    className="input-field"
                    placeholder="• • • • • •"
                    value={verifyCode}
                    onChange={e => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    style={{ textAlign: 'center', fontSize: 28, letterSpacing: '0.3em' }}
                    maxLength={6}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                  />
                </div>

                {error && <ErrorBox msg={error} />}

                <button type="submit" className="btn btn-accent" disabled={loading || verifyCode.length < 6} style={{ width: '100%', justifyContent: 'center' }}>
                  {loading ? 'Prüfe Code…' : 'Bestätigen →'}
                </button>
                <button
                  type="button"
                  onClick={() => { setStep('email'); setVerifyCode(''); setError(''); }}
                  style={{ marginTop: 12, background: 'none', border: 'none', width: '100%', textAlign: 'center', fontFamily: 'var(--sans)', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-muted)', cursor: 'pointer' }}
                >
                  Andere E-Mail verwenden
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function StepDot({ num, label, active, done }: { num: number; label: string; active: boolean; done: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{
        width: 30, height: 30, borderRadius: '50%',
        background: done ? 'var(--accent)' : active ? 'var(--ink)' : 'transparent',
        border: `1.5px solid ${done ? 'var(--accent)' : active ? 'var(--ink)' : 'var(--rule)'}`,
        color: done || active ? 'var(--bg)' : 'var(--ink-muted)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--serif)', fontSize: 14,
      }}>
        {done ? '✓' : num}
      </div>
      <span style={{ fontFamily: 'var(--sans)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: active ? 'var(--ink)' : 'var(--ink-muted)' }}>
        {label}
      </span>
    </div>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div style={{ background: 'rgba(110,34,48,0.08)', border: '1px solid rgba(110,34,48,0.2)', padding: '12px 16px', marginBottom: 16, fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--accent)', borderRadius: 2 }}>
      {msg}
    </div>
  );
}
