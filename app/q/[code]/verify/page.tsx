'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SiteHeader, SiteFooter } from '@/components/SiteHeader';
import { useT } from '@/lib/i18n-client';

type Step = 'email' | 'code';

export default function VerifyPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const t = useT();

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
      if (!res.ok) throw new Error(data.error || t('create.err.generic'));
      if (data.demoCode) {
        setDemoCode(data.demoCode);
        setVerifyCode(data.demoCode);
      }
      setStep('code');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('create.err.generic'));
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
      if (!res.ok) throw new Error(data.error || t('create.err.generic'));
      router.push(`/q/${code}/create`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('create.err.generic'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <SiteHeader />
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 'clamp(104px,9vw,144px)', paddingBottom: 'clamp(40px,6vw,80px)', paddingLeft: 20, paddingRight: 20 }}>
        <div style={{ width: '100%', maxWidth: 480 }}>
          {/* Steps */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 40 }}>
            <StepDot num={1} label={t('verify.step.email')} active={step === 'email'} done={step === 'code'} />
            <div style={{ flex: 1, height: 1, background: 'var(--line)', margin: '0 12px' }} />
            <StepDot num={2} label={t('verify.step.code')} active={step === 'code'} done={false} />
            <div style={{ flex: 1, height: 1, background: 'var(--line)', margin: '0 12px' }} />
            <StepDot num={3} label={t('create.steps.label1')} active={false} done={false} />
          </div>

          <div className="card">
            {step === 'email' ? (
              <form onSubmit={sendCode}>
                <p className="eyebrow">1 / 2</p>
                <h1 className="section-title" style={{ marginBottom: 12 }}>
                  {t('verify.email.title')}
                </h1>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.65, marginBottom: 28 }}>
                  {t('verify.email.lede')}
                </p>

                <div style={{ marginBottom: 20 }}>
                  <label className="input-label" htmlFor="email">{t('verify.email.label')}</label>
                  <input
                    id="email"
                    type="email"
                    required
                    className="input-field"
                    placeholder={t('verify.email.placeholder')}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>

                {error && <ErrorBox msg={error} />}

                <button type="submit" className="btn btn-accent" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                  {loading ? t('verify.email.sending') : t('verify.email.send') + ' →'}
                </button>
              </form>
            ) : (
              <form onSubmit={confirmCode}>
                <p className="eyebrow">2 / 2</p>
                <h1 className="section-title" style={{ marginBottom: 12 }}>
                  {t('verify.code.title')}
                </h1>
                {demoCode ? (
                  <div style={{ background: 'var(--accent-tint)', border: '1px solid rgba(77,107,255,0.3)', padding: '12px 16px', marginBottom: 24, borderRadius: 2 }}>
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent-strong)', marginBottom: 6 }}>{t('verify.demoMode')}</p>
                  </div>
                ) : (
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.65, marginBottom: 28 }}>
                    {t('verify.code.sentTo', { email })}
                  </p>
                )}

                <div style={{ marginBottom: 20 }}>
                  <label className="input-label" htmlFor="vcode">{t('verify.code.label')}</label>
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
                  {loading ? t('verify.code.confirming') : t('verify.code.confirm') + ' →'}
                </button>
                <button
                  type="button"
                  onClick={() => { setStep('email'); setVerifyCode(''); setError(''); }}
                  style={{ marginTop: 12, background: 'none', border: 'none', width: '100%', textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-3)', cursor: 'pointer' }}
                >
                  {t('verify.code.changeEmail')}
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
        border: `1.5px solid ${done ? 'var(--accent)' : active ? 'var(--ink)' : 'var(--line)'}`,
        color: done || active ? 'var(--paper)' : 'var(--ink-3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-serif)', fontSize: 14,
      }}>
        {done ? '✓' : num}
      </div>
      <span style={{ fontFamily: 'var(--font-sans)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: active ? 'var(--ink)' : 'var(--ink-3)' }}>
        {label}
      </span>
    </div>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div style={{ background: 'rgba(77,107,255,0.08)', border: '1px solid rgba(77,107,255,0.3)', padding: '12px 16px', marginBottom: 16, fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--accent)', borderRadius: 2 }}>
      {msg}
    </div>
  );
}
