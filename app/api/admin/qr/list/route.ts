import { NextRequest, NextResponse } from 'next/server';
import { getAllQRCodes } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  if (!await getAdminFromRequest(req)) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }
  const codes = await getAllQRCodes();
  return NextResponse.json({ codes });
}
