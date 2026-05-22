'use client';
import { useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { upload } from '@vercel/blob/client';
import { SiteHeader, SiteFooter } from '@/components/SiteHeader';
import { compressVideo } from '@/lib/compress-video';

function formatETA(seconds: number) {
  if (seconds < 5) return 'wenige Sekunden';
  if (seconds < 60) return `${Math.round(seconds)} Sek.`;
  return `${Math.ceil(seconds / 60)} Min.`;
}

const IMAGE_TEMPLATES = [
  { id: 't1', label: 'Weinberg', url: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=400&h=300&fit=crop' },
  { id: 't2', label: 'Weinglas', url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=300&fit=crop' },
  { id: 't3', label: 'Flaschen', url: 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=400&h=300&fit=crop' },
  { id: 't4', label: 'Reben', url: 'https://images.unsplash.com/photo-1474722883778-792e7990302f?w=400&h=300&fit=crop' },
  { id: 't5', label: 'Herbst', url: 'https://images.unsplash.com/photo-1508004680771-708b02f4fb44?w=400&h=300&fit=crop' },
  { id: 't6', label: 'Keller', url: 'https://images.unsplash.com/photo-1504279807002-09854ccc9b6c?w=400&h=300&fit=crop' },
];

type ImageSource = 'none' | 'template' | 'upload';

export default function CreatePage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();

  const [senderName, setSenderName] = useState('');
  const [message, setMessage] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState('');
  const [imageSource, setImageSource] = useState<ImageSource>('none');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [uploadPercent, setUploadPercent] = useState(0);
  const [uploadETA, setUploadETA] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const videoInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const uploadStartRef = useRef<number>(0);

  function handleVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 200 * 1024 * 1024) { setError('Video max. 200 MB'); return; }
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
    setError('');
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setError('Bild max. 10 MB'); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setImageSource('upload');
    setSelectedTemplate('');
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let videoUrl = '';
      let imageUrl = '';

      if (videoFile) {
        // Compress if > 20 MB — shows its own stage/progress feedback
        const toUpload = await compressVideo(
          videoFile,
          (stage) => { setUploadProgress(stage); setUploadPercent(0); setUploadETA(''); },
          (pct) => setUploadPercent(pct),
        );

        setUploadProgress('Video wird hochgeladen…');
        setUploadPercent(0);
        setUploadETA('');
        uploadStartRef.current = Date.now();
        const ext = toUpload.name.split('.').pop() || 'mp4';
        const blob = await upload(
          `videos/${Date.now()}.${ext}`,
          toUpload,
          {
            access: 'public',
            handleUploadUrl: '/api/upload',
            multipart: true,
            onUploadProgress: ({ percentage }) => {
              // Cap at 95 — server still commits after the HTTP transfer ends
              setUploadPercent(Math.min(Math.round(percentage), 95));
              const elapsed = (Date.now() - uploadStartRef.current) / 1000;
              if (percentage > 2 && elapsed > 0.5) {
                const total = elapsed / (percentage / 100);
                setUploadETA(formatETA(Math.max(0, total - elapsed)));
              }
            },
          }
        );
        videoUrl = blob.url;
        setUploadPercent(100);
        setUploadETA('');
      }

      if (imageSource === 'upload' && imageFile) {
        setUploadProgress('Bild wird hochgeladen…');
        setUploadPercent(0);
        uploadStartRef.current = Date.now();
        const ext = imageFile.name.split('.').pop() || 'jpg';
        const blob = await upload(
          `images/${Date.now()}.${ext}`,
          imageFile,
          {
            access: 'public',
            handleUploadUrl: '/api/upload',
            onUploadProgress: ({ percentage }) => {
              setUploadPercent(Math.min(Math.round(percentage), 95));
            },
          }
        );
        imageUrl = blob.url;
        setUploadPercent(100);
      } else if (imageSource === 'template' && selectedTemplate) {
        imageUrl = IMAGE_TEMPLATES.find(t => t.id === selectedTemplate)?.url || '';
      }

      setUploadProgress('Botschaft wird gespeichert…');
      setUploadPercent(0);
      const res = await fetch('/api/content/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, senderName, message, videoUrl, imageUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Speichern fehlgeschlagen');

      router.push(`/q/${code}/view`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Fehler aufgetreten');
    } finally {
      setLoading(false);
      setUploadProgress('');
      setUploadPercent(0);
      setUploadETA('');
    }
  }

  const canProceedStep1 = senderName.trim().length > 0 && message.trim().length > 0;

  return (
    <>
      <SiteHeader />
      <main style={{ flex: 1, padding: 'clamp(24px,4vw,56px) 16px' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>

          {/* Step indicator */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28 }}>
            {[{ n: 1, label: 'Botschaft' }, { n: 2, label: 'Video' }, { n: 3, label: 'Bild' }].map((s, i) => (
              <>
                <div key={s.n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', fontSize: 13,
                    background: step > s.n ? 'var(--accent)' : step === s.n ? 'var(--ink)' : 'transparent',
                    border: `1.5px solid ${step > s.n ? 'var(--accent)' : step === s.n ? 'var(--ink)' : 'var(--rule)'}`,
                    color: step >= s.n ? 'var(--bg)' : 'var(--ink-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--serif)',
                  }}>
                    {step > s.n ? '✓' : s.n}
                  </div>
                  <span style={{ fontFamily: 'var(--sans)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: step === s.n ? 'var(--ink)' : 'var(--ink-muted)' }}>
                    {s.label}
                  </span>
                </div>
                {i < 2 && <div key={`line-${i}`} style={{ flex: 1, height: 1, background: 'var(--rule)', margin: '0 8px', marginBottom: 16 }} />}
              </>
            ))}
          </div>

          <form onSubmit={handleSubmit}>

            {/* ── Step 1: Text ── */}
            {step === 1 && (
              <div className="card">
                <p className="eyebrow">— 1 / 3 —</p>
                <h1 className="section-title" style={{ fontSize: 'clamp(22px,5vw,38px)', marginBottom: 8 }}>
                  Deine <em>Grussworte</em>
                </h1>
                <p style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink-soft)', marginBottom: 24, lineHeight: 1.6 }}>
                  Was möchtest du dem Empfänger mitteilen?
                </p>

                <div style={{ marginBottom: 16 }}>
                  <label className="input-label" htmlFor="senderName">Dein Name</label>
                  <input id="senderName" type="text" className="input-field" placeholder="z.B. Maria & Thomas"
                    value={senderName} onChange={e => setSenderName(e.target.value)} required
                    style={{ fontSize: 16 }} />
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label className="input-label" htmlFor="message">Persönliche Botschaft</label>
                  <textarea id="message" className="input-field"
                    placeholder="Schreibe hier deine persönliche Botschaft…"
                    value={message} onChange={e => setMessage(e.target.value)}
                    style={{ minHeight: 140, fontSize: 16 }} required />
                  <div style={{ textAlign: 'right', fontFamily: 'var(--sans)', fontSize: 11, color: 'var(--ink-muted)', marginTop: 4 }}>
                    {message.length} Zeichen
                  </div>
                </div>

                <button type="button" className="btn btn-accent" disabled={!canProceedStep1}
                  onClick={() => setStep(2)} style={{ width: '100%', justifyContent: 'center', fontSize: 13 }}>
                  Weiter →
                </button>
              </div>
            )}

            {/* ── Step 2: Video ── */}
            {step === 2 && (
              <div className="card">
                <p className="eyebrow">— 2 / 3 —</p>
                <h1 className="section-title" style={{ fontSize: 'clamp(22px,5vw,38px)', marginBottom: 8 }}>
                  Dein <em>Video</em>
                </h1>
                <p style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink-soft)', marginBottom: 24, lineHeight: 1.6 }}>
                  Optional: Lade eine Videobotschaft hoch (max. 200 MB).
                </p>

                {videoPreview ? (
                  <div style={{ marginBottom: 20 }}>
                    <video src={videoPreview} controls playsInline
                      style={{ width: '100%', borderRadius: 3, background: '#111', maxHeight: 280, objectFit: 'contain' }} />
                    <button type="button" onClick={() => { setVideoFile(null); setVideoPreview(''); }}
                      style={{ marginTop: 10, background: 'none', border: 'none', fontFamily: 'var(--sans)', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-muted)', cursor: 'pointer' }}>
                      Video entfernen ×
                    </button>
                  </div>
                ) : (
                  <div className="upload-zone" style={{ marginBottom: 20 }} onClick={() => videoInputRef.current?.click()}>
                    <div style={{ fontSize: 32, marginBottom: 10, opacity: 0.25 }}>▶</div>
                    <p style={{ fontFamily: 'var(--sans)', fontSize: 15, color: 'var(--ink-soft)', marginBottom: 4 }}>
                      Video auswählen
                    </p>
                    <p style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--ink-muted)' }}>
                      MP4, MOV, WebM · max. 200 MB
                    </p>
                    <input ref={videoInputRef} type="file"
                      accept="video/mp4,video/mov,video/quicktime,video/webm,video/*"
                      onChange={handleVideoChange} style={{ display: 'none' }} />
                  </div>
                )}

                <div className="btn-row">
                  <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}
                    style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}>← Zurück</button>
                  <button type="button" className="btn btn-accent" onClick={() => setStep(3)}
                    style={{ flex: 2, justifyContent: 'center', fontSize: 13 }}>Weiter →</button>
                </div>
              </div>
            )}

            {/* ── Step 3: Image + Submit ── */}
            {step === 3 && (
              <div className="card">
                <p className="eyebrow">— 3 / 3 —</p>
                <h1 className="section-title" style={{ fontSize: 'clamp(22px,5vw,38px)', marginBottom: 8 }}>
                  Dein <em>Bild</em>
                </h1>
                <p style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink-soft)', marginBottom: 20, lineHeight: 1.6 }}>
                  Wähle ein Vorlagenbild oder lade ein eigenes hoch.
                </p>

                {/* Templates — 2 columns on mobile */}
                <p className="input-label">Vorlage wählen</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
                  {IMAGE_TEMPLATES.map(t => (
                    <div key={t.id} onClick={() => { setSelectedTemplate(t.id); setImageSource('template'); setImageFile(null); setImagePreview(''); }}
                      style={{
                        aspectRatio: '4/3', borderRadius: 3, overflow: 'hidden', cursor: 'pointer', position: 'relative',
                        border: `2px solid ${selectedTemplate === t.id ? 'var(--accent)' : 'transparent'}`,
                        transition: 'border-color 0.2s',
                      }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={t.url} alt={t.label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      {selectedTemplate === t.id && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(110,34,48,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 18 }}>✓</div>
                      )}
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent,rgba(0,0,0,0.55))', padding: '6px 6px 4px', fontFamily: 'var(--sans)', fontSize: 9, color: 'white', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        {t.label}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
                  <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--rule)' }} />
                  <span style={{ fontFamily: 'var(--sans)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>oder</span>
                  <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--rule)' }} />
                </div>

                {imagePreview ? (
                  <div style={{ marginBottom: 20 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imagePreview} alt="Vorschau" style={{ width: '100%', borderRadius: 3, maxHeight: 200, objectFit: 'cover', display: 'block' }} />
                    <button type="button" onClick={() => { setImageFile(null); setImagePreview(''); setImageSource('none'); }}
                      style={{ marginTop: 8, background: 'none', border: 'none', fontFamily: 'var(--sans)', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-muted)', cursor: 'pointer' }}>
                      Bild entfernen ×
                    </button>
                  </div>
                ) : (
                  <div className="upload-zone" style={{ marginBottom: 20 }} onClick={() => imageInputRef.current?.click()}>
                    <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.25 }}>🖼</div>
                    <p style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink-soft)', marginBottom: 4 }}>Eigenes Bild hochladen</p>
                    <p style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--ink-muted)' }}>JPG, PNG, WebP · max. 10 MB</p>
                    <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic"
                      onChange={handleImageChange} style={{ display: 'none' }} />
                  </div>
                )}

                {error && (
                  <div style={{ background: 'rgba(110,34,48,0.08)', border: '1px solid rgba(110,34,48,0.2)', padding: '10px 14px', marginBottom: 14, fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--accent)', borderRadius: 2 }}>
                    {error}
                  </div>
                )}

                <div style={{ background: 'rgba(110,34,48,0.05)', border: '1px solid rgba(110,34,48,0.12)', padding: '12px 14px', marginBottom: 18, borderRadius: 2 }}>
                  <p style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.55 }}>
                    <strong style={{ color: 'var(--accent)' }}>Achtung:</strong> Nach dem Speichern kann der Inhalt nicht mehr geändert werden.
                  </p>
                </div>

                {/* Upload progress */}
                {loading && uploadProgress && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--ink-muted)', letterSpacing: '0.06em' }}>
                        {uploadPercent >= 95 && uploadPercent < 100 ? 'Wird abgeschlossen…' : uploadProgress}
                      </span>
                      {uploadPercent > 0 && uploadPercent < 95 && (
                        <span style={{ fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
                          {uploadPercent} %
                        </span>
                      )}
                    </div>
                    <div className="progress-bar-wrap">
                      {uploadPercent === 0 || (uploadPercent >= 95 && uploadPercent < 100) ? (
                        <div className="progress-bar-indeterminate" style={{ width: '40%' }} />
                      ) : (
                        <div className="progress-bar-fill" style={{ width: `${uploadPercent}%` }} />
                      )}
                    </div>
                    {uploadETA && uploadPercent < 95 && (
                      <div style={{ textAlign: 'right', fontFamily: 'var(--sans)', fontSize: 11, color: 'var(--ink-muted)', marginTop: 5 }}>
                        noch ca. {uploadETA}
                      </div>
                    )}
                  </div>
                )}

                <div className="btn-row">
                  <button type="button" className="btn btn-ghost" onClick={() => setStep(2)} disabled={loading}
                    style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}>← Zurück</button>
                  <button type="submit" className="btn btn-accent" disabled={loading || !canProceedStep1}
                    style={{ flex: 2, justifyContent: 'center', fontSize: 13 }}>
                    {loading ? (uploadProgress || 'Lädt…') : 'Für immer speichern →'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
