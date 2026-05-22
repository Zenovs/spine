import { NextRequest, NextResponse } from 'next/server';
import { initDB } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  if (!await getAdminFromRequest(req)) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }
  await initDB();
  return NextResponse.json({ ok: true, message: 'Datenbank initialisiert' });
}
