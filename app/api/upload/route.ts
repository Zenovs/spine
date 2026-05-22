import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_TYPES = [
  'video/mp4', 'video/quicktime', 'video/webm', 'video/3gpp',
  'image/jpeg', 'image/png', 'image/webp', 'image/heic',
];

// Client-side upload handler — file goes browser→Blob directly, bypassing the 4.5MB function limit
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as HandleUploadBody;
    const res = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => ({
        allowedContentTypes: ALLOWED_TYPES,
        maximumSizeInBytes: 200 * 1024 * 1024,
        tokenPayload: pathname,
      }),
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(res);
  } catch (e: unknown) {
    console.error('upload token error:', e);
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
