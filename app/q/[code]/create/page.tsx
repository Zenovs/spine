'use client';
import { useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SiteHeader, SiteFooter } from '@/components/SiteHeader';

const IMAGE_TEMPLATES = [
  { id: 't1', label: 'Weinberg', url: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=400&h=300&fit=crop' },
  { id: 't2', label: 'Weinglas', url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=300&fit=crop' },
  { id: 't3', label: 'Weinflaschen', url: 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=400&h=300&fit=crop' },
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
  const [error, setError] = useState('');
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const videoInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  function handleVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 200 * 1024 * 1024) {
      setError('Video darf maximal 200 MB gross sein.');
      return;
    }
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('Bild darf maximal 10 MB gross sein.');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setImageSource('upload');
    setSelectedTemplate('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let videoUrl = '';
      let imageUrl = '';

      // Upload video if provided
      if (videoFile) {
        const fd = new FormData();
        fd.append('file', videoFile);
        fd.append('type', 'video');
        const vRes = await fetch('/api/upload', { method: 'POST', body: fd });
        const vData = await vRes.json();
        if (!vRes.ok) throw new Error(vData.error || 'Video-Upload fehlgeschlagen');
        videoUrl = vData.url;
      }

      // Upload image or use template
      if (imageSource === 'upload' && imageFile) {
        const fd = new FormData();
        fd.append('file', imageFile);
        fd.append('type', 'image');
        const iRes = await fetch('/api/upload', { method: 'POST', body: fd });
        const iData = await iRes.json();
        if (!iRes.ok) throw new Error(iData.error || 'Bild-Upload fehlgeschlagen');
        imageUrl = iData.url;
      } else if (imageSource === 'template' && selectedTemplate) {
        imageUrl = IMAGE_TEMPLATES.find(t => t.id === selectedTemplate)?.url || '';
      }

      // Save content
      const res = await fetch('/api/content/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, senderName, message, videoUrl, imageUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Speichern fehlgeschlagen');

      router.push(`/q/${code}/view`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  }

  const canProceedStep1 = senderName.trim().length > 0 && message.trim().length > 0;
  const canSubmit = canProceedStep1;

  return (
    <>
      <SiteHeader />
      <main style={{ flex: 1, padding: 'clamp(32px,5vw,64px) 20px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>

          {/* Steps */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 40 }}>
            <StepDot num={1} label="Botschaft" active={step === 1} done={step > 1} />
            <div style={{ flex: 1, height: 1, background: 'var(--rule)', margin: '0 10px' }} />
            <StepDot num={2} label="Video" active={step === 2} done={step > 2} />
            <div style={{ flex: 1, height: 1, background: 'var(--rule)', margin: '0 10px' }} />
            <StepDot num={3} label="Bild" active={step === 3} done={false} />
          </div>

          <form onSubmit={handleSubmit}>

            {/* Step 1: Text */}
            {step === 1 && (
              <div className="card">
                <p className="eyebrow">— Schritt 1 von 3 —</p>
                <h1 className="section-title" style={{ marginBottom: 8 }}>Deine <em>Grussworte</em></h1>
                <p style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink-soft)', marginBottom: 32, lineHeight: 1.65 }}>
                  Was möchtest du dem Empfänger mitteilen? Deine Botschaft wird für immer mit dieser Flasche verbunden.
                </p>

                <div style={{ marginBottom: 20 }}>
                  <label className="input-label" htmlFor="senderName">Dein Name</label>
                  <input
                    id="senderName"
                    type="text"
                    className="input-field"
                    placeholder="z.B. Maria & Thomas"
                    value={senderName}
                    onChange={e => setSenderName(e.target.value)}
                    required
                  />
                </div>

                <div style={{ marginBottom: 28 }}>
                  <label className="input-label" htmlFor="message">Persönliche Botschaft</label>
                  <textarea
                    id="message"
                    className="input-field"
                    placeholder="Schreibe hier deine persönliche Botschaft an den Empfänger…"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    style={{ minHeight: 160 }}
                    required
                  />
                  <div style={{ textAlign: 'right', fontFamily: 'var(--sans)', fontSize: 11, color: 'var(--ink-muted)', marginTop: 4 }}>
                    {message.length} Zeichen
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-accent"
                  disabled={!canProceedStep1}
                  onClick={() => setStep(2)}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Weiter zum Video →
                </button>
              </div>
            )}

            {/* Step 2: Video */}
            {step === 2 && (
              <div className="card">
                <p className="eyebrow">— Schritt 2 von 3 —</p>
                <h1 className="section-title" style={{ marginBottom: 8 }}>Deine <em>Videobotschaft</em></h1>
                <p style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink-soft)', marginBottom: 28, lineHeight: 1.65 }}>
                  Optional: Lade eine persönliche Videobotschaft hoch (max. 200 MB, MP4/MOV/WebM).
                </p>

                {videoPreview ? (
                  <div style={{ marginBottom: 24 }}>
                    <video
                      src={videoPreview}
                      controls
                      style={{ width: '100%', borderRadius: 3, background: '#1a1a1a', maxHeight: 320, objectFit: 'contain' }}
                    />
                    <button
                      type="button"
                      onClick={() => { setVideoFile(null); setVideoPreview(''); }}
                      style={{ marginTop: 10, background: 'none', border: 'none', fontFamily: 'var(--sans)', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-muted)', cursor: 'pointer' }}
                    >
                      Video entfernen ×
                    </button>
                  </div>
                ) : (
                  <div
                    className="upload-zone"
                    style={{ marginBottom: 24 }}
                    onClick={() => videoInputRef.current?.click()}
                  >
                    <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }}>▶</div>
                    <p style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink-soft)', marginBottom: 6 }}>
                      Video auswählen oder hierher ziehen
                    </p>
                    <p style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--ink-muted)' }}>
                      MP4, MOV, WebM · max. 200 MB
                    </p>
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/mp4,video/mov,video/quicktime,video/webm"
                      onChange={handleVideoChange}
                      style={{ display: 'none' }}
                    />
                  </div>
                )}

                <div style={{ display: 'flex', gap: 12 }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setStep(1)} style={{ flex: 1, justifyContent: 'center' }}>
                    ← Zurück
                  </button>
                  <button type="button" className="btn btn-accent" onClick={() => setStep(3)} style={{ flex: 2, justifyContent: 'center' }}>
                    Weiter zum Bild →
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Image + Submit */}
            {step === 3 && (
              <div className="card">
                <p className="eyebrow">— Schritt 3 von 3 —</p>
                <h1 className="section-title" style={{ marginBottom: 8 }}>Dein <em>Bild</em></h1>
                <p style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink-soft)', marginBottom: 28, lineHeight: 1.65 }}>
                  Wähle ein Vorlagenbild oder lade ein eigenes hoch.
                </p>

                {/* Template selection */}
                <div style={{ marginBottom: 20 }}>
                  <p className="input-label">Vorlage auswählen</p>
                  <div className="template-grid">
                    {IMAGE_TEMPLATES.map(t => (
                      <div
                        key={t.id}
                        className={`template-item ${selectedTemplate === t.id ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedTemplate(t.id);
                          setImageSource('template');
                          setImageFile(null);
                          setImagePreview('');
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={t.url} alt={t.label} />
                        {selectedTemplate === t.id && (
                          <div style={{
                            position: 'absolute', inset: 0, background: 'rgba(110,34,48,0.15)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 24, color: 'white',
                          }}>✓</div>
                        )}
                        <div style={{
                          position: 'absolute', bottom: 0, left: 0, right: 0,
                          background: 'linear-gradient(transparent, rgba(0,0,0,0.5))',
                          padding: '8px 8px 6px',
                          fontFamily: 'var(--sans)', fontSize: 10, color: 'white', letterSpacing: '0.1em', textTransform: 'uppercase',
                        }}>
                          {t.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '20px 0' }}>
                  <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--rule)' }} />
                  <span style={{ fontFamily: 'var(--sans)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>oder</span>
                  <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--rule)' }} />
                </div>

                {/* Custom image upload */}
                {imagePreview ? (
                  <div style={{ marginBottom: 28 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imagePreview} alt="Vorschau" style={{ width: '100%', borderRadius: 3, maxHeight: 240, objectFit: 'cover' }} />
                    <button
                      type="button"
                      onClick={() => { setImageFile(null); setImagePreview(''); setImageSource('none'); }}
                      style={{ marginTop: 10, background: 'none', border: 'none', fontFamily: 'var(--sans)', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-muted)', cursor: 'pointer' }}
                    >
                      Bild entfernen ×
                    </button>
                  </div>
                ) : (
                  <div
                    className="upload-zone"
                    style={{ marginBottom: 28 }}
                    onClick={() => imageInputRef.current?.click()}
                  >
                    <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.3 }}>🖼</div>
                    <p style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink-soft)', marginBottom: 4 }}>
                      Eigenes Bild hochladen
                    </p>
                    <p style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--ink-muted)' }}>
                      JPG, PNG, WebP · max. 10 MB
                    </p>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageChange}
                      style={{ display: 'none' }}
                    />
                  </div>
                )}

                {error && <ErrorBox msg={error} />}

                {/* Final warning */}
                <div style={{
                  background: 'rgba(110,34,48,0.06)',
                  border: '1px solid rgba(110,34,48,0.15)',
                  padding: '14px 16px',
                  marginBottom: 20,
                  borderRadius: 2,
                }}>
                  <p style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.55 }}>
                    <strong style={{ color: 'var(--accent)' }}>Wichtig:</strong> Nach dem Speichern kann der Inhalt nicht mehr geändert werden.
                    Der QR-Code ist dann dauerhaft mit deiner Botschaft verbunden.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setStep(2)} style={{ flex: 1, justifyContent: 'center' }}>
                    ← Zurück
                  </button>
                  <button
                    type="submit"
                    className="btn btn-accent"
                    disabled={loading || !canSubmit}
                    style={{ flex: 2, justifyContent: 'center' }}
                  >
                    {loading ? 'Speichere…' : 'Botschaft für immer speichern →'}
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

function StepDot({ num, label, active, done }: { num: number; label: string; active: boolean; done: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        background: done ? 'var(--accent)' : active ? 'var(--ink)' : 'transparent',
        border: `1.5px solid ${done ? 'var(--accent)' : active ? 'var(--ink)' : 'var(--rule)'}`,
        color: done || active ? 'var(--bg)' : 'var(--ink-muted)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--serif)', fontSize: 13,
      }}>
        {done ? '✓' : num}
      </div>
      <span style={{ fontFamily: 'var(--sans)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: active ? 'var(--ink)' : 'var(--ink-muted)' }}>
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
