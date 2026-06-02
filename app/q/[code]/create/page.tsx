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

// Diagnostic logger — visible in Safari Web Inspector on iPhone
const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
function ulog(...args: unknown[]) {
  const ms = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0);
  console.log(`[upload +${ms}ms]`, ...args);
}

// Pre-flight: verify /api/upload is reachable and returns a valid token before
// the SDK takes over. Surfaces token/env failures distinctly from blob-CDN issues.
async function pingUploadEndpoint(): Promise<{ ok: boolean; status: number; text: string }> {
  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Intentionally malformed body — we only want to confirm the route runs and the
      // env (BLOB_READ_WRITE_TOKEN) is wired. A real upload sends a proper HandleUploadBody.
      body: JSON.stringify({ type: 'ping' }),
    });
    const text = await res.text();
    return { ok: res.status < 500, status: res.status, text: text.slice(0, 200) };
  } catch (e: unknown) {
    return { ok: false, status: 0, text: e instanceof Error ? e.message : String(e) };
  }
}

// Wraps @vercel/blob/client upload() with diagnostics and safeguards:
//   1. multipart adapts to file size (small files use single PUT, less overhead)
//   2. max-progress stall: aborts if the highest % reached doesn't advance
//   3. total timeout: hard cap on the entire upload
//   4. external abort: user can cancel via the Cancel button
//   5. logs every progress event and the underlying SDK error for diagnosis
async function uploadWithStallGuard(
  pathname: string,
  file: File,
  useMultipart: boolean,
  externalSignal: AbortSignal,
  onProgress: (e: { percentage: number; retries: number }) => void,
) {
  const STALL_MS = 45_000;
  const TOTAL_MS = 5 * 60_000;
  const controller = new AbortController();
  if (externalSignal.aborted) controller.abort();
  const propagateAbort = () => controller.abort();
  externalSignal.addEventListener('abort', propagateAbort);
  const startedAt = Date.now();
  let maxPct = 0;
  let maxAt = Date.now();
  let lastPct = 0;
  let retryDips = 0;
  let progressEvents = 0;
  let firstByteAt = 0;
  let userCancelled = false;

  ulog('[uwsg] start', { pathname, sizeMB: (file.size / 1e6).toFixed(2), type: file.type, multipart: useMultipart });

  const watchdog = setInterval(() => {
    const now = Date.now();
    if (externalSignal.aborted) {
      userCancelled = true;
      clearInterval(watchdog);
    } else if (now - startedAt > TOTAL_MS) {
      ulog('[uwsg] TOTAL TIMEOUT — aborting', { maxPct, retryDips, progressEvents });
      controller.abort();
      clearInterval(watchdog);
    } else if (now - maxAt > STALL_MS) {
      ulog(`[uwsg] STALL — kein Fortschritt seit ${STALL_MS / 1000}s`, { maxPct, retryDips, progressEvents, firstByteSeconds: firstByteAt ? ((firstByteAt - startedAt) / 1000).toFixed(1) : 'never' });
      controller.abort();
      clearInterval(watchdog);
    }
  }, 3_000);

  try {
    return await upload(pathname, file, {
      access: 'public',
      handleUploadUrl: '/api/upload',
      multipart: useMultipart,
      abortSignal: controller.signal,
      onUploadProgress: (e) => {
        progressEvents++;
        if (e.percentage > 0 && firstByteAt === 0) {
          firstByteAt = Date.now();
          ulog(`[uwsg] first bytes after ${((firstByteAt - startedAt) / 1000).toFixed(1)}s`);
        }
        if (progressEvents <= 3 || progressEvents % 20 === 0) {
          ulog(`[uwsg] progress #${progressEvents}: ${e.percentage.toFixed(1)}% (max ${maxPct.toFixed(1)}%, retries ${retryDips})`);
        }
        if (e.percentage > maxPct) {
          maxPct = e.percentage;
          maxAt = Date.now();
        } else if (e.percentage < lastPct - 5) {
          retryDips++;
          ulog('[uwsg] retry detected', { from: lastPct.toFixed(1), to: e.percentage.toFixed(1), retryDips });
        }
        lastPct = e.percentage;
        onProgress({ percentage: e.percentage, retries: retryDips });
      },
    });
  } catch (err) {
    const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
    ulog(`[uwsg] FAILED after ${elapsed}s`, { progressEvents, maxPct, retryDips, errName: (err as Error)?.name, errMsg: (err as Error)?.message });

    if (userCancelled || externalSignal.aborted) {
      throw new Error('Upload abgebrochen');
    }
    if (controller.signal.aborted) {
      // Tailor the error to what we actually observed
      if (progressEvents <= 1 || maxPct === 0) {
        // No bytes ever flowed. Most likely: /api/upload token endpoint or Vercel Blob CDN
        // is not reachable / hangs. Run a ping to distinguish.
        const ping = await pingUploadEndpoint();
        ulog('[uwsg] post-fail ping /api/upload', ping);
        if (!ping.ok && ping.status === 0) {
          throw new Error(`Upload-Endpunkt nicht erreichbar (Netzwerk-Fehler: ${ping.text}). Kein Byte wurde übertragen.`);
        }
        if (ping.status >= 500) {
          throw new Error(`Upload-Endpunkt antwortet mit Fehler ${ping.status}. Prüfe BLOB_READ_WRITE_TOKEN in Vercel-Env. Server-Antwort: ${ping.text}`);
        }
        throw new Error(`Upload hängt bei 0 % — Token-Endpunkt OK (${ping.status}), aber Vercel Blob CDN antwortet nicht. Möglicherweise CORS oder Firewall.`);
      }
      const reason = Date.now() - startedAt > TOTAL_MS
        ? `Upload-Timeout nach 5 Min`
        : `Upload hängt bei ${Math.round(maxPct)}% (${retryDips} Retries)`;
      throw new Error(`${reason}. Versuch's nochmal — wenn das wiederholt passiert, prüfe BLOB_READ_WRITE_TOKEN auf Vercel.`);
    }
    throw err;
  } finally {
    externalSignal.removeEventListener('abort', propagateAbort);
    clearInterval(watchdog);
  }
}

