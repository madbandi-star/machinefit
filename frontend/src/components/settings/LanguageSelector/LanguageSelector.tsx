import { LOCALES, LOCALE_LABELS } from '@machinefit/shared';
import type { Locale } from '@machinefit/shared';
import { useSettingsStore } from '@/store/settings.store';
import i18n from '@/i18n';

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
      className="input"
      style={{ width: 'auto', padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
      aria-label="Language"
    >
      {LOCALES.map((code) => (
        <option key={code} value={code}>
          {LOCALE_LABELS[code]}
        </option>
      ))}
    </select>
  );
}
