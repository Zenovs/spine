'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useT } from '@/lib/i18n-client';

type Submission = {
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

export function SubmissionsView() {
  const router = useRouter();
  const t = useT();
  const [rows, setRows] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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

  const q = search.toLowerCase();
  const filtered = rows.filter(r =>
    (r.email || '').toLowerCase().includes(q) ||
    (r.sender_name || '').toLowerCase().includes(q) ||
    (r.qr_code || '').toLowerCase().includes(q),
  );

  const uniqueEmails = new Set(rows.map(r => r.email).filter(Boolean)).size;

  return (
    <>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }}>
        {[
          { label: t('subs.stats.total'), value: rows.length },
          { label: t('subs.stats.unique'), value: uniqueEmails },
          { label: t('subs.stats.orphan'), value: rows.filter(r => r.qr_deleted).length },
        ].map((s, i) => (
          <div key={i} className="card card-sm" style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,3vw,40px)', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.015em' }}>{s.value}</div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em', flex: 1 }}>
            {t('subs.title')} <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--ink-3)', fontWeight: 400 }}>({filtered.length})</span>
          </h2>
          <input
            type="text"
            className="input-field"
            placeholder={t('common.search')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: 200, padding: '8px 12px', fontSize: 13 }}
          />
          <a className="btn btn-ghost btn-sm" href="/api/admin/submissions/export?format=csv" download>
            {t('subs.csv')}
          </a>
          <a className="btn btn-ghost btn-sm" href="/api/admin/submissions/export?format=xlsx" download>
            {t('subs.xlsx')}
          </a>
        </div>

        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--ink-3)' }}>
            {t('subs.loading')}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <p className="lede" style={{ textAlign: 'center' }}>
              {rows.length === 0 ? t('subs.empty') : t('subs.noMatch')}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div style={{ overflowX: 'auto', display: 'none' }} className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{t('subs.col.email')}</th><th>{t('subs.col.sender')}</th><th>{t('subs.col.qr')}</th><th>{t('subs.col.status')}</th><th>{t('subs.col.date')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r.content_id}>
                      <td style={{ fontSize: 13, fontFamily: 'var(--font-sans)' }}>{r.email || <span style={{ opacity: 0.4 }}>—</span>}</td>
                      <td style={{ fontSize: 13 }}>{r.sender_name || <span style={{ opacity: 0.4 }}>—</span>}</td>
                      <td>
                        {r.qr_code ? (
                          <a href={`/q/${r.qr_code}/view`} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: '0.06em', color: 'var(--ink)', fontSize: 12 }}>
                            {r.qr_code}
                          </a>
                        ) : <span style={{ opacity: 0.4 }}>—</span>}
                      </td>
                      <td>
                        {r.qr_deleted
                          ? <span className="badge badge-deleted" style={{ fontSize: 10 }}>{t('subs.qrDeleted')}</span>
                          : <span className={`badge badge-${r.qr_status || 'pending'}`} style={{ fontSize: 10 }}>{r.qr_status || '—'}</span>}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>
                        {new Date(r.content_created_at).toLocaleString('de-CH')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile list */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filtered.map(r => (
                <div key={r.content_id} style={{ padding: '14px 20px', borderBottom: '1px solid var(--line)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: 'var(--ink)', wordBreak: 'break-all' }}>{r.email || '—'}</div>
                      {r.sender_name && <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--ink-3)' }}>{r.sender_name}</div>}
                      <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>
                        {r.qr_code && (
                          <a href={`/q/${r.qr_code}/view`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ink-3)', letterSpacing: '0.05em' }}>
                            {r.qr_code}
                          </a>
                        )}
                        {' · '}
                        {new Date(r.content_created_at).toLocaleDateString('de-CH')}
                      </div>
                    </div>
                    {r.qr_deleted
                      ? <span className="badge badge-deleted" style={{ fontSize: 9 }}>{t('subs.qrDeleted')}</span>
                      : <span className={`badge badge-${r.qr_status || 'pending'}`} style={{ fontSize: 9 }}>{r.qr_status || '—'}</span>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
