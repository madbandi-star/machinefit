/**
 * Admin multi-locale text fields (ko / en / ja / zh).
 * Keeps LocalizedString JSONB shape used by brands, machines, tips, etc.
 */
import type { ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { LocalizedString, Locale } from '@machinefit/shared';
import { LOCALES, LOCALE_LABELS } from '@machinefit/shared';
import '@/styles/admin-i18n-fields.css';

type Props = {
  id: string;
  label: string;
  value: LocalizedString;
  onChange: (next: LocalizedString) => void;
  requiredLocales?: Locale[];
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
};

export function LocalizedStringFields({
  id,
  label,
  value,
  onChange,
  requiredLocales = ['ko', 'en'],
  multiline = false,
  rows = 3,
  placeholder,
}: Props) {
  const { t } = useTranslation('admin');

  const setLocale = (locale: Locale, text: string) => {
    onChange({ ...value, [locale]: text });
  };

  return (
    <fieldset className="admin-i18n-fields" aria-labelledby={`${id}-legend`}>
      <legend id={`${id}-legend`} className="admin-i18n-fields__legend">
        {label}
      </legend>
      <div className="admin-i18n-fields__grid">
        {LOCALES.map((locale) => {
          const required = requiredLocales.includes(locale);
          const fieldId = `${id}-${locale}`;
          const commonProps = {
            id: fieldId,
            value: value[locale] ?? '',
            onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
              setLocale(locale, e.target.value),
            placeholder: placeholder ?? LOCALE_LABELS[locale],
            required,
            'aria-label': `${label} (${LOCALE_LABELS[locale]})`,
          };
          return (
            <label key={locale} className="admin-i18n-fields__row" htmlFor={fieldId}>
              <span className="admin-i18n-fields__lang">
                {LOCALE_LABELS[locale]}
                {required ? ` · ${t('required', { defaultValue: 'Required' })}` : ''}
              </span>
              {multiline ? (
                <textarea className="input" rows={rows} {...commonProps} />
              ) : (
                <input className="input" type="text" {...commonProps} />
              )}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
