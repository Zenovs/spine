import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { getAllContent } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth';

type Row = {
  qr_code: string | null;
  qr_status: string | null;
  qr_admin_note: string | null;
  qr_deleted: boolean;
  email: string | null;
  sender_name: string | null;
  message: string | null;
  video_url: string | null;
  image_url: string | null;
  content_created_at: string | null;
};

const HEADERS = [
  'QR-Code',
  'QR-Status',
  'QR-Notiz',
  'E-Mail',
  'Absender',
  'Botschaft',
  'Video-URL',
  'Bild-URL',
  'Eingereicht am',
];

function toCells(rows: Row[]): (string | number)[][] {
  return rows.map(r => [
    r.qr_code ?? '',
    r.qr_deleted ? 'gelöscht' : (r.qr_status ?? ''),
    r.qr_admin_note ?? '',
    r.email ?? '',
    r.sender_name ?? '',
    r.message ?? '',
    r.video_url ?? '',
    r.image_url ?? '',
    r.content_created_at ? new Date(r.content_created_at).toISOString() : '',
  ]);
}

// RFC 4180 CSV escaping — quote if value contains comma, quote, newline; double internal quotes.
function csvCell(v: string | number): string {
  const s = String(v);
  if (/[",\r\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(rows: Row[]): string {
  const cells = toCells(rows);
  const lines = [HEADERS.map(csvCell).join(',')];
  for (const row of cells) lines.push(row.map(csvCell).join(','));
  // UTF-8 BOM so Excel opens umlauts correctly
  return '﻿' + lines.join('\r\n');
}

function toXlsx(rows: Row[]): Buffer {
  const cells = toCells(rows);
  const ws = XLSX.utils.aoa_to_sheet([HEADERS, ...cells]);
  // Column widths for readability
  ws['!cols'] = [
    { wch: 14 }, // code
    { wch: 12 }, // status
    { wch: 24 }, // note
    { wch: 28 }, // email
    { wch: 24 }, // sender
    { wch: 60 }, // message
    { wch: 50 }, // video url
    { wch: 50 }, // image url
    { wch: 20 }, // date
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Einreichungen');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

export async function GET(req: NextRequest) {
  if (!await getAdminFromRequest(req)) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }
  const format = req.nextUrl.searchParams.get('format') === 'xlsx' ? 'xlsx' : 'csv';
  const rows = (await getAllContent()) as Row[];
  const stamp = new Date().toISOString().slice(0, 10);

  if (format === 'xlsx') {
    const buf = toXlsx(rows);
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="weinbotschaft-einreichungen-${stamp}.xlsx"`,
        'Cache-Control': 'no-store',
      },
    });
  }

  return new NextResponse(toCsv(rows), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="weinbotschaft-einreichungen-${stamp}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
