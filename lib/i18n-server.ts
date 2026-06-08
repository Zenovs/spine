// Server-only locale reader. Imports next/headers.
import { cookies } from 'next/headers';
import { DEFAULT_LOCALE, Locale, isLocale } from './i18n';

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const v = cookieStore.get('locale')?.value;
  return isLocale(v) ? v : DEFAULT_LOCALE;
}
