import { NextRequest, NextResponse } from 'next/server';
import { getQRCode, getContent } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const qr = await getQRCode(code);
  if (!qr) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const content = qr.status === 'locked' ? await getContent(qr.id) : null;
  return NextResponse.json({ qr, content });
}
