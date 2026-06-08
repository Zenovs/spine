// Locale-agnostic shared module: types, dictionaries, lookup helper.
// Safe to import from both server and client components — does NOT use
// next/headers. For the server-side locale-from-cookie reader use
// lib/i18n-server.ts. For client-side context/hook use lib/i18n-client.tsx.

import { de } from './i18n/de';
import { fr } from './i18n/fr';

export const LOCALES = ['de', 'fr'] as const;
export type Locale = typeof LOCALES[number];
export const DEFAULT_LOCALE: Locale = 'de';

const dicts: Record<Locale, Record<string, string>> = { de, fr };

export function isLocale(v: unknown): v is Locale {
  return typeof v === 'string' && (LOCALES as readonly string[]).includes(v);
}

export function t(locale: Locale, key: string, vars?: Record<string, string | number>): string {
  const dict = dicts[locale] ?? dicts[DEFAULT_LOCALE];
  let s = dict[key] ?? dicts[DEFAULT_LOCALE][key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return s;
}
