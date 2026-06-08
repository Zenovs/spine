'use client';
import { useLocale, useSetLocale } from '@/lib/i18n-client';
import { LOCALES, type Locale } from '@/lib/i18n';

export function LanguageSwitcher() {
  const current = useLocale();
  const setLocale = useSetLocale();

  return (
    <div
      role="group"
      aria-label="Language"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontFamily: 'var(--font-mono)',
        fontSize: '0.68rem',
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
      }}
    >
      {LOCALES.map((loc: Locale, i) => (
        <span key={loc} style={{ display: 'inline-flex', alignItems: 'center' }}>
          {i > 0 && <span style={{ color: 'var(--ink-3)', opacity: 0.5, margin: '0 4px' }}>·</span>}
          <button
            type="button"
            onClick={() => current !== loc && setLocale(loc)}
            aria-pressed={current === loc}
            style={{
              background: 'none',
              border: 'none',
              padding: '4px 2px',
              cursor: current === loc ? 'default' : 'pointer',
              color: current === loc ? 'var(--ink)' : 'var(--ink-3)',
              fontWeight: current === loc ? 600 : 400,
              fontFamily: 'inherit',
              fontSize: 'inherit',
              letterSpacing: 'inherit',
              textTransform: 'inherit',
            }}
          >
            {loc}
          </button>
        </span>
      ))}
    </div>
  );
}
