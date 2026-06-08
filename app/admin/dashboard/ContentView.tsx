'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useT } from '@/lib/i18n-client';

type ContentItem = {
  content_id: string;
  qr_code_id: string;
  qr_code: string | null;
  qr_status: string | null;
  qr_admin_note: string | null;
  qr_deleted: boolean;
  email: string | null;
  sender_name: string | null;
  message: string | null;
  video_url: string | null;
  image_url: string | null;
  video_fit: 'contain' | 'cover' | null;
  video_obj_x: number | null;
  video_obj_y: number | null;
  content_created_at: string;
};

type Toast = (msg: string) => void;

export function ContentView({ showToast }: { showToast: Toast }) {
  const router = useRouter();
  const t = useT();
  const [rows, setRows] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'orphan'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/submissions/list');
      if (res.status === 401) { router.push('/admin'); return; }
      const data = await res.json();
      setRows(data.rows || []);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { load(); }, [load]);

  async function deleteContent(id: string, label: string) {
    if (!confirm(t('content.deleteConfirm', { label }))) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/content/${id}`, { method: 'DELETE' });
      if (res.status === 401) { router.push('/admin'); return; }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('content.errDelete'));
      const tplKey = data.removedBlobs === 1 ? 'content.toastDeleted' : 'content.toastDeletedPl';
      showToast(t(tplKey, { n: data.removedBlobs }));
      load();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : t('content.errDelete'));
    } finally {
      setDeletingId(null);
    }
  }

  const q = search.toLowerCase();
  const filtered = rows
    .filter(r => filter === 'all' || (filter === 'orphan' ? r.qr_deleted : !r.qr_deleted))
    .filter(r =>
      (r.email || '').toLowerCase().includes(q) ||
      (r.sender_name || '').toLowerCase().includes(q) ||
      (r.message || '').toLowerCase().includes(q) ||
      (r.qr_code || '').toLowerCase().includes(q),
    );

  return (
    <>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }}>
        {[
          { label: t('content.stats.all'), value: rows.length, key: 'all' as const },
          { label: t('content.stats.active'), value: rows.filter(r => !r.qr_deleted).length, key: 'active' as const },
          { label: t('content.stats.orphan'), value: rows.filter(r => r.qr_deleted).length, key: 'orphan' as const },
        ].map(s => (
          <button key={s.key} onClick={() => setFilter(s.key)}
            className="card card-sm"
            style={{
              textAlign: 'center', cursor: 'pointer', background: filter === s.key ? 'rgba(110,34,48,0.05)' : undefined,
              borderColor: filter === s.key ? 'var(--accent)' : undefined,
            }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,3vw,40px)', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.015em' }}>{s.value}</div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)', marginTop: 4 }}>{s.label}</div>
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em', flex: 1 }}>
            {t('content.title')} <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--ink-3)', fontWeight: 400 }}>({filtered.length})</span>
          </h2>
          <input
            type="text"
            className="input-field"
            placeholder={t('common.search')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: 200, padding: '8px 12px', fontSize: 13 }}
          />
        </div>

        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--ink-3)' }}>
            {t('content.loading')}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <p className="lede" style={{ textAlign: 'center' }}>
              {rows.length === 0 ? t('content.empty') : t('content.noMatch')}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filtered.map(r => (
              <div key={r.content_id} style={{ padding: '20px 24px', borderBottom: '1px solid var(--line)' }}>
                {/* Header row: code, status, actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    {r.qr_code ? (
                      <a href={`/q/${r.qr_code}/view`} target="_blank" rel="noopener noreferrer"
                        style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 13, letterSpacing: '0.08em', color: 'var(--ink)' }}>
                        {r.qr_code}
                      </a>
                    ) : (
                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink-3)', fontStyle: 'italic' }}>
                        {t('content.noQR')}
                      </span>
                    )}
                    {r.qr_deleted ? (
                      <span className="badge badge-deleted">{t('content.orphanBadge')}</span>
                    ) : (
                      <span className={`badge badge-${r.qr_status || 'pending'}`}>{r.qr_status}</span>
                    )}
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--ink-3)' }}>
                      {new Date(r.content_created_at).toLocaleString('de-CH')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {r.qr_code && !r.qr_deleted && (
                      <a href={`/q/${r.qr_code}/view`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                        {t('adminDash.action.view')}
                      </a>
                    )}
                    <button
                      className="btn btn-danger btn-sm"
                      disabled={deletingId === r.content_id}
                      onClick={() => deleteContent(r.content_id, r.email || r.qr_code || r.content_id.slice(0, 8))}
                    >
                      {deletingId === r.content_id ? t('common.deleting') : t('common.delete')}
                    </button>
                  </div>
                </div>

                {/* Meta: email + sender */}
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink-2)', marginBottom: 12 }}>
                  {r.email && <span>{r.email}</span>}
                  {r.sender_name && <span> · {t('content.from', { name: r.sender_name })}</span>}
                </div>

                {/* Content grid: message + media */}
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 20, alignItems: 'start' }}>
                  <div style={{ minWidth: 0 }}>
                    {r.message ? (
                      <blockquote style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 14, lineHeight: 1.6, color: 'var(--ink)', borderLeft: '2px solid var(--accent)', paddingLeft: 12, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {r.message}
                      </blockquote>
                    ) : (
                      <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink-3)', fontStyle: 'italic' }}>{t('content.noMessage')}</p>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 180 }}>
                    {r.video_url && (
                      <div>
                        <p className="eyebrow" style={{ marginBottom: 4 }}>{t('adminDash.detail.video')}</p>
                        <video
                          src={r.video_url}
                          controls
                          playsInline
                          style={{
                            width: '100%', aspectRatio: '1/1', borderRadius: 3, background: '#111',
                            objectFit: r.video_fit === 'cover' ? 'cover' : 'contain',
                            objectPosition: `${r.video_obj_x ?? 50}% ${r.video_obj_y ?? 50}%`,
                          }}
                        />
                      </div>
                    )}
                    {r.image_url && (
                      <div>
                        <p className="eyebrow" style={{ marginBottom: 4 }}>{t('adminDash.detail.image')}</p>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={r.image_url} alt={t('adminDash.detail.image')} style={{ width: '100%', borderRadius: 3, display: 'block' }} />
                      </div>
                    )}
                    {!r.video_url && !r.image_url && (
                      <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--ink-3)' }}>{t('content.noMedia')}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
