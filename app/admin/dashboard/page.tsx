'use client';
import { Fragment, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SiteHeader, SiteFooter } from '@/components/SiteHeader';
import { SubmissionsView } from './SubmissionsView';
import { ContentView } from './ContentView';
import { useT } from '@/lib/i18n-client';

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
  const t = useT();
  if (!qr.content_id) {
    return (
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink-3)', padding: '12px 0' }}>
        {t('adminDash.detail.empty')}
      </p>
    );
  }
  const submittedAt = qr.content_created_at ? new Date(qr.content_created_at).toLocaleString('de-CH') : null;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 24, padding: '14px 0 4px', alignItems: 'start' }}>
      <div style={{ minWidth: 0 }}>
        <p className="eyebrow" style={{ marginBottom: 4 }}>{t('adminDash.detail.personalMessage')}</p>
        {qr.sender_name && (
          <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 15, color: 'var(--ink)', marginBottom: 8 }}>
            {t('adminDash.detail.from', { name: qr.sender_name })}
          </p>
        )}
        {qr.message ? (
          <blockquote style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 14, lineHeight: 1.6, color: 'var(--ink)', borderLeft: '2px solid var(--accent)', paddingLeft: 12, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {qr.message}
          </blockquote>
        ) : (
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink-3)' }}>
            {t('adminDash.detail.noMessage')}
          </p>
        )}
        {submittedAt && (
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--ink-3)', marginTop: 10, letterSpacing: '0.05em' }}>
            {t('adminDash.detail.submittedAt', { date: submittedAt })}
          </p>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 200 }}>
        {qr.video_url ? (
          <div>
            <p className="eyebrow" style={{ marginBottom: 4 }}>{t('adminDash.detail.video')}</p>
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
            <a href={qr.video_url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginTop: 4, fontFamily: 'var(--font-sans)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>
              {t('adminDash.detail.openOriginal')}
            </a>
          </div>
        ) : (
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--ink-3)' }}>{t('adminDash.detail.noVideo')}</p>
        )}
        {qr.image_url ? (
          <div>
            <p className="eyebrow" style={{ marginBottom: 4 }}>{t('adminDash.detail.image')}</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr.image_url} alt={t('adminDash.detail.image')} style={{ width: '100%', borderRadius: 3, display: 'block' }} />
            <a href={qr.image_url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginTop: 4, fontFamily: 'var(--font-sans)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>
              {t('adminDash.detail.openOriginal')}
            </a>
          </div>
        ) : (
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--ink-3)' }}>{t('adminDash.detail.noImage')}</p>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const t = useT();
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
        throw new Error(data.error || t('adminDash.create.errStatus', { status: res.status }));
      }
      showToast(t('adminDash.create.toast', { n: data.codes.length }));
      setNote('');
      loadQRCodes();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : t('adminDash.create.errGeneric'));
    } finally {
      setCreating(false);
    }
  }

  async function deleteQR(code: string) {
    if (!confirm(t('adminDash.confirmDelete', { code }))) return;
    const res = await fetch(`/api/admin/qr/${code}`, { method: 'DELETE' });
    if (res.status === 401) { router.push('/admin'); return; }
    showToast(t('adminDash.toastDeleted', { code }));
    loadQRCodes();
  }

  async function resetQR(code: string) {
    if (!confirm(t('adminDash.confirmReset', { code }))) return;
    const res = await fetch(`/api/admin/qr/${code}/reset`, { method: 'POST' });
    if (res.status === 401) { router.push('/admin'); return; }
    showToast(t('adminDash.toastReset', { code }));
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
    showToast(t('adminDash.list.downloadedToast', { n: filtered.length }));
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
      <main style={{ flex: 1, paddingTop: 'clamp(96px,7vw,120px)', paddingBottom: 'clamp(32px,4vw,56px)', paddingLeft: 20, paddingRight: 20 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, marginBottom: 40, flexWrap: 'wrap' }}>
            <div>
              <p className="eyebrow">{t('adminDash.eyebrow')}</p>
              <h1 className="section-title">{t('adminDash.titlePre')} <em>{t('adminDash.titleEm')}</em></h1>
            </div>
            <button
              onClick={async () => {
                await fetch('/api/admin/login', { method: 'DELETE' });
                router.push('/admin');
              }}
              style={{ background: 'none', border: 'none', fontFamily: 'var(--font-sans)', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-3)', cursor: 'pointer' }}
            >
              {t('nav.signOut')}
            </button>
          </div>

          {/* Tab navigation */}
          <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--line)', marginBottom: 32, overflowX: 'auto' }}>
            {([
              { id: 'qr', label: t('adminDash.tabs.qr') },
              { id: 'submissions', label: t('adminDash.tabs.submissions') },
              { id: 'content', label: t('adminDash.tabs.content') },
            ] as { id: Tab; label: string }[]).map(tab => (
              <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
                style={{
                  background: 'none', border: 'none', padding: '12px 18px', cursor: 'pointer',
                  fontFamily: 'var(--font-sans)', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase',
                  color: activeTab === tab.id ? 'var(--ink)' : 'var(--ink-3)',
                  borderBottom: `2px solid ${activeTab === tab.id ? 'var(--accent)' : 'transparent'}`,
                  marginBottom: -1, whiteSpace: 'nowrap',
                }}>
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'submissions' && <SubmissionsView />}
          {activeTab === 'content' && <ContentView showToast={showToast} />}

          {activeTab === 'qr' && <>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }}>
            {[
              { label: t('adminDash.stats.total'), value: stats.total, badge: '' },
              { label: t('adminDash.stats.pending'), value: stats.pending, badge: 'badge-pending' },
              { label: t('adminDash.stats.locked'), value: stats.locked, badge: 'badge-locked' },
            ].map((s, i) => (
              <div key={i} className="card card-sm" style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,3vw,40px)', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.015em' }}>{s.value}</div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Create QR codes */}
          <div className="card" style={{ marginBottom: 32 }}>
            <p className="eyebrow">{t('adminDash.create.eyebrow')}</p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em', marginBottom: 20 }}>{t('adminDash.create.title')}</h2>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div>
                <label className="input-label" htmlFor="count">{t('adminDash.create.count')}</label>
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
                <label className="input-label" htmlFor="note">{t('adminDash.create.note')}</label>
                <input
                  id="note"
                  type="text"
                  className="input-field"
                  placeholder={t('adminDash.create.notePlaceholder')}
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />
              </div>
              <button className="btn btn-accent" onClick={createQRCodes} disabled={creating}>
                {creating ? t('adminDash.create.btnLoading') : t('adminDash.create.btn', { n: count })}
              </button>
            </div>
          </div>

          {/* QR Code list */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em', flex: 1 }}>
                {t('adminDash.list.title')} <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--ink-3)', fontWeight: 400 }}>({filteredCodes.length})</span>
              </h2>
              <input
                type="text"
                className="input-field"
                placeholder={t('common.search')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: 200, padding: '8px 12px', fontSize: 13 }}
              />
              <button className="btn btn-ghost btn-sm" onClick={downloadAllQRs} disabled={filteredCodes.length === 0}>
                {t('adminDash.list.downloadAll')}
              </button>
            </div>

            {loading ? (
              <div style={{ padding: 48, textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--ink-3)' }}>
                {t('adminDash.list.loading')}
              </div>
            ) : filteredCodes.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center' }}>
                <p className="lede" style={{ textAlign: 'center' }}>{t('adminDash.list.empty')}</p>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div style={{ overflowX: 'auto', display: 'none' }} className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th style={{ width: 28 }}></th>
                        <th>{t('adminDash.col.code')}</th><th>{t('adminDash.col.status')}</th><th>{t('adminDash.col.note')}</th><th>{t('adminDash.col.sender')}</th><th>{t('common.email')}</th><th>{t('adminDash.col.created')}</th><th style={{ textAlign: 'right' }}>{t('adminDash.col.actions')}</th>
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
                              <td style={{ fontSize: 14, color: 'var(--ink-3)', textAlign: 'center', userSelect: 'none' }}>
                                {hasContent ? (isExpanded ? '▾' : '▸') : ''}
                              </td>
                              <td><a href={`${baseUrl}/q/${qr.code}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: '0.08em', color: 'var(--ink)', fontSize: 13 }}>{qr.code}</a></td>
                              <td><span className={`badge badge-${qr.status}`}>{qr.status}</span></td>
                              <td style={{ fontSize: 13, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{qr.admin_note || <span style={{ opacity: 0.4 }}>—</span>}</td>
                              <td style={{ fontSize: 13 }}>{qr.sender_name || <span style={{ opacity: 0.4 }}>—</span>}</td>
                              <td style={{ fontSize: 12, color: 'var(--ink-3)' }}>{qr.email || <span style={{ opacity: 0.4 }}>—</span>}</td>
                              <td style={{ fontSize: 12, color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>{new Date(qr.created_at).toLocaleDateString('de-CH')}</td>
                              <td onClick={e => e.stopPropagation()}><div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                <button className="btn btn-ghost btn-sm" onClick={() => downloadQR(qr.code)}>{t('adminDash.action.svg')}</button>
                                <Link href={`/q/${qr.code}/view`} className="btn btn-ghost btn-sm" target="_blank">{t('adminDash.action.view')}</Link>
                                {qr.status === 'locked' && <button className="btn btn-ghost btn-sm" onClick={() => resetQR(qr.code)}>{t('adminDash.action.reset')}</button>}
                                <button className="btn btn-danger btn-sm" onClick={() => deleteQR(qr.code)}>{t('adminDash.action.delete')}</button>
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
                      <div key={qr.id} style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
                        <div
                          onClick={() => hasContent && setExpandedCode(isExpanded ? null : qr.code)}
                          style={{ cursor: hasContent ? 'pointer' : 'default' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              {hasContent && (
                                <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{isExpanded ? '▾' : '▸'}</span>
                              )}
                              <a href={`${baseUrl}/q/${qr.code}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                                style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 14, letterSpacing: '0.08em', color: 'var(--ink)' }}>
                                {qr.code}
                              </a>
                            </div>
                            <span className={`badge badge-${qr.status}`}>{qr.status}</span>
                          </div>
                          {(qr.admin_note || qr.sender_name || qr.email) && (
                            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--ink-3)', marginBottom: 10, lineHeight: 1.5 }}>
                              {qr.admin_note && <div>{qr.admin_note}</div>}
                              {qr.sender_name && <div>{qr.sender_name} · {qr.email}</div>}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => downloadQR(qr.code)}>{t('adminDash.action.svg')}</button>
                          <Link href={`/q/${qr.code}/view`} className="btn btn-ghost btn-sm" target="_blank">{t('adminDash.action.view')}</Link>
                          {qr.status === 'locked' && <button className="btn btn-ghost btn-sm" onClick={() => resetQR(qr.code)}>{t('adminDash.action.reset')}</button>}
                          <button className="btn btn-danger btn-sm" onClick={() => deleteQR(qr.code)}>{t('adminDash.action.delete')}</button>
                        </div>
                        {isExpanded && hasContent && (
                          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px dashed var(--line)' }}>
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
          background: 'var(--ink)', color: 'var(--paper)',
          fontFamily: 'var(--font-sans)', fontSize: 13,
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
