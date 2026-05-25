'use client';
import { Fragment, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SiteHeader, SiteFooter } from '@/components/SiteHeader';
import { SubmissionsView } from './SubmissionsView';
import { ContentView } from './ContentView';

type Tab = 'qr' | 'submissions' | 'content';

type QRCode = {
  id: string;
  code: string;
  status: string;
  admin_note: string | null;
  created_at: string;
  email: string | null;
  sender_name: string | null;
  message: string | null;
  video_url: string | null;
  image_url: string | null;
  video_fit: 'contain' | 'cover' | null;
  video_obj_x: number | null;
  video_obj_y: number | null;
  content_id: string | null;
  content_created_at: string | null;
};

function ContentDetail({ qr }: { qr: QRCode }) {
  if (!qr.content_id) {
    return (
      <p style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-muted)', padding: '12px 0' }}>
        Noch kein Inhalt hinterlegt.
      </p>
    );
  }
  const submittedAt = qr.content_created_at ? new Date(qr.content_created_at).toLocaleString('de-CH') : null;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 24, padding: '14px 0 4px', alignItems: 'start' }}>
      <div style={{ minWidth: 0 }}>
        <p className="eyebrow" style={{ marginBottom: 4 }}>— Persönliche Botschaft —</p>
        {qr.sender_name && (
          <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 15, color: 'var(--ink)', marginBottom: 8 }}>
            von {qr.sender_name}
          </p>
        )}
        {qr.message ? (
          <blockquote style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 14, lineHeight: 1.6, color: 'var(--ink)', borderLeft: '2px solid var(--accent)', paddingLeft: 12, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {qr.message}
          </blockquote>
        ) : (
          <p style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-muted)' }}>
            (keine Botschaft)
          </p>
        )}
        {submittedAt && (
          <p style={{ fontFamily: 'var(--sans)', fontSize: 11, color: 'var(--ink-muted)', marginTop: 10, letterSpacing: '0.05em' }}>
            Eingereicht am {submittedAt}
          </p>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 200 }}>
        {qr.video_url ? (
          <div>
            <p className="eyebrow" style={{ marginBottom: 4 }}>— Video —</p>
            <video
              src={qr.video_url}
              controls
              playsInline
              style={{
                width: '100%', aspectRatio: '16/9', borderRadius: 3, background: '#111',
                objectFit: qr.video_fit === 'cover' ? 'cover' : 'contain',
                objectPosition: `${qr.video_obj_x ?? 50}% ${qr.video_obj_y ?? 50}%`,
              }}
            />
            <a href={qr.video_url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginTop: 4, fontFamily: 'var(--sans)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
              Original öffnen ↗
            </a>
          </div>
        ) : (
          <p style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--ink-muted)' }}>Kein Video</p>
        )}
        {qr.image_url ? (
          <div>
            <p className="eyebrow" style={{ marginBottom: 4 }}>— Bild —</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr.image_url} alt="Bild zur Botschaft" style={{ width: '100%', borderRadius: 3, display: 'block' }} />
            <a href={qr.image_url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginTop: 4, fontFamily: 'var(--sans)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
              Original öffnen ↗
            </a>
          </div>
        ) : (
          <p style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--ink-muted)' }}>Kein Bild</p>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [count, setCount] = useState(1);
  const [note, setNote] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [toast, setToast] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCode, setExpandedCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('qr');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const loadQRCodes = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/qr/list');
      if (res.status === 401) { router.push('/admin'); return; }
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      setQrCodes(data.codes || []);
    } catch {
      // ignore load errors silently
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadQRCodes();
    setBaseUrl(window.location.origin);
  }, [loadQRCodes]);

  async function createQRCodes() {
    setCreating(true);
    try {
      const res = await fetch('/api/admin/qr/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count, note }),
      });
      if (res.status === 401) { router.push('/admin'); return; }
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!res.ok) {
        // 503 means DB was just initialized — retry once automatically
        if (res.status === 503) {
          await new Promise(r => setTimeout(r, 800));
          setCreating(false);
          return createQRCodes();
        }
        throw new Error(data.error || `Fehler (${res.status})`);
      }
      showToast(`${data.codes.length} QR-Code(s) erstellt`);
      setNote('');
      loadQRCodes();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Fehler beim Erstellen');
    } finally {
      setCreating(false);
    }
  }

  async function deleteQR(code: string) {
    if (!confirm(`QR-Code ${code} wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`)) return;
    const res = await fetch(`/api/admin/qr/${code}`, { method: 'DELETE' });
    if (res.status === 401) { router.push('/admin'); return; }
    showToast(`QR-Code ${code} gelöscht`);
    loadQRCodes();
  }

  async function resetQR(code: string) {
    if (!confirm(`Standard-Inhalt für ${code} wiederherstellen? Der gespeicherte Inhalt wird entfernt.`)) return;
    const res = await fetch(`/api/admin/qr/${code}/reset`, { method: 'POST' });
    if (res.status === 401) { router.push('/admin'); return; }
    showToast(`QR-Code ${code} zurückgesetzt`);
    loadQRCodes();
  }

  async function downloadQR(code: string) {
    const res = await fetch(`/api/admin/qr/${code}?format=svg`);
    const svg = await res.text();
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-${code}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function downloadAllQRs() {
    const filtered = filteredCodes;
    for (const qr of filtered) {
      await downloadQR(qr.code);
      await new Promise(r => setTimeout(r, 200));
    }
    showToast(`${filtered.length} QR-Code(s) heruntergeladen`);
  }

  const filteredCodes = qrCodes.filter(q =>
    q.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (q.admin_note || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (q.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: qrCodes.length,
    pending: qrCodes.filter(q => q.status === 'pending').length,
    locked: qrCodes.filter(q => q.status === 'locked').length,
  };

  return (
    <>
      <SiteHeader showAdmin />
      <main style={{ flex: 1, padding: 'clamp(32px,4vw,56px) 20px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, marginBottom: 40, flexWrap: 'wrap' }}>
            <div>
              <p className="eyebrow">— Verwaltung —</p>
              <h1 className="section-title">Admin <em>Konsole</em></h1>
            </div>
            <button
              onClick={async () => {
                await fetch('/api/admin/login', { method: 'DELETE' });
                router.push('/admin');
              }}
              style={{ background: 'none', border: 'none', fontFamily: 'var(--sans)', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-muted)', cursor: 'pointer' }}
            >
              Abmelden
            </button>
          </div>

          {/* Tab navigation */}
          <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--rule)', marginBottom: 32, overflowX: 'auto' }}>
            {([
              { id: 'qr', label: 'QR-Codes' },
              { id: 'submissions', label: 'E-Mail-Einreichungen' },
              { id: 'content', label: 'Inhalte' },
            ] as { id: Tab; label: string }[]).map(t => (
              <button key={t.id} type="button" onClick={() => setActiveTab(t.id)}
                style={{
                  background: 'none', border: 'none', padding: '12px 18px', cursor: 'pointer',
                  fontFamily: 'var(--sans)', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase',
                  color: activeTab === t.id ? 'var(--ink)' : 'var(--ink-muted)',
                  borderBottom: `2px solid ${activeTab === t.id ? 'var(--accent)' : 'transparent'}`,
                  marginBottom: -1, whiteSpace: 'nowrap',
                }}>
                {t.label}
              </button>
            ))}
          </div>

          {activeTab === 'submissions' && <SubmissionsView />}
          {activeTab === 'content' && <ContentView showToast={showToast} />}

          {activeTab === 'qr' && <>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }}>
            {[
              { label: 'Codes total', value: stats.total, badge: '' },
              { label: 'Ausstehend', value: stats.pending, badge: 'badge-pending' },
              { label: 'Gesperrt', value: stats.locked, badge: 'badge-locked' },
            ].map((s, i) => (
              <div key={i} className="card card-sm" style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(28px,3vw,40px)', fontWeight: 500, color: 'var(--ink)' }}>{s.value}</div>
                <div style={{ fontFamily: 'var(--sans)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Create QR codes */}
          <div className="card" style={{ marginBottom: 32 }}>
            <p className="eyebrow">— Neue QR-Codes —</p>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: 24, fontWeight: 500, marginBottom: 20 }}>QR-Codes erstellen</h2>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div>
                <label className="input-label" htmlFor="count">Anzahl</label>
                <input
                  id="count"
                  type="number"
                  min={1}
                  max={50}
                  className="input-field"
                  value={count}
                  onChange={e => setCount(Number(e.target.value))}
                  style={{ width: 100 }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label className="input-label" htmlFor="note">Notiz (optional)</label>
                <input
                  id="note"
                  type="text"
                  className="input-field"
                  placeholder="z.B. Hochzeit Müller, Charge 2025-06"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />
              </div>
              <button className="btn btn-accent" onClick={createQRCodes} disabled={creating}>
                {creating ? 'Erstelle…' : `${count} Code(s) erstellen`}
              </button>
            </div>
          </div>

          {/* QR Code list */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--rule)', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <h2 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 500, flex: 1 }}>
                Alle QR-Codes <span style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink-muted)', fontWeight: 400 }}>({filteredCodes.length})</span>
              </h2>
              <input
                type="text"
                className="input-field"
                placeholder="Suchen…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: 200, padding: '8px 12px', fontSize: 13 }}
              />
              <button className="btn btn-ghost btn-sm" onClick={downloadAllQRs} disabled={filteredCodes.length === 0}>
                Alle SVGs laden
              </button>
            </div>

            {loading ? (
              <div style={{ padding: 48, textAlign: 'center', fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink-muted)' }}>
                Lade Codes…
              </div>
            ) : filteredCodes.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center' }}>
                <p className="lede" style={{ textAlign: 'center' }}>Noch keine QR-Codes erstellt.</p>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div style={{ overflowX: 'auto', display: 'none' }} className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th style={{ width: 28 }}></th>
                        <th>Code</th><th>Status</th><th>Notiz</th><th>Absender</th><th>E-Mail</th><th>Erstellt</th><th style={{ textAlign: 'right' }}>Aktionen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCodes.map(qr => {
                        const isExpanded = expandedCode === qr.code;
                        const hasContent = qr.status === 'locked' && (qr.message || qr.video_url || qr.image_url);
                        return (
                          <Fragment key={qr.id}>
                            <tr
                              onClick={() => hasContent && setExpandedCode(isExpanded ? null : qr.code)}
                              style={{ cursor: hasContent ? 'pointer' : 'default', background: isExpanded ? 'rgba(0,0,0,0.025)' : undefined }}
                            >
                              <td style={{ fontSize: 14, color: 'var(--ink-muted)', textAlign: 'center', userSelect: 'none' }}>
                                {hasContent ? (isExpanded ? '▾' : '▸') : ''}
                              </td>
                              <td><a href={`${baseUrl}/q/${qr.code}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontFamily: 'var(--sans)', fontWeight: 600, letterSpacing: '0.08em', color: 'var(--ink)', fontSize: 13 }}>{qr.code}</a></td>
                              <td><span className={`badge badge-${qr.status}`}>{qr.status}</span></td>
                              <td style={{ fontSize: 13, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{qr.admin_note || <span style={{ opacity: 0.4 }}>—</span>}</td>
                              <td style={{ fontSize: 13 }}>{qr.sender_name || <span style={{ opacity: 0.4 }}>—</span>}</td>
                              <td style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{qr.email || <span style={{ opacity: 0.4 }}>—</span>}</td>
                              <td style={{ fontSize: 12, color: 'var(--ink-muted)', whiteSpace: 'nowrap' }}>{new Date(qr.created_at).toLocaleDateString('de-CH')}</td>
                              <td onClick={e => e.stopPropagation()}><div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                <button className="btn btn-ghost btn-sm" onClick={() => downloadQR(qr.code)}>SVG</button>
                                <Link href={`/q/${qr.code}/view`} className="btn btn-ghost btn-sm" target="_blank">Ansicht</Link>
                                {qr.status === 'locked' && <button className="btn btn-ghost btn-sm" onClick={() => resetQR(qr.code)}>Reset</button>}
                                <button className="btn btn-danger btn-sm" onClick={() => deleteQR(qr.code)}>Löschen</button>
                              </div></td>
                            </tr>
                            {isExpanded && hasContent && (
                              <tr>
                                <td colSpan={8} style={{ background: 'rgba(0,0,0,0.025)', padding: '0 24px 20px' }}>
                                  <ContentDetail qr={qr} />
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {/* Mobile cards */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {filteredCodes.map(qr => {
                    const isExpanded = expandedCode === qr.code;
                    const hasContent = qr.status === 'locked' && (qr.message || qr.video_url || qr.image_url);
                    return (
                      <div key={qr.id} style={{ padding: '16px 20px', borderBottom: '1px solid var(--rule)' }}>
                        <div
                          onClick={() => hasContent && setExpandedCode(isExpanded ? null : qr.code)}
                          style={{ cursor: hasContent ? 'pointer' : 'default' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              {hasContent && (
                                <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{isExpanded ? '▾' : '▸'}</span>
                              )}
                              <a href={`${baseUrl}/q/${qr.code}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                                style={{ fontFamily: 'var(--sans)', fontWeight: 600, fontSize: 14, letterSpacing: '0.08em', color: 'var(--ink)' }}>
                                {qr.code}
                              </a>
                            </div>
                            <span className={`badge badge-${qr.status}`}>{qr.status}</span>
                          </div>
                          {(qr.admin_note || qr.sender_name || qr.email) && (
                            <div style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--ink-muted)', marginBottom: 10, lineHeight: 1.5 }}>
                              {qr.admin_note && <div>{qr.admin_note}</div>}
                              {qr.sender_name && <div>{qr.sender_name} · {qr.email}</div>}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => downloadQR(qr.code)}>SVG</button>
                          <Link href={`/q/${qr.code}/view`} className="btn btn-ghost btn-sm" target="_blank">Ansicht</Link>
                          {qr.status === 'locked' && <button className="btn btn-ghost btn-sm" onClick={() => resetQR(qr.code)}>Reset</button>}
                          <button className="btn btn-danger btn-sm" onClick={() => deleteQR(qr.code)}>Löschen</button>
                        </div>
                        {isExpanded && hasContent && (
                          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px dashed var(--rule)' }}>
                            <ContentDetail qr={qr} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
          </>}
        </div>
      </main>

      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24,
          background: 'var(--ink)', color: 'var(--bg)',
          fontFamily: 'var(--sans)', fontSize: 13,
          padding: '12px 18px', borderRadius: 2,
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          zIndex: 999,
        }}>
          {toast}
        </div>
      )}

      <SiteFooter />
    </>
  );
}
