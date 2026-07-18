import { LOCALES, LOCALE_FLAGS, LOCALE_LABELS } from '@machinefit/shared';
import type { Locale } from '@machinefit/shared';
import { useSettingsStore } from '@/store/settings.store';
import i18n from '@/i18n';
import '@/styles/components.css';

export function LanguageSelector() {
  const locale = useSettingsStore((s) => s.locale);
  const setLocale = useSettingsStore((s) => s.setLocale);

  const handleSelect = (newLocale: Locale) => {
    setLocale(newLocale);
    void i18n.changeLanguage(newLocale);
  };

  return (
    <div
      className="language-picker"
      role="group"
      aria-label={`Language: ${LOCALE_LABELS[locale]}`}
    >
      {LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          className={`language-picker__btn${locale === code ? ' language-picker__btn--active' : ''}`}
          aria-pressed={locale === code}
          title={LOCALE_LABELS[code]}
          onClick={() => handleSelect(code)}
        >
          {LOCALE_FLAGS[code]}
        </button>
      ))}
    </div>
  );
}
