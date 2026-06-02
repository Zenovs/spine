import { notFound } from 'next/navigation';
import { getQRCode, getContent } from '@/lib/db';
import { SiteHeader, SiteFooter } from '@/components/SiteHeader';
import { VideoPlayerClient } from './VideoPlayerClient';

export default async function ViewPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const qr = await getQRCode(code);
  if (!qr) return notFound();

  let content = null;
  let senderName = '';
  let message = '';
  let videoUrl = '';
  let imageUrl = '';
  let videoFit: 'contain' | 'cover' = 'contain';
  let videoObjX = 50;
  let videoObjY = 50;

  if (qr.status === 'locked') {
    content = await getContent(qr.id);
    if (content) {
      senderName = content.sender_name || '';
      message = content.message || '';
      videoUrl = content.video_url || '';
      imageUrl = content.image_url || '';
      videoFit = content.video_fit === 'cover' ? 'cover' : 'contain';
      videoObjX = typeof content.video_obj_x === 'number' ? content.video_obj_x : 50;
      videoObjY = typeof content.video_obj_y === 'number' ? content.video_obj_y : 50;
    }
  } else {
    // Show default content if set
    message = qr.default_message || '';
    imageUrl = qr.default_image_url || '';
  }

  const isLocked = qr.status === 'locked';
  const hasContent = message || videoUrl || imageUrl;

  return (
    <>
      <SiteHeader />

      {/* Lock banner */}
      <div className="lock-banner">
        <svg viewBox="0 0 16 16" width={14} height={14} fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="7" width="10" height="8" rx="1" />
          <path d="M5 7V5a3 3 0 0 1 6 0v2" />
        </svg>
        {isLocked ? 'Dieser Inhalt ist dauerhaft gespeichert und kann nicht mehr geändert werden.' : 'Standard-Inhalt · Noch keine persönliche Botschaft hinterlegt.'}
      </div>

      <main style={{ flex: 1, padding: 'clamp(20px,4vw,56px) 16px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <p className="eyebrow" style={{ textAlign: 'center' }}>Persönliche Botschaft</p>
            {senderName ? (
              <h1 className="display" style={{ textAlign: 'center' }}>
                Von <em>{senderName}</em>
              </h1>
            ) : (
              <h1 className="display" style={{ textAlign: 'center' }}>
                Eine <em>besondere</em> Flasche
              </h1>
            )}
          </div>

          {hasContent ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

              {/* Video */}
              {videoUrl && (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <VideoPlayerClient
                    url={videoUrl}
                    senderName={senderName}
                    fit={videoFit}
                    objX={videoObjX}
                    objY={videoObjY}
                  />
                </div>
              )}

              {/* Image */}
              {imageUrl && (
                <div style={{ borderRadius: 3, overflow: 'hidden', border: '1px solid var(--line)' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt="Bild zur Botschaft"
                    style={{ width: '100%', maxHeight: 400, objectFit: 'cover', display: 'block' }}
                  />
                </div>
              )}

              {/* Message */}
              {message && (
                <div className="card">
                  <p className="eyebrow">Grussworte</p>
                  <blockquote style={{
                    fontFamily: 'var(--font-serif)',
                    fontStyle: 'italic',
                    fontSize: 'clamp(18px,2vw,24px)',
                    lineHeight: 1.65,
                    color: 'var(--ink)',
                    borderLeft: '3px solid var(--accent)',
                    paddingLeft: 20,
                    margin: 0,
                  }}>
                    {message}
                  </blockquote>
                  {senderName && (
                    <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <svg viewBox="0 0 220 60" width="140" height="36" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round">
                        <path d="M6 38 C 16 22, 28 14, 38 20 C 46 26, 38 40, 30 38 C 24 36, 30 28, 42 28 L 62 32 C 70 32, 74 26, 78 18 C 80 14, 86 14, 86 22 L 86 36 C 86 42, 92 42, 96 34 L 104 22 C 108 16, 114 18, 114 26 L 114 38 C 114 44, 122 42, 128 34 C 134 26, 142 22, 150 28 C 158 34, 156 42, 148 42 C 142 42, 144 34, 156 34 L 178 38 C 188 38, 196 30, 200 22" />
                      </svg>
                      <div style={{ borderLeft: '1px solid var(--line)', paddingLeft: 14 }}>
                        <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 20, color: 'var(--ink)' }}>{senderName}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: 'clamp(40px,6vw,64px)' }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 48, color: 'var(--line)', marginBottom: 20 }}>◇</div>
              <p className="lede" style={{ textAlign: 'center' }}>
                Dieser QR-Code hat noch keinen Inhalt. Scan nach dem Aufkleben auf die Flasche.
              </p>
            </div>
          )}
          {/* CTA — always shown */}
          <div style={{ marginTop: 48, borderTop: '1px solid var(--line)', paddingTop: 36, textAlign: 'center' }}>
            <p className="eyebrow" style={{ textAlign: 'center' }}>Mehr entdecken</p>
            <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 'clamp(15px,1.6vw,18px)', color: 'var(--ink-2)', marginBottom: 24, lineHeight: 1.6 }}>
              Entdecke unsere Weine und bestelle direkt online.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="https://beispiel.ch" target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                Zur Website
              </a>
              <a href="https://shop.beispiel.ch" target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
                Zum Shop
              </a>
            </div>
          </div>

        </div>
      </main>
      <SiteFooter />
    </>
  );
}
