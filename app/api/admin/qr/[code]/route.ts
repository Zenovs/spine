import { NextRequest, NextResponse } from 'next/server';
import db, { getQRCode } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth';
import { generateQRCodeSVG } from '@/lib/qrcode';

export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  if (!await getAdminFromRequest(req)) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  const { code } = await params;
  const format = req.nextUrl.searchParams.get('format');

  if (format === 'svg') {
    const svg = await generateQRCodeSVG(code);
    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Content-Disposition': `attachment; filename="qr-${code}.svg"`,
      },
    });
  }

  const qr = await getQRCode(code);
  if (!qr) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ qr });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  if (!await getAdminFromRequest(req)) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  const { code } = await params;
  const sql = db();
  await sql`
    UPDATE qr_codes SET deleted_at = NOW(), status = 'deleted' WHERE code = ${code}
  `;
  return NextResponse.json({ ok: true });
}
