import { NextRequest, NextResponse } from 'next/server';
import { getAllContent, initDB } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  if (!await getAdminFromRequest(req)) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }
  try {
    const rows = await getAllContent();
    return NextResponse.json({ rows });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('does not exist') || msg.includes('relation')) {
      await initDB();
      return NextResponse.json({ rows: [] });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
