import { LOCALES, LOCALE_FLAGS, LOCALE_LABELS } from '@machinefit/shared';
import type { Locale } from '@machinefit/shared';
import { useSettingsStore } from '@/store/settings.store';
import i18n from '@/i18n';
import './LanguageSelector.css';

export function LanguageSelector() {
  const locale = useSettingsStore((s) => s.locale);
  const setLocale = useSettingsStore((s) => s.setLocale);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocale = e.target.value as Locale;
    setLocale(newLocale);
    void i18n.changeLanguage(newLocale);
  };

  return (
    <select
      value={locale}
      onChange={handleChange}
      className="language-selector"
      aria-label={`Language: ${LOCALE_LABELS[locale]}`}
    >
      {LOCALES.map((code) => (
        <option key={code} value={code} title={LOCALE_LABELS[code]}>
          {LOCALE_FLAGS[code]}
        </option>
      ))}
    </select>
  );
}
