import { NextRequest, NextResponse } from 'next/server';
import db, { getQRCode } from '@/lib/db';
import { sendVerificationEmail } from '@/lib/email';

function randomCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req: NextRequest) {
  try {
    const { code, email } = await req.json();

    if (!code || !email) {
      return NextResponse.json({ error: 'Code und E-Mail erforderlich' }, { status: 400 });
    }

    const qr = await getQRCode(code);
    if (!qr) {
      return NextResponse.json({ error: 'QR-Code nicht gefunden' }, { status: 404 });
    }
    if (qr.status === 'locked') {
      return NextResponse.json({ error: 'Dieser QR-Code ist bereits gesperrt' }, { status: 409 });
    }

    const sql = db();
    // Expire old codes for this qr+email
    await sql`
      UPDATE verifications
      SET expires_at = NOW()
      WHERE qr_code_id = ${qr.id} AND email = ${email} AND verified = FALSE
    `;

    const verifyCode = randomCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await sql`
      INSERT INTO verifications (qr_code_id, email, code, expires_at)
      VALUES (${qr.id}, ${email}, ${verifyCode}, ${expiresAt.toISOString()})
    `;

    await sendVerificationEmail(email, verifyCode);

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    console.error('verify/send error:', e);
    return NextResponse.json({ error: 'Fehler beim Senden der E-Mail' }, { status: 500 });
  }
}
