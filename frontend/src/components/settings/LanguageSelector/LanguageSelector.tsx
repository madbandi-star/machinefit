import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LOCALES,
  LOCALE_FLAGS,
  LOCALE_LABELS,
} from '@machinefit/shared';
import type { Locale } from '@machinefit/shared';
import { Icon } from '@/components/icons/Icon';
import { useSettingsStore } from '@/store/settings.store';
import i18n from '@/i18n';
import '@/styles/components.css';

interface LanguageSelectorProps {
  variant?: 'default' | 'compact';
}

export function LanguageSelector({ variant = 'default' }: LanguageSelectorProps) {
  const { t } = useTranslation('common');
  const locale = useSettingsStore((s) => s.locale);
  const setLocale = useSettingsStore((s) => s.setLocale);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const compact = variant === 'compact';

  const handleSelect = (newLocale: Locale) => {
    setLocale(newLocale);
    void i18n.changeLanguage(newLocale);
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className={`language-picker${compact ? ' language-picker--compact' : ''}`}
    >
      <button
        type="button"
        className="language-picker__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={`${t('settings.language')}: ${LOCALE_LABELS[locale]}`}
        onClick={() => setOpen((prev) => !prev)}
      >
        {!compact ? (
          <span className="language-picker__flag" aria-hidden>
            {LOCALE_FLAGS[locale]}
          </span>
        ) : null}
        <span className="language-picker__code" aria-hidden>
          {locale.toUpperCase()}
        </span>
        <Icon name="chevronDown" size={compact ? 10 : 11} className="language-picker__chevron" />
      </button>

      {open ? (
        <ul
          id={listboxId}
          className="language-picker__menu"
          role="listbox"
          aria-label={t('settings.language')}
        >
          {LOCALES.map((code) => (
            <li key={code} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={locale === code}
                className={`language-picker__option${locale === code ? ' language-picker__option--active' : ''}`}
                onClick={() => handleSelect(code)}
              >
                <span className="language-picker__option-flag" aria-hidden>
                  {LOCALE_FLAGS[code]}
                </span>
                <span className="language-picker__option-label">{LOCALE_LABELS[code]}</span>
                {locale === code ? (
                  <span className="language-picker__option-check" aria-hidden>
                    ✓
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
