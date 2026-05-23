import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_TYPES = [
  'video/mp4', 'video/quicktime', 'video/webm', 'video/3gpp',
  'image/jpeg', 'image/png', 'image/webp', 'image/heic',
];

// Client-side upload handler — file goes browser→Blob directly, bypassing the 4.5MB function limit
export async function POST(req: NextRequest) {
  // Health-check path used by the client to distinguish "endpoint down" from
  // "Vercel Blob CDN unreachable" before/after a failed upload.
  let body: HandleUploadBody;
  try {
    const json = await req.json();
    if (json && json.type === 'ping') {
      const hasToken = !!process.env.BLOB_READ_WRITE_TOKEN;
      return NextResponse.json({ ok: true, hasToken });
    }
    body = json as HandleUploadBody;
  } catch (e: unknown) {
    return NextResponse.json({ error: 'invalid body: ' + String(e) }, { status: 400 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('upload: BLOB_READ_WRITE_TOKEN missing in env');
    return NextResponse.json({ error: 'BLOB_READ_WRITE_TOKEN not configured on server' }, { status: 500 });
  }

  try {
    const res = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => ({
        allowedContentTypes: ALLOWED_TYPES,
        maximumSizeInBytes: 200 * 1024 * 1024,
        tokenPayload: pathname,
        addRandomSuffix: true,
        allowOverwrite: true,
      }),
    });
    return NextResponse.json(res);
  } catch (e: unknown) {
    console.error('upload token error:', e);
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
