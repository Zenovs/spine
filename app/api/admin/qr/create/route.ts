import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth';
import { generateCode } from '@/lib/qrcode';

export async function POST(req: NextRequest) {
  if (!await getAdminFromRequest(req)) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

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
}
