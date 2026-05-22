import QRCode from 'qrcode';
import { customAlphabet } from 'nanoid';

const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const generate = customAlphabet(alphabet, 10);

export function generateCode(): string {
  return generate();
}

export async function generateQRCodeDataURL(code: string): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://weinbotschaft.vercel.app';
  const url = `${baseUrl}/q/${code}`;
  return QRCode.toDataURL(url, {
    width: 400,
    margin: 2,
    color: { dark: '#1F1A12', light: '#FBF7EE' },
    errorCorrectionLevel: 'H',
  });
}

export async function generateQRCodeSVG(code: string): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://weinbotschaft.vercel.app';
  const url = `${baseUrl}/q/${code}`;
  return QRCode.toString(url, {
    type: 'svg',
    margin: 2,
    color: { dark: '#1F1A12', light: '#FBF7EE' },
    errorCorrectionLevel: 'H',
  });
}
