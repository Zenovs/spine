import { NextRequest, NextResponse } from 'next/server';
import db, { getQRCode } from '@/lib/db';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const { code, senderName, message, videoUrl, imageUrl, videoFit, videoObjX, videoObjY } = await req.json();

    if (!code) {
      return NextResponse.json({ error: 'Code erforderlich' }, { status: 400 });
    }
    if (!message?.trim()) {
      return NextResponse.json({ error: 'Botschaft erforderlich' }, { status: 400 });
    }

    // Check verification cookie
    const cookieStore = await cookies();
    const verifiedEmail = cookieStore.get(`verified_${code}`)?.value;
    if (!verifiedEmail) {
      return NextResponse.json({ error: 'Nicht verifiziert. Bitte E-Mail bestätigen.' }, { status: 401 });
    }

    const qr = await getQRCode(code);
    if (!qr) {
      return NextResponse.json({ error: 'QR-Code nicht gefunden' }, { status: 404 });
    }
    if (qr.status === 'locked') {
      return NextResponse.json({ error: 'Dieser QR-Code ist bereits gesperrt' }, { status: 409 });
    }

    // Sanitize video positioning
    const fit = videoFit === 'cover' ? 'cover' : 'contain';
    const objX = Math.max(0, Math.min(100, Math.round(Number(videoObjX) || 50)));
    const objY = Math.max(0, Math.min(100, Math.round(Number(videoObjY) || 50)));

    const sql = db();
    // Save content
    await sql`
      INSERT INTO content (qr_code_id, email, sender_name, message, video_url, image_url, video_fit, video_obj_x, video_obj_y)
      VALUES (${qr.id}, ${verifiedEmail}, ${senderName || null}, ${message}, ${videoUrl || null}, ${imageUrl || null}, ${fit}, ${objX}, ${objY})
    `;

    // Lock the QR code
    await sql`UPDATE qr_codes SET status = 'locked' WHERE id = ${qr.id}`;

    // Clear verification cookie
    const res = NextResponse.json({ ok: true });
    res.cookies.delete(`verified_${code}`);
    return res;
  } catch (e: unknown) {
    console.error('content/save error:', e);
    return NextResponse.json({ error: 'Fehler beim Speichern' }, { status: 500 });
  }
}
