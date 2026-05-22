'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SiteHeader, SiteFooter } from '@/components/SiteHeader';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falsches Passwort');
      router.push('/admin/dashboard');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Fehler');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <SiteHeader />
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 20px' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div className="card">
            <p className="eyebrow">— Admin —</p>
            <h1 className="section-title" style={{ marginBottom: 8 }}>Anmeldung</h1>
            <p style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink-soft)', marginBottom: 28, lineHeight: 1.65 }}>
              Gib das Admin-Passwort ein, um auf die Verwaltungskonsole zuzugreifen.
            </p>
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: 20 }}>
                <label className="input-label" htmlFor="password">Passwort</label>
                <input
                  id="password"
                  type="password"
                  required
                  className="input-field"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
              {error && (
                <div style={{ background: 'rgba(110,34,48,0.08)', border: '1px solid rgba(110,34,48,0.2)', padding: '10px 14px', marginBottom: 16, fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--accent)', borderRadius: 2 }}>
                  {error}
                </div>
              )}
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                {loading ? 'Anmelden…' : 'Anmelden →'}
              </button>
            </form>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
