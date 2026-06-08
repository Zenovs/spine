'use client';
import { createContext, useCallback, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { DEFAULT_LOCALE, Locale, t } from './i18n';

const Ctx = createContext<Locale>(DEFAULT_LOCALE);

export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <Ctx.Provider value={locale}>{children}</Ctx.Provider>;
}

export function useLocale(): Locale {
  return useContext(Ctx);
}

export function useT() {
  const locale = useLocale();
  return useCallback(
    (key: string, vars?: Record<string, string | number>) => t(locale, key, vars),
    [locale],
  );
}

export function useSetLocale() {
  const router = useRouter();
  return useCallback((locale: Locale) => {
    // 1 year cookie. samesite=lax is fine since we never POST cross-site.
    document.cookie = `locale=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    router.refresh();
  }, [router]);
}