const IMAGE_TEMPLATES = [
  { id: 't1', label: 'Weinberg', url: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=400&h=300&fit=crop' },
  { id: 't2', label: 'Weinglas', url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=300&fit=crop' },
  { id: 't3', label: 'Flaschen', url: 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=400&h=300&fit=crop' },
  { id: 't4', label: 'Reben', url: 'https://images.unsplash.com/photo-1474722883778-792e7990302f?w=400&h=300&fit=crop' },
  { id: 't5', label: 'Herbst', url: 'https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=400&h=300&fit=crop' },
  { id: 't6', label: 'Keller', url: 'https://images.unsplash.com/photo-1504279807002-09854ccc9b6c?w=400&h=300&fit=crop' },
];

type ImageSource = 'none' | 'template' | 'upload';
type CompState = 'idle' | 'preparing' | 'compressing' | 'ready' | 'failed';

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
  const [uploadRetries, setUploadRetries] = useState(0);
  const [error, setError] = useState('');
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Compression-on-selection state
  const [compState, setCompState] = useState<CompState>('idle');
  const [compStage, setCompStage] = useState('');
  const [compPct, setCompPct] = useState(0);

  const [videoFit, setVideoFit] = useState<'contain' | 'cover'>('contain');
  const [videoObjPos, setVideoObjPos] = useState({ x: 50, y: 50 });
  const videoDragRef = useRef<{ startX: number; startY: number; posX: number; posY: number } | null>(null);

  const videoInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const uploadStartRef = useRef<number>(0);
  const compIdRef = useRef(0);
  const compPromiseRef = useRef<Promise<File> | null>(null);
  const uploadAbortRef = useRef<AbortController | null>(null);

  function handleVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 200 * 1024 * 1024) { setError('Video max. 200 MB'); return; }
    setError('');
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
    startCompression(file);
  }

  function resetVideo() {
    compIdRef.current++; // invalidate any in-flight compression
    compPromiseRef.current = null;
    setVideoFile(null);
    setVideoPreview('');
    setVideoFit('contain');
    setVideoObjPos({ x: 50, y: 50 });
    setCompState('idle');
    setCompStage('');
    setCompPct(0);
  }

  function startCompression(file: File) {
    const myId = ++compIdRef.current;
    setCompState('preparing');
    setCompStage('Wird vorbereitet…');
    setCompPct(0);

    compPromiseRef.current = (async () => {
      try {
        const result = await compressVideo(
          file,
          (stage) => {
            if (myId !== compIdRef.current) return;
            ulog('precompress stage:', stage);
            setCompStage(stage);
            setCompState(stage.toLowerCase().includes('komprim') ? 'compressing' : 'preparing');
          },
          (pct) => { if (myId === compIdRef.current) setCompPct(pct); },
        );
        if (myId !== compIdRef.current) throw new Error('cancelled');
        setCompPct(100);
        setCompState('ready');
        setCompStage(result.didCompress
          ? `✓ Komprimiert: ${result.originalMB.toFixed(0)} MB → ${result.compressedMB.toFixed(0)} MB`
          : `✓ Bereit zum Hochladen · ${result.originalMB.toFixed(0)} MB`);
        ulog('precompress done', { didCompress: result.didCompress, originalMB: result.originalMB.toFixed(2), compressedMB: result.compressedMB.toFixed(2) });
        return result.file;
      } catch (err) {
        if (myId !== compIdRef.current) throw err;
        ulog('precompress failed — original wird verwendet:', err);
        setCompState('failed');
        setCompStage(`Komprimierung fehlgeschlagen · Original ${(file.size / 1e6).toFixed(0)} MB wird hochgeladen`);
        return file;
      }
    })();
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

  function cancelUpload() {
    ulog('user cancelled upload');
    uploadAbortRef.current?.abort();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setUploadRetries(0);
    uploadAbortRef.current = new AbortController();
    ulog('submit start', { hasVideo: !!videoFile, hasImage: !!imageFile, imageSource, compState });

    try {
      let videoUrl = '';
      let imageUrl = '';

      if (videoFile) {
        // Compression has been running since the user selected the video. Just wait for it.
        let toUpload: File;
        if (compPromiseRef.current) {
          if (compState !== 'ready' && compState !== 'failed') {
            setUploadProgress('Komprimierung wird abgeschlossen…');
            setUploadPercent(0);
          }
          toUpload = await compPromiseRef.current;
        } else {
          toUpload = videoFile;
        }

        if (uploadAbortRef.current.signal.aborted) throw new Error('Abgebrochen');
        if (toUpload.size === 0) throw new Error('Video-Datei ist leer (0 Byte) — bitte erneut auswählen');

        // Pre-flight: verify token endpoint reachable & env configured BEFORE wasting 45s
        // on the SDK's silent retries when /api/upload is misconfigured.
        setUploadProgress('Verbindung wird geprüft…');
        const ping = await pingUploadEndpoint();
        ulog('preflight ping /api/upload', ping);
        if (!ping.ok) {
          if (ping.status === 0) throw new Error(`Keine Verbindung zum Server: ${ping.text}`);
          throw new Error(`Server-Fehler ${ping.status}: ${ping.text}`);
        }

        const mb = (toUpload.size / 1e6).toFixed(0);
        setUploadProgress(`Video wird hochgeladen · ${mb} MB`);
        setUploadPercent(0);
        setUploadETA('');
        uploadStartRef.current = Date.now();
        const ext = toUpload.name.split('.').pop() || 'mp4';
        const pathname = `videos/${Date.now()}.${ext}`;
        ulog('blob upload start', { pathname, sizeMB: mb, type: toUpload.type });

        const useMultipart = toUpload.size > 15 * 1024 * 1024;
        const blob = await uploadWithStallGuard(pathname, toUpload, useMultipart, uploadAbortRef.current.signal, ({ percentage, retries }) => {
          setUploadPercent(Math.min(Math.round(percentage), 95));
          setUploadRetries(retries);
          const elapsed = (Date.now() - uploadStartRef.current) / 1000;
          if (percentage > 2 && elapsed > 0.5) {
            const total = elapsed / (percentage / 100);
            setUploadETA(formatETA(Math.max(0, total - elapsed)));
          }
        });
        ulog('blob upload done', { url: blob.url });
        videoUrl = blob.url;
        setUploadPercent(100);
        setUploadETA('');
      }

      if (imageSource === 'upload' && imageFile) {
        if (uploadAbortRef.current.signal.aborted) throw new Error('Abgebrochen');
        ulog('image upload start', { name: imageFile.name, sizeMB: (imageFile.size / 1e6).toFixed(2) });
        setUploadProgress('Bild wird hochgeladen…');
        setUploadPercent(0);
        setUploadRetries(0);
        uploadStartRef.current = Date.now();
        const ext = imageFile.name.split('.').pop() || 'jpg';
        const pathname = `images/${Date.now()}.${ext}`;
        const blob = await uploadWithStallGuard(pathname, imageFile, false, uploadAbortRef.current.signal, ({ percentage, retries }) => {
          setUploadPercent(Math.min(Math.round(percentage), 95));
          setUploadRetries(retries);
        });
        ulog('image upload done', { url: blob.url });
        imageUrl = blob.url;
        setUploadPercent(100);
      } else if (imageSource === 'template' && selectedTemplate) {
        imageUrl = IMAGE_TEMPLATES.find(t => t.id === selectedTemplate)?.url || '';
      }

      if (uploadAbortRef.current.signal.aborted) throw new Error('Abgebrochen');
      ulog('save content start');
      setUploadProgress('Botschaft wird gespeichert…');
      setUploadPercent(0);
      const res = await fetch('/api/content/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code, senderName, message, videoUrl, imageUrl,
          videoFit,
          videoObjX: videoObjPos.x,
          videoObjY: videoObjPos.y,
        }),
      });
      const data = await res.json();
      ulog('save content response', { ok: res.ok, status: res.status, data });
      if (!res.ok) throw new Error(data.error || 'Speichern fehlgeschlagen');

      router.push(`/q/${code}/view`);
    } catch (e: unknown) {
      ulog('ERROR caught:', e);
      const msg = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
      setError(msg);
    } finally {
      setLoading(false);
      setUploadProgress('');
      setUploadPercent(0);
      setUploadETA('');
      setUploadRetries(0);
      uploadAbortRef.current = null;
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
                    border: `1.5px solid ${step > s.n ? 'var(--accent)' : step === s.n ? 'var(--ink)' : 'var(--line)'}`,
                    color: step >= s.n ? 'var(--paper)' : 'var(--ink-3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-serif)',
                  }}>
                    {step > s.n ? '✓' : s.n}
                  </div>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: step === s.n ? 'var(--ink)' : 'var(--ink-3)' }}>
                    {s.label}
                  </span>
                </div>
                {i < 2 && <div key={`line-${i}`} style={{ flex: 1, height: 1, background: 'var(--line)', margin: '0 8px', marginBottom: 16 }} />}
              </>
            ))}
          </div>

          <form onSubmit={handleSubmit}>

            {/* ── Step 1: Text ── */}
            {step === 1 && (
              <div className="card">
                <p className="eyebrow">1 / 3</p>
                <h1 className="section-title" style={{ fontSize: 'clamp(22px,5vw,38px)', marginBottom: 8 }}>
                  Deine <em>Grussworte</em>
                </h1>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--ink-2)', marginBottom: 24, lineHeight: 1.6 }}>
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
                  <div style={{ textAlign: 'right', fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>
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
                <p className="eyebrow">2 / 3</p>
                <h1 className="section-title" style={{ fontSize: 'clamp(22px,5vw,38px)', marginBottom: 8 }}>
                  Dein <em>Video</em>
                </h1>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--ink-2)', marginBottom: 24, lineHeight: 1.6 }}>
                  Optional: Lade eine Videobotschaft hoch (max. 200 MB).
                </p>

                {videoPreview ? (
                  <div style={{ marginBottom: 20 }}>
                    {/* Video box with drag-to-pan in cover mode */}
                    <div
                      style={{ position: 'relative', borderRadius: 3, overflow: 'hidden', background: '#111', aspectRatio: '1/1', cursor: videoFit === 'cover' ? 'grab' : 'default' }}
                      onTouchStart={e => {
                        if (videoFit !== 'cover') return;
                        const t = e.touches[0];
                        videoDragRef.current = { startX: t.clientX, startY: t.clientY, posX: videoObjPos.x, posY: videoObjPos.y };
                      }}
                      onTouchMove={e => {
                        if (!videoDragRef.current || videoFit !== 'cover') return;
                        const t = e.touches[0];
                        const dx = t.clientX - videoDragRef.current.startX;
                        const dy = t.clientY - videoDragRef.current.startY;
                        setVideoObjPos({
                          x: Math.max(0, Math.min(100, videoDragRef.current.posX - dx * 0.25)),
                          y: Math.max(0, Math.min(100, videoDragRef.current.posY - dy * 0.25)),
                        });
                      }}
                      onTouchEnd={() => { videoDragRef.current = null; }}
                    >
                      <video
                        src={videoPreview}
                        controls={videoFit === 'contain'}
                        playsInline
                        style={{
                          width: '100%', height: '100%', display: 'block',
                          objectFit: videoFit,
                          objectPosition: `${videoObjPos.x}% ${videoObjPos.y}%`,
                        }}
                      />
                      {videoFit === 'cover' && (
                        <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.55)', color: 'white', fontFamily: 'var(--font-sans)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 999, pointerEvents: 'none' }}>
                          Ziehen zum Ausrichten
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                      <button type="button"
                        onClick={() => { setVideoFit(f => f === 'contain' ? 'cover' : 'contain'); setVideoObjPos({ x: 50, y: 50 }); }}
                        style={{ background: 'none', border: '1px solid var(--line)', borderRadius: 999, fontFamily: 'var(--font-sans)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-3)', cursor: 'pointer', padding: '4px 12px' }}>
                        {videoFit === 'contain' ? '⊡ Ausfüllen' : '⊞ Anpassen'}
                      </button>
                      <button type="button" onClick={resetVideo}
                        style={{ background: 'none', border: 'none', fontFamily: 'var(--font-sans)', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-3)', cursor: 'pointer' }}>
                        Entfernen ×
                      </button>
                    </div>

                    {/* Pre-compression status — runs in background after selection */}
                    {(compState === 'preparing' || compState === 'compressing') && (
                      <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(0,0,0,0.03)', borderRadius: 3, border: '1px solid var(--line)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--ink-2)' }}>{compStage}</span>
                          {compPct > 0 && compPct < 100 && (
                            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>{compPct} %</span>
                          )}
                        </div>
                        <div className="progress-bar-wrap">
                          {compPct === 0 || compState === 'preparing' ? (
                            <div className="progress-bar-indeterminate" style={{ width: '40%' }} />
                          ) : (
                            <div className="progress-bar-fill" style={{ width: `${compPct}%` }} />
                          )}
                        </div>
                        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: 'var(--ink-3)', marginTop: 6, letterSpacing: '0.04em' }}>
                          Das Video wird im Hintergrund vorbereitet — du kannst bereits weitermachen.
                        </p>
                      </div>
                    )}
                    {compState === 'ready' && (
                      <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--accent)', marginTop: 10, letterSpacing: '0.04em' }}>
                        {compStage}
                      </p>
                    )}
                    {compState === 'failed' && (
                      <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--ink-3)', marginTop: 10, letterSpacing: '0.04em' }}>
                        {compStage}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="upload-zone" style={{ marginBottom: 20 }} onClick={() => videoInputRef.current?.click()}>
                    <div style={{ fontSize: 32, marginBottom: 10, opacity: 0.25 }}>▶</div>
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: 15, color: 'var(--ink-2)', marginBottom: 4 }}>
                      Video auswählen
                    </p>
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--ink-3)' }}>
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

            {/* ── Step 3: Image (optional) + Submit ── */}
            {step === 3 && (
              <div className="card">
                <p className="eyebrow">3 / 3</p>
                <h1 className="section-title" style={{ fontSize: 'clamp(22px,5vw,38px)', marginBottom: 8 }}>
                  Dein <em>Bild</em> <span style={{ fontFamily: 'var(--font-sans)', fontStyle: 'normal', fontSize: 14, color: 'var(--ink-3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>(optional)</span>
                </h1>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--ink-2)', marginBottom: 16, lineHeight: 1.6 }}>
                  Wähle ein Vorlagenbild, lade ein eigenes hoch — oder lass es weg, wenn nur dein Video & deine Botschaft zu sehen sein sollen.
                </p>

                {/* "No image" toggle */}
                <button type="button"
                  onClick={() => { setImageSource('none'); setSelectedTemplate(''); setImageFile(null); setImagePreview(''); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                    background: imageSource === 'none' ? 'var(--accent-tint)' : 'transparent',
                    border: `1px solid ${imageSource === 'none' ? 'var(--accent)' : 'var(--line)'}`,
                    borderRadius: 3, padding: '12px 14px', marginBottom: 18, cursor: 'pointer', textAlign: 'left',
                  }}>
                  <span style={{
                    width: 16, height: 16, borderRadius: '50%',
                    border: `1.5px solid ${imageSource === 'none' ? 'var(--accent)' : 'var(--line)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {imageSource === 'none' && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} />}
                  </span>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: imageSource === 'none' ? 'var(--accent)' : 'var(--ink-2)', letterSpacing: '0.02em' }}>
                    Kein Bild anzeigen
                  </span>
                </button>

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
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(77,107,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 18 }}>✓</div>
                      )}
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent,rgba(0,0,0,0.55))', padding: '6px 6px 4px', fontFamily: 'var(--font-sans)', fontSize: 9, color: 'white', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        {t.label}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
                  <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--line)' }} />
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>oder</span>
                  <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--line)' }} />
                </div>

                {imagePreview ? (
                  <div style={{ marginBottom: 20 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imagePreview} alt="Vorschau" style={{ width: '100%', borderRadius: 3, maxHeight: 200, objectFit: 'cover', display: 'block' }} />
                    <button type="button" onClick={() => { setImageFile(null); setImagePreview(''); setImageSource('none'); }}
                      style={{ marginTop: 8, background: 'none', border: 'none', fontFamily: 'var(--font-sans)', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-3)', cursor: 'pointer' }}>
                      Bild entfernen ×
                    </button>
                  </div>
                ) : (
                  <div className="upload-zone" style={{ marginBottom: 20 }} onClick={() => imageInputRef.current?.click()}>
                    <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.25 }}>🖼</div>
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--ink-2)', marginBottom: 4 }}>Eigenes Bild hochladen</p>
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--ink-3)' }}>JPG, PNG, WebP · max. 10 MB</p>
                    <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic"
                      onChange={handleImageChange} style={{ display: 'none' }} />
                  </div>
                )}

                {error && (
                  <div style={{ background: 'rgba(77,107,255,0.08)', border: '1px solid rgba(77,107,255,0.3)', padding: '10px 14px', marginBottom: 14, fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--accent)', borderRadius: 2, wordBreak: 'break-word' }}>
                    {error}
                  </div>
                )}

                {loading && uploadProgress && (
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--ink-3)', marginBottom: 12, textAlign: 'center', letterSpacing: '0.04em' }}>
                    Bitte Tab geöffnet lassen und Bildschirm aktiv halten
                  </div>
                )}

                <div style={{ background: 'rgba(77,107,255,0.05)', border: '1px solid rgba(77,107,255,0.15)', padding: '12px 14px', marginBottom: 18, borderRadius: 2 }}>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.55 }}>
                    <strong style={{ color: 'var(--accent)' }}>Achtung:</strong> Nach dem Speichern kann der Inhalt nicht mehr geändert werden.
                  </p>
                </div>

                {/* Upload progress */}
                {loading && uploadProgress && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--ink-3)', letterSpacing: '0.06em' }}>
                        {uploadPercent >= 95 && uploadPercent < 100 ? 'Wird abgeschlossen…' : uploadProgress}
                      </span>
                      {uploadPercent > 0 && uploadPercent < 95 && (
                        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: uploadRetries > 0 ? 'var(--accent)' : 'var(--ink-3)' }}>
                        {uploadRetries > 0
                          ? `Verbindung instabil · ${uploadRetries} Wiederholung${uploadRetries === 1 ? '' : 'en'}`
                          : (uploadETA && uploadPercent < 95 ? `noch ca. ${uploadETA}` : ' ')}
                      </span>
                      <button type="button" onClick={cancelUpload}
                        style={{ background: 'none', border: 'none', fontFamily: 'var(--font-sans)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-3)', cursor: 'pointer', padding: 0 }}>
                        Abbrechen ×
                      </button>
                    </div>
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
