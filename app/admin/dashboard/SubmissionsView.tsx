'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

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
          { label: 'Einreichungen', value: rows.length },
          { label: 'Eindeutige E-Mails', value: uniqueEmails },
          { label: 'QR-Code gelöscht', value: rows.filter(r => r.qr_deleted).length },
        ].map((s, i) => (
          <div key={i} className="card card-sm" style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(28px,3vw,40px)', fontWeight: 500, color: 'var(--ink)' }}>{s.value}</div>
            <div style={{ fontFamily: 'var(--sans)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--rule)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 500, flex: 1 }}>
            E-Mail-Einreichungen <span style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink-muted)', fontWeight: 400 }}>({filtered.length})</span>
          </h2>
          <input
            type="text"
            className="input-field"
            placeholder="Suchen…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: 200, padding: '8px 12px', fontSize: 13 }}
          />
          <a className="btn btn-ghost btn-sm" href="/api/admin/submissions/export?format=csv" download>
            CSV ↓
          </a>
          <a className="btn btn-ghost btn-sm" href="/api/admin/submissions/export?format=xlsx" download>
            XLSX ↓
          </a>
        </div>

        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink-muted)' }}>
            Lade Einreichungen…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <p className="lede" style={{ textAlign: 'center' }}>
              {rows.length === 0 ? 'Noch keine Einreichungen.' : 'Keine Treffer.'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div style={{ overflowX: 'auto', display: 'none' }} className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>E-Mail</th><th>Absender</th><th>QR-Code</th><th>QR-Status</th><th>Datum</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r.content_id}>
                      <td style={{ fontSize: 13, fontFamily: 'var(--sans)' }}>{r.email || <span style={{ opacity: 0.4 }}>—</span>}</td>
                      <td style={{ fontSize: 13 }}>{r.sender_name || <span style={{ opacity: 0.4 }}>—</span>}</td>
                      <td>
                        {r.qr_code ? (
                          <a href={`/q/${r.qr_code}/view`} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'var(--sans)', fontWeight: 600, letterSpacing: '0.06em', color: 'var(--ink)', fontSize: 12 }}>
                            {r.qr_code}
                          </a>
                        ) : <span style={{ opacity: 0.4 }}>—</span>}
                      </td>
                      <td>
                        {r.qr_deleted
                          ? <span className="badge badge-deleted" style={{ fontSize: 10 }}>QR gelöscht</span>
                          : <span className={`badge badge-${r.qr_status || 'pending'}`} style={{ fontSize: 10 }}>{r.qr_status || '—'}</span>}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--ink-muted)', whiteSpace: 'nowrap' }}>
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
                <div key={r.content_id} style={{ padding: '14px 20px', borderBottom: '1px solid var(--rule)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600, color: 'var(--ink)', wordBreak: 'break-all' }}>{r.email || '—'}</div>
                      {r.sender_name && <div style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--ink-muted)' }}>{r.sender_name}</div>}
                      <div style={{ fontFamily: 'var(--sans)', fontSize: 11, color: 'var(--ink-muted)', marginTop: 4 }}>
                        {r.qr_code && (
                          <a href={`/q/${r.qr_code}/view`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ink-muted)', letterSpacing: '0.05em' }}>
                            {r.qr_code}
                          </a>
                        )}
                        {' · '}
                        {new Date(r.content_created_at).toLocaleDateString('de-CH')}
                      </div>
                    </div>
                    {r.qr_deleted
                      ? <span className="badge badge-deleted" style={{ fontSize: 9 }}>QR gelöscht</span>
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
