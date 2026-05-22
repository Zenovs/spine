import { redirect, notFound } from 'next/navigation';
import { getQRCode, getContent } from '@/lib/db';

export default async function QRLandingPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const qr = await getQRCode(code);

  if (!qr) return notFound();

  // If locked (content submitted) → show view page
  if (qr.status === 'locked') {
    redirect(`/q/${code}/view`);
  }

  // If pending or active → show verify page (first step)
  redirect(`/q/${code}/verify`);
}
