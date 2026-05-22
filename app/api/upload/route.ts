import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_VIDEO_SIZE = 200 * 1024 * 1024; // 200 MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;  // 10 MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string;

    if (!file) {
      return NextResponse.json({ error: 'Keine Datei erhalten' }, { status: 400 });
    }

    if (type === 'video') {
      if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
        return NextResponse.json({ error: 'Ungültiges Videoformat. Erlaubt: MP4, MOV, WebM' }, { status: 400 });
      }
      if (file.size > MAX_VIDEO_SIZE) {
        return NextResponse.json({ error: 'Video zu gross (max. 200 MB)' }, { status: 400 });
      }
    } else if (type === 'image') {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return NextResponse.json({ error: 'Ungültiges Bildformat. Erlaubt: JPG, PNG, WebP' }, { status: 400 });
      }
      if (file.size > MAX_IMAGE_SIZE) {
        return NextResponse.json({ error: 'Bild zu gross (max. 10 MB)' }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: 'Ungültiger Dateityp' }, { status: 400 });
    }

    const ext = file.name.split('.').pop() || (type === 'video' ? 'mp4' : 'jpg');
    const filename = `${type}s/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const blob = await put(filename, file, {
      access: 'public',
      contentType: file.type,
    });

    return NextResponse.json({ url: blob.url });
  } catch (e: unknown) {
    console.error('upload error:', e);
    return NextResponse.json({ error: 'Upload fehlgeschlagen' }, { status: 500 });
  }
}

export const maxDuration = 60;
