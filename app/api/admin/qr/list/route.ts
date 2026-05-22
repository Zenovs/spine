import { NextRequest, NextResponse } from 'next/server';
import { getAllQRCodes, initDB } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  if (!await getAdminFromRequest(req)) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }
  try {
    const codes = await getAllQRCodes();
    return NextResponse.json({ codes });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('does not exist') || msg.includes('relation')) {
      await initDB();
      return NextResponse.json({ codes: [] });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
