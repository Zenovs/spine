import { NextRequest, NextResponse } from 'next/server';
import db, { initDB } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth';
import { generateCode } from '@/lib/qrcode';

export async function POST(req: NextRequest) {
  if (!await getAdminFromRequest(req)) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  try {
    const { count = 1, note } = await req.json();
    const n = Math.min(Math.max(1, Number(count)), 50);
    const sql = db();

    const codes: string[] = [];
    for (let i = 0; i < n; i++) {
      let code: string;
      let tries = 0;
      do {
        code = generateCode();
        tries++;
        if (tries > 10) throw new Error('Konnte keinen einzigartigen Code generieren');
      } while (codes.includes(code));

      await sql`
        INSERT INTO qr_codes (code, admin_note)
        VALUES (${code}, ${note || null})
      `;
      codes.push(code);
    }

    return NextResponse.json({ codes });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    // Auto-init DB if tables don't exist yet
    if (msg.includes('does not exist') || msg.includes('relation')) {
      await initDB();
      return NextResponse.json({ error: 'Datenbank wurde initialisiert. Bitte nochmals versuchen.' }, { status: 503 });
    }
    console.error('qr/create error:', e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
