import { NextRequest, NextResponse } from 'next/server';
import db, { getQRCode } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  if (!await getAdminFromRequest(req)) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  const { code } = await params;
  const qr = await getQRCode(code);
  if (!qr) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const sql = db();
  // Delete content and reset status to pending
  await sql`DELETE FROM content WHERE qr_code_id = ${qr.id}`;
  await sql`DELETE FROM verifications WHERE qr_code_id = ${qr.id}`;
  await sql`UPDATE qr_codes SET status = 'pending' WHERE id = ${qr.id}`;

  return NextResponse.json({ ok: true });
}
