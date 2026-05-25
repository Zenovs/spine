import { NextRequest, NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { deleteContent } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await getAdminFromRequest(req)) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const removed = await deleteContent(id);

    // Best-effort blob cleanup. We don't fail the whole request if a blob is
    // already gone or unreachable — the DB row is what really matters.
    const urls = [removed?.video_url, removed?.image_url].filter((u): u is string => !!u && u.includes('blob.vercel-storage.com'));
    if (urls.length) {
      try {
        await del(urls);
      } catch (blobErr) {
        console.warn('content delete: blob cleanup partial failure:', blobErr);
      }
    }

    return NextResponse.json({ ok: true, removedBlobs: urls.length });
  } catch (e: unknown) {
    console.error('content delete error:', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
