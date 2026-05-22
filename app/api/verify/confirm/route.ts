import { NextRequest, NextResponse } from 'next/server';
import sql, { getQRCode } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { code, email, verifyCode } = await req.json();

    if (!code || !email || !verifyCode) {
      return NextResponse.json({ error: 'Alle Felder erforderlich' }, { status: 400 });
    }

    const qr = await getQRCode(code);
    if (!qr) {
      return NextResponse.json({ error: 'QR-Code nicht gefunden' }, { status: 404 });
    }
    if (qr.status === 'locked') {
      return NextResponse.json({ error: 'Dieser QR-Code ist bereits gesperrt' }, { status: 409 });
    }

    const rows = await sql`
      SELECT * FROM verifications
      WHERE qr_code_id = ${qr.id}
        AND email = ${email}
        AND code = ${verifyCode}
        AND verified = FALSE
        AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (!rows[0]) {
      return NextResponse.json({ error: 'Ungültiger oder abgelaufener Code' }, { status: 400 });
    }

    await sql`
      UPDATE verifications SET verified = TRUE WHERE id = ${rows[0].id}
    `;

    // Mark QR as active (verified, not yet locked)
    await sql`
      UPDATE qr_codes SET status = 'active' WHERE id = ${qr.id}
    `;

    // Set a short-lived session cookie for the create page
    const res = NextResponse.json({ ok: true });
    res.cookies.set(`verified_${code}`, email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hour to complete creation
      path: '/',
    });
    return res;
  } catch (e: unknown) {
    console.error('verify/confirm error:', e);
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 });
  }
}
